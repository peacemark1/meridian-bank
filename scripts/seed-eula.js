/**
 * Idempotent setup for the Eula Lopez Delatte customer.
 *
 * Her $3,200,000.00 settlement does NOT start as an opening balance and is NOT
 * a standing instruction: it arrives as three PENDING incoming-wire deposits
 * that post together on the next Monday (settlement date).
 *
 * Idempotent: safe to re-run after any database reseed.
 * Run: node scripts/seed-eula.js
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const db = new PrismaClient();

const EMAIL = "eulalopez01@gmail.com";
const NAME = "Eula Lopez Delatte";
const CITY = "London, UK";

// $3,200,000.00 in integer cents, split into three parts (67, 67, 66)
const TOTAL_CENTS = 320_000_00 * 100;
const PARTS = [106_666_667, 106_666_667, 106_666_666];

/** Next Monday, 09:00 New York time (14:00 UTC), as a settlement date. */
function nextMondaySettlement() {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday ... 6 = Saturday
  let add = (1 - day + 7) % 7;
  if (add === 0) add = 7; // already Monday → settles on the following one
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + add, 14, 0, 0));
}

function ref(prefix) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

(async () => {
  if (PARTS.reduce((a, b) => a + b, 0) !== TOTAL_CENTS)
    throw new Error("wire parts do not sum to the settlement total");

  const settlementDate = nextMondaySettlement();
  console.log("Settlement date (next Monday 09:00 ET):", settlementDate.toISOString());

  // 1 — customer + accounts (balance zero: the funds have not landed yet)
  let user = await db.user.findUnique({
    where: { email: EMAIL },
    include: { accounts: true },
  });

  if (!user) {
    const passwordHash = await bcrypt.hash("Meridian-7490", 10);
    user = await db.user.create({
      data: {
        name: NAME,
        email: EMAIL,
        city: CITY,
        role: "CUSTOMER",
        currency: "EUR",
        passwordHash,
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
    console.log("Created customer:", NAME, "/", EMAIL);
  } else {
    console.log("Customer already exists:", user.name, "/", EMAIL);
  }

  const checking = user.accounts.find((a) => a.type === "CHECKING");
  if (!checking) throw new Error("Customer has no checking account to receive the wires");

  // 2 — three pending incoming wires arriving Monday (no standing instruction)
  const alreadyPending = await db.transaction.findMany({
    where: { accountId: checking.id, status: "PENDING", type: "DEPOSIT" },
    orderBy: { createdAt: "asc" },
  });

  if (alreadyPending.length > 0) {
    console.log("Pending wire deposits already scheduled for this account:",
      alreadyPending.map((t) => `${t.reference} $${(t.amountCents / 100).toFixed(2)}`).join(", "));
  } else {
    for (let i = 0; i < PARTS.length; i++) {
      await db.transaction.create({
        data: {
          reference: ref("WIR"),
          accountId: checking.id,
          type: "DEPOSIT",
          status: "PENDING",
          postAt: settlementDate,
          amountCents: PARTS[i],
          description: `Incoming wire — remittance ${i + 1} of 3 (settlement of account consolidation)`,
        },
      });
    }
    console.log(
      "Scheduled", PARTS.length, "pending incoming wires:",
      PARTS.map((c) => "$" + (c / 100).toFixed(2)).join(", "),
      "— posting", settlementDate.toISOString(),
    );
  }

  console.log("\nSetup complete.");
  console.log("Customer:", EMAIL, "/ temp password: Meridian-7490");
  console.log("Checking:", checking.accountNumber, "— current balance $0.00 until settlement posts");
  console.log("Not a recurring instruction — one-time settlement delivered as three wires.");
})()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
