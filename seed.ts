import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { existsSync, unlinkSync } from "fs";

const DB_PATH = "crm.db";
if (existsSync(DB_PATH)) { unlinkSync(DB_PATH); console.log("Fresh DB"); }

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS businesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, industry TEXT NOT NULL DEFAULT 'general',
    owner_name TEXT, owner_email TEXT, phone TEXT, address TEXT,
    plan TEXT DEFAULT 'starter', mrr REAL DEFAULT 0, status TEXT DEFAULT 'active',
    settings TEXT DEFAULT '{}',
    plan_services TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, last_login DATETIME
  );
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'business_admin',
    business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT, must_change_password INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, last_login DATETIME
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

// ── SUPERADMIN (Peach Stack internal only) ──────────────────────────────────
// SECURITY: credentials MUST be set via Railway env vars — never hardcoded
const SA_EMAIL = process.env.SUPERADMIN_EMAIL;
const SA_PASS  = process.env.SUPERADMIN_PASSWORD;
if (!SA_EMAIL || !SA_PASS) {
  console.error("FATAL: SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must be set as environment variables.");
  console.error("Set them in Railway dashboard before deploying.");
  process.exit(1);
}
db.prepare("INSERT INTO users (email,password,role,name) VALUES (?,?,'superadmin','Peach Stack Admin')")
  .run(SA_EMAIL, bcrypt.hashSync(SA_PASS, 12));

// Always update superadmin password to match env var (runs on every boot)
db.prepare(
  "UPDATE users SET password=?, email=? WHERE role='superadmin'"
).run(bcrypt.hashSync(SA_PASS, 12), SA_EMAIL);

// Always update demo business passwords
const DEMO_PASS = bcrypt.hashSync('demo1234', 10);
db.prepare("UPDATE users SET password=? WHERE email='priya@luxethreading.com'").run(DEMO_PASS);
db.prepare("UPDATE users SET password=? WHERE email='marcus@metroauto.com'").run(DEMO_PASS);
db.prepare("UPDATE users SET password=? WHERE email='amara@peachtreebites.com'").run(DEMO_PASS);
console.log("Superadmin created: " + SA_EMAIL);

// ── BUSINESS 1: Hair / Beauty Salon ─────────────────────────────────────────
const b1 = db.prepare("INSERT INTO businesses (name,industry,owner_name,owner_email,phone,plan,mrr,plan_services,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
  .run("Luxe Threading Studio","beauty","Priya Sharma","priya@luxethreading.com","404-291-0847","starter",72,'["crm","onboarding","website-basic","booking","reminders","reviews"]' ,"active","2025-04-01 10:00:00");
const BID1 = b1.lastInsertRowid;
db.prepare("INSERT INTO users (email,password,role,business_id,name,must_change_password,created_at) VALUES (?,?,'business_admin',?,?,0,?)")
  .run("priya@luxethreading.com", bcrypt.hashSync("demo1234", 12), BID1, "Priya Sharma","2025-04-01 10:00:00");

// Business 1 clients
const b1clients = [
  {name:"Sophia Martinez",email:"sophia.martinez@gmail.com",phone:"404-291-0847",status:"VIP",notes:"Prefers morning. Brow threading + tint every 3 weeks. Always 20% tip.",created_at:"2025-04-12"},
  {name:"Fatima Al-Hassan",email:"fatima.alhassan@gmail.com",phone:"770-592-4400",status:"VIP",notes:"Monthly full face + lash lift. Never cancels.",created_at:"2025-04-28"},
  {name:"Isabella Romano",email:"isabella.romano@gmail.com",phone:"770-348-9900",status:"VIP",notes:"Weekly until June wedding. Referred bridal party.",created_at:"2025-05-05"},
  {name:"Priya Patel",email:"priya.patel@gmail.com",phone:"678-382-9014",status:"VIP",notes:"Lash lift every 6 weeks. Buys retail. Avg $140/visit.",created_at:"2025-05-19"},
  {name:"Olivia Brooks",email:"olivia.brooks@gmail.com",phone:"678-445-2290",status:"Active",notes:"Weekly, multiple services per visit.",created_at:"2025-05-20"},
  {name:"James Carter",email:"james.carter@outlook.com",phone:"678-554-3201",status:"Active",notes:"Full face monthly. Referred by Sophia.",created_at:"2025-06-01"},
  {name:"Chloe Thompson",email:"chloe.t@gmail.com",phone:"404-584-0023",status:"Active",notes:"Brow threading biweekly. Leaves 5-star reviews.",created_at:"2025-07-07"},
  {name:"Emily Chen",email:"emily.chen@gmail.com",phone:"678-904-5567",status:"New",notes:"First visit Sep 2025. Interested in brow lamination.",created_at:"2025-09-08"},
  {name:"Ashley Williams",email:"ashley.w@hotmail.com",phone:"404-839-1102",status:"At Risk",notes:"Missed last 2 appointments. Send re-engagement.",created_at:"2025-07-22"},
  {name:"Ryan Murphy",email:"ryan.murphy@outlook.com",phone:"770-215-8874",status:"Inactive",notes:"Last visit Oct 2025. No response to emails.",created_at:"2025-06-20"},
];
const insC = db.prepare("INSERT INTO clients (business_id,name,email,phone,status,notes,created_at) VALUES (?,?,?,?,?,?,?)");
const b1cids: number[] = [];
for (const c of b1clients) { const r = insC.run(BID1,c.name,c.email,c.phone,c.status,c.notes,c.created_at); b1cids.push(Number(r.lastInsertRowid)); }

// Business 1 appointments
const insA = db.prepare("INSERT INTO appointments (business_id,client_id,service,staff,date,duration,price,tip,status) VALUES (?,?,?,?,?,?,?,?,?)");
const b1appts = [
  [BID1,b1cids[0],"Brow Threading + Tint","Arnav","2025-05-15 10:00",40,42,8,"Completed"],
  [BID1,b1cids[1],"Full Face Threading","Priya","2025-05-19 14:00",40,45,5,"Completed"],
  [BID1,b1cids[2],"Lash Lift + Tint","Amelia","2025-05-26 11:00",75,115,20,"Completed"],
  [BID1,b1cids[3],"Lash Lift","Amelia","2025-06-02 09:00",60,95,15,"Completed"],
  [BID1,b1cids[0],"Brow Threading + Tint","Arnav","2025-06-05 10:00",40,42,8,"Completed"],
  [BID1,b1cids[4],"Lash Lift + Tint","Amelia","2025-06-23 11:00",75,115,20,"Completed"],
  [BID1,b1cids[1],"Full Face Threading","Priya","2025-07-12 14:00",40,45,5,"Completed"],
  [BID1,b1cids[2],"Brow Lamination","Priya","2025-07-22 13:00",50,85,10,"Completed"],
  [BID1,b1cids[3],"Lash Lift","Amelia","2025-08-07 09:00",60,95,20,"Completed"],
  [BID1,b1cids[0],"Brow Threading + Tint","Arnav","2025-08-04 10:00",40,42,8,"Completed"],
  [BID1,b1cids[4],"Full Face Threading","Jordan","2025-08-14 11:00",40,45,0,"Completed"],
  [BID1,b1cids[5],"Full Face Threading","Priya","2025-09-09 14:00",40,45,5,"Completed"],
  [BID1,b1cids[2],"Lash Lift + Tint","Amelia","2025-09-12 13:00",75,115,20,"Completed"],
  [BID1,b1cids[3],"Lash Lift","Amelia","2025-10-19 09:00",60,95,20,"Completed"],
  [BID1,b1cids[0],"Brow Threading + Tint","Arnav","2025-11-03 10:00",40,42,8,"Completed"],
  [BID1,b1cids[4],"Lash Lift + Tint","Amelia","2025-12-01 11:00",75,115,25,"Completed"],
  [BID1,b1cids[1],"Full Face Threading","Priya","2026-01-14 14:00",40,45,5,"Completed"],
  [BID1,b1cids[2],"Lash Lift + Tint","Amelia","2026-01-20 13:00",75,115,20,"Completed"],
  [BID1,b1cids[3],"Lash Lift","Amelia","2026-02-06 09:00",60,95,20,"Completed"],
  [BID1,b1cids[0],"Brow Threading + Tint","Arnav","2026-02-04 10:00",40,42,8,"Completed"],
  [BID1,b1cids[4],"Lash Lift + Tint","Amelia","2026-02-14 11:00",75,115,20,"Completed"],
  [BID1,b1cids[5],"Full Face Threading","Priya","2026-03-14 14:00",40,45,5,"Completed"],
  [BID1,b1cids[0],"Brow Threading + Tint","Arnav","2026-03-27 10:00",40,42,0,"Confirmed"],
  [BID1,b1cids[2],"Lash Lift + Tint","Amelia","2026-03-28 13:00",75,115,0,"Confirmed"],
  [BID1,b1cids[3],"Lash Lift","Amelia","2026-04-02 09:00",60,95,0,"Confirmed"],
  [BID1,b1cids[7],"Brow Lamination","Priya","2026-04-05 16:00",50,85,0,"Pending"],
];
for (const a of b1appts) insA.run(...a);

// Business 1 expenses
const insE = db.prepare("INSERT INTO expenses (business_id,date,category,amount,note) VALUES (?,?,?,?,?)");
const b1exp = [
  [BID1,"2025-05-15","Supplies",145,"Threading thread, cotton, wax strips"],
  [BID1,"2025-05-20","Software",149,"Monthly platform fee"],
  [BID1,"2025-06-01","Supplies",180,"Brow lamination kits x4"],
  [BID1,"2025-06-20","Rent",1200,"Studio rent June"],
  [BID1,"2025-07-01","Supplies",95,"Lash lift kits x3"],
  [BID1,"2025-07-20","Rent",1200,"Studio rent July"],
  [BID1,"2025-07-25","Marketing",75,"Instagram ads"],
  [BID1,"2025-08-01","Supplies",220,"Full restock"],
  [BID1,"2025-08-20","Rent",1200,"Studio rent Aug"],
  [BID1,"2025-09-20","Rent",1200,"Studio rent Sep"],
  [BID1,"2025-09-28","Equipment",340,"New LED mirror"],
  [BID1,"2025-10-20","Rent",1200,"Studio rent Oct"],
  [BID1,"2025-11-20","Rent",1200,"Studio rent Nov"],
  [BID1,"2025-11-22","Marketing",150,"Holiday promotion"],
  [BID1,"2025-12-20","Rent",1200,"Studio rent Dec"],
  [BID1,"2026-01-20","Rent",1200,"Studio rent Jan"],
  [BID1,"2026-02-20","Rent",1200,"Studio rent Feb"],
  [BID1,"2026-03-20","Rent",1200,"Studio rent Mar"],
];
for (const e of b1exp) insE.run(...e);
console.log("Business 1 (Beauty) seeded");

// ── BUSINESS 2: Auto Shop ────────────────────────────────────────────────────
const b2 = db.prepare("INSERT INTO businesses (name,industry,owner_name,owner_email,phone,plan,mrr,plan_services,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
  .run("Metro Auto Works","auto","Marcus Johnson","marcus@metroauto.com","404-555-0182","starter",60,'["crm","onboarding","website-basic","booking","reminders"]' ,"active","2025-06-15 09:00:00");
const BID2 = b2.lastInsertRowid;
db.prepare("INSERT INTO users (email,password,role,business_id,name,must_change_password,created_at) VALUES (?,?,'business_admin',?,?,0,?)")
  .run("marcus@metroauto.com", bcrypt.hashSync("demo1234", 12), BID2, "Marcus Johnson","2025-06-15 09:00:00");

const b2clients = [
  {name:"Derek Williams",email:"derek.w@gmail.com",phone:"404-772-1100",status:"VIP",notes:"Fleet of 3 vehicles. Monthly maintenance. High value.",created_at:"2025-06-20"},
  {name:"Sandra Lee",email:"sandra.lee@gmail.com",phone:"678-441-3302",status:"Active",notes:"2019 Honda Civic. Oil change every 3 months.",created_at:"2025-07-01"},
  {name:"Tony Nguyen",email:"tony.nguyen@yahoo.com",phone:"404-883-4412",status:"Active",notes:"2021 Ford F-150. Referred by Derek.",created_at:"2025-07-14"},
  {name:"Rachel Kim",email:"rachel.kim@gmail.com",phone:"770-229-0033",status:"New",notes:"2022 Toyota Camry. First visit for inspection.",created_at:"2025-12-10"},
  {name:"James Ford",email:"james.ford@outlook.com",phone:"404-337-8821",status:"At Risk",notes:"Has not been in since Aug. Was monthly regular.",created_at:"2025-07-08"},
];
const b2cids: number[] = [];
for (const c of b2clients) { const r = insC.run(BID2,c.name,c.email,c.phone,c.status,c.notes,c.created_at); b2cids.push(Number(r.lastInsertRowid)); }

const b2appts = [
  [BID2,b2cids[0],"Oil Change + Filter","Mike","2025-07-10 09:00",45,89,0,"Completed"],
  [BID2,b2cids[1],"Oil Change","Mike","2025-07-15 11:00",30,65,0,"Completed"],
  [BID2,b2cids[2],"Brake Inspection + Pad Replace","Carlos","2025-07-22 10:00",90,220,0,"Completed"],
  [BID2,b2cids[0],"Tire Rotation + Balance","Carlos","2025-08-05 09:00",60,85,0,"Completed"],
  [BID2,b2cids[4],"Full Service","Mike","2025-08-12 10:00",120,310,0,"Completed"],
  [BID2,b2cids[1],"AC Diagnostic + Recharge","Carlos","2025-09-03 11:00",75,145,0,"Completed"],
  [BID2,b2cids[0],"Oil Change + Filter","Mike","2025-09-10 09:00",45,89,0,"Completed"],
  [BID2,b2cids[2],"Transmission Fluid Change","Carlos","2025-10-01 10:00",60,120,0,"Completed"],
  [BID2,b2cids[0],"Full Detail + Wax","Mike","2025-10-15 09:00",180,250,0,"Completed"],
  [BID2,b2cids[1],"Oil Change","Mike","2025-11-05 11:00",30,65,0,"Completed"],
  [BID2,b2cids[0],"Oil Change + Filter","Mike","2025-12-10 09:00",45,89,0,"Completed"],
  [BID2,b2cids[2],"Winter Tire Swap","Carlos","2025-12-20 10:00",60,110,0,"Completed"],
  [BID2,b2cids[0],"Full Service","Mike","2026-01-08 09:00",120,310,0,"Completed"],
  [BID2,b2cids[1],"Oil Change","Mike","2026-02-03 11:00",30,65,0,"Completed"],
  [BID2,b2cids[3],"Safety Inspection","Carlos","2026-02-20 10:00",45,75,0,"Completed"],
  [BID2,b2cids[0],"Oil Change + Filter","Mike","2026-03-10 09:00",45,89,0,"Completed"],
  [BID2,b2cids[2],"Brake Check","Carlos","2026-03-28 10:00",60,95,0,"Confirmed"],
  [BID2,b2cids[3],"Oil Change","Mike","2026-04-01 11:00",30,65,0,"Pending"],
];
for (const a of b2appts) insA.run(...a);

const b2exp = [
  [BID2,"2025-07-01","Parts",890,"Brake pads, rotors, filters bulk order"],
  [BID2,"2025-07-20","Rent",2200,"Shop rent July"],
  [BID2,"2025-07-20","Software",199,"Platform fee"],
  [BID2,"2025-08-01","Parts",650,"Oil, filters, fluids restock"],
  [BID2,"2025-08-20","Rent",2200,"Shop rent Aug"],
  [BID2,"2025-09-20","Rent",2200,"Shop rent Sep"],
  [BID2,"2025-09-15","Equipment",1200,"New tire mounting machine"],
  [BID2,"2025-10-20","Rent",2200,"Shop rent Oct"],
  [BID2,"2025-11-20","Rent",2200,"Shop rent Nov"],
  [BID2,"2025-12-01","Parts",720,"Winter parts restock"],
  [BID2,"2025-12-20","Rent",2200,"Shop rent Dec"],
  [BID2,"2026-01-20","Rent",2200,"Shop rent Jan"],
  [BID2,"2026-02-20","Rent",2200,"Shop rent Feb"],
  [BID2,"2026-03-20","Rent",2200,"Shop rent Mar"],
];
for (const e of b2exp) insE.run(...e);
console.log("Business 2 (Auto) seeded");

// ── BUSINESS 3: Restaurant / Cafe ───────────────────────────────────────────
const b3 = db.prepare("INSERT INTO businesses (name,industry,owner_name,owner_email,phone,plan,mrr,plan_services,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
  .run("Peachtree Bites Cafe","restaurant","Amara Osei","amara@peachtreebites.com","404-876-4430","growth",112,'["crm","onboarding","website-custom","booking","reminders","seo","reviews","email-sms"]' ,"active","2025-08-01 09:00:00");
const BID3 = b3.lastInsertRowid;
db.prepare("INSERT INTO users (email,password,role,business_id,name,must_change_password,created_at) VALUES (?,?,'business_admin',?,?,0,?)")
  .run("amara@peachtreebites.com", bcrypt.hashSync("demo1234", 12), BID3, "Amara Osei","2025-08-01 09:00:00");

const b3clients = [
  {name:"David & Sarah Park",email:"david.park@gmail.com",phone:"404-551-2209",status:"VIP",notes:"Anniversary dinner regulars. Prefer table 12. Wine pairing always.",created_at:"2025-08-10"},
  {name:"Corporate: TechFlow Inc",email:"events@techflow.com",phone:"678-330-4400",status:"VIP",notes:"Monthly team lunches, 15-20 people. Invoice net 30.",created_at:"2025-08-15"},
  {name:"Maria Rodriguez",email:"maria.r@gmail.com",phone:"404-229-0011",status:"Active",notes:"Brunch regular every Sunday. Gluten-free.",created_at:"2025-09-01"},
  {name:"Jason & Group",email:"jason.smith@yahoo.com",phone:"770-448-3312",status:"Active",notes:"Birthday groups, usually 8-12. Needs cake pre-arranged.",created_at:"2025-09-20"},
  {name:"Lisa Chen",email:"lisa.chen@gmail.com",phone:"678-771-0099",status:"New",notes:"First reservation Feb 2026. Valentine's dinner.",created_at:"2026-02-01"},
];
const b3cids: number[] = [];
for (const c of b3clients) { const r = insC.run(BID3,c.name,c.email,c.phone,c.status,c.notes,c.created_at); b3cids.push(Number(r.lastInsertRowid)); }

const b3appts = [
  [BID3,b3cids[0],"Dinner Reservation (2)","Floor","2025-08-20 19:00",120,145,30,"Completed"],
  [BID3,b3cids[1],"Team Lunch (18 pax)","Events","2025-08-28 12:00",90,870,0,"Completed"],
  [BID3,b3cids[2],"Brunch (1)","Floor","2025-09-07 10:30",60,42,8,"Completed"],
  [BID3,b3cids[0],"Dinner Reservation (2)","Floor","2025-09-18 19:00",120,158,30,"Completed"],
  [BID3,b3cids[3],"Birthday Dinner (10)","Floor","2025-09-25 18:00",150,620,100,"Completed"],
  [BID3,b3cids[1],"Team Lunch (20 pax)","Events","2025-10-23 12:00",90,960,0,"Completed"],
  [BID3,b3cids[2],"Brunch (1)","Floor","2025-10-05 10:30",60,45,8,"Completed"],
  [BID3,b3cids[0],"Anniversary Dinner (2)","Floor","2025-10-15 19:30",150,210,50,"Completed"],
  [BID3,b3cids[1],"Team Lunch (16 pax)","Events","2025-11-20 12:00",90,768,0,"Completed"],
  [BID3,b3cids[2],"Brunch (1)","Floor","2025-11-09 10:30",60,42,10,"Completed"],
  [BID3,b3cids[0],"Holiday Dinner (4)","Floor","2025-12-12 19:00",120,320,60,"Completed"],
  [BID3,b3cids[3],"Holiday Party (12)","Floor","2025-12-20 18:00",180,840,150,"Completed"],
  [BID3,b3cids[1],"Team Lunch (15 pax)","Events","2026-01-22 12:00",90,720,0,"Completed"],
  [BID3,b3cids[2],"Brunch (1)","Floor","2026-01-12 10:30",60,45,8,"Completed"],
  [BID3,b3cids[4],"Valentine Dinner (2)","Floor","2026-02-14 19:00",120,195,40,"Completed"],
  [BID3,b3cids[0],"Dinner Reservation (2)","Floor","2026-02-22 19:00",120,148,30,"Completed"],
  [BID3,b3cids[1],"Team Lunch (18 pax)","Events","2026-03-19 12:00",90,864,0,"Completed"],
  [BID3,b3cids[2],"Brunch (1)","Floor","2026-03-08 10:30",60,42,8,"Completed"],
  [BID3,b3cids[0],"Dinner Reservation (2)","Floor","2026-03-28 19:00",120,158,0,"Confirmed"],
  [BID3,b3cids[3],"Birthday Dinner (8)","Floor","2026-04-03 18:00",150,0,0,"Pending"],
  [BID3,b3cids[1],"Team Lunch (20 pax)","Events","2026-04-09 12:00",90,0,0,"Confirmed"],
];
for (const a of b3appts) insA.run(...a);

const b3exp = [
  [BID3,"2025-08-01","Food & Beverage",3200,"Opening inventory"],
  [BID3,"2025-08-20","Rent",4500,"Rent Aug"],
  [BID3,"2025-08-20","Software",299,"Platform fee"],
  [BID3,"2025-08-25","Payroll",6800,"Staff wages Aug"],
  [BID3,"2025-09-20","Rent",4500,"Rent Sep"],
  [BID3,"2025-09-01","Food & Beverage",2800,"Monthly produce + protein"],
  [BID3,"2025-09-25","Payroll",6800,"Staff wages Sep"],
  [BID3,"2025-10-01","Food & Beverage",2900,"Monthly supplies"],
  [BID3,"2025-10-20","Rent",4500,"Rent Oct"],
  [BID3,"2025-10-25","Payroll",6800,"Staff wages Oct"],
  [BID3,"2025-11-01","Food & Beverage",2750,"Monthly supplies"],
  [BID3,"2025-11-20","Rent",4500,"Rent Nov"],
  [BID3,"2025-11-25","Payroll",6800,"Staff wages Nov"],
  [BID3,"2025-11-15","Marketing",400,"Holiday social ads"],
  [BID3,"2025-12-01","Food & Beverage",3500,"Holiday menu supplies"],
  [BID3,"2025-12-20","Rent",4500,"Rent Dec"],
  [BID3,"2025-12-25","Payroll",7200,"Staff wages Dec inc holiday"],
  [BID3,"2026-01-01","Food & Beverage",2600,"Jan supplies"],
  [BID3,"2026-01-20","Rent",4500,"Rent Jan"],
  [BID3,"2026-01-25","Payroll",6800,"Staff wages Jan"],
  [BID3,"2026-02-01","Food & Beverage",2900,"Feb supplies inc Valentine"],
  [BID3,"2026-02-20","Rent",4500,"Rent Feb"],
  [BID3,"2026-02-25","Payroll",6800,"Staff wages Feb"],
  [BID3,"2026-03-01","Food & Beverage",2750,"Mar supplies"],
  [BID3,"2026-03-20","Rent",4500,"Rent Mar"],
  [BID3,"2026-03-25","Payroll",6800,"Staff wages Mar"],
];
for (const e of b3exp) insE.run(...e);

// Business 3 invoices
const insI = db.prepare("INSERT INTO invoices (business_id,client_id,client_name,client_email,amount,status,due_date,items) VALUES (?,?,?,?,?,?,?,?)");
insI.run(BID3,b3cids[1],"Corporate: TechFlow Inc","events@techflow.com",870,"Paid","2025-09-27",JSON.stringify([{description:"Team Lunch Aug 28 (18 pax)",amount:870}]));
insI.run(BID3,b3cids[1],"Corporate: TechFlow Inc","events@techflow.com",960,"Paid","2025-11-22",JSON.stringify([{description:"Team Lunch Oct 23 (20 pax)",amount:960}]));
insI.run(BID3,b3cids[1],"Corporate: TechFlow Inc","events@techflow.com",768,"Paid","2025-12-20",JSON.stringify([{description:"Team Lunch Nov 20 (16 pax)",amount:768}]));
insI.run(BID3,b3cids[1],"Corporate: TechFlow Inc","events@techflow.com",720,"Paid","2026-02-21",JSON.stringify([{description:"Team Lunch Jan 22 (15 pax)",amount:720}]));
insI.run(BID3,b3cids[1],"Corporate: TechFlow Inc","events@techflow.com",864,"Unpaid","2026-04-18",JSON.stringify([{description:"Team Lunch Mar 19 (18 pax)",amount:864}]));
console.log("Business 3 (Restaurant) seeded");

console.log("\n=== Seed complete ===");
console.log("Superadmin account created for: " + SA_EMAIL);
console.log("3 demo businesses seeded (Luxe Threading, Metro Auto Works, Peachtree Bites)");
console.log("Demo business login URL: /login");
console.log("Superadmin URL: /admin (credentials set via env vars)");
db.close();
