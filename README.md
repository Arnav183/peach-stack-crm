# Peach Stack CRM

A multi-tenant business management platform built and operated by **Peach Stack**.

Peach Stack is a dev shop and training program based in Atlanta, GA. We build real production software for small businesses across multiple industries.

---

## What It Is

A full-stack SaaS CRM platform that powers client-facing business dashboards for small businesses. Each business gets their own isolated environment with a dashboard tailored to their industry.

Supported industries: Hair & Beauty, Auto Shop, Restaurant & Cafe, Dental & Medical, Retail, Fitness & Gym, Freelancer & Agency, General Service.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS, Recharts |
| Backend | Node.js, Express, better-sqlite3 (SQLite) |
| Auth | JWT (httpOnly cookie), bcrypt (cost 12) |
| Build | Vite 6 |
| Deploy | Railway |

---

## Architecture

- **Multi-tenant** — each business has fully isolated data, scoped at the database query level
- **3-tier access** — platform admin, business admin, customer portal
- **Rate limiting** — login endpoint protected against brute force
- **Security headers** — X-Frame-Options, X-Content-Type-Options, X-Robots-Tag, Referrer-Policy
- **Health check** — dedicated `/health` endpoint for Railway deployment monitoring

---

## Local Development

```bash
npm install
```

Copy `.env.example` to `.env` and fill in the required variables:

```
JWT_SECRET=          # Required — any long random string
SUPERADMIN_EMAIL=    # Required — platform admin login
SUPERADMIN_PASSWORD= # Required — platform admin password
```

```bash
npm run dev
```

---

## Deployment

Deployed on Railway with persistent SQLite storage.

Required environment variables (set in Railway dashboard):

```
JWT_SECRET
SUPERADMIN_EMAIL
SUPERADMIN_PASSWORD
NODE_ENV=production
```

Set `RESET_DB=true` to wipe and re-seed the database on next deploy. Remove it after the first boot.

---

## Access

This platform is operated by Peach Stack. Access is provisioned by the Peach Stack team.

For business inquiries: [peachstack.dev](https://peachstack.dev)

---

*Built and maintained by [Peach Stack](https://github.com/Arnav183) — Atlanta, GA*

