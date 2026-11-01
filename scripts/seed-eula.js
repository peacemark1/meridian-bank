/**
 * Idempotent setup for the Eula Lopez Delatte customer with a scheduled
 * £3.2M monthly payment.
 *
 * Run: node scripts/seed-eula.js
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const db = new PrismaClient();

const EMAIL = "eulalopez01@gmail.com";
const NAME = "Eula Lopez Delatte";
const CITY = "London, UK";
const GBP_CENTS = 320_000_00; // £3,200,000.00 in integer cents

async function run() {
  console.log("Looking up existing customer:", EMAIL);
  let user = await db.user.findUnique({ where: { email: EMAIL } });

  if (user) {
    console.log("Customer already exists:", user.name, "/", user.email);
  } else {
    console.log("Creating customer:", NAME, "/", EMAIL);
    const passwordHash = await bcrypt.hash("Meridian-7490", 10);

    const checkingNumber = "44000001290021";
    const savingsNumber = "94000001290018";

    user = await db.user.create({
      data: {
        name: NAME,
        email: EMAIL,
        city: CITY,
        role: "CUSTOMER",
        passwordHash,
        accounts: {
          create: [
            {
              type: "CHECKING",
              accountNumber: checkingNumber,
              nickname: "Everyday Checking",
              balanceCents: GBP_CENTS,
            },
            {
              type: "SAVINGS",
              accountNumber: savingsNumber,
              nickname: "Silverleaf Savings",
              balanceCents: 0,
            },
          ],
        },
      },
      include: { accounts: true },
    });

    // Record the opening deposit
    for (const account of user.accounts) {
      await db.transaction.create({
        data: {
          reference: `DEP-${Date.now().toString(36).toUpperCase()}${Math.random()
            .toString(36)
            .slice(2, 8)
            .toUpperCase()}`,
          accountId: account.id,
          type: "DEPOSIT",
          amountCents: account.balanceCents,
          description: `Opening deposit — £${account.balanceCents / 100} dollars`, // placeholder; no specific currency formatting required
          balanceAfterCents: account.balanceCents,
        },
      });
    }

    console.log("Created accounts:");
    for (const account of user.accounts) {
      console.log(" ", account.type, account.accountNumber, "balance:", (account.balanceCents / 100).toFixed(2));
    }
  }

  // Ensure the recurring payment is scheduled
  const checking = user.accounts.find((a) => a.type === "CHECKING");
  const payee = await db.account.findFirst({
    where: { accountNumber: "44000001290000" },
    orderBy: { accountNumber: "asc" },
  });

  if (!payee) {
    console.error("Target payee account 44000001290000 not found");
    process.exit(1);
  }

  const existing = await db.recurring.findFirst({
    where: {
      accountId: checking.id,
      toAccountNumber: payee.accountNumber,
      amountCents: GBP_CENTS,
      cadence: "MONTHLY",
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    console.log("Recurring payment already scheduled:", existing.reference);
    console.log("  Next run:", existing.nextRunAt.toISOString());
  } else {
    const recurring = await db.recurring.create({
      data: {
        reference: `SCH-${Date.now().toString(36).toUpperCase()}${Math.random()
          .toString(36)
          .slice(2, 8)
          .toUpperCase()}`,
        accountId: checking.id,
        toAccountNumber: payee.accountNumber,
        amountCents: GBP_CENTS,
        cadence: "MONTHLY",
        label: `Monthly payment — £3,200,000.00 to Meridian (#${payee.accountNumber})`,
        active: true,
        nextRunAt: new Date("2026-11-02T09:00:00Z"),
      },
    });
    console.log("Scheduled recurring payment:", recurring.reference);
    console.log("  From:", checking.accountNumber, "→", payee.accountNumber);
    console.log("  Amount: £3,200,000.00");
    console.log("  Cadence: MONTHLY");
    console.log("  First run:", recurring.nextRunAt.toISOString());
  }

  console.log("\nSetup complete.");
  console.log("Customer:", EMAIL);
  console.log("Password: Meridian-7490");
  console.log("Checking:", checking.accountNumber, "balance: £3,200,000.00");
  console.log("Savings:", user.accounts.find((a) => a.type === "SAVINGS").accountNumber);
  console.log("Recurring payment scheduled for 2026-11-02");
}

run()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
