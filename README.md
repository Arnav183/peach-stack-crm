# BizCRM — 404 Labs

A full-stack small business CRM built and maintained by [404 Labs](https://github.com/404-labs-dev).

## What It Does

BizCRM is a clean, fast internal tool for small businesses to manage clients, track appointments, and monitor revenue — all in one place.

- **Dashboard** — at-a-glance stats: total clients, revenue, upcoming appointments, new clients this month
- **Clients** — full client list with search, status badges (VIP / Regular / New / At Risk / Inactive), and individual detail pages with notes and appointment history
- **Appointments** — view and manage upcoming and past appointments with status tracking
- **Revenue** — monthly revenue chart + breakdown by service
- **Settings** — update business name and owner info

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS, Recharts |
| Backend | Node.js, Express, better-sqlite3 |
| Auth | JWT (cookie-based), bcrypt |
| Build | Vite 6 |
| Deploy | Vercel (frontend) / Railway or Render (backend) |

## Getting Started

```bash
# Install dependencies
npm install

# Run in development (starts Express + Vite together)
npm run dev
```

App runs at `http://localhost:3000`

**Demo credentials**
```
Email:    admin@example.com
Password: admin123
```

## Seeding the Database

```bash
npx tsx seed.ts
```

This creates 20 realistic demo clients with varied join dates, statuses, and 40 appointments spread across 6 months. Only runs if the database is empty.

## Environment Variables

Copy `.env.example` to `.env`:

```
JWT_SECRET=your-secret-key-here
```

## Project Structure

```
├── server.ts          # Express API + Vite middleware
├── seed.ts            # Database seeding script
├── crm.db             # SQLite database (auto-created)
├── src/
│   ├── App.tsx        # Root app + auth state
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

## Built By

**404 Labs** — a dev shop and training program based in Atlanta, GA.  
We build real software for small businesses and teach junior developers by doing it.

---

*This project is a portfolio piece and demo used to showcase 404 Labs' work.*
