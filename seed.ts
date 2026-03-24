import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const db = new Database("crm.db");

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

// Seed user
const userCount = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (email, password, business_name, owner_name) VALUES (?, ?, ?, ?)")
    .run("admin@example.com", hashedPassword, "Luxe Studio", "Arnav Hazari");
  console.log("Created demo user: admin@example.com / admin123");
}

const clientCount = db.prepare("SELECT count(*) as count FROM clients").get() as { count: number };
if (clientCount.count === 0) {
  // Realistic clients with varied join dates over the past 6 months and varied statuses
  const clients = [
    { name: "Sophia Martinez",  email: "sophia.martinez@gmail.com",  phone: "404-291-0847", status: "VIP",      notes: "Prefers morning appointments. Regulars brow threading + tint.", created_at: "2024-09-04 10:23:00" },
    { name: "James Carter",    email: "james.carter@outlook.com",    phone: "678-554-3201", status: "Regular",  notes: "Referred by Sophia. Happy with full face threading.",           created_at: "2024-09-18 14:05:00" },
    { name: "Priya Patel",     email: "priya.patel@gmail.com",       phone: "770-382-9014", status: "VIP",      notes: "Lash lift every 6 weeks. Very punctual.",                       created_at: "2024-09-27 09:45:00" },
    { name: "Marcus Johnson",  email: "marcus.johnson@yahoo.com",    phone: "404-617-2230", status: "Regular",  notes: "Brow shaping monthly. Prefers Saturday slots.",                 created_at: "2024-10-03 11:30:00" },
    { name: "Emily Chen",      email: "emily.chen@gmail.com",        phone: "678-904-5567", status: "New",      notes: "First visit. Interested in brow lamination.",                  created_at: "2024-10-14 16:00:00" },
    { name: "Daniel Okafor",   email: "daniel.okafor@gmail.com",     phone: "770-248-7713", status: "Regular",  notes: "Upper lip and brow threading biweekly.",                        created_at: "2024-10-22 13:15:00" },
    { name: "Ashley Williams", email: "ashley.w@hotmail.com",        phone: "404-839-1102", status: "At Risk",  notes: "Missed last 2 appointments. Follow up needed.",                 created_at: "2024-10-31 10:00:00" },
    { name: "Kevin Nguyen",    email: "kevin.nguyen@gmail.com",      phone: "678-331-8845", status: "Regular",  notes: "Lash tinting. Books 3 weeks in advance.",                       created_at: "2024-11-07 15:30:00" },
    { name: "Fatima Al-Hassan",email: "fatima.alhassan@gmail.com",   phone: "770-592-4400", status: "VIP",      notes: "Monthly full face + lash lift. Spends most per visit.",         created_at: "2024-11-15 09:00:00" },
    { name: "Tyler Brooks",    email: "tyler.brooks@yahoo.com",      phone: "404-773-6621", status: "New",      notes: "Walk-in conversion. Booked online after first visit.",           created_at: "2024-11-22 12:00:00" },
    { name: "Nadia Osei",      email: "nadia.osei@gmail.com",        phone: "678-440-3390", status: "Regular",  notes: "Brow lamination + tint every 8 weeks.",                         created_at: "2024-12-01 10:45:00" },
    { name: "Ryan Murphy",     email: "ryan.murphy@outlook.com",     phone: "770-215-8874", status: "Inactive", notes: "Has not booked since October. Sent re-engagement email.",        created_at: "2024-12-09 14:20:00" },
    { name: "Chloe Thompson",  email: "chloe.t@gmail.com",           phone: "404-584-0023", status: "Regular",  notes: "Prefers Amelia for threading. Very loyal.",                     created_at: "2024-12-17 11:00:00" },
    { name: "Andre Davis",     email: "andre.davis@gmail.com",       phone: "678-762-1195", status: "New",      notes: "Referred by Marcus Johnson. First appointment next week.",       created_at: "2025-01-06 09:30:00" },
    { name: "Isabella Romano", email: "isabella.romano@gmail.com",   phone: "770-348-9900", status: "VIP",      notes: "Wedding client — full face + lash lift weekly for 3 months.",  created_at: "2025-01-14 13:00:00" },
    { name: "David Kim",       email: "david.kim@outlook.com",       phone: "404-901-4422", status: "Regular",  notes: "Brow threading only. Quick appointments.",                      created_at: "2025-01-23 15:15:00" },
    { name: "Zoe Harris",      email: "zoe.harris@gmail.com",        phone: "678-503-7781", status: "At Risk",  notes: "Had a complaint about wait time in December. Needs follow-up.", created_at: "2025-02-03 10:30:00" },
    { name: "Michael Grant",   email: "michael.grant@yahoo.com",     phone: "770-674-2210", status: "Regular",  notes: "Monthly lash tint. Never misses appointments.",                 created_at: "2025-02-12 12:45:00" },
    { name: "Aisha Townsend",  email: "aisha.townsend@gmail.com",    phone: "404-237-5566", status: "New",      notes: "Booked via Instagram. Interested in lamination.",               created_at: "2025-02-28 09:00:00" },
    { name: "Liam Foster",     email: "liam.foster@gmail.com",       phone: "678-890-3344", status: "Regular",  notes: "Full face threading every 3 weeks. Easy to schedule.",          created_at: "2025-03-10 14:00:00" },
  ];

  const insertClient = db.prepare(
    "INSERT INTO clients (name, email, phone, notes, status, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  );
  clients.forEach(c => insertClient.run(c.name, c.email, c.phone, c.notes, c.status, c.created_at));
  console.log(`Seeded ${clients.length} clients`);

  // Seed services
  const services = [
    { name: "Brow Threading",         duration: 30, price: 35 },
    { name: "Brow Tinting",           duration: 20, price: 25 },
    { name: "Brow Lamination",        duration: 45, price: 75 },
    { name: "Brow Threading + Tint",  duration: 45, price: 55 },
    { name: "Full Face Threading",    duration: 45, price: 65 },
    { name: "Upper Lip Threading",    duration: 10, price: 15 },
    { name: "Lash Lift",              duration: 60, price: 95 },
    { name: "Lash Tinting",           duration: 20, price: 25 },
    { name: "Lash Lift + Tint",       duration: 75, price: 110 },
  ];
  const insertService = db.prepare("INSERT INTO services (name, duration, price) VALUES (?, ?, ?)");
  services.forEach(s => insertService.run(s.name, s.duration, s.price));
  console.log(`Seeded ${services.length} services`);

  // Seed realistic appointments spread over past 6 months
  const appts = [
    { client_id: 1,  service: "Brow Threading + Tint", date: "2024-09-06 10:00:00", duration: 45, price: 55,  status: "Completed" },
    { client_id: 3,  service: "Lash Lift",              date: "2024-09-28 09:00:00", duration: 60, price: 95,  status: "Completed" },
    { client_id: 1,  service: "Brow Threading + Tint", date: "2024-10-04 10:30:00", duration: 45, price: 55,  status: "Completed" },
    { client_id: 2,  service: "Full Face Threading",   date: "2024-10-10 14:00:00", duration: 45, price: 65,  status: "Completed" },
    { client_id: 4,  service: "Brow Threading",        date: "2024-10-19 11:00:00", duration: 30, price: 35,  status: "Completed" },
    { client_id: 9,  service: "Lash Lift + Tint",      date: "2024-10-25 09:30:00", duration: 75, price: 110, status: "Completed" },
    { client_id: 5,  service: "Brow Lamination",       date: "2024-11-02 16:00:00", duration: 45, price: 75,  status: "Completed" },
    { client_id: 6,  service: "Brow Threading",        date: "2024-11-05 13:00:00", duration: 30, price: 35,  status: "Completed" },
    { client_id: 8,  service: "Lash Tinting",          date: "2024-11-12 15:00:00", duration: 20, price: 25,  status: "Completed" },
    { client_id: 3,  service: "Lash Lift",              date: "2024-11-16 09:00:00", duration: 60, price: 95,  status: "Completed" },
    { client_id: 1,  service: "Brow Threading + Tint", date: "2024-11-22 10:00:00", duration: 45, price: 55,  status: "Completed" },
    { client_id: 9,  service: "Full Face Threading",   date: "2024-12-01 09:00:00", duration: 45, price: 65,  status: "Completed" },
    { client_id: 13, service: "Brow Threading",        date: "2024-12-08 11:00:00", duration: 30, price: 35,  status: "Completed" },
    { client_id: 4,  service: "Brow Threading",        date: "2024-12-14 11:00:00", duration: 30, price: 35,  status: "Completed" },
    { client_id: 15, service: "Lash Lift + Tint",      date: "2024-12-19 13:00:00", duration: 75, price: 110, status: "Completed" },
    { client_id: 6,  service: "Upper Lip Threading",   date: "2024-12-22 13:00:00", duration: 10, price: 15,  status: "Completed" },
    { client_id: 8,  service: "Lash Tinting",          date: "2025-01-08 15:00:00", duration: 20, price: 25,  status: "Completed" },
    { client_id: 1,  service: "Brow Threading + Tint", date: "2025-01-11 10:00:00", duration: 45, price: 55,  status: "Completed" },
    { client_id: 15, service: "Lash Lift",              date: "2025-01-15 13:30:00", duration: 60, price: 95,  status: "Completed" },
    { client_id: 3,  service: "Lash Lift",              date: "2025-01-25 09:00:00", duration: 60, price: 95,  status: "Completed" },
    { client_id: 16, service: "Brow Threading",        date: "2025-01-28 15:00:00", duration: 30, price: 35,  status: "Completed" },
    { client_id: 9,  service: "Lash Lift + Tint",      date: "2025-02-05 09:00:00", duration: 75, price: 110, status: "Completed" },
    { client_id: 13, service: "Brow Threading",        date: "2025-02-09 11:00:00", duration: 30, price: 35,  status: "Completed" },
    { client_id: 18, service: "Lash Tinting",          date: "2025-02-15 12:30:00", duration: 20, price: 25,  status: "Completed" },
    { client_id: 15, service: "Full Face Threading",   date: "2025-02-19 13:00:00", duration: 45, price: 65,  status: "Completed" },
    { client_id: 1,  service: "Brow Threading + Tint", date: "2025-02-22 10:00:00", duration: 45, price: 55,  status: "Completed" },
    { client_id: 4,  service: "Brow Threading",        date: "2025-03-01 11:00:00", duration: 30, price: 35,  status: "Completed" },
    { client_id: 19, service: "Brow Lamination",       date: "2025-03-05 09:30:00", duration: 45, price: 75,  status: "Completed" },
    { client_id: 3,  service: "Lash Lift",              date: "2025-03-08 09:00:00", duration: 60, price: 95,  status: "Completed" },
    { client_id: 20, service: "Full Face Threading",   date: "2025-03-12 14:00:00", duration: 45, price: 65,  status: "Completed" },
    // Upcoming appointments
    { client_id: 1,  service: "Brow Threading + Tint", date: "2025-03-28 10:00:00", duration: 45, price: 55,  status: "Confirmed" },
    { client_id: 15, service: "Lash Lift + Tint",      date: "2025-03-29 13:00:00", duration: 75, price: 110, status: "Confirmed" },
    { client_id: 9,  service: "Full Face Threading",   date: "2025-04-01 09:00:00", duration: 45, price: 65,  status: "Confirmed" },
    { client_id: 14, service: "Brow Threading",        date: "2025-04-03 11:00:00", duration: 30, price: 35,  status: "Confirmed" },
    { client_id: 8,  service: "Lash Tinting",          date: "2025-04-05 15:00:00", duration: 20, price: 25,  status: "Confirmed" },
    { client_id: 20, service: "Brow Lamination",       date: "2025-04-08 14:00:00", duration: 45, price: 75,  status: "Pending" },
    { client_id: 16, service: "Brow Threading",        date: "2025-04-10 15:00:00", duration: 30, price: 35,  status: "Pending" },
    { client_id: 3,  service: "Lash Lift",              date: "2025-04-12 09:00:00", duration: 60, price: 95,  status: "Confirmed" },
    { client_id: 19, service: "Brow Threading",        date: "2025-04-15 09:30:00", duration: 30, price: 35,  status: "Pending" },
    { client_id: 4,  service: "Brow Threading",        date: "2025-04-19 11:00:00", duration: 30, price: 35,  status: "Confirmed" },
  ];

  const insertAppt = db.prepare(
    "INSERT INTO appointments (client_id, service, date, duration, price, status) VALUES (?, ?, ?, ?, ?, ?)"
  );
  appts.forEach(a => insertAppt.run(a.client_id, a.service, a.date, a.duration, a.price, a.status));
  console.log(`Seeded ${appts.length} appointments`);
}

console.log("Seed complete.");
db.close();
