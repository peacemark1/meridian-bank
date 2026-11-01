"use server";

import { prisma } from "@/lib/prisma";
import { getSession, requireCustomer, requireAdmin, newRef } from "@/lib/auth";
import { parseDollarsToCents } from "@/lib/money";

export interface ActionState {
  error?: string;
  success?: string;
}

async function runTransfer(opts: {
  fromAccountId: string;
  toAccountId: string;
  amountCents: number;
  description: string;
  creditType: "TRANSFER" | "PAYMENT";
  forceComplete?: boolean;
}) {
  const { fromAccountId, toAccountId, amountCents, description, creditType } = opts;

  return prisma.$transaction(
    async (tx) => {
      const [from, to] = await Promise.all([
        tx.account.findUnique({ where: { id: fromAccountId } }),
        tx.account.findUnique({ where: { id: toAccountId } }),
      ]);

      if (!from || !to) return { error: "Account not found." };
      if (from.status === "FROZEN") return { error: "Source account is frozen." };
      if (to.status === "FROZEN") return { error: "Destination account is frozen." };
      if (from.balanceCents < amountCents) return { error: "Insufficient funds." };

      // Same-institution payments over $2,500 enter the overnight batch —
      // they post "one business day later" (a few minutes in this demo).
      const PENDING_THRESHOLD_CENTS = 250_000;
      const goesPending =
        creditType === "PAYMENT" &&
        !opts.forceComplete &&
        amountCents >= PENDING_THRESHOLD_CENTS;

      if (goesPending) {
        await tx.transaction.create({
          data: {
            reference: newRef("PAY"),
            accountId: from.id,
            type: "PAYMENT_OUT",
            status: "PENDING",
            postAt: new Date(Date.now() + 3 * 60 * 1000),
            amountCents,
            description: description || "Customer payment",
            counterpartyAccountId: to.id,
          },
        });
        return { success: true as const, reference: "PENDING" };
      }

      const fromBalance = from.balanceCents - amountCents;
      const toBalance = to.balanceCents + amountCents;
      const outRef = newRef(creditType === "TRANSFER" ? "TRF" : "PAY");
      const inRef = `${outRef}-IN`;

      await tx.account.update({ where: { id: from.id }, data: { balanceCents: fromBalance } });
      await tx.account.update({ where: { id: to.id }, data: { balanceCents: toBalance } });

      await tx.transaction.createMany({
        data: [
          {
            reference: outRef,
            accountId: from.id,
            type: creditType === "TRANSFER" ? "TRANSFER_OUT" : "PAYMENT_OUT",
            amountCents,
            description,
            balanceAfterCents: fromBalance,
            counterpartyAccountId: to.id,
          },
          {
            reference: inRef,
            accountId: to.id,
            type: creditType === "TRANSFER" ? "TRANSFER_IN" : "PAYMENT_IN",
            amountCents,
            description,
            balanceAfterCents: toBalance,
            counterpartyAccountId: from.id,
          },
        ],
      });

      return { success: true as const, reference: outRef };
    },
    { timeout: 10_000 },
  );
}

function serializeError(err: unknown): { error: string } {
  // Prisma P2024/P2028 transaction errors surface as generic failures; retry is
  // the caller's choice via the form. Everything else passes the client message.
  const message = err instanceof Error ? err.message : "Something went wrong.";
  if (message.includes("Timed out") || message.includes("transaction")) {
    return { error: "The bank is busy — please try again." };
  }
  return { error: message };
}

export async function depositAction(
  accountId: string,
  amount: string,
  description: string,
): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Please sign in." };

  const cents = parseDollarsToCents(amount);
  if (!cents) return { error: "Enter a valid positive amount." };
  if (cents > 1_000_000_00) return { error: "Deposits above $1,000,000 require a branch visit." };

  try {
    await prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({ where: { id: accountId } });
      if (!account) throw new Error("Account not found.");
      if (account.userId !== session.userId && session.role !== "ADMIN")
        throw new Error("Not your account.");
      if (account.status === "FROZEN") throw new Error("Account is frozen.");

      const balance = account.balanceCents + cents;
      await tx.account.update({ where: { id: accountId }, data: { balanceCents: balance } });
      await tx.transaction.create({
        data: {
          reference: newRef("DEP"),
          accountId,
          type: "DEPOSIT",
          amountCents: cents,
          description: description || "Cash deposit",
          balanceAfterCents: balance,
        },
      });
    });
    return { success: `Deposited successfully.` };
  } catch (e) {
    return serializeError(e);
  }
}

export async function withdrawAction(
  accountId: string,
  amount: string,
): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "Please sign in." };

  const cents = parseDollarsToCents(amount);
  if (!cents) return { error: "Enter a valid positive amount." };

  try {
    await prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({ where: { id: accountId } });
      if (!account) throw new Error("Account not found.");
      if (account.userId !== session.userId && session.role !== "ADMIN")
        throw new Error("Not your account.");
      if (account.status === "FROZEN") throw new Error("Account is frozen.");
      if (account.balanceCents < cents) throw new Error("Insufficient funds.");

      const balance = account.balanceCents - cents;
      await tx.account.update({ where: { id: accountId }, data: { balanceCents: balance } });
      await tx.transaction.create({
        data: {
          reference: newRef("WDR"),
          accountId,
          type: "WITHDRAW",
          amountCents: cents,
          description: "ATM withdrawal",
          balanceAfterCents: balance,
        },
      });
    });
    return { success: "Withdrawal complete." };
  } catch (e) {
    return serializeError(e);
  }
}

export async function transferAction(formData: FormData): Promise<ActionState> {
  const session = await requireCustomer();
  const fromAccountId = String(formData.get("fromAccountId") ?? "");
  const toAccountNumber = String(formData.get("toAccountNumber") ?? "").replace(/\s+/g, "");
  const amount = String(formData.get("amount") ?? "");
  const description = String(formData.get("description") ?? "").slice(0, 140);
  const kind = String(formData.get("kind") ?? "own"); // own | external

  const cents = parseDollarsToCents(amount);
  if (!cents) return { error: "Enter a valid positive amount." };

  const from = await prisma.account.findUnique({ where: { id: fromAccountId } });
  if (!from || (from.userId !== session.userId && session.role !== "ADMIN"))
    return { error: "Select one of your accounts." };

  let to = await prisma.account.findUnique({ where: { accountNumber: toAccountNumber } });
  if (!to) return { error: `No account found “${toAccountNumber}”.` };
  if (to.id === from.id) return { error: "Source and destination must differ." };

  if (kind === "own") {
    if (to.userId !== session.userId)
      return { error: "That account belongs to another customer — use the Payments tab." };
    const result = await runTransfer({
      fromAccountId: from.id,
      toAccountId: to.id,
      amountCents: cents,
      description: description || "Between own accounts",
      creditType: "TRANSFER",
    });
    return "error" in result && result.error ? { error: result.error } : { success: "Transfer complete." };
  }

  // external: same-branch instant, capped like a real rail
  if (cents > 250_000_00)
    return { error: "Same-branch transfers are capped at $250,000. Visit a branch for larger wires." };

  const result = await runTransfer({
    fromAccountId: from.id,
    toAccountId: to.id,
    amountCents: cents,
    description: description || "Customer payment",
    creditType: "PAYMENT",
  });
  return "error" in result && result.error
    ? { error: result.error }
    : result.reference === "PENDING"
      ? {
          success:
            "Large payment scheduled — funds post to the recipient within one business day. Track it under Pending on your dashboard.",
        }
      : { success: "Payment sent." };
}

export async function requestMoneyAction(formData: FormData): Promise<ActionState> {
  const session = await requireCustomer();
  const me = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!me) return { error: "Please sign in." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const cents = parseDollarsToCents(String(formData.get("amount") ?? ""));
  const note = String(formData.get("note") ?? "").slice(0, 140);

  if (!cents) return { error: "Enter a valid amount." };
  if (email === me.email.toLowerCase())
    return { error: "You can't request money from yourself." };

  const recipient = await prisma.user.findUnique({ where: { email } });
  if (!recipient || recipient.role === "EMPLOYEE" || recipient.role === "ADMIN")
    return { error: "No customer found with that email." };

  await prisma.moneyRequest.create({
    data: {
      reference: newRef("REQ"),
      requesterId: session.userId,
      recipientId: recipient.id,
      amountCents: cents,
      note,
    },
  });
  return { success: `Requested from ${recipient.name}. They'll see it on their dashboard.` };
}

export async function respondRequestAction(
  requestId: string,
  decision: "PAY" | "DECLINE",
): Promise<ActionState> {
  const session = await requireCustomer();

  const request = await prisma.moneyRequest.findUnique({ where: { id: requestId } });
  if (!request || request.recipientId !== session.userId) return { error: "Request not found." };
  if (request.status !== "PENDING") return { error: "Request already handled." };

  if (decision === "DECLINE") {
    await prisma.moneyRequest.update({
      where: { id: requestId },
      data: { status: "DECLINED", resolvedAt: new Date() },
    });
    return { success: "Request declined." };
  }

  const [myChecking] = await prisma.account.findMany({
    where: { userId: session.userId, type: "CHECKING", status: "ACTIVE" },
    take: 1,
  });
  const [theirChecking] = await prisma.account.findMany({
    where: { userId: request.requesterId, type: "CHECKING" },
    take: 1,
  });
  if (!myChecking || !theirChecking) return { error: "No checking account available." };

  const result = await runTransfer({
    fromAccountId: myChecking.id,
    toAccountId: theirChecking.id,
    amountCents: request.amountCents,
    description: `Request ${request.reference}${request.note ? ` — ${request.note}` : ""}`,
    creditType: "PAYMENT",
  });
  if ("error" in result && result.error) return { error: result.error };

  await prisma.moneyRequest.update({
    where: { id: requestId },
    data: { status: "PAID", resolvedAt: new Date() },
  });
  return { success: "Request paid." };
}

/** Admin only: adjust an account balance with an audit trail transaction. */
export async function adjustBalanceAction(
  accountId: string,
  amount: string,
  reason: string,
): Promise<ActionState> {
  const session = await requireAdmin();
  const cents = parseDollarsToCents(amount);
  if (!cents) return { error: "Enter a valid amount." };
  const signed = amount.trim().startsWith("-") ? -cents : cents;
  if (!reason.trim()) return { error: "An adjustment reason is required." };

  try {
    await prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({ where: { id: accountId } });
      if (!account) throw new Error("Account not found.");
      const balance = account.balanceCents + signed;
      if (balance < 0) throw new Error("Resulting balance cannot be negative.");

      await tx.account.update({ where: { id: accountId }, data: { balanceCents: balance } });
      await tx.transaction.create({
        data: {
          reference: newRef("ADJ"),
          accountId,
          type: "ADJUSTMENT",
          amountCents: Math.abs(signed),
          description: `${signed > 0 ? "Credit" : "Debit"} by vault ops (admin ${session.userId.slice(-6).toUpperCase()}): ${reason.trim()}`,
          balanceAfterCents: balance,
        },
      });
    });
    return { success: "Balance adjusted." };
  } catch (e) {
    return serializeError(e);
  }
}
