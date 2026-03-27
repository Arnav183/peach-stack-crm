import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync, unlinkSync } from "fs";
import { execSync } from "child_process";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SECURITY: JWT secret must be set via env var in production — no insecure fallback
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("FATAL: JWT_SECRET environment variable is not set. Set it in Railway variables.");
  }
  console.warn("WARNING: JWT_SECRET not set. Using insecure default for development only.");
}
const JWT_SECRET = process.env.JWT_SECRET || "dev-local-only-not-for-production";

const PORT = process.env.PORT || 8080;
const DB_PATH = path.join(process.cwd(), "crm.db");

// Rate limiting store (in-memory, per IP)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return { allowed: true };
  }
  if (entry.count >= 10) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { allowed: true };
}
function resetRateLimit(ip: string) { loginAttempts.delete(ip); }

if (process.env.RESET_DB === "true" && existsSync(DB_PATH)) {
  unlinkSync(DB_PATH);
  console.log("RESET_DB=true — deleted existing DB");
} else if (existsSync(DB_PATH)) {
  try { const t = new Database(DB_PATH); t.prepare("SELECT 1").get(); t.close(); }
  catch (e) { console.log("Corrupt DB — deleting"); unlinkSync(DB_PATH); }
}

if (!existsSync(DB_PATH)) {
  console.log("No DB found — running seed...");
  try { execSync("npx tsx seed.ts", { stdio: "inherit", cwd: process.cwd() }); }
  catch (e) { console.error("Seed failed:", e); }
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS businesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    industry TEXT NOT NULL DEFAULT 'general',
    owner_name TEXT,
    owner_email TEXT,
    phone TEXT,
    address TEXT,
    plan TEXT DEFAULT 'starter',
    mrr REAL DEFAULT 0,
    plan_services TEXT DEFAULT '[]',
    status TEXT DEFAULT 'active',
    settings TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
  );
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'business_admin',
    business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT,
    must_change_password INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
  );
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL, email TEXT, phone TEXT, notes TEXT,
    status TEXT DEFAULT 'New',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    service TEXT, staff TEXT, date DATETIME, duration INTEGER,
    price REAL DEFAULT 0, tip REAL DEFAULT 0,
    is_walkin INTEGER DEFAULT 0, status TEXT DEFAULT 'Confirmed', notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    date TEXT NOT NULL, category TEXT NOT NULL, amount REAL NOT NULL, note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS manual_revenue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    date TEXT NOT NULL, source TEXT NOT NULL, amount REAL NOT NULL, note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    client_name TEXT, client_email TEXT,
    amount REAL NOT NULL, status TEXT DEFAULT 'Unpaid',
    due_date TEXT, items TEXT DEFAULT '[]', notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
// Migrations — keep existing data, add new columns safely
const migrations = [
  "ALTER TABLE users ADD COLUMN business_id INTEGER REFERENCES businesses(id)",
  "ALTER TABLE users ADD COLUMN name TEXT",
  "ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'business_admin'",
  "ALTER TABLE users ADD COLUMN last_login DATETIME",
  "ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0",
  "ALTER TABLE clients ADD COLUMN business_id INTEGER",
  "ALTER TABLE appointments ADD COLUMN business_id INTEGER",
  "ALTER TABLE appointments ADD COLUMN staff TEXT",
  "ALTER TABLE appointments ADD COLUMN tip REAL DEFAULT 0",
  "ALTER TABLE appointments ADD COLUMN is_walkin INTEGER DEFAULT 0",
  "ALTER TABLE appointments ADD COLUMN notes TEXT",
  "ALTER TABLE expenses ADD COLUMN business_id INTEGER",
  "ALTER TABLE manual_revenue ADD COLUMN business_id INTEGER",
  "ALTER TABLE invoices ADD COLUMN business_id INTEGER",
  "ALTER TABLE invoices ADD COLUMN client_id INTEGER",
];
for (const m of migrations) { try { db.exec(m); } catch(e) {} }

async function startServer() {
  const app = express();
  // Health check endpoint — must respond immediately for Railway
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use(express.json({ limit: "10mb" }));
  app.use(cookieParser());

  // Security headers
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  // --- MIDDLEWARE ---
  const auth = (req: any, res: any, next: any) => {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch { res.status(403).json({ error: "Invalid or expired session" }); }
  };

  const superadminOnly = (req: any, res: any, next: any) => {
    if (req.user?.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
    next();
  };

  const businessOnly = (req: any, res: any, next: any) => {
    if (!["business_admin", "business_staff"].includes(req.user?.role)) return res.status(403).json({ error: "Forbidden" });
    if (!req.user?.business_id) return res.status(403).json({ error: "No business context" });
    next();
  };

  // Critical: ensure every business query is scoped to req.user.business_id
  const scopeCheck = (req: any, res: any, next: any) => {
    if (req.user?.role === "superadmin") return res.status(403).json({ error: "Superadmin cannot access business data directly" });
    next();
  };

  // --- AUTH ROUTES ---
  // Business login — /api/auth/login
  app.post("/api/auth/login", (req, res) => {
    const ip = req.ip || "unknown";
    const rl = checkRateLimit(ip);
    if (!rl.allowed) return res.status(429).json({ error: "Too many attempts. Try again in " + rl.retryAfter + "s" });
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const user = db.prepare("SELECT u.*, b.name as business_name, b.industry FROM users u LEFT JOIN businesses b ON u.business_id = b.id WHERE u.email = ? AND u.role != 'superadmin'").get(email.toLowerCase().trim()) as any;
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: "Invalid email or password" });
    resetRateLimit(ip);
    db.prepare("UPDATE users SET last_login=datetime('now') WHERE id=?").run(user.id);
    if (user.business_id) db.prepare("UPDATE businesses SET last_login=datetime('now') WHERE id=?").run(user.business_id);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, business_id: user.business_id, name: user.name }, JWT_SECRET, { expiresIn: "12h" });
    res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" });
    res.json({ user: { id: user.id, email: user.email, role: user.role, business_id: user.business_id, name: user.name, business_name: user.business_name, industry: user.industry, must_change_password: user.must_change_password } });
  });

  // Superadmin login — /api/admin/login (separate endpoint, separate cookie name conceptually)
  app.post("/api/admin/login", (req, res) => {
    const ip = req.ip || "unknown";
    const rl = checkRateLimit("admin_" + ip);
    if (!rl.allowed) return res.status(429).json({ error: "Too many attempts" });
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Required" });
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND role = 'superadmin'").get(email.toLowerCase().trim()) as any;
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: "Invalid credentials" });
    resetRateLimit("admin_" + ip);
    db.prepare("UPDATE users SET last_login=datetime('now') WHERE id=?").run(user.id);
    const token = jwt.sign({ id: user.id, email: user.email, role: "superadmin" }, JWT_SECRET, { expiresIn: "8h" });
    res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" });
    res.json({ user: { id: user.id, email: user.email, role: "superadmin", name: user.name } });
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie("token"); res.json({ ok: true });
  });

  app.get("/api/auth/me", auth, (req: any, res) => {
    const u = db.prepare("SELECT u.id,u.email,u.role,u.business_id,u.name,u.must_change_password,b.name as business_name,b.industry,b.settings FROM users u LEFT JOIN businesses b ON u.business_id=b.id WHERE u.id=?").get(req.user.id) as any;
    if (!u) return res.status(401).json({ error: "Not found" });
    res.json({ user: { ...u, settings: u.settings ? JSON.parse(u.settings) : {} } });
  });

  app.put("/api/auth/password", auth, (req: any, res) => {
    const { current_password, new_password } = req.body;
    if (!new_password || new_password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
    const user = db.prepare("SELECT * FROM users WHERE id=?").get(req.user.id) as any;
    if (!bcrypt.compareSync(current_password, user.password)) return res.status(401).json({ error: "Current password incorrect" });
    db.prepare("UPDATE users SET password=?, must_change_password=0 WHERE id=?").run(bcrypt.hashSync(new_password, 12), req.user.id);
    res.json({ ok: true });
  });
  // --- SUPERADMIN ROUTES ---
  app.get("/api/super/businesses", auth, superadminOnly, (_req, res) => {
    const businesses = db.prepare(`
      SELECT b.*, 
        (SELECT COUNT(*) FROM users WHERE business_id=b.id AND role='business_admin') as admin_count,
        (SELECT COUNT(*) FROM clients WHERE business_id=b.id) as client_count,
        (SELECT COUNT(*) FROM appointments WHERE business_id=b.id AND date>datetime('now')) as upcoming_appts,
        (SELECT COALESCE(SUM(price+tip),0) FROM appointments WHERE business_id=b.id AND status='Completed') as total_revenue,
        (SELECT email FROM users WHERE business_id=b.id AND role='business_admin' LIMIT 1) as admin_email
      FROM businesses b ORDER BY b.created_at DESC
    `).all();
    res.json(businesses);
  });

  app.post("/api/super/businesses", auth, superadminOnly, async (req, res) => {
    const { name, industry, owner_name, owner_email, phone, plan, mrr } = req.body;
    if (!name || !owner_email || !industry) return res.status(400).json({ error: "name, industry, owner_email required" });
    if (db.prepare("SELECT id FROM users WHERE email=?").get(owner_email.toLowerCase())) return res.status(409).json({ error: "Email already in use" });
    const tempPw = Array.from({length:12}, () => "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#"[Math.floor(Math.random()*57)]).join("");
    const tx = db.transaction(() => {
      const biz = db.prepare("INSERT INTO businesses (name,industry,owner_name,owner_email,phone,plan,mrr,status) VALUES (?,?,?,?,?,?,?,'active')").run(name, industry, owner_name||"", owner_email.toLowerCase(), phone||"", plan||"starter", mrr||0);
      db.prepare("INSERT INTO users (email,password,role,business_id,name,must_change_password) VALUES (?,?,'business_admin',?,?,1)").run(owner_email.toLowerCase(), bcrypt.hashSync(tempPw, 12), biz.lastInsertRowid, owner_name||"");
      return { id: biz.lastInsertRowid, tempPw };
    });
    const result = tx();
    res.json({ id: result.id, tempPassword: result.tempPw, message: "Business created. Share temp password with client." });
  });

  app.put("/api/super/businesses/:id", auth, superadminOnly, (req, res) => {
    const { name, industry, owner_name, phone, plan, mrr, status } = req.body;
    db.prepare("UPDATE businesses SET name=?,industry=?,owner_name=?,phone=?,plan=?,mrr=?,status=? WHERE id=?").run(name,industry,owner_name||"",phone||"",plan||"starter",mrr||0,status||"active",req.params.id);
    res.json({ ok: true });
  });

  app.delete("/api/super/businesses/:id", auth, superadminOnly, (req, res) => {
    // Cascade deletes all business data via FK
    db.prepare("DELETE FROM businesses WHERE id=?").run(req.params.id);
    res.json({ ok: true });
  });

  app.get("/api/super/stats", auth, superadminOnly, (_req, res) => {
    const totalBiz = (db.prepare("SELECT COUNT(*) as c FROM businesses WHERE status='active'").get() as any).c;
    const totalMrr = (db.prepare("SELECT COALESCE(SUM(mrr),0) as t FROM businesses WHERE status='active'").get() as any).t;
    const newThisMonth = (db.prepare("SELECT COUNT(*) as c FROM businesses WHERE created_at>=date('now','start of month')").get() as any).c;
    const recentLogins = db.prepare("SELECT b.name, b.industry, u.last_login, u.email FROM users u JOIN businesses b ON u.business_id=b.id WHERE u.role='business_admin' AND u.last_login IS NOT NULL ORDER BY u.last_login DESC LIMIT 8").all();
    const byIndustry = db.prepare("SELECT industry, COUNT(*) as count FROM businesses GROUP BY industry ORDER BY count DESC").all();
    const mrrByMonth = db.prepare("SELECT strftime('%Y-%m',created_at) as month, COUNT(*) as new_clients, SUM(mrr) as mrr FROM businesses WHERE status='active' GROUP BY month ORDER BY month DESC LIMIT 6").all();
    res.json({ totalBiz, totalMrr, newThisMonth, recentLogins, byIndustry, mrrByMonth });
  });

  app.post("/api/super/businesses/:id/reset-password", auth, superadminOnly, (req, res) => {
    const tempPw = Array.from({length:12}, () => "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#"[Math.floor(Math.random()*57)]).join("");
    db.prepare("UPDATE users SET password=?,must_change_password=1 WHERE business_id=? AND role='business_admin'").run(bcrypt.hashSync(tempPw, 12), req.params.id);
    res.json({ tempPassword: tempPw });
  });
  // --- BUSINESS ROUTES (all scoped to req.user.business_id) ---

  // Business profile
  app.get("/api/business/profile", auth, businessOnly, (req: any, res) => {
    const biz = db.prepare("SELECT * FROM businesses WHERE id=?").get(req.user.business_id) as any;
    if (!biz) return res.status(404).json({ error: "Not found" });
    res.json({ ...biz, settings: biz.settings ? JSON.parse(biz.settings) : {} });
  });

  app.put("/api/business/profile", auth, businessOnly, (req: any, res) => {
    const { name, owner_name, phone, address, settings } = req.body;
    db.prepare("UPDATE businesses SET name=?,owner_name=?,phone=?,address=?,settings=? WHERE id=?")
      .run(name, owner_name||"", phone||"", address||"", JSON.stringify(settings||{}), req.user.business_id);
    res.json({ ok: true });
  });

  // Settings / password
  app.put("/api/business/settings", auth, businessOnly, (req: any, res) => {
    const { name } = req.body;
    db.prepare("UPDATE users SET name=? WHERE id=?").run(name, req.user.id);
    res.json({ ok: true });
  });

  // Stats — scoped
  app.get("/api/stats", auth, businessOnly, scopeCheck, (req: any, res) => {
    const bid = req.user.business_id;
    const { startDate, endDate } = req.query;
    let af = "WHERE a.business_id=? AND a.status='Completed'", ap: any[] = [bid];
    let ef = "WHERE business_id=?", ep: any[] = [bid];
    let mf = "WHERE business_id=?", mp: any[] = [bid];
    if (startDate && endDate) {
      af += " AND a.date BETWEEN ? AND ?"; ap.push(startDate, endDate);
      ef += " AND date BETWEEN ? AND ?"; ep.push(startDate, endDate);
      mf += " AND date BETWEEN ? AND ?"; mp.push(startDate, endDate);
    }
    const tc = (db.prepare("SELECT count(*) as c FROM clients WHERE business_id=?").get(bid) as any).c;
    const nm = (db.prepare("SELECT count(*) as c FROM clients WHERE business_id=? AND created_at>=date('now','start of month')").get(bid) as any).c;
    const ar = (db.prepare(`SELECT COALESCE(sum(a.price+a.tip),0) as t FROM appointments a ${af}`).get(...ap) as any).t;
    const mr = (db.prepare(`SELECT COALESCE(sum(amount),0) as t FROM manual_revenue ${mf}`).get(...mp) as any).t;
    const totalRevenue = (ar||0) + (mr||0);
    const te = (db.prepare(`SELECT COALESCE(sum(amount),0) as t FROM expenses ${ef}`).get(...ep) as any).t;
    const ua = (db.prepare("SELECT count(*) as c FROM appointments WHERE business_id=? AND date>datetime('now')").get(bid) as any).c;
    const ui = (db.prepare("SELECT count(*) as c, COALESCE(sum(amount),0) as t FROM invoices WHERE business_id=? AND status='Unpaid'").get(bid) as any);
    const rbm = db.prepare(`SELECT strftime('%Y-%m',a.date) as month, sum(a.price+a.tip) as total FROM appointments a ${af} GROUP BY month ORDER BY month DESC LIMIT 12`).all(...ap);
    const ebm = db.prepare(`SELECT strftime('%Y-%m',date) as month, sum(amount) as total FROM expenses ${ef} GROUP BY month ORDER BY month DESC LIMIT 12`).all(...ep);
    const rbs = db.prepare(`SELECT a.service, sum(a.price) as total, count(*) as count FROM appointments a ${af} GROUP BY a.service ORDER BY total DESC`).all(...ap);
    const ebc = db.prepare(`SELECT category as name, sum(amount) as value FROM expenses ${ef} GROUP BY category ORDER BY value DESC`).all(...ep);
    const na = db.prepare("SELECT a.*, COALESCE(c.name,'Walk-in') as client_name FROM appointments a LEFT JOIN clients c ON a.client_id=c.id WHERE a.business_id=? AND a.date>datetime('now') ORDER BY a.date ASC LIMIT 5").all(bid);
    const top = db.prepare("SELECT c.id,c.name,c.email,c.status, COALESCE(sum(a.price+a.tip),0) as total_revenue, count(a.id) as visit_count FROM clients c LEFT JOIN appointments a ON a.client_id=c.id AND a.status='Completed' WHERE c.business_id=? GROUP BY c.id ORDER BY total_revenue DESC LIMIT 6").all(bid);
    res.json({ totalClients:tc, newClientsThisMonth:nm, totalRevenue, totalExpenses:te||0, netProfit:totalRevenue-(te||0), upcomingAppointments:ua, unpaidInvoices:ui.c, unpaidInvoicesTotal:ui.t, revenueByMonth:rbm, expensesByMonth:ebm, revenueByService:rbs, expensesByCategory:ebc, nextAppointments:na, topClients:top });
  });
  // CLIENTS — scoped
  app.get("/api/clients", auth, businessOnly, scopeCheck, (req: any, res) => {
    const rows = (db.prepare("SELECT * FROM clients WHERE business_id=? ORDER BY name ASC").all(req.user.business_id) as any[]).map((c: any) => {
      const pu = db.prepare("SELECT id,email FROM users WHERE business_id=? AND email=? AND role='customer'").get(req.user.business_id, c.email);
      return { ...c, portal_user: pu || null };
    });
    res.json(rows);
  });
  app.post("/api/clients", auth, businessOnly, scopeCheck, (req: any, res) => {
    const { name, email, phone, notes, status } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });
    const r = db.prepare("INSERT INTO clients (business_id,name,email,phone,notes,status) VALUES (?,?,?,?,?,?)").run(req.user.business_id, name, email||"", phone||"", notes||"", status||"New");
    res.json({ id: r.lastInsertRowid });
  });
  app.get("/api/clients/:id", auth, businessOnly, scopeCheck, (req: any, res) => {
    const client = db.prepare("SELECT * FROM clients WHERE id=? AND business_id=?").get(req.params.id, req.user.business_id);
    if (!client) return res.status(404).json({ error: "Not found" });
    const appointments = db.prepare("SELECT * FROM appointments WHERE client_id=? AND business_id=? ORDER BY date DESC").all(req.params.id, req.user.business_id);
    const invoices = db.prepare("SELECT * FROM invoices WHERE client_id=? AND business_id=? ORDER BY created_at DESC").all(req.params.id, req.user.business_id);
    const portal_user = db.prepare("SELECT id,email,must_change_password FROM users WHERE business_id=? AND email=(SELECT email FROM clients WHERE id=?) AND role='customer'").get(req.user.business_id, req.params.id);
    res.json({ ...client as any, appointments, invoices, portal_user: portal_user || null });
  });
  app.put("/api/clients/:id", auth, businessOnly, scopeCheck, (req: any, res) => {
    const existing = db.prepare("SELECT id FROM clients WHERE id=? AND business_id=?").get(req.params.id, req.user.business_id);
    if (!existing) return res.status(404).json({ error: "Not found" });
    const { name, email, phone, notes, status } = req.body;
    db.prepare("UPDATE clients SET name=?,email=?,phone=?,notes=?,status=? WHERE id=? AND business_id=?").run(name, email||"", phone||"", notes||"", status||"New", req.params.id, req.user.business_id);
    res.json({ ok: true });
  });
  app.delete("/api/clients/:id", auth, businessOnly, scopeCheck, (req: any, res) => {
    const existing = db.prepare("SELECT id FROM clients WHERE id=? AND business_id=?").get(req.params.id, req.user.business_id);
    if (!existing) return res.status(404).json({ error: "Not found" });
    db.prepare("DELETE FROM appointments WHERE client_id=? AND business_id=?").run(req.params.id, req.user.business_id);
    db.prepare("DELETE FROM invoices WHERE client_id=? AND business_id=?").run(req.params.id, req.user.business_id);
    db.prepare("DELETE FROM clients WHERE id=? AND business_id=?").run(req.params.id, req.user.business_id);
    res.json({ ok: true });
  });
  // APPOINTMENTS — scoped
  app.get("/api/appointments", auth, businessOnly, scopeCheck, (req: any, res) => {
    res.json(db.prepare("SELECT a.*, COALESCE(c.name,'Walk-in') as client_name FROM appointments a LEFT JOIN clients c ON a.client_id=c.id WHERE a.business_id=? ORDER BY a.date DESC").all(req.user.business_id));
  });
  app.post("/api/appointments", auth, businessOnly, scopeCheck, (req: any, res) => {
    const { client_id, service, staff, date, duration, price, tip, is_walkin, status, notes } = req.body;
    if (client_id) {
      const owns = db.prepare("SELECT id FROM clients WHERE id=? AND business_id=?").get(client_id, req.user.business_id);
      if (!owns) return res.status(403).json({ error: "Client not in your business" });
    }
    const r = db.prepare("INSERT INTO appointments (business_id,client_id,service,staff,date,duration,price,tip,is_walkin,status,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)").run(req.user.business_id, client_id||null, service, staff||"", date, duration||60, price||0, tip||0, is_walkin?1:0, status||"Confirmed", notes||"");
    res.json({ id: r.lastInsertRowid });
  });
  app.patch("/api/appointments/:id/status", auth, businessOnly, scopeCheck, (req: any, res) => {
    const existing = db.prepare("SELECT id FROM appointments WHERE id=? AND business_id=?").get(req.params.id, req.user.business_id);
    if (!existing) return res.status(404).json({ error: "Not found" });
    db.prepare("UPDATE appointments SET status=? WHERE id=? AND business_id=?").run(req.body.status, req.params.id, req.user.business_id);
    res.json({ ok: true });
  });
  app.delete("/api/appointments/:id", auth, businessOnly, scopeCheck, (req: any, res) => {
    db.prepare("DELETE FROM appointments WHERE id=? AND business_id=?").run(req.params.id, req.user.business_id);
    res.json({ ok: true });
  });

  // EXPENSES — scoped
  app.get("/api/expenses", auth, businessOnly, scopeCheck, (req: any, res) => {
    res.json(db.prepare("SELECT * FROM expenses WHERE business_id=? ORDER BY date DESC").all(req.user.business_id));
  });
  app.post("/api/expenses", auth, businessOnly, scopeCheck, (req: any, res) => {
    const { date, category, amount, note } = req.body;
    const r = db.prepare("INSERT INTO expenses (business_id,date,category,amount,note) VALUES (?,?,?,?,?)").run(req.user.business_id, date, category, amount, note||"");
    res.json({ id: r.lastInsertRowid });
  });
  app.put("/api/expenses/:id", auth, businessOnly, scopeCheck, (req: any, res) => {
    const { date, category, amount, note } = req.body;
    db.prepare("UPDATE expenses SET date=?,category=?,amount=?,note=? WHERE id=? AND business_id=?").run(date, category, amount, note||"", req.params.id, req.user.business_id);
    res.json({ ok: true });
  });
  app.delete("/api/expenses/:id", auth, businessOnly, scopeCheck, (req: any, res) => {
    db.prepare("DELETE FROM expenses WHERE id=? AND business_id=?").run(req.params.id, req.user.business_id);
    res.json({ ok: true });
  });
  app.post("/api/expenses/import", auth, businessOnly, scopeCheck, (req: any, res) => {
    const { rows } = req.body;
    const ins = db.prepare("INSERT INTO expenses (business_id,date,category,amount,note) VALUES (?,?,?,?,?)");
    const tx = db.transaction((es: any[]) => { let n=0; for (const e of es) { if (!e.date||!e.amount) continue; ins.run(req.user.business_id,e.date,e.category||"Other",e.amount,e.note||""); n++; } return n; });
    res.json({ imported: tx(rows) });
  });

  // MANUAL REVENUE — scoped
  app.get("/api/revenue/manual", auth, businessOnly, scopeCheck, (req: any, res) => {
    res.json(db.prepare("SELECT * FROM manual_revenue WHERE business_id=? ORDER BY date DESC").all(req.user.business_id));
  });
  app.post("/api/revenue/manual", auth, businessOnly, scopeCheck, (req: any, res) => {
    const { date, source, amount, note } = req.body;
    const r = db.prepare("INSERT INTO manual_revenue (business_id,date,source,amount,note) VALUES (?,?,?,?,?)").run(req.user.business_id, date, source, amount, note||"");
    res.json({ id: r.lastInsertRowid });
  });
  app.put("/api/revenue/manual/:id", auth, businessOnly, scopeCheck, (req: any, res) => {
    const { date, source, amount, note } = req.body;
    db.prepare("UPDATE manual_revenue SET date=?,source=?,amount=?,note=? WHERE id=? AND business_id=?").run(date, source, amount, note||"", req.params.id, req.user.business_id);
    res.json({ ok: true });
  });
  app.delete("/api/revenue/manual/:id", auth, businessOnly, scopeCheck, (req: any, res) => {
    db.prepare("DELETE FROM manual_revenue WHERE id=? AND business_id=?").run(req.params.id, req.user.business_id);
    res.json({ ok: true });
  });
  app.post("/api/revenue/manual/import", auth, businessOnly, scopeCheck, (req: any, res) => {
    const { rows } = req.body;
    const ins = db.prepare("INSERT INTO manual_revenue (business_id,date,source,amount,note) VALUES (?,?,?,?,?)");
    const tx = db.transaction((items: any[]) => { let n=0; for (const r of items) { if (!r.date||!r.amount) continue; ins.run(req.user.business_id,r.date,r.source||"Other",r.amount,r.note||""); n++; } return n; });
    res.json({ imported: tx(rows) });
  });

  // INVOICES — scoped
  app.get("/api/invoices", auth, businessOnly, scopeCheck, (req: any, res) => {
    res.json(db.prepare("SELECT * FROM invoices WHERE business_id=? ORDER BY created_at DESC").all(req.user.business_id));
  });
  app.post("/api/invoices", auth, businessOnly, scopeCheck, (req: any, res) => {
    const { client_id, client_name, client_email, amount, status, due_date, items, notes } = req.body;
    const r = db.prepare("INSERT INTO invoices (business_id,client_id,client_name,client_email,amount,status,due_date,items,notes) VALUES (?,?,?,?,?,?,?,?,?)").run(req.user.business_id, client_id||null, client_name||"", client_email||"", amount, status||"Unpaid", due_date||"", JSON.stringify(items||[]), notes||"");
    res.json({ id: r.lastInsertRowid });
  });
  app.put("/api/invoices/:id", auth, businessOnly, scopeCheck, (req: any, res) => {
    const { client_id, client_name, client_email, amount, status, due_date, items, notes } = req.body;
    db.prepare("UPDATE invoices SET client_id=?,client_name=?,client_email=?,amount=?,status=?,due_date=?,items=?,notes=? WHERE id=? AND business_id=?").run(client_id||null, client_name||"", client_email||"", amount, status, due_date||"", JSON.stringify(items||[]), notes||"", req.params.id, req.user.business_id);
    res.json({ ok: true });
  });
  app.delete("/api/invoices/:id", auth, businessOnly, scopeCheck, (req: any, res) => {
    db.prepare("DELETE FROM invoices WHERE id=? AND business_id=?").run(req.params.id, req.user.business_id);
    res.json({ ok: true });
  });

  // ACCOUNTS (portal users) — scoped
  app.get("/api/accounts", auth, businessOnly, scopeCheck, (req: any, res) => {
    res.json(db.prepare("SELECT u.id,u.email,u.must_change_password,c.name as client_name,c.status as client_status FROM users u LEFT JOIN clients c ON c.email=u.email AND c.business_id=u.business_id WHERE u.business_id=? AND u.role='customer' ORDER BY c.name ASC").all(req.user.business_id));
  });
  app.post("/api/accounts", auth, businessOnly, scopeCheck, (req: any, res) => {
    const { client_id, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password required" });
    if (db.prepare("SELECT id FROM users WHERE email=?").get(email)) return res.status(409).json({ error: "Email already exists" });
    const client = db.prepare("SELECT * FROM clients WHERE id=? AND business_id=?").get(client_id, req.user.business_id) as any;
    if (!client) return res.status(404).json({ error: "Client not found" });
    const r = db.prepare("INSERT INTO users (email,password,role,business_id,name,must_change_password) VALUES (?,?,'customer',?,?,1)").run(email, bcrypt.hashSync(password, 12), req.user.business_id, client.name);
    res.json({ id: r.lastInsertRowid });
  });
  app.put("/api/accounts/:id", auth, businessOnly, scopeCheck, (req: any, res) => {
    const acc = db.prepare("SELECT * FROM users WHERE id=? AND business_id=? AND role='customer'").get(req.params.id, req.user.business_id);
    if (!acc) return res.status(404).json({ error: "Not found" });
    if (req.body.password) db.prepare("UPDATE users SET password=?,must_change_password=1 WHERE id=?").run(bcrypt.hashSync(req.body.password, 12), req.params.id);
    res.json({ ok: true });
  });
  app.delete("/api/accounts/:id", auth, businessOnly, scopeCheck, (req: any, res) => {
    db.prepare("DELETE FROM users WHERE id=? AND business_id=? AND role='customer'").run(req.params.id, req.user.business_id);
    res.json({ ok: true });
  });

  // PORTAL (customer-facing)
  app.get("/api/portal/me", auth, (req: any, res) => {
    if (req.user.role !== "customer") return res.status(403).json({ error: "Customer only" });
    const client = db.prepare("SELECT id,name,email,phone,status FROM clients WHERE email=? AND business_id=?").get(req.user.email, req.user.business_id) as any;
    if (!client) return res.status(404).json({ error: "Not found" });
    const appointments = db.prepare("SELECT * FROM appointments WHERE client_id=? AND business_id=? ORDER BY date DESC").all(client.id, req.user.business_id);
    const invoices = db.prepare("SELECT * FROM invoices WHERE client_id=? AND business_id=? ORDER BY created_at DESC").all(client.id, req.user.business_id);
    const stats = db.prepare("SELECT COUNT(*) as total_visits, COALESCE(SUM(price+tip),0) as total_spent, MAX(date) as last_visit FROM appointments WHERE client_id=? AND business_id=? AND status='Completed'").get(client.id, req.user.business_id) as any;
    const nextAppt = db.prepare("SELECT * FROM appointments WHERE client_id=? AND business_id=? AND date>datetime('now') ORDER BY date ASC LIMIT 1").get(client.id, req.user.business_id);
    const owed = (db.prepare("SELECT COALESCE(SUM(amount),0) as t FROM invoices WHERE client_id=? AND business_id=? AND status='Unpaid'").get(client.id, req.user.business_id) as any).t;
    res.json({ client, appointments, invoices, stats, nextAppt, outstandingAmount: owed });
  });
  app.put("/api/portal/profile", auth, (req: any, res) => {
    if (req.user.role !== "customer") return res.status(403).json({ error: "Customer only" });
    const { name, email, phone } = req.body;
    const client = db.prepare("SELECT id FROM clients WHERE email=? AND business_id=?").get(req.user.email, req.user.business_id) as any;
    if (client) db.prepare("UPDATE clients SET name=?,email=?,phone=? WHERE id=? AND business_id=?").run(name, email, phone, client.id, req.user.business_id);
    res.json({ ok: true });
  });
  // Static serving
  const distPath = path.join(process.cwd(), "dist");
  const hasDist = existsSync(distPath);
  if (!hasDist) {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath, { index: false }));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  
// ── Plan & Invoice routes ─────────────────────────────────────────────────────

// Update a business plan_services and recalculate mrr
app.put('/api/super/businesses/:id/plan', auth, superadminOnly, (req, res) => {
  const { plan_services } = req.body; // array of service IDs
  if (!Array.isArray(plan_services)) return res.status(400).json({ error: 'plan_services must be an array' });

  // Service catalog monthly prices (mirrors SuperQuote.tsx)
  const MONTHLY: Record<string, number> = {
    'crm': 25, 'website-basic': 15, 'website-custom': 25, 'seo': 15,
    'booking': 10, 'reminders': 10, 'ai-phone': 35, 'ai-chat': 15,
    'ai-followup': 15, 'reviews': 12, 'email-sms': 15, 'priority-support': 20,
  };
  const mrr = plan_services.reduce((sum: any, id: any) => sum + (MONTHLY[id] || 0), 0);

  db.run(
    'UPDATE businesses SET plan_services = ?, mrr = ? WHERE id = ?',
    [JSON.stringify(plan_services), mrr, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, mrr });
    }
  );
});

// Get invoices for a business (last 3 months + next 3 months)
app.get('/api/super/businesses/:id/invoices', auth, superadminOnly, (req, res) => {
  const bizId = parseInt(req.params.id);
  db.get('SELECT name, mrr, plan_services FROM businesses WHERE id = ?', [bizId], (err, biz: any) => {
    if (err || !biz) return res.status(404).json({ error: 'Business not found' });

    const mrr = biz.mrr || 0;
    const now = new Date();
    const invoices = [];

    // Past 3 months (paid)
    for (let i = 3; i >= 1; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      invoices.push({
        id: 'inv-past-' + i,
        period: d.toLocaleString('default', { month: 'long', year: 'numeric' }),
        amount: mrr,
        status: 'paid',
        due_date: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0],
      });
    }

    // Current month (due)
    invoices.push({
      id: 'inv-current',
      period: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
      amount: mrr,
      status: 'due',
      due_date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
    });

    // Next 2 months (upcoming)
    for (let i = 1; i <= 2; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      invoices.push({
        id: 'inv-upcoming-' + i,
        period: d.toLocaleString('default', { month: 'long', year: 'numeric' }),
        amount: mrr,
        status: 'upcoming',
        due_date: d.toISOString().split('T')[0],
      });
    }

    res.json({ business_name: biz.name, mrr, plan_services: JSON.parse(biz.plan_services || '[]'), invoices });
  });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on port " + PORT);
  });
}

startServer();
