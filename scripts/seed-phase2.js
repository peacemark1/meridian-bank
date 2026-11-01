const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

(async () => {
  const emails = ["m.ellsworth44@gmail.com", "j.whitlock198@outlook.com", "sofia.marchetti@protonmail.com", "walter.jennings870@gmail.com"];
  const users = await db.user.findMany({
    where: { email: { in: emails } },
    include: { accounts: true },
  });
  const byEmail = {};
  for (const u of users) byEmail[u.email] = u;

  const checking = (u) => (u ? u.accounts.find((a) => a.type === "CHECKING") : null);

  if (await db.recurring.count()) {
    console.log("Recurring demo already seeded; skipping");
    return;
  }

  // Margaret pays her gardener (James) monthly, like a real standing instruction
  const margaret = checking(byEmail["m.ellsworth44@gmail.com"]);
  const james = checking(byEmail["j.whitlock198@outlook.com"]);
  if (margaret && james) {
    await db.recurring.create({
      data: {
        reference: "SCH-GARDEN",
        accountId: margaret.id,
        toAccountNumber: james.accountNumber,
        amountCents: 85_00,
        cadence: "MONTHLY",
        label: "Garden maintenance",
        nextRunAt: new Date(Date.now() + 45 * 60 * 1000),
      },
    });
    console.log("Demo recurring: Margaret → James garden maintenance");
  }

  // Sofia scheduled her savings sweep (walter owes for the league — realistic!)
  const sofia = checking(byEmail["sofia.marchetti@protonmail.com"]);
  const walter = checking(byEmail["walter.jennings870@gmail.com"]);
  if (sofia && walter) {
    await db.recurring.create({
      data: {
        reference: "SCH-LEAGUE",
        accountId: sofia.id,
        toAccountNumber: walter.accountNumber,
        amountCents: 22_00,
        cadence: "WEEKLY",
        label: "Softball league dues",
        nextRunAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });
    console.log("Demo recurring: Sofia → Walter league dues");
  }

  // A big pending payment that has entered the overnight batch
  if (sofia && james) {
    await db.transaction.create({
      data: {
        reference: "PAY-BATCH-" + Date.now().toString(36).toUpperCase().slice(-6),
        accountId: sofia.id,
        type: "PAYMENT_OUT",
        status: "PENDING",
        postAt: new Date(Date.now() + 2 * 60 * 1000),
        amountCents: 42_000,
        description: "Kitchen renovation deposit — Marchetti & Sons",
        counterpartyAccountId: james.id,
        createdAt: new Date(Date.now() - 10_000),
      },
    });
    console.log("Demo pending: Sofia → James $420 kitchen deposit (posts in ~2 min)");
  }
})()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
