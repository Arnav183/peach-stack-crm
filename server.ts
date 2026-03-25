fix: serve SPA index.html for all routes based on dist existence not NODE_ENVimport express from "express";
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
const JWT_SECRET = process.env.JWT_SECRET || "peach-stack-crm-secret-key-2025";
const PORT = process.env.PORT || 8080;
const DB_PATH = path.join(process.cwd(), "crm.db");

if (process.env.RESET_DB === "true" && existsSync(DB_PATH)) {
  unlinkSync(DB_PATH); console.log("RESET_DB=true — deleted existing DB");
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
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE, password TEXT,
    business_name TEXT, owner_name TEXT,
    role TEXT DEFAULT 'admin',
    client_id INTEGER,
    must_change_password INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT, email TEXT, phone TEXT, notes TEXT,
    status TEXT DEFAULT 'New',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER, service TEXT, staff TEXT,
    date DATETIME, duration INTEGER, price REAL,
    tip REAL DEFAULT 0, is_walkin INTEGER DEFAULT 0,
    status TEXT, notes TEXT,
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );
  CREATE TABLE IF NOT EXISTS services (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, duration INTEGER, price REAL);
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL, category TEXT NOT NULL, amount REAL NOT NULL, note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS manual_revenue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL, source TEXT NOT NULL, amount REAL NOT NULL, note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER, client_name TEXT, client_email TEXT,
    amount REAL NOT NULL, status TEXT DEFAULT 'Unpaid',
    due_date TEXT, items TEXT, notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );
`);

const migrations = [
  "ALTER TABLE appointments ADD COLUMN staff TEXT",
  "ALTER TABLE appointments ADD COLUMN tip REAL DEFAULT 0",
  "ALTER TABLE appointments ADD COLUMN is_walkin INTEGER DEFAULT 0",
  "ALTER TABLE appointments ADD COLUMN notes TEXT",
  "ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'admin'",
  "ALTER TABLE users ADD COLUMN client_id INTEGER",
  "ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0",
];
for (const m of migrations) { try { db.exec(m); } catch(e) {} }

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "10mb" }));
  app.use(cookieParser());

  const auth = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Forbidden" });
      req.user = user; next();
    });
  };

  const adminOnly = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: "Admin access required" });
    next();
  };

  // AUTH
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role || 'admin', client_id: user.client_id }, JWT_SECRET, { expiresIn: "24h" });
      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
      res.json({ user: { id: user.id, email: user.email, role: user.role || 'admin', client_id: user.client_id, must_change_password: user.must_change_password, business_name: user.business_name, owner_name: user.owner_name } });
    } else { res.status(401).json({ error: "Invalid email or password" }); }
  });

  app.post("/api/auth/logout", (req, res) => { res.clearCookie("token"); res.json({ message: "Logged out" }); });

  app.get("/api/auth/me", auth, (req: any, res) => {
    const user = db.prepare("SELECT id, email, role, client_id, must_change_password, business_name, owner_name FROM users WHERE id = ?").get(req.user.id);
    res.json({ user });
  });

  app.put("/api/auth/settings", auth, adminOnly, (req: any, res) => {
    const { business_name, owner_name, email } = req.body;
    db.prepare("UPDATE users SET business_name=?, owner_name=?, email=? WHERE id=?").run(business_name, owner_name, email, req.user.id);
    res.json({ message: "Updated" });
  });

  app.put("/api/auth/password", auth, (req: any, res) => {
    const { current_password, new_password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id) as any;
    if (!bcrypt.compareSync(current_password, user.password)) return res.status(401).json({ error: "Current password is incorrect" });
    db.prepare("UPDATE users SET password=?, must_change_password=0 WHERE id=?").run(bcrypt.hashSync(new_password, 10), req.user.id);
    res.json({ message: "Password updated" });
  });

  // ACCOUNTS
  app.get("/api/accounts", auth, adminOnly, (_req, res) => {
    res.json(db.prepare(`SELECT u.id, u.email, u.role, u.client_id, u.must_change_password, u.owner_name, c.name as client_name, c.status as client_status FROM users u LEFT JOIN clients c ON u.client_id = c.id WHERE u.role = 'client' ORDER BY c.name ASC`).all());
  });

  app.post("/api/accounts", auth, adminOnly, (req, res) => {
    const { client_id, email, password, owner_name } = req.body;
    if (!client_id || !email || !password) return res.status(400).json({ error: "client_id, email, and password required" });
    const client = db.prepare("SELECT * FROM clients WHERE id=?").get(client_id) as any;
    if (!client) return res.status(404).json({ error: "Client not found" });
    if (db.prepare("SELECT id FROM users WHERE email=?").get(email)) return res.status(409).json({ error: "Email already exists" });
    const r = db.prepare("INSERT INTO users (email,password,role,client_id,owner_name,must_change_password) VALUES (?,?,'client',?,?,1)").run(email, bcrypt.hashSync(password, 10), client_id, owner_name || client.name);
    res.json({ id: r.lastInsertRowid });
  });

  app.put("/api/accounts/:id", auth, adminOnly, (req, res) => {
    const { email, password, owner_name } = req.body;
    const acc = db.prepare("SELECT * FROM users WHERE id=? AND role='client'").get(req.params.id) as any;
    if (!acc) return res.status(404).json({ error: "Account not found" });
    if (password) {
      db.prepare("UPDATE users SET email=?, password=?, owner_name=?, must_change_password=1 WHERE id=?").run(email || acc.email, bcrypt.hashSync(password, 10), owner_name || acc.owner_name, req.params.id);
    } else {
      db.prepare("UPDATE users SET email=?, owner_name=? WHERE id=?").run(email || acc.email, owner_name || acc.owner_name, req.params.id);
    }
    res.json({ message: "Updated" });
  });

  app.delete("/api/accounts/:id", auth, adminOnly, (req, res) => {
    db.prepare("DELETE FROM users WHERE id=? AND role='client'").run(req.params.id);
    res.json({ message: "Revoked" });
  });

  // CLIENTS
  app.get("/api/clients", auth, adminOnly, (_req, res) => {
    const clients = (db.prepare("SELECT * FROM clients ORDER BY name ASC").all() as any[]).map((c: any) => {
      const pu = db.prepare("SELECT id, email FROM users WHERE client_id=? AND role='client'").get(c.id);
      return { ...c, portal_user: pu || null };
    });
    res.json(clients);
  });
  app.post("/api/clients", auth, adminOnly, (req, res) => {
    const { name, email, phone, notes, status } = req.body;
    const r = db.prepare("INSERT INTO clients (name,email,phone,notes,status) VALUES (?,?,?,?,?)").run(name, email, phone, notes||"", status||"New");
    res.json({ id: r.lastInsertRowid });
  });
  app.get("/api/clients/:id", auth, adminOnly, (req, res) => {
    const client = db.prepare("SELECT * FROM clients WHERE id=?").get(req.params.id);
    const appointments = db.prepare("SELECT * FROM appointments WHERE client_id=? ORDER BY date DESC").all(req.params.id);
    const invoices = db.prepare("SELECT * FROM invoices WHERE client_id=? ORDER BY created_at DESC").all(req.params.id);
    const portal_user = db.prepare("SELECT id, email, must_change_password FROM users WHERE client_id=? AND role='client'").get(req.params.id);
    res.json({ ...client as any, appointments, invoices, portal_user: portal_user || null });
  });
  app.put("/api/clients/:id", auth, adminOnly, (req, res) => {
    const { name, email, phone, notes, status } = req.body;
    db.prepare("UPDATE clients SET name=?,email=?,phone=?,notes=?,status=? WHERE id=?").run(name, email, phone, notes, status, req.params.id);
    res.json({ message: "Updated" });
  });
  app.delete("/api/clients/:id", auth, adminOnly, (req, res) => {
    db.prepare("DELETE FROM appointments WHERE client_id=?").run(req.params.id);
    db.prepare("DELETE FROM invoices WHERE client_id=?").run(req.params.id);
    db.prepare("DELETE FROM users WHERE client_id=? AND role='client'").run(req.params.id);
    db.prepare("DELETE FROM clients WHERE id=?").run(req.params.id);
    res.json({ message: "Deleted" });
  });
  app.post("/api/clients/import", auth, adminOnly, (req, res) => {
    const { rows } = req.body;
    if (!Array.isArray(rows)) return res.status(400).json({ error: "rows must be array" });
    const ins = db.prepare("INSERT INTO clients (name,email,phone,notes,status) VALUES (?,?,?,?,?)");
    const tx = db.transaction((cls: any[]) => { let n=0; for (const c of cls) { if (!c.name) continue; ins.run(c.name,c.email||"",c.phone||"",c.notes||"",c.status||"New"); n++; } return n; });
    res.json({ imported: tx(rows) });
  });

  // PORTAL
  app.get("/api/portal/me", auth, (req: any, res) => {
    if (req.user.role !== 'client') return res.status(403).json({ error: "Client only" });
    const client = db.prepare("SELECT id,name,email,phone,status,created_at FROM clients WHERE id=?").get(req.user.client_id) as any;
    if (!client) return res.status(404).json({ error: "Not found" });
    const appointments = db.prepare("SELECT id,service,staff,date,duration,price,tip,status FROM appointments WHERE client_id=? ORDER BY date DESC").all(req.user.client_id);
    const invoices = db.prepare("SELECT id,amount,status,due_date,items,notes,created_at FROM invoices WHERE client_id=? ORDER BY created_at DESC").all(req.user.client_id);
    const stats = db.prepare("SELECT COUNT(*) as total_visits, COALESCE(SUM(price+tip),0) as total_spent, MAX(date) as last_visit FROM appointments WHERE client_id=? AND status='Completed'").get(req.user.client_id) as any;
    const nextAppt = db.prepare("SELECT id,service,staff,date,duration,price,status FROM appointments WHERE client_id=? AND date>datetime('now') ORDER BY date ASC LIMIT 1").get(req.user.client_id);
    const owed = (db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM invoices WHERE client_id=? AND status='Unpaid'").get(req.user.client_id) as any).total;
    res.json({ client, appointments, invoices, stats, nextAppt, outstandingAmount: owed });
  });
  app.put("/api/portal/profile", auth, (req: any, res) => {
    if (req.user.role !== 'client') return res.status(403).json({ error: "Client only" });
    const { name, email, phone } = req.body;
    db.prepare("UPDATE clients SET name=?,email=?,phone=? WHERE id=?").run(name, email, phone, req.user.client_id);
    db.prepare("UPDATE users SET email=? WHERE id=?").run(email, req.user.id);
    res.json({ message: "Updated" });
  });

  // APPOINTMENTS
  app.get("/api/appointments", auth, adminOnly, (_req, res) => {
    res.json(db.prepare("SELECT a.*, COALESCE(c.name,'Walk-in') as client_name FROM appointments a LEFT JOIN clients c ON a.client_id=c.id ORDER BY a.date DESC").all());
  });
  app.post("/api/appointments", auth, adminOnly, (req, res) => {
    const { client_id,service,staff,date,duration,price,tip,is_walkin,status,notes } = req.body;
    const r = db.prepare("INSERT INTO appointments (client_id,service,staff,date,duration,price,tip,is_walkin,status,notes) VALUES (?,?,?,?,?,?,?,?,?,?)").run(client_id||null,service,staff||"",date,duration||60,price||0,tip||0,is_walkin?1:0,status||"Confirmed",notes||"");
    res.json({ id: r.lastInsertRowid });
  });
  app.put("/api/appointments/:id", auth, adminOnly, (req, res) => {
    const { client_id,service,staff,date,duration,price,tip,is_walkin,status,notes } = req.body;
    db.prepare("UPDATE appointments SET client_id=?,service=?,staff=?,date=?,duration=?,price=?,tip=?,is_walkin=?,status=?,notes=? WHERE id=?").run(client_id||null,service,staff||"",date,duration,price,tip||0,is_walkin?1:0,status,notes||"",req.params.id);
    res.json({ message: "Updated" });
  });
  app.patch("/api/appointments/:id/status", auth, adminOnly, (req, res) => {
    db.prepare("UPDATE appointments SET status=? WHERE id=?").run(req.body.status, req.params.id);
    res.json({ message: "Updated" });
  });
  app.delete("/api/appointments/:id", auth, adminOnly, (req, res) => {
    db.prepare("DELETE FROM appointments WHERE id=?").run(req.params.id);
    res.json({ message: "Deleted" });
  });
  app.post("/api/appointments/import", auth, adminOnly, (req, res) => {
    const { rows } = req.body;
    if (!Array.isArray(rows)) return res.status(400).json({ error: "rows must be array" });
    const ins = db.prepare("INSERT INTO appointments (client_id,service,staff,date,duration,price,tip,is_walkin,status,notes) VALUES (?,?,?,?,?,?,?,?,?,?)");
    const tx = db.transaction((appts: any[]) => { let n=0; for (const a of appts) { if (!a.service||!a.date) continue; let cid=null; if (a.client_name) { const cl=db.prepare("SELECT id FROM clients WHERE name=? COLLATE NOCASE").get(a.client_name) as any; if (cl) cid=cl.id; } ins.run(cid,a.service,a.staff||"",a.date,a.duration||60,a.price||0,a.tip||0,a.is_walkin?1:0,a.status||"Completed",a.notes||""); n++; } return n; });
    res.json({ imported: tx(rows) });
  });

  // EXPENSES
  app.get("/api/expenses", auth, adminOnly, (_req, res) => { res.json(db.prepare("SELECT * FROM expenses ORDER BY date DESC").all()); });
  app.post("/api/expenses", auth, adminOnly, (req, res) => { const { date,category,amount,note }=req.body; const r=db.prepare("INSERT INTO expenses (date,category,amount,note) VALUES (?,?,?,?)").run(date,category,amount,note||""); res.json({ id: r.lastInsertRowid }); });
  app.put("/api/expenses/:id", auth, adminOnly, (req, res) => { const { date,category,amount,note }=req.body; db.prepare("UPDATE expenses SET date=?,category=?,amount=?,note=? WHERE id=?").run(date,category,amount,note||"",req.params.id); res.json({ message: "Updated" }); });
  app.delete("/api/expenses/:id", auth, adminOnly, (req, res) => { db.prepare("DELETE FROM expenses WHERE id=?").run(req.params.id); res.json({ message: "Deleted" }); });
  app.post("/api/expenses/import", auth, adminOnly, (req, res) => { const { rows }=req.body; if (!Array.isArray(rows)) return res.status(400).json({ error: "array required" }); const ins=db.prepare("INSERT INTO expenses (date,category,amount,note) VALUES (?,?,?,?)"); const tx=db.transaction((es: any[]) => { let n=0; for (const e of es) { if (!e.date||!e.amount) continue; ins.run(e.date,e.category||"Other",e.amount,e.note||""); n++; } return n; }); res.json({ imported: tx(rows) }); });

  // MANUAL REVENUE
  app.get("/api/revenue/manual", auth, adminOnly, (_req, res) => { res.json(db.prepare("SELECT * FROM manual_revenue ORDER BY date DESC").all()); });
  app.post("/api/revenue/manual", auth, adminOnly, (req, res) => { const { date,source,amount,note }=req.body; const r=db.prepare("INSERT INTO manual_revenue (date,source,amount,note) VALUES (?,?,?,?)").run(date,source,amount,note||""); res.json({ id: r.lastInsertRowid }); });
  app.put("/api/revenue/manual/:id", auth, adminOnly, (req, res) => { const { date,source,amount,note }=req.body; db.prepare("UPDATE manual_revenue SET date=?,source=?,amount=?,note=? WHERE id=?").run(date,source,amount,note||"",req.params.id); res.json({ message: "Updated" }); });
  app.delete("/api/revenue/manual/:id", auth, adminOnly, (req, res) => { db.prepare("DELETE FROM manual_revenue WHERE id=?").run(req.params.id); res.json({ message: "Deleted" }); });
  app.post("/api/revenue/manual/import", auth, adminOnly, (req, res) => { const { rows }=req.body; if (!Array.isArray(rows)) return res.status(400).json({ error: "array required" }); const ins=db.prepare("INSERT INTO manual_revenue (date,source,amount,note) VALUES (?,?,?,?)"); const tx=db.transaction((items: any[]) => { let n=0; for (const r of items) { if (!r.date||!r.amount) continue; ins.run(r.date,r.source||"Other",r.amount,r.note||""); n++; } return n; }); res.json({ imported: tx(rows) }); });

  // INVOICES
  app.get("/api/invoices", auth, adminOnly, (_req, res) => { res.json(db.prepare("SELECT * FROM invoices ORDER BY created_at DESC").all()); });
  app.post("/api/invoices", auth, adminOnly, (req, res) => { const { client_id,client_name,client_email,amount,status,due_date,items,notes }=req.body; const r=db.prepare("INSERT INTO invoices (client_id,client_name,client_email,amount,status,due_date,items,notes) VALUES (?,?,?,?,?,?,?,?)").run(client_id||null,client_name||"",client_email||"",amount,status||"Unpaid",due_date||"",JSON.stringify(items||[]),notes||""); res.json({ id: r.lastInsertRowid }); });
  app.put("/api/invoices/:id", auth, adminOnly, (req, res) => { const { client_id,client_name,client_email,amount,status,due_date,items,notes }=req.body; db.prepare("UPDATE invoices SET client_id=?,client_name=?,client_email=?,amount=?,status=?,due_date=?,items=?,notes=? WHERE id=?").run(client_id||null,client_name||"",client_email||"",amount,status,due_date||"",JSON.stringify(items||[]),notes||"",req.params.id); res.json({ message: "Updated" }); });
  app.delete("/api/invoices/:id", auth, adminOnly, (req, res) => { db.prepare("DELETE FROM invoices WHERE id=?").run(req.params.id); res.json({ message: "Deleted" }); });

  // STATS
  app.get("/api/stats", auth, adminOnly, (req, res) => {
    const { startDate, endDate } = req.query;
    let af="WHERE a.status='Completed'", ef="WHERE 1=1", mf="WHERE 1=1";
    let ap: any[]=[], ep: any[]=[], mp: any[]=[];
    if (startDate&&endDate) { af+=" AND a.date BETWEEN ? AND ?"; ap=[startDate,endDate]; ef+=" AND date BETWEEN ? AND ?"; ep=[startDate,endDate]; mf+=" AND date BETWEEN ? AND ?"; mp=[startDate,endDate]; }
    const tc=db.prepare("SELECT count(*) as count FROM clients").get() as any;
    const nm=db.prepare("SELECT count(*) as count FROM clients WHERE created_at>=date('now','start of month')").get() as any;
    const ar=db.prepare(`SELECT COALESCE(sum(a.price+a.tip),0) as total FROM appointments a ${af}`).get(...ap) as any;
    const mr=db.prepare(`SELECT COALESCE(sum(amount),0) as total FROM manual_revenue ${mf}`).get(...mp) as any;
    const totalRevenue=(ar.total||0)+(mr.total||0);
    const te=db.prepare(`SELECT COALESCE(sum(amount),0) as total FROM expenses ${ef}`).get(...ep) as any;
    const ua=db.prepare("SELECT count(*) as count FROM appointments WHERE date>datetime('now')").get() as any;
    const ui=db.prepare("SELECT count(*) as count, COALESCE(sum(amount),0) as total FROM invoices WHERE status='Unpaid'").get() as any;
    const rbm=db.prepare(`SELECT strftime('%Y-%m',a.date) as month, sum(a.price+a.tip) as total FROM appointments a ${af} GROUP BY month ORDER BY month DESC LIMIT 12`).all(...ap);
    const ebm=db.prepare(`SELECT strftime('%Y-%m',date) as month, sum(amount) as total FROM expenses ${ef} GROUP BY month ORDER BY month DESC LIMIT 12`).all(...ep);
    const rbs=db.prepare(`SELECT a.service as service, sum(a.price) as total, count(*) as count FROM appointments a ${af} GROUP BY a.service ORDER BY total DESC`).all(...ap);
    const ebc=db.prepare(`SELECT category as name, sum(amount) as value FROM expenses ${ef} GROUP BY category ORDER BY value DESC`).all(...ep);
    const rc=db.prepare("SELECT * FROM clients ORDER BY created_at DESC LIMIT 5").all();
    const na=db.prepare("SELECT a.*, COALESCE(c.name,'Walk-in') as client_name FROM appointments a LEFT JOIN clients c ON a.client_id=c.id WHERE a.date>datetime('now') ORDER BY a.date ASC LIMIT 5").all();
    const top=db.prepare("SELECT c.id,c.name,c.email,c.phone,c.status, COALESCE(sum(a.price+a.tip),0) as total_revenue, count(a.id) as visit_count FROM clients c LEFT JOIN appointments a ON a.client_id=c.id AND a.status='Completed' GROUP BY c.id ORDER BY total_revenue DESC LIMIT 6").all();
    res.json({ totalClients:tc.count, newClientsThisMonth:nm.count, totalRevenue, totalExpenses:te.total||0, netProfit:totalRevenue-(te.total||0), upcomingAppointments:ua.count, unpaidInvoices:ui.count, unpaidInvoicesTotal:ui.total, revenueByMonth:rbm, expensesByMonth:ebm, revenueByService:rbs, expensesByCategory:ebc, recentClients:rc, nextAppointments:na, topClients:top });
  });

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

  app.listen(PORT, "0.0.0.0", () => { console.log(`Server running on port ${PORT}`); });
}
startServer();
