const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

(async () => {
  const tina = await db.user.findFirst({ where: { email: "tina@meridian.demo" } });
  const margaret = await db.user.findFirst({ where: { email: "margaret@meridian.demo" } });
  if (!tina || !margaret) return console.log("users missing — run seed first");
  const account = await db.account.findFirst({
    where: { userId: margaret.id, type: "CHECKING" },
    orderBy: { createdAt: "asc" },
  });
  if (!account) return console.log("no account");

  const count = await db.accountUpdate.count({ where: { accountId: account.id } });
  if (count > 0) return console.log("memo already present");

  await db.accountUpdate.create({
    data: {
      accountId: account.id,
      authorId: tina.id,
      title: "Overdraft grace fee waived — courtesy refund",
      body:
        "Dear Margaret,\n\n" +
        "As discussed during your visit to the Plaza branch on the 18th, the $35.00 " +
        "overdraft grace assessment from October 4 has been waived as a courtesy. A " +
        "credit adjustment will post to your checking account within one business day.\n\n" +
        "If you have any questions, reply through Secure Messages or call your relationship " +
        "banker directly at +44 (0)20 7946 0958 extension 4411.\n\n" +
        "Sincerely,\n" +
        "Tina Okafor\n" +
        "Branch Operations, First National Meridian Bank",
    },
  });
  console.log("Demo secure message posted to", margaret.name);
})()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
