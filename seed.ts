import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { subMonths, format, addDays, subDays, parseISO } from "date-fns";

const db = new Database("crm.db");

console.log("Initializing database and seeding...");

// Clear existing data
db.exec(`
  DROP TABLE IF EXISTS appointments;
  DROP TABLE IF EXISTS clients;
  DROP TABLE IF EXISTS services;
  DROP TABLE IF EXISTS users;
`);

// Create Tables
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

// Create Admin User
const hashedPassword = bcrypt.hashSync("admin123", 10);
db.prepare("INSERT INTO users (email, password, business_name, owner_name) VALUES (?, ?, ?, ?)")
  .run("admin@example.com", hashedPassword, "Luxe Studio", "Arnav Hazari");

// Create Clients
const clientNames = [
  "Sarah Johnson", "Michael Chen", "Emma Davis", "James Wilson", "Olivia Brown",
  "William Taylor", "Sophia Martinez", "Alexander Garcia", "Isabella Rodriguez", "Ethan Miller",
  "Mia Anderson", "Benjamin Thomas", "Charlotte Jackson", "Daniel White", "Amelia Harris",
  "Lucas Martin", "Harper Thompson", "Mason Moore", "Evelyn Young", "Logan Allen"
];

const clientStatuses = ["Active", "Inactive", "VIP", "New", "At Risk"];

const clients: any[] = [];
clientNames.forEach((name, i) => {
  const email = `${name.toLowerCase().replace(" ", ".")}@example.com`;
  // Varied phone numbers
  const areaCode = [212, 310, 415, 617, 702, 305][Math.floor(Math.random() * 6)];
  const prefix = Math.floor(Math.random() * 900) + 100;
  const line = Math.floor(Math.random() * 9000) + 1000;
  const phone = `(${areaCode}) ${prefix}-${line}`;
  
  const status = clientStatuses[Math.floor(Math.random() * clientStatuses.length)];
  
  // Varied join dates over the last 12 months
  const monthsAgo = Math.floor(Math.random() * 12);
  const daysAgo = Math.floor(Math.random() * 30);
  const createdAt = subDays(subMonths(new Date(), monthsAgo), daysAgo).toISOString();

  const result = db.prepare("INSERT INTO clients (name, email, phone, notes, status, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(name, email, phone, `Client since ${format(parseISO(createdAt), "MMM yyyy")}`, status, createdAt);
  clients.push({ id: result.lastInsertRowid, name });
});

// Create Appointments
const services = [
  { name: "Haircut", price: 50, duration: 45 },
  { name: "Coloring", price: 120, duration: 120 },
  { name: "Styling", price: 40, duration: 30 },
  { name: "Manicure", price: 30, duration: 45 },
  { name: "Pedicure", price: 45, duration: 60 },
  { name: "Facial", price: 80, duration: 60 }
];

const statuses = ["Completed", "Confirmed", "Cancelled"];

// Generate 80 appointments over the last 6 months
for (let i = 0; i < 80; i++) {
  const client = clients[Math.floor(Math.random() * clients.length)];
  const service = services[Math.floor(Math.random() * services.length)];
  
  // Random date in the last 6 months
  const randomDays = Math.floor(Math.random() * 180);
  const date = subDays(new Date(), randomDays);
  date.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0);

  const status = date < new Date() ? (Math.random() > 0.1 ? "Completed" : "Cancelled") : "Confirmed";

  db.prepare("INSERT INTO appointments (client_id, service, date, duration, price, status) VALUES (?, ?, ?, ?, ?, ?)")
    .run(client.id, service.name, date.toISOString(), service.duration, service.price, status);
}

// Add some future appointments
for (let i = 0; i < 10; i++) {
  const client = clients[Math.floor(Math.random() * clients.length)];
  const service = services[Math.floor(Math.random() * services.length)];
  
  const date = addDays(new Date(), Math.floor(Math.random() * 14));
  date.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0);

  db.prepare("INSERT INTO appointments (client_id, service, date, duration, price, status) VALUES (?, ?, ?, ?, ?, ?)")
    .run(client.id, service.name, date.toISOString(), service.duration, service.price, "Confirmed");
}

console.log("Database seeded successfully!");
process.exit(0);
