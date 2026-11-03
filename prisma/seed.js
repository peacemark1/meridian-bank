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
  const existingUsers = await db.user.count();
  if (existingUsers > 0) {
    // Idempotent seeding: the demo data already exists (any seeded environment
    // runs this script again harmlessly — deploys, rebuilds, restarts).
    console.log(`Seed skipped — ${existingUsers} users already present.`);
    return;
  }

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

  // ————————————————————————————————————————————————————————————————
  // Phase 3 (session 2) demo extensions — idempotent on fresh databases
  // ————————————————————————————————————————————————————————————————
  const freshCheckings = await db.account.findMany({
    where: { type: "CHECKING" },
    include: { user: true },
  });
  const accOf = (email) => freshCheckings.find((a) => a.user.email === email);
  const margAcc = accOf("m.ellsworth44@gmail.com");
  const jamesAcc = accOf("j.whitlock198@outlook.com");
  const sofiaAcc = accOf("sofia.marchetti@protonmail.com");
  const walterAcc = accOf("walter.jennings870@gmail.com");

  if (!(await db.recurring.count()) && margAcc && jamesAcc) {
    await db.recurring.create({
      data: {
        reference: "SCH-GARDEN",
        accountId: margAcc.id,
        toAccountNumber: jamesAcc.accountNumber,
        amountCents: 85_00,
        cadence: "MONTHLY",
        label: "Garden maintenance",
        nextRunAt: new Date(Date.now() + 45 * 60 * 1000),
      },
    });
  }
  if (sofiaAcc && walterAcc) {
    if (!(await db.recurring.findFirst({ where: { reference: "SCH-LEAGUE" } }))) {
      await db.recurring.create({
        data: {
          reference: "SCH-LEAGUE",
          accountId: sofiaAcc.id,
          toAccountNumber: walterAcc.accountNumber,
          amountCents: 22_00,
          cadence: "WEEKLY",
          label: "Softball league dues",
          nextRunAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      });
    }
    // one payment sitting in the overnight batch
    await db.transaction.create({
      data: {
        reference: "PAY-BATCH-" + Date.now().toString(36).toUpperCase().slice(-6),
        accountId: sofiaAcc.id,
        type: "PAYMENT_OUT",
        status: "PENDING",
        postAt: new Date(Date.now() + 2 * 60 * 1000),
        amountCents: 42_000,
        description: "Kitchen renovation deposit — Marchetti & Sons",
        counterpartyAccountId: jamesAcc ? jamesAcc.id : null,
        createdAt: new Date(Date.now() - 10_000),
      },
    });
  }

  // Eula Lopez Delatte — private-client settlement delivered Monday morning as
  // three pending incoming wires (not a balance, not a standing instruction)
  const EULA_EMAIL = "eulalopez01@gmail.com";
  if (!(await db.user.findUnique({ where: { email: EULA_EMAIL } }))) {
    const eula = await db.user.create({
      data: {
        name: "Eula Lopez Delatte",
        email: EULA_EMAIL,
        city: "London, UK",
        role: "CUSTOMER",
        currency: "EUR",
        passwordHash: await bcrypt.hash("Meridian-7490", 10),
        accounts: {
          create: [
            {
              type: "CHECKING",
              accountNumber: "44000001290056",
              nickname: "Everyday Checking",
              balanceCents: 0,
            },
            {
              type: "SAVINGS",
              accountNumber: "94000001290063",
              nickname: "Silverleaf Savings",
              balanceCents: 0,
            },
          ],
        },
      },
      include: { accounts: true },
    });

    const wireDay = () => {
      const now = new Date();
      let add = (1 - now.getUTCDay() + 7) % 7;
      if (add === 0) add = 7;
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + add, 14, 0, 0));
    };
    const postAt = wireDay();
    const parts = [106_666_667, 106_666_667, 106_666_666]; // sum: $3,200,000.00
    const eulaChecking = eula.accounts.find((a) => a.type === "CHECKING");
    for (let i = 0; i < parts.length; i++) {
      await db.transaction.create({
        data: {
          reference: `WIR-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 8).toUpperCase()}-${i + 1}`,
          accountId: eulaChecking.id,
          type: "DEPOSIT",
          status: "PENDING",
          postAt,
          amountCents: parts[i],
          description: `Incoming wire — remittance ${i + 1} of 3 (settlement of account consolidation)`,
        },
      });
    }
    console.log("Eula Lopez Delatte seeded — three incoming wires post " + postAt.toISOString());
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
