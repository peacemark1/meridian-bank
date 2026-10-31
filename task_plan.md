# Task Plan: First National Meridian Bank — Prototype

## Goal
Build a demo/prototype banking system website: Next.js + TypeScript + Tailwind + shadcn-style UI + Prisma + SQLite.
Three portals (Customer / Employee / Admin), demo auth, navy+gold brand "First National Meridian Bank".

## Status: IN PRODUCTION BUILD — core complete; server runs at http://localhost:3000

### Phase 1: Scaffold + Schema + Seed — Status: complete
### Phase 2: Auth + role routing — Status: complete
### Phase 3: Customer portal — Status: complete
### Phase 4: Admin + Employee portals — Status: complete
### Phase 5: Polish — Status: complete (charts, empty states, CSV export in-pass; mobile is desktop-first)

## Next Step
User acceptance: open http://localhost:3000 and try the demo logins.

### Phase 2: Auth + role routing — Status: pending
- Session auth (bcrypt), login page, role-based redirect & guards (CUSTOMER/EMPLOYEE/ADMIN)

### Phase 3: Customer portal — Status: pending
- Dashboard, deposit/withdraw, transfers, money requests, statements + CSV

### Phase 4: Admin + Employee portals — Status: pending
- Admin: stats, user mgmt, freeze/adjust; Employee: read-only search + flag

### Phase 5: Polish — Status: pending
- Charts, empty states, responsive, final pass

## Next Step
When npm install completes: prisma generate → migrate/dev → seed → next build.

## Session 1 Results (Oct 31, 2026)
- ✅ Database: SQLite (prisma/dev.db), migration `init` applied, seed complete (8 users)
- ✅ Production build: 15 routes compiled clean, TypeScript passes
- ✅ Smoke tests: landing 200, login 200, register 200, /dashboard guards via 307 redirect

## Decisions Made
- Money as integer cents everywhere
- Signed HMAC session cookie (no extra deps); bcrypt for passwords
- Hand-rolled SVG charts & shadcn-style UI kit (no recharts/shadcn CLI — slow npm)
- Seed data in plain JS (prisma/seed.js) to avoid tsx dependency
- **Pin prisma@6 + @prisma/client@6 stable** — Prisma 8 RC's embedded toolchain (composer/alchemy/orm-*) repeatedly arrived truncated on this slow connection; 6.x is lean

## Notes
- npm registry extremely slow here (~2-10s per fetch); use background installs
- Two node installs on machine (v24.13.0 active; stray v26 in user profile)
- Full npm fight logged in findings.md; tree verified clean on 2026-10-31

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| create-next-app rejects dir name "Bank" | 1 | Scaffolded `scaffold-app`, hoisted files, renamed package |
| npm installs time out (registry ~2-10s/fetch) | 2 | Background install + parallel code writing |
| npm ECONNRESET mid-install | 3 | Retry loop with fetch-retries |
| npm "Invalid Version:" on @prisma/client install | 4 | Truncated package dirs deleted (esbuild, call-bound, @effect/sql-d1, …) |
| npm "Invalid Version:" persisted | 5 | Root cause: corrupt package-lock.json (≈60 entries with empty version from killed installs) → deleted lockfile, reinstall rebuilds it |
