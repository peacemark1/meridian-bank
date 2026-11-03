// One-off: display currency GBP for Eula Lopez Delatte (UK-resident private client).
// Safe to re-run: sets only when the row's currency isn't already GBP.
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

const EMAIL = "eulalopez01@gmail.com";

async function main() {
  const user = await db.user.findUnique({ where: { email: EMAIL } });
  if (!user) {
    console.error("User not found:", EMAIL);
    process.exit(1);
  }
  if (user.currency === "GBP") {
    console.log("Already GBP — no change.");
    return;
  }
  await db.user.update({ where: { email: EMAIL }, data: { currency: "GBP" } });
  console.log(`${user.name}: display currency set to GBP`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
