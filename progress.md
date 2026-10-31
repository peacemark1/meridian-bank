# Progress — First National Meridian Bank

## Session 1 (Oct 31, 2026)

- Plan agreed in Plan mode: Next.js + TS + Tailwind + Prisma/SQLite, 3 portals, demo auth
- Scaffold issue: dir name `Bank` violates npm naming → scaffolded `scaffold-app`, hoisted files, renamed package to `meridian-bank`
- npm installs extremely slow (~5-10 min timeouts) → backgrounded full install, wrote all source code in parallel
- Wrote: schema.prisma, seed.js, lib/{prisma,auth,money,bank,admin-actions,cn}.ts, components/{wordmark,ui,portal-shell,login-form,register-form,deposit-withdraw-form,transfer-form,request-forms,account-controls,flag-button}.tsx, pages: landing, login, register, dashboard{,/transfer,/actions,/requests,/statements}, admin{,/users,/oversight}, employee{,/flags}, api/statements/export
- Pending: prisma generate, migrate, seed, build, fix any TS errors

## Session 2 (Oct 31, 2026) — Recurring, pending, mobile, deployment

- Schema migration `transactions_recurring`: Transaction gains status/postAt/settledAt; new Recurring model; Account routingNumber/nickname/openedAt; User phone/city
- `src/lib/clock.ts` — `advanceBusinessClock()`: settles due PENDING items (declines on insufficient funds), runs due Recurring instructions; wired into dashboard, consumer recurring page, admin account page, and `GET /api/bank/clock` (cron-ready)
- `runTransfer`: PAYMENT ≥ $2,500 → PENDING with postAt +3 min; admin "Post now / Decline" controls (`src/lib/pending-actions.ts`, `src/components/pending-controls.tsx`)
- `/dashboard/recurring` (create/pause/resume/cancel standing instructions) via `src/lib/recurring-actions.ts` + `src/components/recurring-forms.tsx`
- Dashboard: overnight-batch pending card + active-instruction counter; ledger rows show PENDING/DECLINED badges
- Mobile: `portal-shell.tsx` rewritten as client component (top bar, hamburger drawer, safe-area stacking, active-route highlight, `repeat` icon added)
- Demo data seeded (scripts/seed-phase2.js): Margaret→James monthly garden order, Sofia→Walter weekly league dues, Sofia→James $420 PENDING kitchen deposit
- `npm run build` clean — 20/20 routes
- Git initialized, committed (f71f32a), pushed to https://github.com/peacemark1/meridian-bank
- Render service created: `meridian-bank` (srv-dbj7l3dg1s2s73evtp8g) → https://meridian-bank-2fi7.onrender.com ; first deploy dep-dbj7l3tg1s2s73evtv50 builds npm install → prisma generate/migrate → seed → next build
- Local smoke tests: /api/bank/clock 200 `{ok:true,…}`, protected routes 307 unauthenticated
