# BizCRM — Peach Stack

A full-stack small business CRM built by **Peach Stack**.

Peach Stack is a dev shop and training program based in Atlanta, GA.
We build real software for small businesses and train junior developers by doing it.

---

## What It Does

A clean, fast internal tool for small businesses to manage clients,
track appointments, and monitor revenue — all in one place.

- **Dashboard** — total clients, revenue, upcoming appointments, new clients this month
- **Clients** — searchable list with VIP / Regular / New / At Risk / Inactive status badges, detail pages with notes and appointment history
- **Appointments** — view and manage upcoming and past appointments with status tracking
- **Revenue** — monthly revenue chart + breakdown by service type
- **Settings** — update business name and owner info

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS, Recharts |
| Backend | Node.js, Express, better-sqlite3 (SQLite) |
| Auth | JWT (httpOnly cookie), bcrypt |
| Build | Vite 6 |
| Deploy | Railway |

## Getting Started

```bash
npm install
npm run dev
```

App runs at `http://localhost:3000`

**Demo login**
```
Email:    admin@example.com
Password: admin123
```

## Seed the Database

```bash
npx tsx seed.ts
```

Populates 20 realistic clients with varied join dates (Sept 2024 — Mar 2025),
5 status types, and 40 appointments spread across 6 months.
Only runs if the database is empty.

## Environment Variables

Copy `.env.example` to `.env`:

```
JWT_SECRET=your-secret-key-here
```

## Project Structure

```
├── server.ts               Express API + Vite dev middleware
├── seed.ts                 Database seed script
├── crm.db                  SQLite database (auto-created on first run)
├── src/
│   ├── App.tsx             Root component + auth state
│   ├── components/
│   │   └── Sidebar.tsx
│   └── pages/
│       ├── Login.tsx
│       ├── Dashboard.tsx
│       ├── Clients.tsx
│       ├── ClientDetail.tsx
│       ├── Appointments.tsx
│       ├── Revenue.tsx
│       └── Settings.tsx
```

## Deploying

This app uses a persistent Express server + SQLite — it cannot run on Vercel.
Deploy to **Railway** (free tier) for a full working deployment:

1. Connect this repo on railway.app
2. Set start command: `npm run dev`
3. Add env var: `JWT_SECRET=your-secret`
4. Deploy — Railway gives you a public URL instantly

---

*Built and maintained by [Peach Stack](https://github.com/Arnav183) — Atlanta, GA*
