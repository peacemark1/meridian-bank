// One-off: UK repositioning — every seeded account was created with the old
// ABA routing default. Set all routing numbers to the Meridian sort code.
// Safe to re-run.
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  const result = await db.account.updateMany({
    where: { routingNumber: { not: "041127" } },
    data: { routingNumber: "041127" },
  });
  console.log(`sort code 04-11-27 applied to ${result.count} account(s)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
