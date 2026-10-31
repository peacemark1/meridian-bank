# Task Plan: First National Meridian Bank — Prototype

## Goal
Build a demo/prototype banking system website: Next.js + TypeScript + Tailwind + shadcn-style UI + Prisma + SQLite.
Three portals (Customer / Employee / Admin), demo auth, navy+gold brand "First National Meridian Bank".

## Status: DEPLOYED — live at https://meridian-bank-2fi7.onrender.com

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
- SQLite acceptable on Render free tier: seeded during build → pristine demo per deploy

## Notes
- npm registry extremely slow here (~2-10s per fetch); use background installs
- Two node installs on machine (v24.13.0 active; stray v26 in user profile)
- Full npm fight logged in findings.md; tree verified clean on 2026-10-31
- Free tier sleeps after ~15 min idle → first visit may take ~30s to wake
- Optional: Render cron job hitting /api/bank/clock every few minutes for hands-off time

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
