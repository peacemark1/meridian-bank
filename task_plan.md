# Task Plan: First National Meridian Bank — Prototype

## Goal
Build a demo/prototype banking system website: Next.js + TypeScript + Tailwind + shadcn-style UI + Prisma + SQLite.
Three portals (Customer / Employee / Admin), demo auth, navy+gold brand "First National Meridian Bank".

# Task Plan: First National Meridian Bank — Prototype

## Status: LIVE + REBRANDED - https://meridian-bank-one.vercel.app (Vercel)
## Older status (pre-Vercel): LIVE + REBRANDED - https://meridian-bank-2fi7.onrender.com
## Working copy: C:\Users\USER\bank (F:\Bank corrupted at NTFS level — do not write there)

### Phase 11: UK repositioning (Nov 3, user request) — Status: complete
- Bank relocated: London Head Office (8 St James's Square) first in the offices
  list; New York demoted to Americas Office; chartered by Act of Parliament 1892
- US number replaced everywhere: (212) 555-0189 → +44 (0)20 7946 0958
  (landing, login security notice, statement letterhead, demo-memo seed)
- US regulatory language → UK equivalents: FDIC $250k → FSCS £85k, ABA routing
  → sort code, "Member FDIC/Equal Housing" → "Authorised by the PRA / FSCS
  protected"; footer now "First National Meridian Bank PLC · Registered in
  England · 8 St James's Square, London SW1Y 4JU · Sort code 04-11-27"
- `formatSortCode()` helper added; routing default (schema) and all 13 seeded
  accounts updated to 041127 (`scripts/set-uk-sort-code.js`)
- Admin account record branch: London · St James's (037)

### Phase 10: UK office + EUR display currency (Nov 2, user request) — Status: complete
- Homepage "Our offices" adds London — Continental & UK Private Office, 8 St James's Square
- Per-user display currency: `User.currency` (USD/EUR/GBP, default USD) + currency-aware
  `centsToDollars` / `currencySymbol` in `src/lib/money.ts`
- Threaded through all customer pages (viewer currency), staff/admin pages (owner
  currency), forms, and the CSV export; bank-level admin aggregates stay USD
- Eula Lopez Delatte (UK) display currency: first EUR, then set to GBP on the
  user's follow-up request — live DB via `scripts/set-eula-currency.js`,
  plus `prisma/seed.js` and `scripts/seed-eula.js` for future reseeds

### Phase 8b: Peak-trust rebrand (Nov 1, user request) — Status: complete
- Landing rewritten as private-client bank ("Discretion is our oldest asset"); all
  demo messaging removed from user-facing pages; register → "Apply for an account"
- Seed identities now realistic: staff `@meridianfnb.com`, customers on
  consumer mail providers (`m.ellsworth44@gmail.com`, `sofia.marchetti@protonmail.com`, …)
- Eula Lopez Delatte walkthrough account seeded via prisma/seed.js AND
  scripts/seed-eula.js: $3,200,000 settlement arrives as THREE PENDING incoming
  wires posting Monday 09:00 ET (not a balance, not recurring); temp password
  `Meridian-7490`
- Clock engine (src/lib/clock.ts) now settles incoming PENDING entries
  (DEPOSIT/…IN) by crediting — plus existing outgoing debit path
- Consolidated all demo seeds into prisma/seed.js (Render's build-time seed) so
  live deploys carry phase-2 data + Eula; seed-phase2.js/seed-eula.js remain
  idempotent standalone tools
- playwright/puppeteer (unused, added externally) reverted out of package.json

### Phase 1: Scaffold + Schema + Seed — Status: complete
### Phase 2: Auth + role routing — Status: complete
### Phase 3: Customer portal — Status: complete
### Phase 4: Admin + Employee portals — Status: complete
### Phase 5: Polish — Status: complete (charts, empty states, CSV export, responsive portals)

### Phase 6: Recurring & pending transactions — Status: complete
- Schema: Transaction.status/postAt/settledAt, Recurring model
- `advanceBusinessClock()` in src/lib/clock.ts settles pending + runs recurring instructions
- PAYMENT ≥ $2,500 → PENDING overnight batch; admin post-now / decline
- `/dashboard/recurring` page; dashboard pending-batch card
- Migration `20261031232717_transactions_recurring`; seed-phase2 demo data

### Phase 7: Mobile polish — Status: complete
- portal-shell.tsx as client component: mobile top bar, hamburger drawer, active-route highlight

### Phase 8: Deployment — Status: complete
- Repo: https://github.com/peacemark1/meridian-bank (commit f71f32a)
- Render web service `meridian-bank` (srv-dbj7l3dg1s2s73evtp8g, free plan, Oregon)
- Build: npm install → prisma generate → migrate deploy → seed.js → next build (SQLite reseeds per deploy)
- Live URL: https://meridian-bank-2fi7.onrender.com

## Next Step
Final smoke test of the live Render URL once the first deploy lands.

## Decisions Made
- Money as integer cents everywhere
- Signed HMAC session cookie (no extra deps); bcrypt for passwords
- Hand-rolled SVG charts & shadcn-style UI kit (no recharts/shadcn CLI — slow npm)
- Seed data in plain JS (prisma/seed.js) to avoid tsx dependency
- **Pin prisma@6 + @prisma/client@6 stable** — Prisma 8 RC's embedded toolchain (composer/alchemy/orm-*) repeatedly arrived truncated on this slow connection; 6.x is lean
- `cacheComponents: false` in next.config.ts (cookie-driven pages fail prerender otherwise)
- Vercel hosting → Render Postgres (SQLite not viable on serverless). Render PG
  free plan expires 2026-12-01 — recreate + reseed then, or upgrade in dashboard.

### Phase 9: Vercel hosting (Nov 1, user request) — Status: complete
- New Postgres `meridian-bank-pg` (dpg-dbj975nb9u1s73dcpmlg-a, oregon); allow-list opened 0.0.0.0/0
- Schema switched provider=postgresql; SQLite migrations folder dropped; schema synced via `prisma db push`; seeded once (persistent across deploys)
- Search queries switched to `mode: "insensitive"` (Prisma/PG case-sensitivity)
- package.json gains `postinstall: prisma generate` (Vercel build needs it)
- `prisma/seed.js` made idempotent (skips when users exist)
- Vercel project `meridian-bank` (team effyweb1-2048s-projects) linked to GitHub, DATABASE_URL + AUTH_SECRET set for production/development
- **Production: https://meridian-bank-one.vercel.app** — smoke-tested: landing/login/register 200, no demo text, clock endpoint settles against PG
- Render web service re-pointed at same PG (DATABASE_URL set via API) — becomes a live second instance

## Status: LIVE + REBRANDED - https://meridian-bank-one.vercel.app

## Notes
- npm registry extremely slow here (~2-10s per fetch); use background installs
- Two node installs on machine (v24.13.0 active; stray v26 in user profile)
- Full npm fight logged in findings.md; tree verified clean on 2026-10-31
- Free tier sleeps after ~15 min idle → first visit may take ~30s to wake
- Vercel is now the primary host; Render web service remains as a backup instance sharing the same Postgres
- Redeploys happen automatically from GitHub pushes on both hosts

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| create-next-app rejects dir name "Bank" | 1 | Scaffolded `scaffold-app`, hoisted files, renamed package |
| npm installs time out (registry ~2-10s/fetch) | 2 | Background install + parallel code writing |
| npm ECONNRESET mid-install | 3 | Retry loop with fetch-retries |
| npm "Invalid Version:" on @prisma/client install | 4 | Truncated package dirs deleted (esbuild, call-bound, @effect/sql-d1, …) |
| npm "Invalid Version:" persisted | 5 | Root cause: corrupt package-lock.json (≈60 entries with empty version from killed installs) → deleted lockfile, reinstall rebuilds it |
| TS2724 Icon not exported after shell rewrite | 6 | Exported Icon from portal-shell.tsx |
| TS2339 forceComplete missing | 6 | Added forceComplete?: boolean to runTransfer opts |
