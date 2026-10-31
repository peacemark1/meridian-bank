# Findings — First National Meridian Bank build

## Environment
- Node v24.13.0 (Program Files), npm 11.6.2; a stray node-v24.22.1 in AppData\Local\nodejs also on PATH — watch for version confusion
- npm registry extremely slow from this machine (2–10s per HTTP fetch, even PONG 3.7s); tarball downloads via Invoke-WebRequest are fast — slowness is npm's fetch pattern (hundreds of small requests)
- Machine has `.freebuff` folder in F:\Bank (pre-existing, untouched)

## npm instability chain (root cause chain)
1. Interrupted installs truncate package folders AND package-lock.json entries → semver "Invalid Version:" crashes in Arborist dedupe
2. Fix: scan physical tree for missing/empty `version` in package.json (Node one-liner walk), delete truncated dirs, remove bad lockfile entries, reinstall
3. Even "successful" installs can leave dist files missing inside packages that parse fine (e.g. package-manager-detector/dist/detect.mjs, @prisma/composer-cli/dist/family.mjs) → detect via ERR_MODULE_NOT_FOUND on first CLI use
4. npm prune ("removed N packages") drops packages not listed in package.json that were manually installed (clsx, @prisma/client both got dropped this way — re-added)

## Prisma 8 RC note
- `prisma` resolved to ^8.0.0-rc.29; ships @prisma/composer + composer-cli (large, with alchemy/effect/commented test fixtures). If truncations persist on those, pin prisma@6 stable instead.

## Demo data design
- Fake-but-realistic: 6 American customers, bi-monthly payroll deposits, inter-customer cabin-share payment, one pre-flagged "structured ATM withdrawals" transaction for the compliance demo, a pending money-request pair
- All demo passwords: demo1234
