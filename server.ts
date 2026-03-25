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

const JWT_SECRET = process.env.JWT_SECRET || "peach-stack-crm-secret-key-2025";
const PORT = process.env.PORT || 8080;
const DB_PATH = path.join(process.cwd(), "crm.db");

if (process.env.RESET_DB === "true" && existsSync(DB_PATH)) {
  unlinkSync(DB_PATH);
  console.log("RESET_DB=true — deleted existing DB");
} else if (existsSync(DB_PATH)) {
  try {
    const testDb = new Database(DB_PATH);
    testDb.prepare("SELECT 1").get();
    testDb.close();
  } catch (e) {
    console.log("Corrupt DB detected — deleting");
    unlinkSync(DB_PATH);
  }
}

if (!existsSync(DB_PATH)) {
  console.log("No DB found — running seed...");
  try {
    execSync("npx tsx seed.ts", { stdio: "inherit", cwd: process.cwd() });
    console.log("Seed complete.");
  } catch (e) {
    console.error("Seed failed:", e);
  }
}

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    business_name TEXT,
    owner_name TEXT
  );
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    phone TEXT,
    notes TEXT,
    status TEXT DEFAULT 'New',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    service TEXT,
    staff TEXT,
    date DATETIME,
    duration INTEGER,
    price REAL,
    tip REAL DEFAULT 0,
    is_walkin INTEGER DEFAULT 0,
    status TEXT,
    notes TEXT,
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    duration INTEGER,
    price REAL
  );
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS manual_revenue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    source TEXT NOT NULL,
    amount REAL NOT NULL,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    client_name TEXT,
    client_email TEXT,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'Unpaid',
    due_date TEXT,
    items TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );
`);

// Migrate existing appointments table to add new columns if they don't exist
try {
  db.exec("ALTER TABLE appointments ADD COLUMN staff TEXT");
} catch(e) {}
try {
  db.exec("ALTER TABLE appointments ADD COLUMN tip REAL DEFAULT 0");
} catch(e) {}
try {
  db.exec("ALTER TABLE appointments ADD COLUMN is_walkin INTEGER DEFAULT 0");
} catch(e) {}
try {
  db.exec("ALTER TABLE appointments ADD COLUMN notes TEXT");
} catch(e) {}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "10mb" }));
  app.use(cookieParser());

  const auth = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Forbidden" });
      req.user = user;
      next();
    });
  };

  // ── AUTH ──────────────────────────────────────────────────────────────────
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "24h" });
      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
      res.json({ user: { id: user.id, email: user.email, business_name: user.business_name, owner_name: user.owner_name } });
    } else {
      res.status(401).json({ error: "Invalid email or password" });
    }
  });
  app.post("/api/auth/logout", (req, res) => { res.clearCookie("token"); res.json({ message: "Logged out" }); });
  app.get("/api/auth/me", auth, (req: any, res) => {
    const user = db.prepare("SELECT id, email, business_name, owner_name FROM users WHERE id = ?").get(req.user.id);
    res.json({ user });
  });
  app.put("/api/auth/settings", auth, (req: any, res) => {
    const { business_name, owner_name, email } = req.body;
    db.prepare("UPDATE users SET business_name = ?, owner_name = ?, email = ? WHERE id = ?").run(business_name, owner_name, email, req.user.id);
    res.json({ message: "Settings updated" });
  });

  // ── CLIENTS ───────────────────────────────────────────────────────────────
  app.get("/api/clients", auth, (_req, res) => { res.json(db.prepare("SELECT * FROM clients ORDER BY name ASC").all()); });
  app.post("/api/clients", auth, (req, res) => {
    const { name, email, phone, notes, status } = req.body;
    const r = db.prepare("INSERT INTO clients (name, email, phone, notes, status) VALUES (?, ?, ?, ?, ?)").run(name, email, phone, notes || "", status || "New");
    res.json({ id: r.lastInsertRowid });
  });
  app.get("/api/clients/:id", auth, (req, res) => {
    const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id);
    const appointments = db.prepare("SELECT * FROM appointments WHERE client_id = ? ORDER BY date DESC").all(req.params.id);
    const invoices = db.prepare("SELECT * FROM invoices WHERE client_id = ? ORDER BY created_at DESC").all(req.params.id);
    res.json({ ...client as any, appointments, invoices });
  });
  app.put("/api/clients/:id", auth, (req, res) => {
    const { name, email, phone, notes, status } = req.body;
    db.prepare("UPDATE clients SET name=?, email=?, phone=?, notes=?, status=? WHERE id=?").run(name, email, phone, notes, status, req.params.id);
    res.json({ message: "Updated" });
  });
  app.delete("/api/clients/:id", auth, (req, res) => {
    db.prepare("DELETE FROM appointments WHERE client_id=?").run(req.params.id);
    db.prepare("DELETE FROM invoices WHERE client_id=?").run(req.params.id);
    db.prepare("DELETE FROM clients WHERE id=?").run(req.params.id);
    res.json({ message: "Deleted" });
  });
  // Bulk import clients from CSV/Excel
  app.post("/api/clients/import", auth, (req, res) => {
    const { rows } = req.body; // array of { name, email, phone, notes, status }
    if (!Array.isArray(rows)) return res.status(400).json({ error: "rows must be an array" });
    const insert = db.prepare("INSERT INTO clients (name, email, phone, notes, status) VALUES (?, ?, ?, ?, ?)");
    const insertMany = db.transaction((clients: any[]) => {
      let count = 0;
      for (const c of clients) {
        if (!c.name) continue;
        insert.run(c.name, c.email || "", c.phone || "", c.notes || "", c.status || "New");
        count++;
      }
      return count;
    });
    const count = insertMany(rows);
    res.json({ imported: count });
  });

  // ── APPOINTMENTS ──────────────────────────────────────────────────────────
  app.get("/api/appointments", auth, (_req, res) => {
    res.json(db.prepare(`
      SELECT a.*, COALESCE(c.name, 'Walk-in') as client_name
      FROM appointments a LEFT JOIN clients c ON a.client_id = c.id
      ORDER BY a.date DESC
    `).all());
  });
  app.post("/api/appointments", auth, (req, res) => {
    const { client_id, service, staff, date, duration, price, tip, is_walkin, status, notes } = req.body;
    const r = db.prepare("INSERT INTO appointments (client_id, service, staff, date, duration, price, tip, is_walkin, status, notes) VALUES (?,?,?,?,?,?,?,?,?,?)").run(client_id || null, service, staff || "", date, duration || 60, price || 0, tip || 0, is_walkin ? 1 : 0, status || "Confirmed", notes || "");
    res.json({ id: r.lastInsertRowid });
  });
  app.put("/api/appointments/:id", auth, (req, res) => {
    const { client_id, service, staff, date, duration, price, tip, is_walkin, status, notes } = req.body;
    db.prepare("UPDATE appointments SET client_id=?, service=?, staff=?, date=?, duration=?, price=?, tip=?, is_walkin=?, status=?, notes=? WHERE id=?").run(client_id || null, service, staff || "", date, duration, price, tip || 0, is_walkin ? 1 : 0, status, notes || "", req.params.id);
    res.json({ message: "Updated" });
  });
  app.patch("/api/appointments/:id/status", auth, (req, res) => {
    db.prepare("UPDATE appointments SET status=? WHERE id=?").run(req.body.status, req.params.id);
    res.json({ message: "Updated" });
  });
  app.delete("/api/appointments/:id", auth, (req, res) => {
    db.prepare("DELETE FROM appointments WHERE id=?").run(req.params.id);
    res.json({ message: "Deleted" });
  });
  // Bulk import appointments
  app.post("/api/appointments/import", auth, (req, res) => {
    const { rows } = req.body;
    if (!Array.isArray(rows)) return res.status(400).json({ error: "rows must be an array" });
    const insert = db.prepare("INSERT INTO appointments (client_id, service, staff, date, duration, price, tip, is_walkin, status, notes) VALUES (?,?,?,?,?,?,?,?,?,?)");
    const insertMany = db.transaction((appts: any[]) => {
      let count = 0;
      for (const a of appts) {
        if (!a.service || !a.date) continue;
        // Try to match client by name
        let clientId = null;
        if (a.client_name) {
          const client = db.prepare("SELECT id FROM clients WHERE name = ? COLLATE NOCASE").get(a.client_name) as any;
          if (client) clientId = client.id;
        }
        insert.run(clientId, a.service, a.staff || "", a.date, a.duration || 60, a.price || 0, a.tip || 0, a.is_walkin ? 1 : 0, a.status || "Completed", a.notes || "");
        count++;
      }
      return count;
    });
    const count = insertMany(rows);
    res.json({ imported: count });
  });

  // ── EXPENSES ──────────────────────────────────────────────────────────────
  app.get("/api/expenses", auth, (_req, res) => {
    res.json(db.prepare("SELECT * FROM expenses ORDER BY date DESC").all());
  });
  app.post("/api/expenses", auth, (req, res) => {
    const { date, category, amount, note } = req.body;
    const r = db.prepare("INSERT INTO expenses (date, category, amount, note) VALUES (?,?,?,?)").run(date, category, amount, note || "");
    res.json({ id: r.lastInsertRowid });
  });
  app.put("/api/expenses/:id", auth, (req, res) => {
    const { date, category, amount, note } = req.body;
    db.prepare("UPDATE expenses SET date=?, category=?, amount=?, note=? WHERE id=?").run(date, category, amount, note || "", req.params.id);
    res.json({ message: "Updated" });
  });
  app.delete("/api/expenses/:id", auth, (req, res) => {
    db.prepare("DELETE FROM expenses WHERE id=?").run(req.params.id);
    res.json({ message: "Deleted" });
  });
  // Bulk import expenses
  app.post("/api/expenses/import", auth, (req, res) => {
    const { rows } = req.body;
    if (!Array.isArray(rows)) return res.status(400).json({ error: "rows must be an array" });
    const insert = db.prepare("INSERT INTO expenses (date, category, amount, note) VALUES (?,?,?,?)");
    const insertMany = db.transaction((expenses: any[]) => {
      let count = 0;
      for (const e of expenses) {
        if (!e.date || !e.amount) continue;
        insert.run(e.date, e.category || "Other", e.amount, e.note || "");
        count++;
      }
      return count;
    });
    res.json({ imported: insertMany(rows) });
  });

  // ── MANUAL REVENUE ────────────────────────────────────────────────────────
  app.get("/api/revenue/manual", auth, (_req, res) => {
    res.json(db.prepare("SELECT * FROM manual_revenue ORDER BY date DESC").all());
  });
  app.post("/api/revenue/manual", auth, (req, res) => {
    const { date, source, amount, note } = req.body;
    const r = db.prepare("INSERT INTO manual_revenue (date, source, amount, note) VALUES (?,?,?,?)").run(date, source, amount, note || "");
    res.json({ id: r.lastInsertRowid });
  });
  app.put("/api/revenue/manual/:id", auth, (req, res) => {
    const { date, source, amount, note } = req.body;
    db.prepare("UPDATE manual_revenue SET date=?, source=?, amount=?, note=? WHERE id=?").run(date, source, amount, note || "", req.params.id);
    res.json({ message: "Updated" });
  });
  app.delete("/api/revenue/manual/:id", auth, (req, res) => {
    db.prepare("DELETE FROM manual_revenue WHERE id=?").run(req.params.id);
    res.json({ message: "Deleted" });
  });
  app.post("/api/revenue/manual/import", auth, (req, res) => {
    const { rows } = req.body;
    if (!Array.isArray(rows)) return res.status(400).json({ error: "rows must be an array" });
    const insert = db.prepare("INSERT INTO manual_revenue (date, source, amount, note) VALUES (?,?,?,?)");
    const insertMany = db.transaction((items: any[]) => {
      let count = 0;
      for (const r of items) {
        if (!r.date || !r.amount) continue;
        insert.run(r.date, r.source || "Other", r.amount, r.note || "");
        count++;
      }
      return count;
    });
    res.json({ imported: insertMany(rows) });
  });

  // ── INVOICES ──────────────────────────────────────────────────────────────
  app.get("/api/invoices", auth, (_req, res) => {
    res.json(db.prepare("SELECT * FROM invoices ORDER BY created_at DESC").all());
  });
  app.post("/api/invoices", auth, (req, res) => {
    const { client_id, client_name, client_email, amount, status, due_date, items, notes } = req.body;
    const r = db.prepare("INSERT INTO invoices (client_id, client_name, client_email, amount, status, due_date, items, notes) VALUES (?,?,?,?,?,?,?,?)").run(client_id || null, client_name || "", client_email || "", amount, status || "Unpaid", due_date || "", JSON.stringify(items || []), notes || "");
    res.json({ id: r.lastInsertRowid });
  });
  app.put("/api/invoices/:id", auth, (req, res) => {
    const { client_id, client_name, client_email, amount, status, due_date, items, notes } = req.body;
    db.prepare("UPDATE invoices SET client_id=?, client_name=?, client_email=?, amount=?, status=?, due_date=?, items=?, notes=? WHERE id=?").run(client_id || null, client_name || "", client_email || "", amount, status, due_date || "", JSON.stringify(items || []), notes || "", req.params.id);
    res.json({ message: "Updated" });
  });
  app.delete("/api/invoices/:id", auth, (req, res) => {
    db.prepare("DELETE FROM invoices WHERE id=?").run(req.params.id);
    res.json({ message: "Deleted" });
  });

  // ── STATS (full P&L) ──────────────────────────────────────────────────────
  app.get("/api/stats", auth, (req, res) => {
    const { startDate, endDate } = req.query;
    let apptFilter = "WHERE a.status = 'Completed'";
    let expFilter = "WHERE 1=1";
    let manualFilter = "WHERE 1=1";
    let params: any[] = [];
    let expParams: any[] = [];
    let manualParams: any[] = [];
    if (startDate && endDate) {
      apptFilter += " AND a.date BETWEEN ? AND ?"; params.push(startDate, endDate);
      expFilter += " AND date BETWEEN ? AND ?"; expParams.push(startDate, endDate);
      manualFilter += " AND date BETWEEN ? AND ?"; manualParams.push(startDate, endDate);
    }

    const totalClients = db.prepare("SELECT count(*) as count FROM clients").get() as any;
    const newClientsThisMonth = db.prepare("SELECT count(*) as count FROM clients WHERE created_at >= date('now','start of month')").get() as any;
    const apptRevenue = db.prepare(`SELECT COALESCE(sum(a.price + a.tip), 0) as total FROM appointments a ${apptFilter}`).get(...params) as any;
    const manualRevenue = db.prepare(`SELECT COALESCE(sum(amount), 0) as total FROM manual_revenue ${manualFilter}`).get(...manualParams) as any;
    const totalRevenue = (apptRevenue.total || 0) + (manualRevenue.total || 0);
    const totalExpenses = db.prepare(`SELECT COALESCE(sum(amount), 0) as total FROM expenses ${expFilter}`).get(...expParams) as any;
    const netProfit = totalRevenue - (totalExpenses.total || 0);
    const upcomingAppointments = db.prepare("SELECT count(*) as count FROM appointments WHERE date > datetime('now')").get() as any;
    const unpaidInvoices = db.prepare("SELECT count(*) as count, COALESCE(sum(amount),0) as total FROM invoices WHERE status='Unpaid'").get() as any;

    const revenueByMonth = db.prepare(`
      SELECT strftime('%Y-%m', a.date) as month, sum(a.price + a.tip) as total
      FROM appointments a ${apptFilter} GROUP BY month ORDER BY month DESC LIMIT 12
    `).all(...params);

    const expensesByMonth = db.prepare(`
      SELECT strftime('%Y-%m', date) as month, sum(amount) as total
      FROM expenses ${expFilter} GROUP BY month ORDER BY month DESC LIMIT 12
    `).all(...expParams);

    const revenueByService = db.prepare(`
      SELECT a.service as name, sum(a.price) as value, count(*) as count
      FROM appointments a ${apptFilter} GROUP BY a.service ORDER BY value DESC
    `).all(...params);

    const expensesByCategory = db.prepare(`
      SELECT category as name, sum(amount) as value
      FROM expenses ${expFilter} GROUP BY category ORDER BY value DESC
    `).all(...expParams);

    const recentClients = db.prepare("SELECT * FROM clients ORDER BY created_at DESC LIMIT 5").all();
    const nextAppointments = db.prepare(`
      SELECT a.*, COALESCE(c.name, 'Walk-in') as client_name
      FROM appointments a LEFT JOIN clients c ON a.client_id = c.id
      WHERE a.date > datetime('now') ORDER BY a.date ASC LIMIT 5
    `).all();

    res.json({
      totalClients: totalClients.count,
      newClientsThisMonth: newClientsThisMonth.count,
      totalRevenue,
      totalExpenses: totalExpenses.total || 0,
      netProfit,
      upcomingAppointments: upcomingAppointments.count,
      unpaidInvoices: unpaidInvoices.count,
      unpaidInvoicesTotal: unpaidInvoices.total,
      revenueByMonth,
      expensesByMonth,
      revenueByService,
      expensesByCategory,
      recentClients,
      nextAppointments,
    });
  });

  // Serve frontend
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => { res.sendFile(path.join(distPath, "index.html")); });
  }

  app.listen(PORT, "0.0.0.0", () => { console.log(`Server running on port ${PORT}`); });
}

startServer();
