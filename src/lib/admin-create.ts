"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, newRef } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { parseDollarsToCents } from "@/lib/money";

export interface CreatedAccount {
  id: string;
  accountNumber: string;
  type: string;
  balanceCents: number;
}

export interface CreateCustomerState {
  error?: string;
  created?: {
    userId: string;
    name: string;
    email: string;
    tempPassword: string;
    accounts: CreatedAccount[];
  };
}

function randomTempPassword() {
  const words = ["Meridian", "Vault", "Sterling", "Charter", "Cornerstone", "Beacon", "Granite", "Fiduciary"];
  const w = words[Math.floor(Math.random() * words.length)];
  return `${w}-${Math.floor(1000 + Math.random() * 9000)}`;
}

/** Issues the next unique account number on the given product prefix. */
async function nextAccountNumber(prefix: string) {
  const existing = await prisma.account.findMany({
    where: { accountNumber: { startsWith: prefix } },
    select: { accountNumber: true },
  });
  let seq = 1290000 + existing.length * 3;
  let candidate = "";
  do {
    seq += 3;
    candidate = `${prefix}${String(seq).padStart(10, "0")}`;
  } while (existing.some((e) => e.accountNumber === candidate));
  return candidate;
}

const WELCOME_MEMO = (name: string, checking: string, savings: string | null) =>
  `Dear ${name.split(" ")[0]},\n\nWelcome to First National Meridian Bank. Your accounts are now open:\n${checking}${savings ? `\n${savings}` : ""}\n\nYour relationship banker will be in touch within 5 business days to review your statement delivery preferences. Deposits at First National Meridian Bank are insured by the FDIC up to $250,000 per depositor, for each account ownership category.\n\nSincerely,\nThe Meridian New Accounts Desk`;

export async function createCustomerAction(
  _prev: CreateCustomerState,
  formData: FormData,
): Promise<CreateCustomerState> {
  const session = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const openChecking = formData.get("openChecking") === "on";
  const openSavings = formData.get("openSavings") === "on";
  const checkingDeposit = parseDollarsToCents(String(formData.get("checkingDeposit") ?? "0")) ?? 0;
  const savingsDeposit = parseDollarsToCents(String(formData.get("savingsDeposit") ?? "0")) ?? 0;

  if (name.length < 2) return { error: "Enter the customer's full legal name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  if (!openChecking && !openSavings) return { error: "Open at least one product." };
  if (openChecking && checkingDeposit < 2500)
    return { error: "Meridian Checking requires a $25 minimum opening deposit." };
  if (openSavings && savingsDeposit < 10_000)
    return { error: "Meridian Savings requires a $100 minimum opening deposit." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: `A customer already exists with email ${email}.` };

  const tempPassword = randomTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const accountsToOpen: { type: "CHECKING" | "SAVINGS"; balance: number }[] = [];
  if (openChecking) accountsToOpen.push({ type: "CHECKING", balance: checkingDeposit });
  if (openSavings) accountsToOpen.push({ type: "SAVINGS", balance: savingsDeposit });

  const accountNumbers = await Promise.all(
    accountsToOpen.map((a) => nextAccountNumber(a.type === "CHECKING" ? "4400" : "9400")),
  );

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      city,
      role: "CUSTOMER",
      passwordHash,
      accounts: {
        create: accountsToOpen.map((a, i) => ({
          type: a.type,
          accountNumber: accountNumbers[i],
          nickname: a.type === "CHECKING" ? "Everyday Checking" : "Silverleaf Savings",
          balanceCents: a.balance,
        })),
      },
    },
    include: { accounts: true },
  });

  const admin = await prisma.user.findUnique({ where: { id: session.userId } });

  // opening ledger entries + welcome memos
  for (const account of user.accounts) {
    if (account.balanceCents > 0) {
      await prisma.transaction.create({
        data: {
          reference: newRef("DEP"),
          accountId: account.id,
          type: "DEPOSIT",
          amountCents: account.balanceCents,
          description: "Opening deposit",
          balanceAfterCents: account.balanceCents,
          createdAt: new Date(),
        },
      });
    }
    await prisma.accountUpdate.create({
      data: {
        accountId: account.id,
        authorId: session.userId,
        title: "Welcome to First National Meridian Bank",
        body: WELCOME_MEMO(
          name,
          `Meridian ${account.type === "CHECKING" ? "Everyday Checking" : "Silverleaf Savings"} ……… ${account.accountNumber}`,
          null,
        ),
      },
    });
  }

  void admin;

  return {
    created: {
      userId: user.id,
      name,
      email,
      tempPassword,
      accounts: user.accounts.map((a) => ({
        id: a.id,
        accountNumber: a.accountNumber,
        type: a.type,
        balanceCents: a.balanceCents,
      })),
    },
  };
}

export async function postAccountUpdateAction(
  accountId: string,
  title: string,
  body: string,
): Promise<{ error?: string; success?: string }> {
  const session = await requireAdmin();
  if (!title.trim() || !body.trim()) return { error: "Both a title and a message are required." };

  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) return { error: "Account not found." };

  await prisma.accountUpdate.create({
    data: {
      accountId,
      authorId: session.userId,
      title: title.trim(),
      body: body.trim(),
    },
  });
  return { success: "Secure message posted — it will appear on the customer's dashboard." };
}
