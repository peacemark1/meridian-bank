import { prisma } from "@/lib/prisma";
import { newRef } from "@/lib/auth";

/**
 * The simulated business clock. Call `advanceBusinessClock()` when servers
 * render a portal page (or hit /api/bank/clock from a real cron job):
 *  - settles PENDING transactions whose postAt has passed
 *  - runs active Recurring instructions whose nextRunAt has passed
 * In production these would be a nightly batch; in the demo they run on load.
 */

const CADENCE_MS: Record<string, number> = {
  WEEKLY: 7 * 86_400_000,
  BIWEEKLY: 14 * 86_400_000,
  MONTHLY: 30 * 86_400_000,
};

export interface ClockResult {
  settled: number;
  declined: number;
  recurringsRun: number;
}

/** Runs one outbound instruction instantly (used by the recurring batch). */
async function executeTransferInstant(opts: {
  fromAccountId: string;
  toAccountId: string;
  amountCents: number;
  description: string;
  creditType: "TRANSFER" | "PAYMENT";
}): Promise<{ ok: true; reference: string } | { ok: false; reason: string }> {
  const { fromAccountId, toAccountId, amountCents, description, creditType } = opts;
  return prisma.$transaction(async (tx) => {
    const from = await tx.account.findUnique({ where: { id: fromAccountId } });
    const to = await tx.account.findUnique({ where: { id: toAccountId } });
    if (!from || !to) return { ok: false as const, reason: "account not found" };
    if (from.status === "FROZEN") return { ok: false as const, reason: "source account frozen" };
    if (to.status === "FROZEN") return { ok: false as const, reason: "destination account frozen" };
    if (from.balanceCents < amountCents) return { ok: false as const, reason: "insufficient funds" };

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
    return { ok: true as const, reference: outRef };
  });
}

export async function advanceBusinessClock(): Promise<ClockResult> {
  let settled = 0;
  let declined = 0;
  let recurringsRun = 0;

  // 1 — settle pending outgoing transactions that have reached their post time
  const due = await prisma.transaction.findMany({
    where: { status: "PENDING", postAt: { lte: new Date() } },
    include: { account: true, counterparty: true },
    orderBy: { createdAt: "asc" },
  });

  for (const pending of due) {
    await prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({ where: { id: pending.accountId } });
      if (!account) return;

      if (account.balanceCents < pending.amountCents) {
        await tx.transaction.update({
          where: { id: pending.id },
          data: {
            status: "DECLINED",
            settledAt: new Date(),
            description: `${pending.description} — declined: insufficient funds at posting`,
          },
        });
        declined += 1;
        return;
      }

      const balance = account.balanceCents - pending.amountCents;
      await tx.account.update({ where: { id: account.id }, data: { balanceCents: balance } });
      await tx.transaction.update({
        where: { id: pending.id },
        data: { status: "COMPLETED", balanceAfterCents: balance, settledAt: new Date() },
      });

      const to = pending.counterparty;
      if (to) {
        const fresh = await tx.account.findUnique({ where: { id: to.id } });
        if (fresh && fresh.status === "ACTIVE") {
          const toBalance = fresh.balanceCents + pending.amountCents;
          await tx.account.update({ where: { id: fresh.id }, data: { balanceCents: toBalance } });
          await tx.transaction.create({
            data: {
              reference: `${pending.reference}-IN`,
              accountId: fresh.id,
              type: pending.type === "PAYMENT_OUT" ? "PAYMENT_IN" : "TRANSFER_IN",
              amountCents: pending.amountCents,
              description: pending.description,
              balanceAfterCents: toBalance,
              counterpartyAccountId: account.id,
            },
          });
        }
      }
      settled += 1;
    });
  }

  // 2 — run due recurring instructions
  const dueRecurrings = await prisma.recurring.findMany({
    where: { active: true, nextRunAt: { lte: new Date() } },
    include: { account: true },
    orderBy: { nextRunAt: "asc" },
  });

  for (const r of dueRecurrings) {
    const target = await prisma.account.findUnique({
      where: { accountNumber: r.toAccountNumber },
    });
    let result: { ok: boolean; reason?: string; reference?: string } = {
      ok: false,
      reason: "target account not found",
    };
    if (target) {
      const res = await executeTransferInstant({
        fromAccountId: r.accountId,
        toAccountId: target.id,
        amountCents: r.amountCents,
        description: `${r.label || "Scheduled transfer"} (${r.reference})`,
        creditType: target.userId === r.account.userId ? "TRANSFER" : "PAYMENT",
      });
      result = res.ok
        ? { ok: true, reference: res.reference }
        : { ok: false, reason: res.reason };
    }

    const step = CADENCE_MS[r.cadence] ?? CADENCE_MS.MONTHLY;
    const next = new Date(r.nextRunAt.getTime() + step);

    await prisma.recurring.update({
      where: { id: r.id },
      data: {
        lastRunAt: new Date(),
        nextRunAt: next > new Date() ? next : new Date(Date.now() + step),
        lastError: result.ok ? null : result.reason ?? "failed",
      },
    });
    if (result.ok) recurringsRun += 1;
  }

  return { settled, declined, recurringsRun };
}

/** Post a single pending transaction immediately (admin action). */
export async function postPendingNow(transactionId: string): Promise<void> {
  await prisma.transaction.update({
    where: { id: transactionId },
    data: { postAt: new Date(Date.now() - 60_000) },
  });
}

export async function declinePending(transactionId: string): Promise<void> {
  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      status: "DECLINED",
      settledAt: new Date(),
      description: "declined by vault operations before posting",
    },
  });
}
