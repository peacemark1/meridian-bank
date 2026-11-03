// One-off: display currency EUR for Eula Lopez Delatte (UK-resident private client).
// Safe to re-run: sets only when the row's currency isn't already EUR.
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

const EMAIL = "eulalopez01@gmail.com";

async function main() {
  const user = await db.user.findUnique({ where: { email: EMAIL } });
  if (!user) {
    console.error("User not found:", EMAIL);
    process.exit(1);
  }
  if (user.currency === "EUR") {
    console.log("Already EUR — no change.");
    return;
  }
  await db.user.update({ where: { email: EMAIL }, data: { currency: "EUR" } });
  console.log(`${user.name}: display currency set to EUR`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
