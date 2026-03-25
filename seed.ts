import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { existsSync, unlinkSync } from "fs";

const DB_PATH = "crm.db";
if (existsSync(DB_PATH)) { unlinkSync(DB_PATH); console.log("Deleted existing DB — starting fresh"); }

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

const hashedPassword = bcrypt.hashSync("admin123", 10);
db.prepare("INSERT INTO users (email,password,business_name,owner_name,role) VALUES (?,?,?,?,?)").run("admin@example.com", hashedPassword, "Luxe Threading Studio", "Arnav Hazari", "admin");
console.log("Created user: admin@example.com / admin123");

const services = [
  { name: "Brow Threading", duration: 20, price: 18 },
  { name: "Full Face Threading", duration: 40, price: 45 },
  { name: "Brow Tinting", duration: 25, price: 28 },
  { name: "Brow Lamination", duration: 50, price: 85 },
  { name: "Brow Threading + Tint", duration: 40, price: 42 },
  { name: "Lash Lift", duration: 60, price: 95 },
  { name: "Lash Tinting", duration: 25, price: 30 },
  { name: "Lash Lift + Tint", duration: 75, price: 115 },
  { name: "Upper Lip Threading", duration: 10, price: 10 },
  { name: "Chin Threading", duration: 10, price: 10 },
];
const ins = db.prepare("INSERT INTO services (name,duration,price) VALUES (?,?,?)");
services.forEach(s => ins.run(s.name, s.duration, s.price));

const clients = [
  { name: "Sophia Martinez", email: "sophia.martinez@gmail.com", phone: "404-291-0847", status: "VIP", notes: "Prefers morning slots. Brow threading + tint every 3 weeks. Always 20% tip. Referred 4 clients.", created_at: "2025-04-12 09:00:00" },
  { name: "Fatima Al-Hassan", email: "fatima.alhassan@gmail.com", phone: "770-592-4400", status: "VIP", notes: "Monthly full face + lash lift combo. Books 3 appointments ahead. Never cancels.", created_at: "2025-04-28 10:30:00" },
  { name: "Isabella Romano", email: "isabella.romano@gmail.com", phone: "770-348-9900", status: "VIP", notes: "Weekly appointments until June wedding. Referred entire bridal party (5 people).", created_at: "2025-05-05 14:00:00" },
  { name: "Priya Patel", email: "priya.patel@gmail.com", phone: "678-382-9014", status: "VIP", notes: "Lash lift every 6 weeks. Buys retail too — avg spend $140/visit.", created_at: "2025-05-19 11:00:00" },
  { name: "Olivia Brooks", email: "olivia.brooks@gmail.com", phone: "678-445-2290", status: "VIP", notes: "Weekly client, multiple services per visit. High spender, always senior staff.", created_at: "2025-04-20 10:00:00" },
  { name: "James Carter", email: "james.carter@outlook.com", phone: "678-554-3201", status: "Active", notes: "Full face threading monthly. Referred by Sophia. Always on time.", created_at: "2025-05-22 15:00:00" },
  { name: "Marcus Johnson", email: "marcus.johnson@yahoo.com", phone: "404-617-2230", status: "Active", notes: "Brow shaping every 4 weeks. Prefers Saturday appointments.", created_at: "2025-06-01 10:00:00" },
  { name: "Kevin Nguyen", email: "kevin.nguyen@gmail.com", phone: "678-331-8845", status: "Active", notes: "Lash tinting every 5 weeks. Always books ahead. Prefers Amelia.", created_at: "2025-06-14 13:00:00" },
  { name: "Nadia Osei", email: "nadia.osei@gmail.com", phone: "678-440-3390", status: "Active", notes: "Brow lamination + tint every 8 weeks. Drives 45 mins for quality.", created_at: "2025-06-28 09:30:00" },
  { name: "Chloe Thompson", email: "chloe.t@gmail.com", phone: "404-584-0023", status: "Active", notes: "Brow threading biweekly. Always leaves 5-star reviews.", created_at: "2025-07-07 11:00:00" },
  { name: "Michael Grant", email: "michael.grant@yahoo.com", phone: "770-674-2210", status: "Active", notes: "Monthly lash tint. Brings his wife occasionally.", created_at: "2025-07-15 14:30:00" },
  { name: "Rachel Torres", email: "rachel.torres@gmail.com", phone: "678-220-4413", status: "Active", notes: "Lash lift every 6 weeks. Very precise about shape.", created_at: "2025-05-10 09:00:00" },
  { name: "Brandon Lee", email: "brandon.lee@outlook.com", phone: "404-512-7890", status: "Active", notes: "Brow threading + tint monthly. Graphic designer, detail-oriented. Great tipper.", created_at: "2025-06-05 15:30:00" },
  { name: "David Kim", email: "david.kim@outlook.com", phone: "404-901-4422", status: "Active", notes: "Brow threading only, quick appointments. Lunchbreak regular every 3 weeks.", created_at: "2025-08-02 12:00:00" },
  { name: "Liam Foster", email: "liam.foster@gmail.com", phone: "678-890-3344", status: "Active", notes: "Full face threading every 3 weeks. Flexible with times.", created_at: "2025-08-18 10:00:00" },
  { name: "Emily Chen", email: "emily.chen@gmail.com", phone: "678-904-5567", status: "New", notes: "First visit Sep 2025. Interested in brow lamination. Came from Instagram.", created_at: "2025-09-08 16:00:00" },
  { name: "Tyler Brooks", email: "tyler.brooks@yahoo.com", phone: "404-773-6621", status: "New", notes: "Walk-in conversion. Booked online after first visit.", created_at: "2025-10-15 12:00:00" },
  { name: "Andre Davis", email: "andre.davis@gmail.com", phone: "678-762-1195", status: "New", notes: "Referred by Marcus Johnson. First appointment last week.", created_at: "2025-12-03 09:00:00" },
  { name: "Aisha Townsend", email: "aisha.townsend@gmail.com", phone: "404-237-5566", status: "New", notes: "Booked via Instagram DM. Interested in lamination.", created_at: "2026-01-20 10:00:00" },
  { name: "Nina Patel", email: "nina.patel@gmail.com", phone: "770-339-8821", status: "New", notes: "Sister of Priya Patel. Interested in full lash + brow package.", created_at: "2026-02-15 11:00:00" },
  { name: "Ashley Williams", email: "ashley.w@hotmail.com", phone: "404-839-1102", status: "At Risk", notes: "Missed last 2 appointments without notice. Was reliable before. Send re-engagement offer.", created_at: "2025-07-22 10:00:00" },
  { name: "Zoe Harris", email: "zoe.harris@gmail.com", phone: "678-503-7781", status: "At Risk", notes: "Had complaint about wait time. Offered discount on next visit. Needs follow-up call.", created_at: "2025-08-10 14:00:00" },
  { name: "Daniel Okafor", email: "daniel.okafor@gmail.com", phone: "770-248-7713", status: "At Risk", notes: "Was biweekly regular, hasn't booked since December. Check in needed.", created_at: "2025-07-30 13:00:00" },
  { name: "Ryan Murphy", email: "ryan.murphy@outlook.com", phone: "770-215-8874", status: "Inactive", notes: "Last visit was October 2025. Sent 2 re-engagement emails, no response.", created_at: "2025-06-20 14:00:00" },
  { name: "Jessica Park", email: "jessica.park@gmail.com", phone: "404-662-5510", status: "Inactive", notes: "Came twice in May and June 2025, then stopped. No explanation.", created_at: "2025-05-30 11:00:00" },
];
const insC = db.prepare("INSERT INTO clients (name,email,phone,notes,status,created_at) VALUES (?,?,?,?,?,?)");
clients.forEach(c => insC.run(c.name, c.email, c.phone, c.notes, c.status, c.created_at));
console.log(`Seeded ${clients.length} clients`);

const STAFF = ["Arnav", "Priya", "Amelia", "Jordan"];
const appts = [
  // Apr 2025
  { cid:1, svc:"Brow Threading + Tint", staff:"Arnav", date:"2025-04-15 10:00", dur:40, price:42, tip:8, status:"Completed" },
  { cid:4, svc:"Lash Lift", staff:"Amelia", date:"2025-04-22 09:00", dur:60, price:95, tip:15, status:"Completed" },
  { cid:5, svc:"Lash Lift + Tint", staff:"Amelia", date:"2025-04-26 11:00", dur:75, price:115, tip:20, status:"Completed" },
  { cid:2, svc:"Full Face Threading", staff:"Priya", date:"2025-04-30 14:00", dur:40, price:45, tip:5, status:"Completed" },
  // May 2025
  { cid:1, svc:"Brow Threading + Tint", staff:"Arnav", date:"2025-05-05 10:00", dur:40, price:42, tip:8, status:"Completed" },
  { cid:3, svc:"Brow Lamination", staff:"Priya", date:"2025-05-08 13:00", dur:50, price:85, tip:10, status:"Completed" },
  { cid:12, svc:"Lash Lift", staff:"Amelia", date:"2025-05-12 09:00", dur:60, price:95, tip:15, status:"Completed" },
  { cid:5, svc:"Full Face Threading", staff:"Jordan", date:"2025-05-14 11:00", dur:40, price:45, tip:0, status:"Completed" },
  { cid:2, svc:"Full Face Threading", staff:"Priya", date:"2025-05-19 14:00", dur:40, price:45, tip:5, status:"Completed" },
  { cid:4, svc:"Lash Lift", staff:"Amelia", date:"2025-05-20 09:00", dur:60, price:95, tip:20, status:"Completed" },
  { cid:25, svc:"Brow Threading", staff:"Arnav", date:"2025-05-27 15:00", dur:20, price:18, tip:0, status:"Completed" },
  // Jun 2025
  { cid:1, svc:"Brow Threading + Tint", staff:"Arnav", date:"2025-06-02 10:00", dur:40, price:42, tip:8, status:"Completed" },
  { cid:7, svc:"Brow Threading", staff:"Jordan", date:"2025-06-07 11:00", dur:20, price:18, tip:0, status:"Completed" },
  { cid:13, svc:"Brow Threading + Tint", staff:"Arnav", date:"2025-06-10 15:30", dur:40, price:42, tip:5, status:"Completed" },
  { cid:2, svc:"Full Face Threading", staff:"Priya", date:"2025-06-14 14:00", dur:40, price:45, tip:5, status:"Completed" },
  { cid:8, svc:"Lash Tinting", staff:"Amelia", date:"2025-06-16 13:00", dur:25, price:30, tip:5, status:"Completed" },
  { cid:12, svc:"Lash Lift", staff:"Amelia", date:"2025-06-20 09:00", dur:60, price:95, tip:15, status:"Completed" },
  { cid:5, svc:"Lash Lift + Tint", staff:"Amelia", date:"2025-06-23 11:00", dur:75, price:115, tip:20, status:"Completed" },
  { cid:3, svc:"Lash Lift + Tint", staff:"Amelia", date:"2025-06-26 13:00", dur:75, price:115, tip:20, status:"Completed" },
  { cid:4, svc:"Lash Lift", staff:"Amelia", date:"2025-06-30 09:00", dur:60, price:95, tip:20, status:"Completed" },
  // Jul 2025
  { cid:1, svc:"Brow Threading + Tint", staff:"Arnav", date:"2025-07-03 10:00", dur:40, price:42, tip:8, status:"Completed" },
  { cid:10, svc:"Brow Threading", staff:"Jordan", date:"2025-07-05 11:00", dur:20, price:18, tip:0, status:"Completed" },
  { cid:6, svc:"Full Face Threading", staff:"Priya", date:"2025-07-08 14:00", dur:40, price:45, tip:5, status:"Completed" },
  { cid:2, svc:"Full Face Threading", staff:"Priya", date:"2025-07-12 14:00", dur:40, price:45, tip:5, status:"Completed" },
  { cid:9, svc:"Brow Lamination", staff:"Priya", date:"2025-07-14 10:00", dur:50, price:85, tip:10, status:"Completed" },
  { cid:11, svc:"Lash Tinting", staff:"Amelia", date:"2025-07-17 12:30", dur:25, price:30, tip:5, status:"Completed" },
  { cid:13, svc:"Brow Threading + Tint", staff:"Arnav", date:"2025-07-19 15:00", dur:40, price:42, tip:5, status:"Completed" },
  { cid:3, svc:"Full Face Threading", staff:"Jordan", date:"2025-07-22 13:00", dur:40, price:45, tip:0, status:"Completed" },
  { cid:12, svc:"Lash Lift", staff:"Amelia", date:"2025-07-25 09:00", dur:60, price:95, tip:15, status:"Completed" },
  { cid:5, svc:"Brow Lamination", staff:"Priya", date:"2025-07-28 11:00", dur:50, price:85, tip:10, status:"Completed" },
  // Aug 2025
  { cid:1, svc:"Brow Threading + Tint", staff:"Arnav", date:"2025-08-04 10:00", dur:40, price:42, tip:8, status:"Completed" },
  { cid:4, svc:"Lash Lift", staff:"Amelia", date:"2025-08-07 09:00", dur:60, price:95, tip:20, status:"Completed" },
  { cid:14, svc:"Brow Threading", staff:"Jordan", date:"2025-08-10 12:00", dur:20, price:18, tip:0, status:"Completed" },
  { cid:6, svc:"Full Face Threading", staff:"Priya", date:"2025-08-13 14:00", dur:40, price:45, tip:5, status:"Completed" },
  { cid:10, svc:"Brow Threading", staff:"Jordan", date:"2025-08-17 11:00", dur:20, price:18, tip:0, status:"Completed" },
  { cid:3, svc:"Lash Lift + Tint", staff:"Amelia", date:"2025-08-20 13:00", dur:75, price:115, tip:20, status:"Completed" },
  { cid:2, svc:"Full Face Threading", staff:"Priya", date:"2025-08-22 14:00", dur:40, price:45, tip:5, status:"Completed" },
  { cid:9, svc:"Brow Tinting", staff:"Arnav", date:"2025-08-25 10:00", dur:25, price:28, tip:0, status:"Completed" },
  // Sep 2025
  { cid:5, svc:"Lash Lift + Tint", staff:"Amelia", date:"2025-09-02 11:00", dur:75, price:115, tip:20, status:"Completed" },
  { cid:1, svc:"Brow Threading + Tint", staff:"Arnav", date:"2025-09-06 10:00", dur:40, price:42, tip:8, status:"Completed" },
  { cid:15, svc:"Full Face Threading", staff:"Priya", date:"2025-09-09 14:00", dur:40, price:45, tip:5, status:"Completed" },
  { cid:3, svc:"Brow Lamination", staff:"Priya", date:"2025-09-12 13:00", dur:50, price:85, tip:10, status:"Completed" },
  { cid:11, svc:"Lash Tinting", staff:"Amelia", date:"2025-09-16 12:00", dur:25, price:30, tip:5, status:"Completed" },
  { cid:4, svc:"Lash Lift", staff:"Amelia", date:"2025-09-19 09:00", dur:60, price:95, tip:20, status:"Completed" },
  // Oct 2025
  { cid:1, svc:"Brow Threading + Tint", staff:"Arnav", date:"2025-10-06 10:00", dur:40, price:42, tip:8, status:"Completed" },
  { cid:12, svc:"Lash Lift", staff:"Amelia", date:"2025-10-09 09:00", dur:60, price:95, tip:15, status:"Completed" },
  { cid:16, svc:"Brow Lamination", staff:"Priya", date:"2025-10-13 16:00", dur:50, price:85, tip:0, status:"Completed" },
  { cid:6, svc:"Full Face Threading", staff:"Jordan", date:"2025-10-17 14:00", dur:40, price:45, tip:5, status:"Completed" },
  { cid:3, svc:"Lash Lift + Tint", staff:"Amelia", date:"2025-10-21 13:00", dur:75, price:115, tip:20, status:"Completed" },
  { cid:14, svc:"Brow Threading", staff:"Jordan", date:"2025-10-24 12:00", dur:20, price:18, tip:0, status:"Completed" },
  // Nov 2025
  { cid:1, svc:"Brow Threading + Tint", staff:"Arnav", date:"2025-11-03 10:00", dur:40, price:42, tip:8, status:"Completed" },
  { cid:4, svc:"Lash Lift", staff:"Amelia", date:"2025-11-06 09:00", dur:60, price:95, tip:20, status:"Completed" },
  { cid:5, svc:"Full Face Threading", staff:"Priya", date:"2025-11-10 14:00", dur:40, price:45, tip:5, status:"Completed" },
  { cid:3, svc:"Brow Lamination", staff:"Priya", date:"2025-11-14 13:00", dur:50, price:85, tip:10, status:"Completed" },
  { cid:9, svc:"Brow Threading", staff:"Jordan", date:"2025-11-18 11:00", dur:20, price:18, tip:0, status:"Completed" },
  // Dec 2025
  { cid:5, svc:"Lash Lift + Tint", staff:"Amelia", date:"2025-12-01 11:00", dur:75, price:115, tip:25, status:"Completed" },
  { cid:1, svc:"Brow Threading + Tint", staff:"Arnav", date:"2025-12-05 10:00", dur:40, price:42, tip:8, status:"Completed" },
  { cid:4, svc:"Lash Lift", staff:"Amelia", date:"2025-12-11 09:00", dur:60, price:95, tip:20, status:"Completed" },
  { cid:3, svc:"Lash Lift + Tint", staff:"Amelia", date:"2025-12-17 13:00", dur:75, price:115, tip:20, status:"Completed" },
  // Jan 2026
  { cid:1, svc:"Brow Threading + Tint", staff:"Arnav", date:"2026-01-07 10:00", dur:40, price:42, tip:8, status:"Completed" },
  { cid:12, svc:"Lash Lift", staff:"Amelia", date:"2026-01-10 09:00", dur:60, price:95, tip:15, status:"Completed" },
  { cid:5, svc:"Full Face Threading", staff:"Priya", date:"2026-01-14 14:00", dur:40, price:45, tip:5, status:"Completed" },
  { cid:3, svc:"Lash Lift + Tint", staff:"Amelia", date:"2026-01-20 13:00", dur:75, price:115, tip:20, status:"Completed" },
  { cid:4, svc:"Lash Lift", staff:"Amelia", date:"2026-01-24 09:00", dur:60, price:95, tip:20, status:"Completed" },
  // Feb 2026
  { cid:1, svc:"Brow Threading + Tint", staff:"Arnav", date:"2026-02-04 10:00", dur:40, price:42, tip:8, status:"Completed" },
  { cid:6, svc:"Full Face Threading", staff:"Priya", date:"2026-02-07 14:00", dur:40, price:45, tip:5, status:"Completed" },
  { cid:9, svc:"Brow Lamination", staff:"Priya", date:"2026-02-11 10:00", dur:50, price:85, tip:10, status:"Completed" },
  { cid:5, svc:"Lash Lift + Tint", staff:"Amelia", date:"2026-02-14 11:00", dur:75, price:115, tip:20, status:"Completed" },
  { cid:13, svc:"Brow Threading + Tint", staff:"Arnav", date:"2026-02-18 15:30", dur:40, price:42, tip:5, status:"Completed" },
  { cid:3, svc:"Lash Lift + Tint", staff:"Amelia", date:"2026-02-24 13:00", dur:75, price:115, tip:20, status:"Completed" },
  // Mar 2026 — some completed, some upcoming
  { cid:1, svc:"Brow Threading + Tint", staff:"Arnav", date:"2026-03-04 10:00", dur:40, price:42, tip:8, status:"Completed" },
  { cid:4, svc:"Lash Lift", staff:"Amelia", date:"2026-03-07 09:00", dur:60, price:95, tip:20, status:"Completed" },
  { cid:12, svc:"Lash Lift", staff:"Amelia", date:"2026-03-11 09:00", dur:60, price:95, tip:15, status:"Completed" },
  { cid:6, svc:"Full Face Threading", staff:"Priya", date:"2026-03-14 14:00", dur:40, price:45, tip:5, status:"Completed" },
  { cid:5, svc:"Lash Lift + Tint", staff:"Amelia", date:"2026-03-18 11:00", dur:75, price:115, tip:20, status:"Completed" },
  // Upcoming
  { cid:1, svc:"Brow Threading + Tint", staff:"Arnav", date:"2026-03-27 10:00", dur:40, price:42, tip:0, status:"Confirmed" },
  { cid:3, svc:"Lash Lift + Tint", staff:"Amelia", date:"2026-03-27 13:00", dur:75, price:115, tip:0, status:"Confirmed" },
  { cid:4, svc:"Lash Lift", staff:"Amelia", date:"2026-03-28 09:00", dur:60, price:95, tip:0, status:"Confirmed" },
  { cid:5, svc:"Full Face Threading", staff:"Priya", date:"2026-03-29 14:00", dur:40, price:45, tip:0, status:"Confirmed" },
  { cid:16, svc:"Brow Lamination", staff:"Priya", date:"2026-03-31 16:00", dur:50, price:85, tip:0, status:"Confirmed" },
  { cid:19, svc:"Brow Threading", staff:"Jordan", date:"2026-04-01 11:00", dur:20, price:18, tip:0, status:"Pending" },
  { cid:6, svc:"Full Face Threading", staff:"Priya", date:"2026-04-02 14:00", dur:40, price:45, tip:0, status:"Confirmed" },
  { cid:12, svc:"Lash Lift", staff:"Amelia", date:"2026-04-03 09:00", dur:60, price:95, tip:0, status:"Confirmed" },
  { cid:20, svc:"Brow Lamination", staff:"Priya", date:"2026-04-04 11:00", dur:50, price:85, tip:0, status:"Pending" },
  { cid:10, svc:"Brow Threading", staff:"Jordan", date:"2026-04-05 11:00", dur:20, price:18, tip:0, status:"Confirmed" },
];
const insA = db.prepare("INSERT INTO appointments (client_id,service,staff,date,duration,price,tip,is_walkin,status,notes) VALUES (?,?,?,?,?,?,?,0,?,?)");
appts.forEach(a => insA.run(a.cid, a.svc, a.staff, a.date, a.dur, a.price, a.tip, a.status, null));
console.log(`Seeded ${appts.length} appointments`);

// Expenses
const expenses = [
  { date:"2025-05-01", category:"Supplies", amount:145, note:"Threading thread, cotton, wax strips" },
  { date:"2025-05-15", category:"Software", amount:29, note:"Booking system monthly fee" },
  { date:"2025-06-01", category:"Supplies", amount:180, note:"Brow lamination kits x4" },
  { date:"2025-06-15", category:"Software", amount:29, note:"Booking system" },
  { date:"2025-06-20", category:"Rent", amount:1200, note:"Studio rent June" },
  { date:"2025-07-01", category:"Supplies", amount:95, note:"Lash lift kits x3" },
  { date:"2025-07-15", category:"Software", amount:29, note:"Booking system" },
  { date:"2025-07-20", category:"Rent", amount:1200, note:"Studio rent July" },
  { date:"2025-07-25", category:"Marketing", amount:75, note:"Instagram ads" },
  { date:"2025-08-01", category:"Supplies", amount:220, note:"Full restock — threads, tints, lamination" },
  { date:"2025-08-15", category:"Software", amount:29, note:"Booking system" },
  { date:"2025-08-20", category:"Rent", amount:1200, note:"Studio rent Aug" },
  { date:"2025-09-01", category:"Supplies", amount:110, note:"Lash lift kits, brow tints" },
  { date:"2025-09-15", category:"Software", amount:29, note:"Booking system" },
  { date:"2025-09-20", category:"Rent", amount:1200, note:"Studio rent Sep" },
  { date:"2025-09-28", category:"Equipment", amount:340, note:"New LED mirror for station 2" },
  { date:"2025-10-01", category:"Supplies", amount:130, note:"Monthly supplies restock" },
  { date:"2025-10-15", category:"Software", amount:29, note:"Booking system" },
  { date:"2025-10-20", category:"Rent", amount:1200, note:"Studio rent Oct" },
  { date:"2025-11-01", category:"Supplies", amount:160, note:"Supplies + holiday promo products" },
  { date:"2025-11-15", category:"Software", amount:29, note:"Booking system" },
  { date:"2025-11-20", category:"Rent", amount:1200, note:"Studio rent Nov" },
  { date:"2025-11-22", category:"Marketing", amount:150, note:"Holiday promotion social ads" },
  { date:"2025-12-01", category:"Supplies", amount:200, note:"Holiday restock" },
  { date:"2025-12-15", category:"Software", amount:29, note:"Booking system" },
  { date:"2025-12-20", category:"Rent", amount:1200, note:"Studio rent Dec" },
  { date:"2026-01-01", category:"Supplies", amount:165, note:"New year restock" },
  { date:"2026-01-15", category:"Software", amount:29, note:"Booking system" },
  { date:"2026-01-20", category:"Rent", amount:1200, note:"Studio rent Jan" },
  { date:"2026-02-01", category:"Supplies", amount:140, note:"Feb supplies" },
  { date:"2026-02-15", category:"Software", amount:29, note:"Booking system" },
  { date:"2026-02-20", category:"Rent", amount:1200, note:"Studio rent Feb" },
  { date:"2026-03-01", category:"Supplies", amount:155, note:"Mar supplies" },
  { date:"2026-03-15", category:"Software", amount:29, note:"Booking system" },
  { date:"2026-03-20", category:"Rent", amount:1200, note:"Studio rent Mar" },
];
const insE = db.prepare("INSERT INTO expenses (date,category,amount,note) VALUES (?,?,?,?)");
expenses.forEach(e => insE.run(e.date, e.category, e.amount, e.note));
console.log(`Seeded ${expenses.length} expenses`);

// Invoices
const invoices = [
  { cid:1, name:"Sophia Martinez", email:"sophia.martinez@gmail.com", amount:126, status:"Paid", due:"2026-02-28", items:JSON.stringify([{description:"Brow Threading + Tint x3",amount:126}]), notes:"Q1 package", created:"2026-01-15" },
  { cid:3, name:"Isabella Romano", email:"isabella.romano@gmail.com", amount:345, status:"Paid", due:"2026-02-15", items:JSON.stringify([{description:"Lash Lift + Tint x3",amount:345}]), notes:"Wedding prep package", created:"2026-01-20" },
  { cid:5, name:"Olivia Brooks", email:"olivia.brooks@gmail.com", amount:460, status:"Unpaid", due:"2026-03-31", items:JSON.stringify([{description:"Monthly VIP package - Feb/Mar",amount:460}]), notes:"Net 30", created:"2026-03-01" },
  { cid:4, name:"Priya Patel", email:"priya.patel@gmail.com", amount:285, status:"Unpaid", due:"2026-04-01", items:JSON.stringify([{description:"Lash Lift x3",amount:285}]), notes:"Quarterly package", created:"2026-03-05" },
  { cid:2, name:"Fatima Al-Hassan", email:"fatima.alhassan@gmail.com", amount:180, status:"Paid", due:"2026-01-31", items:JSON.stringify([{description:"Full Face Threading x4",amount:180}]), notes:"Jan package", created:"2026-01-02" },
  { cid:16, name:"Emily Chen", email:"emily.chen@gmail.com", amount:85, status:"Unpaid", due:"2026-04-05", items:JSON.stringify([{description:"Brow Lamination",amount:85}]), notes:"First service invoice", created:"2026-03-10" },
];
const insI = db.prepare("INSERT INTO invoices (client_id,client_name,client_email,amount,status,due_date,items,notes,created_at) VALUES (?,?,?,?,?,?,?,?,?)");
invoices.forEach(i => insI.run(i.cid, i.name, i.email, i.amount, i.status, i.due, i.items, i.notes, i.created));
console.log(`Seeded ${invoices.length} invoices`);

console.log("Seed complete — Luxe Threading Studio demo data ready.");
db.close();
