# First National Meridian Bank — Demo Prototype

*Banking on a Solid Foundation since 1892.*

A fictional UK-headquartered private-bank prototype with three portals, built with
**Next.js 16 · TypeScript · Tailwind v4 · Prisma · PostgreSQL**.

> Demo only. No real money, no real KYC, no regulatory anything.

## Live demo

**https://meridian-bank-one.vercel.app** (Vercel · PostgreSQL on Render).
A dated but equivalent instance also runs on Render free tier; it may sleep
30–60 s on first visit after idling.

## Database

- **Postgres hosted on Render** (`meridian-bank-pg`, oregon) — the demo data
  persists across deploys now; the seed only runs on an empty database
  (`prisma/seed.js` is idempotent).
- Connection: `DATABASE_URL` (external URL, `?sslmode=require`) in `.env`.
- ⚠️ Render's free plan expires this database on **2026-12-01**; upgrade it in
  the dashboard or recreate + reseed after that date.
- Apply schema with `npx prisma db push` (no migrations folder maintained).

## Run it

```bash
npm run dev      # development (http://localhost:3000) — needs DATABASE_URL in .env
```

Seed data loads only into an empty database; to rebuild demo state, create a
fresh database, run `npx prisma db push && node prisma/seed.js`.

## Demo logins (password for all: `demo1234`)

| Role | Email | What you can do |
|---|---|---|
| Customer | `m.ellsworth44@gmail.com` | Dashboard, transfers, standing instructions, pay/decline requests, statements + CSV |
| Employee | `t.okafor@meridianfnb.com` | Customer directory (read-only), flagged transactions |
| Admin | `r.kessler@meridianfnb.com` | Ops dashboard, freeze accounts, audited balance adjustments, full ledger |

Private-client walkthrough: `eulalopez01@gmail.com` / temp password
`Meridian-7490` — a UK-resident customer whose portal displays amounts in
**euro (€)**. Checking opens at 0.00 while a 3,200,000.00 settlement
(arrives as three `PENDING` incoming wires) posts on the next Monday, 14:00 UTC
(09:00 New York / 14:00 London).

or open your own accounts via **Open an account** on the landing page.

## Portals

- **Customer (`/dashboard`)** — balance cards, overview, transfers between own
  accounts, payments to any Meridian customer, deposits/withdrawals, money
  requests (send/receive/pay/decline), scheduled/recurring transfers
  (`/dashboard/recurring`), statements with CSV export.
- **Employee (`/employee`)** — search the book of business, review flagged
  transactions, flag/unflag ledger entries.
- **Admin (`/admin`)** — deposits-on-book stats, 14-day money-flow chart,
  freeze/unfreeze accounts, balance adjustments (always written to the ledger
  as `ADJUSTMENT` transactions), full transaction oversight, onboarding of new
  customers (Form NMB-2 → temp credentials), post-now/decline control over
  pending batch items.

## Recurring & pending engine

- Payments **≥ $2,500** enter the **overnight batch** as `PENDING` and post when
  the simulated business clock reaches their `postAt` (a few minutes in demo
  time). Admins can post them early or decline them from the account page.
- `src/lib/clock.ts` implements `advanceBusinessClock()`: settles due pending
  items and runs due `Recurring` instructions (weekly / biweekly / monthly).
  It runs on portal page loads and behind `GET /api/bank/clock` — point a real
  cron job (e.g. a Render cron hitting that endpoint) at it for hands-off time.

## Architecture notes

- Money is an integer **cents** everywhere (`Account.balanceCents`);
  the UI formats with `Intl.NumberFormat`.
- Transfers run in a single Prisma transaction: balance checks, both balance
  updates, and both ledger entries (an `OUT` and an `IN` row) commit atomically.
- Auth is a signed HMAC session cookie (`src/lib/auth.ts`); passwords are
  bcrypt-hashed. Demo-grade, not production-grade.
- Suspicious-looking activity can be flagged from the staff portals;
  flagged rows surface in both `/admin/oversight` and `/employee/flags`.
