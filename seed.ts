import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { existsSync, unlinkSync } from "fs";

const DB_PATH = "crm.db";

// Start completely fresh
if (existsSync(DB_PATH)) {
  unlinkSync(DB_PATH);
  console.log("Deleted existing DB — starting fresh");
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

// Demo user
const hashedPassword = bcrypt.hashSync("admin123", 10);
db.prepare("INSERT INTO users (email, password, business_name, owner_name) VALUES (?, ?, ?, ?)")
  .run("admin@example.com", hashedPassword, "Luxe Threading Studio", "Arnav Hazari");
console.log("Created user: admin@example.com / admin123");

// Services
const services = [
  { name: "Brow Threading",        duration: 20, price: 18 },
  { name: "Full Face Threading",   duration: 40, price: 45 },
  { name: "Brow Tinting",          duration: 25, price: 28 },
  { name: "Brow Lamination",       duration: 50, price: 85 },
  { name: "Brow Threading + Tint", duration: 40, price: 42 },
  { name: "Lash Lift",             duration: 60, price: 95 },
  { name: "Lash Tinting",          duration: 25, price: 30 },
  { name: "Lash Lift + Tint",      duration: 75, price: 115 },
  { name: "Upper Lip Threading",   duration: 10, price: 10 },
  { name: "Chin Threading",        duration: 10, price: 10 },
];
const insertService = db.prepare("INSERT INTO services (name, duration, price) VALUES (?, ?, ?)");
services.forEach(s => insertService.run(s.name, s.duration, s.price));

// Clients — 24 total, mix of all statuses
const clients = [
  // VIP clients (high value, frequent visitors)
  { name: "Sophia Martinez",   email: "sophia.martinez@gmail.com",   phone: "404-291-0847", status: "VIP",      notes: "Prefers morning slots. Brow threading + tint every 3 weeks. Tip: always 20%. Referred 4 clients.",              created_at: "2024-07-12 09:00:00" },
  { name: "Fatima Al-Hassan",  email: "fatima.alhassan@gmail.com",   phone: "770-592-4400", status: "VIP",      notes: "Monthly full face + lash lift combo. Always books 3 appointments ahead. Never cancels.",                     created_at: "2024-07-28 10:30:00" },
  { name: "Isabella Romano",   email: "isabella.romano@gmail.com",   phone: "770-348-9900", status: "VIP",      notes: "Bride-to-be, weekly appointments until June wedding. Referred her entire bridal party (5 people).",           created_at: "2024-08-05 14:00:00" },
  { name: "Priya Patel",       email: "priya.patel@gmail.com",       phone: "678-382-9014", status: "VIP",      notes: "Lash lift every 6 weeks religiously. Very punctual. Buys retail products too — avg spend $140/visit.",        created_at: "2024-08-19 11:00:00" },

  // Regular clients (consistent bookings)
  { name: "James Carter",      email: "james.carter@outlook.com",    phone: "678-554-3201", status: "Regular",  notes: "Full face threading monthly. Referred by Sophia. Easy to work with, always on time.",                        created_at: "2024-08-22 15:00:00" },
  { name: "Marcus Johnson",    email: "marcus.johnson@yahoo.com",    phone: "404-617-2230", status: "Regular",  notes: "Brow shaping every 4 weeks. Prefers Saturday appointments. Has been coming for 8 months.",                  created_at: "2024-09-01 10:00:00" },
  { name: "Kevin Nguyen",      email: "kevin.nguyen@gmail.com",      phone: "678-331-8845", status: "Regular",  notes: "Lash tinting every 5 weeks. Always books 2-3 weeks ahead. Prefers Amelia.",                                  created_at: "2024-09-14 13:00:00" },
  { name: "Nadia Osei",        email: "nadia.osei@gmail.com",        phone: "678-440-3390", status: "Regular",  notes: "Brow lamination + tint every 8 weeks. Said she drives 45 mins because of quality.",                         created_at: "2024-09-28 09:30:00" },
  { name: "Chloe Thompson",    email: "chloe.t@gmail.com",           phone: "404-584-0023", status: "Regular",  notes: "Brow threading biweekly. Always leaves 5-star reviews. Very loyal, mentioned us in her Instagram stories.",  created_at: "2024-10-07 11:00:00" },
  { name: "Michael Grant",     email: "michael.grant@yahoo.com",     phone: "770-674-2210", status: "Regular",  notes: "Monthly lash tint. Never misses. Quiet but appreciative. Brings his wife occasionally.",                    created_at: "2024-10-15 14:30:00" },
  { name: "David Kim",         email: "david.kim@outlook.com",       phone: "404-901-4422", status: "Regular",  notes: "Brow threading only, quick in-and-out appointments. Lunchbreak regular every 3 weeks.",                     created_at: "2024-11-02 12:00:00" },
  { name: "Liam Foster",       email: "liam.foster@gmail.com",       phone: "678-890-3344", status: "Regular",  notes: "Full face threading every 3 weeks. Easy to schedule, flexible with times. Tip: usually 15%.",               created_at: "2024-11-18 10:00:00" },

  // New clients (recent, promising)
  { name: "Emily Chen",        email: "emily.chen@gmail.com",        phone: "678-904-5567", status: "New",      notes: "First visit Jan 2025. Interested in brow lamination. Came from Instagram ad. Potential VIP.",                created_at: "2025-01-08 16:00:00" },
  { name: "Tyler Brooks",      email: "tyler.brooks@yahoo.com",      phone: "404-773-6621", status: "New",      notes: "Walk-in conversion in December. Booked online after first visit. Asked about lash lift packages.",           created_at: "2025-01-15 12:00:00" },
  { name: "Andre Davis",       email: "andre.davis@gmail.com",       phone: "678-762-1195", status: "New",      notes: "Referred by Marcus Johnson. Had first appointment last week. Expressed interest in monthly package.",        created_at: "2025-02-03 09:00:00" },
  { name: "Aisha Townsend",    email: "aisha.townsend@gmail.com",    phone: "404-237-5566", status: "New",      notes: "Booked via Instagram DM. Interested in lamination. First appt next week.",                                  created_at: "2025-02-20 10:00:00" },

  // At Risk (need follow-up)
  { name: "Ashley Williams",   email: "ashley.w@hotmail.com",        phone: "404-839-1102", status: "At Risk",  notes: "Missed last 2 appointments without notice. Was a reliable regular before. Send re-engagement offer.",        created_at: "2024-10-22 10:00:00" },
  { name: "Zoe Harris",        email: "zoe.harris@gmail.com",        phone: "678-503-7781", status: "At Risk",  notes: "Had complaint about wait time in November. Offered discount on next visit. Needs personal follow-up call.", created_at: "2024-11-10 14:00:00" },
  { name: "Daniel Okafor",     email: "daniel.okafor@gmail.com",     phone: "770-248-7713", status: "At Risk",  notes: "Was biweekly regular, hasn't booked since January. Last service was upper lip threading. Check in needed.",  created_at: "2024-10-30 13:00:00" },

  // Inactive (haven't been back)
  { name: "Ryan Murphy",       email: "ryan.murphy@outlook.com",     phone: "770-215-8874", status: "Inactive", notes: "Last visit was October. Sent 2 re-engagement emails, no response. May have moved.",                          created_at: "2024-09-20 14:00:00" },
  { name: "Jessica Park",      email: "jessica.park@gmail.com",      phone: "404-662-5510", status: "Inactive", notes: "Came twice in August and September, then stopped. No explanation. Responded to one text but didn't book.", created_at: "2024-08-30 11:00:00" },

  // Additional clients for chart richness
  { name: "Rachel Torres",     email: "rachel.torres@gmail.com",     phone: "678-220-4413", status: "Regular",  notes: "Lash lift every 6 weeks. Quiet client, very precise about shape. Has been coming since August.",             created_at: "2024-08-10 09:00:00" },
  { name: "Brandon Lee",       email: "brandon.lee@outlook.com",     phone: "404-512-7890", status: "Regular",  notes: "Brow threading + tint monthly. Graphic designer, very detail-oriented about shape. Great tipper.",         created_at: "2024-09-05 15:30:00" },
  { name: "Nina Patel",        email: "nina.patel@gmail.com",        phone: "770-339-8821", status: "New",      notes: "Sister of Priya Patel. First visit this month. Interested in full lash + brow package.",                   created_at: "2025-02-15 11:00:00" },
  { name: "Olivia Brooks",     email: "olivia.brooks@gmail.com",     phone: "678-445-2290", status: "VIP",      notes: "Weekly client, gets multiple services per visit. High spender, always referred to senior staff.",           created_at: "2024-07-20 10:00:00" },
];

const insertClient = db.prepare("INSERT INTO clients (name, email, phone, notes, status, created_at) VALUES (?, ?, ?, ?, ?, ?)");
clients.forEach(c => insertClient.run(c.name, c.email, c.phone, c.notes, c.status, c.created_at));
console.log(`Seeded ${clients.length} clients`);

// Appointments — 60 total spread over 8 months, all services used, realistic revenue curve
const appts = [
  // July 2024 — early months, lighter
  { client_id: 1,  service: "Brow Threading + Tint", date: "2024-07-15 10:00:00", duration: 40, price: 42,  status: "Completed" },
  { client_id: 4,  service: "Lash Lift",              date: "2024-07-22 09:00:00", duration: 60, price: 95,  status: "Completed" },
  { client_id: 24, service: "Lash Lift + Tint",       date: "2024-07-26 11:00:00", duration: 75, price: 115, status: "Completed" },
  { client_id: 2,  service: "Full Face Threading",    date: "2024-07-30 14:00:00", duration: 40, price: 45,  status: "Completed" },

  // August 2024
  { client_id: 1,  service: "Brow Threading + Tint", date: "2024-08-05 10:00:00", duration: 40, price: 42,  status: "Completed" },
  { client_id: 3,  service: "Brow Lamination",        date: "2024-08-08 13:00:00", duration: 50, price: 85,  status: "Completed" },
  { client_id: 22, service: "Lash Lift",              date: "2024-08-12 09:00:00", duration: 60, price: 95,  status: "Completed" },
  { client_id: 24, service: "Full Face Threading",    date: "2024-08-14 11:00:00", duration: 40, price: 45,  status: "Completed" },
  { client_id: 2,  service: "Full Face Threading",    date: "2024-08-19 14:00:00", duration: 40, price: 45,  status: "Completed" },
  { client_id: 4,  service: "Lash Lift",              date: "2024-08-20 09:00:00", duration: 60, price: 95,  status: "Completed" },
  { client_id: 21, service: "Brow Threading",         date: "2024-08-27 15:00:00", duration: 20, price: 18,  status: "Completed" },

  // September 2024
  { client_id: 1,  service: "Brow Threading + Tint", date: "2024-09-02 10:00:00", duration: 40, price: 42,  status: "Completed" },
  { client_id: 6,  service: "Brow Threading",         date: "2024-09-07 11:00:00", duration: 20, price: 18,  status: "Completed" },
  { client_id: 23, service: "Brow Threading + Tint", date: "2024-09-10 15:30:00", duration: 40, price: 42,  status: "Completed" },
  { client_id: 2,  service: "Full Face Threading",    date: "2024-09-14 14:00:00", duration: 40, price: 45,  status: "Completed" },
  { client_id: 7,  service: "Lash Tinting",           date: "2024-09-16 13:00:00", duration: 25, price: 30,  status: "Completed" },
  { client_id: 22, service: "Lash Lift",              date: "2024-09-20 09:00:00", duration: 60, price: 95,  status: "Completed" },
  { client_id: 24, service: "Lash Lift + Tint",       date: "2024-09-23 11:00:00", duration: 75, price: 115, status: "Completed" },
  { client_id: 3,  service: "Lash Lift + Tint",       date: "2024-09-26 13:00:00", duration: 75, price: 115, status: "Completed" },
  { client_id: 4,  service: "Lash Lift",              date: "2024-09-30 09:00:00", duration: 60, price: 95,  status: "Completed" },

  // October 2024 — busy month
  { client_id: 1,  service: "Brow Threading + Tint", date: "2024-10-03 10:00:00", duration: 40, price: 42,  status: "Completed" },
  { client_id: 9,  service: "Brow Threading",         date: "2024-10-05 11:00:00", duration: 20, price: 18,  status: "Completed" },
  { client_id: 5,  service: "Full Face Threading",    date: "2024-10-08 14:00:00", duration: 40, price: 45,  status: "Completed" },
  { client_id: 2,  service: "Full Face Threading",    date: "2024-10-12 14:00:00", duration: 40, price: 45,  status: "Completed" },
  { client_id: 8,  service: "Brow Lamination",        date: "2024-10-14 10:00:00", duration: 50, price: 85,  status: "Completed" },
  { client_id: 10, service: "Lash Tinting",           date: "2024-10-17 12:30:00", duration: 25, price: 30,  status: "Completed" },
  { client_id: 23, service: "Brow Threading + Tint", date: "2024-10-19 15:00:00", duration: 40, price: 42,  status: "Completed" },
  { client_id: 3,  service: "Full Face Threading",    date: "2024-10-22 13:00:00", duration: 40, price: 45,  status: "Completed" },
  { client_id: 22, service: "Lash Lift",              date: "2024-10-25 09:00:00", duration: 60, price: 95,  status: "Completed" },
  { client_id: 24, service: "Brow Lamination",        date: "2024-10-28 11:00:00", duration: 50, price: 85,  status: "Completed" },
  { client_id: 6,  service: "Brow Threading",         date: "2024-10-31 13:00:00", duration: 20, price: 18,  status: "Completed" },

  // November 2024
  { client_id: 1,  service: "Brow Threading + Tint", date: "2024-11-04 10:00:00", duration: 40, price: 42,  status: "Completed" },
  { client_id: 4,  service: "Lash Lift",              date: "2024-11-07 09:00:00", duration: 60, price: 95,  status: "Completed" },
  { client_id: 11, service: "Brow Threading",         date: "2024-11-10 12:00:00", duration: 20, price: 18,  status: "Completed" },
  { client_id: 5,  service: "Full Face Threading",    date: "2024-11-13 14:00:00", duration: 40, price: 45,  status: "Completed" },
  { client_id: 9,  service: "Brow Threading",         date: "2024-11-17 11:00:00", duration: 20, price: 18,  status: "Completed" },
  { client_id: 3,  service: "Lash Lift + Tint",       date: "2024-11-20 13:00:00", duration: 75, price: 115, status: "Completed" },
  { client_id: 2,  service: "Full Face Threading",    date: "2024-11-22 14:00:00", duration: 40, price: 45,  status: "Completed" },
  { client_id: 8,  service: "Brow Tinting",           date: "2024-11-25 10:00:00", duration: 25, price: 28,  status: "Completed" },
  { client_id: 7,  service: "Lash Tinting",           date: "2024-11-27 15:00:00", duration: 25, price: 30,  status: "Completed" },

  // December 2024
  { client_id: 24, service: "Lash Lift + Tint",       date: "2024-12-02 11:00:00", duration: 75, price: 115, status: "Completed" },
  { client_id: 1,  service: "Brow Threading + Tint", date: "2024-12-06 10:00:00", duration: 40, price: 42,  status: "Completed" },
  { client_id: 12, service: "Full Face Threading",    date: "2024-12-09 14:00:00", duration: 40, price: 45,  status: "Completed" },
  { client_id: 3,  service: "Brow Lamination",        date: "2024-12-12 13:00:00", duration: 50, price: 85,  status: "Completed" },
  { client_id: 10, service: "Lash Tinting",           date: "2024-12-16 12:00:00", duration: 25, price: 30,  status: "Completed" },
  { client_id: 4,  service: "Lash Lift",              date: "2024-12-19 09:00:00", duration: 60, price: 95,  status: "Completed" },
  { client_id: 20, service: "Upper Lip Threading",    date: "2024-12-22 14:00:00", duration: 10, price: 10,  status: "Cancelled" },

  // January 2025
  { client_id: 1,  service: "Brow Threading + Tint", date: "2025-01-06 10:00:00", duration: 40, price: 42,  status: "Completed" },
  { client_id: 22, service: "Lash Lift",              date: "2025-01-09 09:00:00", duration: 60, price: 95,  status: "Completed" },
  { client_id: 13, service: "Brow Lamination",        date: "2025-01-13 16:00:00", duration: 50, price: 85,  status: "Completed" },
  { client_id: 5,  service: "Full Face Threading",    date: "2025-01-17 14:00:00", duration: 40, price: 45,  status: "Completed" },
  { client_id: 3,  service: "Lash Lift + Tint",       date: "2025-01-21 13:00:00", duration: 75, price: 115, status: "Completed" },
  { client_id: 11, service: "Brow Threading",         date: "2025-01-24 12:00:00", duration: 20, price: 18,  status: "Completed" },

  // February 2025
  { client_id: 1,  service: "Brow Threading + Tint", date: "2025-02-03 10:00:00", duration: 40, price: 42,  status: "Completed" },
  { client_id: 4,  service: "Lash Lift",              date: "2025-02-06 09:00:00", duration: 60, price: 95,  status: "Completed" },
  { client_id: 15, service: "Brow Threading",         date: "2025-02-10 11:00:00", duration: 20, price: 18,  status: "Completed" },
  { client_id: 24, service: "Full Face Threading",    date: "2025-02-13 11:00:00", duration: 40, price: 45,  status: "Completed" },
  { client_id: 8,  service: "Brow Lamination",        date: "2025-02-17 10:00:00", duration: 50, price: 85,  status: "Completed" },
  { client_id: 23, service: "Brow Threading + Tint", date: "2025-02-20 15:30:00", duration: 40, price: 42,  status: "Completed" },
  { client_id: 3,  service: "Lash Lift + Tint",       date: "2025-02-24 13:00:00", duration: 75, price: 115, status: "Completed" },

  // March 2025 — upcoming appointments
  { client_id: 1,  service: "Brow Threading + Tint", date: "2025-03-28 10:00:00", duration: 40, price: 42,  status: "Confirmed" },
  { client_id: 3,  service: "Lash Lift + Tint",       date: "2025-03-28 13:00:00", duration: 75, price: 115, status: "Confirmed" },
  { client_id: 4,  service: "Lash Lift",              date: "2025-03-29 09:00:00", duration: 60, price: 95,  status: "Confirmed" },
  { client_id: 24, service: "Full Face Threading",    date: "2025-03-29 11:00:00", duration: 40, price: 45,  status: "Confirmed" },
  { client_id: 13, service: "Brow Lamination",        date: "2025-04-01 16:00:00", duration: 50, price: 85,  status: "Confirmed" },
  { client_id: 16, service: "Brow Threading",         date: "2025-04-02 11:00:00", duration: 20, price: 18,  status: "Pending"   },
  { client_id: 5,  service: "Full Face Threading",    date: "2025-04-03 14:00:00", duration: 40, price: 45,  status: "Confirmed" },
  { client_id: 22, service: "Lash Lift",              date: "2025-04-04 09:00:00", duration: 60, price: 95,  status: "Confirmed" },
  { client_id: 23, service: "Brow Threading + Tint", date: "2025-04-05 15:00:00", duration: 40, price: 42,  status: "Pending"   },
  { client_id: 14, service: "Upper Lip Threading",    date: "2025-04-07 12:00:00", duration: 10, price: 10,  status: "Pending"   },
  { client_id: 9,  service: "Brow Threading",         date: "2025-04-08 11:00:00", duration: 20, price: 18,  status: "Confirmed" },
  { client_id: 8,  service: "Brow Lamination",        date: "2025-04-10 10:00:00", duration: 50, price: 85,  status: "Confirmed" },
];

const insertAppt = db.prepare("INSERT INTO appointments (client_id, service, date, duration, price, status) VALUES (?, ?, ?, ?, ?, ?)");
appts.forEach(a => insertAppt.run(a.client_id, a.service, a.date, a.duration, a.price, a.status));
console.log(`Seeded ${appts.length} appointments`);

console.log("Seed complete.");
db.close();
