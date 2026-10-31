# First National Meridian Bank — Demo Prototype

*Banking on a Solid Foundation since 1892.*

A fictional American community-bank prototype with three portals, built with
**Next.js 16 · TypeScript · Tailwind v4 · Prisma · SQLite**.

> Demo only. No real money, no real KYC, no regulatory anything.

## Live demo

**https://meridian-bank-2fi7.onrender.com** (Render free tier — first load after
idle may take ~30s while the instance wakes; the SQLite database reseeds to the
pristine demo state on every deploy).

## Run it

```bash
npm run dev      # development (http://localhost:3000)
# — or —
npm run build && npm run start   # production
```

The SQLite database (`prisma/dev.db`) ships seeded. To re-seed from scratch:

```bash
npx prisma migrate reset --force
```

## Demo logins (password for all: `demo1234`)

| Role | Email | What you can do |
|---|---|---|
| Customer | `margaret@meridian.demo` | Dashboard, transfers, pay/decline requests, statements + CSV |
| Employee | `tina@meridian.demo` | Customer directory (read-only), flagged transactions |
| Admin | `admin@meridian.demo` | Ops dashboard, freeze accounts, audited balance adjustments, full ledger |

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
