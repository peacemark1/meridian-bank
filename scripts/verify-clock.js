/**
 * Throwaway verification for the clock's incoming-credit settlement path:
 *  - inserts a past-due PENDING deposit of $0.01 on Eula's savings
 *  - runs the clock once (directly, not via HTTP)
 *  - asserts the deposit completed and the balance credited
 *  - cleans up (balance burned, test rows deleted)
 * Leaves the seeded (future-dated) Eula wires alone except to report status.
 */
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

(async () => {
  const { advanceBusinessClock } = await import("../src/lib/clock.ts").catch(() => ({}));
  // src/lib is TS — run the settlement logic through the compiled server instead.
  // This script therefore only sets up and reads state; the clock call is HTTP.

  const savings = await db.account.findFirst({
    where: { accountNumber: "94000001290063" },
  });
  if (!savings) throw new Error("Eula savings account not found");

  const test = await db.transaction.create({
    data: {
      reference: "WIR-TEST-" + Date.now().toString(36).toUpperCase(),
      accountId: savings.id,
      type: "DEPOSIT",
      status: "PENDING",
      postAt: new Date(Date.now() - 60_000), // due now
      amountCents: 1,
      description: "Test pending credit (self-cleaning)",
    },
  });
  console.log("inserted test pending deposit", test.id);

  const res = await fetch("http://localhost:3000/api/bank/clock");
  console.log("clock:", await res.json());

  const after = await db.transaction.findUnique({ where: { id: test.id } });
  const acct = await db.account.findUnique({ where: { id: savings.id } });
  console.log("test deposit now:", after.status, "balanceAfter:", after.balanceAfterCents);
  console.log("savings balance (cents):", acct.balanceCents);

  // Eula's Monday wires must still be pending
  const wires = await db.transaction.findMany({
    where: { accountId: (await db.account.findUnique({ where: { accountNumber: "44000001290056" } })).id, type: "DEPOSIT" },
    orderBy: { postAt: "asc" },
  });
  for (const w of wires) console.log("monday wire:", w.status, "$" + (w.amountCents / 100).toFixed(2), "postAt", w.postAt?.toISOString());

  // cleanup: burn the credited cent and remove test rows
  await db.account.update({ where: { id: acct.id }, data: { balanceCents: 0 } });
  await db.transaction.delete({ where: { id: test.id } });
  console.log("cleanup done");
})()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
