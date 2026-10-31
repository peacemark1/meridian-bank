"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, requireStaff } from "@/lib/auth";
import type { ActionState } from "@/lib/bank";

export async function setAccountStatusAction(
  accountId: string,
  status: "ACTIVE" | "FROZEN",
): Promise<ActionState> {
  await requireAdmin();
  await prisma.account.update({ where: { id: accountId }, data: { status } });
  return { success: status === "ACTIVE" ? "Account unfrozen." : "Account frozen." };
}

/** Staff (employee or admin): flag or clear a transaction. */
export async function flagTransactionAction(
  transactionId: string,
  flagged: boolean,
  note?: string,
): Promise<ActionState> {
  await requireStaff();
  await prisma.transaction.update({
    where: { id: transactionId },
    data: { isFlagged: flagged, flagNote: flagged ? (note || "Flagged by staff") : null },
  });
  return { success: flagged ? "Transaction flagged for review." : "Flag cleared." };
}
