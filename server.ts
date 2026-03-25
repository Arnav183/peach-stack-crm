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

// Force reseed if RESET_DB=true, or delete corrupt DB
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

// Run seed if DB doesn't exist yet
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
    date DATETIME,
    duration INTEGER,
    price REAL,
    status TEXT,
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    duration INTEGER,
    price REAL
  );
`);

async function startServer() {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Forbidden" });
      req.user = user;
      next();
    });
  };

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

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out" });
  });

  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    const user = db.prepare("SELECT id, email, business_name, owner_name FROM users WHERE id = ?").get(req.user.id);
    res.json({ user });
  });

  app.get("/api/clients", authenticateToken, (req, res) => {
    const clients = db.prepare("SELECT * FROM clients ORDER BY name ASC").all();
    res.json(clients);
  });

  app.post("/api/clients", authenticateToken, (req, res) => {
    const { name, email, phone, notes } = req.body;
    const result = db.prepare("INSERT INTO clients (name, email, phone, notes) VALUES (?, ?, ?, ?)").run(name, email, phone, notes);
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/clients/:id", authenticateToken, (req, res) => {
    const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id);
    const appointments = db.prepare("SELECT * FROM appointments WHERE client_id = ? ORDER BY date DESC").all(req.params.id);
    res.json({ ...client as any, appointments });
  });

  app.put("/api/clients/:id", authenticateToken, (req, res) => {
    const { name, email, phone, notes, status } = req.body;
    db.prepare("UPDATE clients SET name = ?, email = ?, phone = ?, notes = ?, status = ? WHERE id = ?").run(name, email, phone, notes, status, req.params.id);
    res.json({ message: "Client updated" });
  });

  app.delete("/api/clients/:id", authenticateToken, (req, res) => {
    db.prepare("DELETE FROM appointments WHERE client_id = ?").run(req.params.id);
    db.prepare("DELETE FROM clients WHERE id = ?").run(req.params.id);
    res.json({ message: "Client deleted" });
  });

  app.get("/api/appointments", authenticateToken, (req, res) => {
    const appointments = db.prepare(`
      SELECT a.*, c.name as client_name FROM appointments a
      JOIN clients c ON a.client_id = c.id ORDER BY a.date DESC
    `).all();
    res.json(appointments);
  });

  app.post("/api/appointments", authenticateToken, (req, res) => {
    const { client_id, service, date, duration, price, status } = req.body;
    const result = db.prepare("INSERT INTO appointments (client_id, service, date, duration, price, status) VALUES (?, ?, ?, ?, ?, ?)").run(client_id, service, date, duration, price, status);
    res.json({ id: result.lastInsertRowid });
  });

  app.patch("/api/appointments/:id/status", authenticateToken, (req, res) => {
    const { status } = req.body;
    db.prepare("UPDATE appointments SET status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ message: "Status updated" });
  });

  app.get("/api/stats", authenticateToken, (req, res) => {
    const { startDate, endDate } = req.query;
    let dateFilter = "WHERE status = 'Completed'";
    let params: any[] = [];
    if (startDate && endDate) { dateFilter += " AND date BETWEEN ? AND ?"; params.push(startDate, endDate); }
    const totalClients = db.prepare("SELECT count(*) as count FROM clients").get() as any;
    const totalRevenue = db.prepare(`SELECT sum(price) as total FROM appointments ${dateFilter}`).get(...params) as any;
    const upcomingAppointments = db.prepare("SELECT count(*) as count FROM appointments WHERE date > datetime('now')").get() as any;
    const revenueByMonth = db.prepare(`SELECT strftime('%Y-%m', date) as month, sum(price) as total FROM appointments ${dateFilter} GROUP BY month ORDER BY month DESC LIMIT 12`).all(...params);
    const revenueByService = db.prepare(`SELECT service as name, sum(price) as value FROM appointments ${dateFilter} GROUP BY service ORDER BY value DESC`).all(...params);
    const recentClients = db.prepare("SELECT * FROM clients ORDER BY created_at DESC LIMIT 5").all();
    const nextAppointments = db.prepare(`SELECT a.*, c.name as client_name FROM appointments a JOIN clients c ON a.client_id = c.id WHERE a.date > datetime('now') ORDER BY a.date ASC LIMIT 5`).all();
    res.json({ totalClients: totalClients.count, totalRevenue: totalRevenue.total || 0, upcomingAppointments: upcomingAppointments.count, revenueByMonth, revenueByService, recentClients, nextAppointments });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => { res.sendFile(path.join(distPath, "index.html")); });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
