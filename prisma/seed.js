const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const db = new PrismaClient();

function ref(prefix, n) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${n.toString(36).toUpperCase().padStart(3, "0")}`;
}

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

async function main() {
  console.log("Seeding First National Meridian Bank…");
  await db.transaction.deleteMany({});
  await db.moneyRequest.deleteMany({});
  await db.account.deleteMany({});
  await db.user.deleteMany({});

  const password = await bcrypt.hash("demo1234", 10);

  const admin = await db.user.create({
    data: {
      name: "Raymond Kessler",
      email: "r.kessler@meridianfnb.com",
      passwordHash: password,
      role: "ADMIN",
    },
  });
  console.log(`Admin: ${admin.email} / demo1234`);

  await db.user.create({
    data: {
      name: "Tina Okafor",
      email: "t.okafor@meridianfnb.com",
      passwordHash: password,
      role: "EMPLOYEE",
    },
  });
  console.log("Employee: t.okafor@meridianfnb.com / demo1234");

  // Customers: name, email, checking cents, savings cents
  const customers = [
    ["Margaret Ellsworth", "m.ellsworth44@gmail.com", 184250, 92000],
    ["James Whitlock", "j.whitlock198@outlook.com", 5420, 15000],
    ["Priya Raman", "priya.raman912@gmail.com", 61308, 240500],
    ["Douglas Hobbs", "dhobbs574@aol.com", 21340, 0],
    ["Sofia Marchetti", "sofia.marchetti@protonmail.com", 1298055, 43200],
    ["Walter Jennings", "walter.jennings870@gmail.com", 89000, 5000],
  ];

  let seq = 0;
  for (const [name, email, checking, savings] of customers) {
    await db.user.create({
      data: {
        name,
        email,
        passwordHash: password,
        role: "CUSTOMER",
        accounts: {
          create: [
            {
              type: "CHECKING",
              accountNumber: `4400${String(1290000 + seq++ * 7).padStart(10, "0")}`,
              balanceCents: checking,
            },
            ...(savings > 0
              ? [
                  {
                    type: "SAVINGS",
                    accountNumber: `9400${String(1290000 + seq++ * 7).padStart(10, "0")}`,
                    balanceCents: savings,
                  },
                ]
              : []),
          ],
        },
      },
    });
    console.log(`Customer: ${email} / demo1234`);
  }

  const checkings = await db.account.findMany({ where: { type: "CHECKING" }, include: { user: true } });
  const savingsAccts = await db.account.findMany({ where: { type: "SAVINGS" }, include: { user: true } });

  let n = 0;
  for (const a of checkings) {
    await db.transaction.create({
      data: {
        reference: ref("OPEN", n),
        accountId: a.id,
        type: "DEPOSIT",
        amountCents: a.balanceCents,
        description: "Opening deposit",
        balanceAfterCents: a.balanceCents,
        createdAt: daysAgo(45),
      },
    });

    for (const [days, amt] of [
      [30, 142500],
      [16, 142500],
      [2, 142500],
    ]) {
      await db.transaction.create({
        data: {
          reference: ref("DEP", ++n),
          accountId: a.id,
          type: "DEPOSIT",
          amountCents: amt,
          description: "Payroll — Meridian Industries",
          balanceAfterCents: a.balanceCents + amt - 0,
          createdAt: daysAgo(days),
        },
      });
    }
  }
  void savingsAccts;

  // interesting payments between customers
  const margaret = checkings.find((a) => a.user.email === "m.ellsworth44@gmail.com");
  const james = checkings.find((a) => a.user.email === "j.whitlock198@outlook.com");
  if (margaret && james) {
    await db.transaction.create({
      data: {
        reference: ref("PAY", ++n),
        accountId: james.id,
        type: "PAYMENT_IN",
        amountCents: 65000,
        description: "Cabin rental share",
        balanceAfterCents: james.balanceCents + 65000,
        counterpartyAccountId: margaret.id,
        createdAt: daysAgo(6),
      },
    });
    await db.transaction.create({
      data: {
        reference: ref("PAY", ++n),
        accountId: margaret.id,
        type: "PAYMENT_OUT",
        amountCents: 65000,
        description: "Cabin rental share",
        balanceAfterCents: margaret.balanceCents - 65000,
        counterpartyAccountId: james.id,
        createdAt: daysAgo(6),
      },
    });
    const margSavings = savingsAccts.find((s) => s.userId === margaret.userId);
    await db.transaction.create({
      data: {
        reference: ref("TRF", ++n),
        accountId: margaret.id,
        type: "TRANSFER_IN",
        amountCents: 25000,
        description: `From Meridian Savings ····${margSavings ? margSavings.accountNumber.slice(-4) : ""}`,
        balanceAfterCents: margaret.balanceCents,
        createdAt: daysAgo(3),
      },
    });
  }

  // one suspicious transaction for the compliance demo
  const hobbs = checkings.find((a) => a.user.email === "dhobbs574@aol.com");
  if (hobbs) {
    await db.transaction.create({
      data: {
        reference: ref("WDR", ++n),
        accountId: hobbs.id,
        type: "WITHDRAW",
        amountCents: 9500,
        description: "ATM withdrawal — series of 3, same night",
        balanceAfterCents: hobbs.balanceCents - 9500,
        isFlagged: true,
        flagNote: "Structured withdrawals: 3 x $95.00 in one hour — pattern review",
        createdAt: daysAgo(1),
      },
    });
  }

  // money requests
  const users = await db.user.findMany({ where: { role: "CUSTOMER" } });
  const byEmail = (e) => users.find((u) => u.email === e);
  const priya = byEmail("priya.raman912@gmail.com");
  const margaretUser = byEmail("m.ellsworth44@gmail.com");
  const sofia = byEmail("sofia.marchetti@protonmail.com");
  const walter = byEmail("walter.jennings870@gmail.com");

  if (priya && margaretUser) {
    await db.moneyRequest.create({
      data: {
        reference: ref("REQ", ++n),
        requesterId: priya.id,
        recipientId: margaretUser.id,
        amountCents: 120000,
        note: "Symphony gala tickets (2)",
      },
    });
  }
  if (sofia && walter) {
    await db.moneyRequest.create({
      data: {
        reference: ref("REQ", ++n),
        requesterId: sofia.id,
        recipientId: walter.id,
        amountCents: 4500,
        note: "Baseball cards",
        status: "PAID",
        resolvedAt: daysAgo(2),
        createdAt: daysAgo(5),
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
