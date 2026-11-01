"use server";

import { prisma } from "@/lib/prisma";
import { requireCustomer, getSessionUser, newRef } from "@/lib/auth";
import { parseDollarsToCents } from "@/lib/money";

export interface RecurringState {
  error?: string;
  success?: string;
}

export async function createRecurringAction(
  _prev: RecurringState,
  formData: FormData,
): Promise<RecurringState> {
  const session = await requireCustomer();
  const user = await getSessionUser();
  if (!user) return { error: "Please sign in." };

  const fromAccountId = String(formData.get("fromAccountId") ?? "");
  const toAccountNumber = String(formData.get("toAccountNumber") ?? "").replace(/\s+/g, "");
  const cadenceRaw = String(formData.get("cadence") ?? "MONTHLY");
  const label = String(formData.get("label") ?? "").trim().slice(0, 60);
  const cents = parseDollarsToCents(String(formData.get("amount") ?? ""));

  if (!cents) return { error: "Enter a valid amount." };
  if (!["WEEKLY", "BIWEEKLY", "MONTHLY"].includes(cadenceRaw))
    return { error: "Choose a schedule." };

  const from = await prisma.account.findUnique({ where: { id: fromAccountId } });
  if (!from || from.userId !== session.userId)
    return { error: "Select one of your accounts." };

  const to = await prisma.account.findUnique({ where: { accountNumber: toAccountNumber } });
  if (!to) return { error: `No account found “${toAccountNumber}”.` };

  const cadenceLabel = cadenceRaw === "WEEKLY" ? "every week" : cadenceRaw === "BIWEEKLY" ? "every 2 weeks" : "every month";

  await prisma.recurring.create({
    data: {
      reference: newRef("SCH"),
      accountId: from.id,
      toAccountNumber: to.accountNumber,
      amountCents: cents,
      cadence: cadenceRaw,
      label: label || `Recurring payment ${cadenceLabel}`,
      nextRunAt: new Date(Date.now() + 60_000),
    },
  });

  return {
    success: `Scheduled ${label || "transfer"} — runs ${cadenceLabel}. Your first transfer is queued for the next processing window.`,
  };
}

export async function toggleRecurringAction(
  id: string,
  active: boolean,
): Promise<{ error?: string; success?: string }> {
  const session = await requireCustomer();
  const r = await prisma.recurring.findUnique({ where: { id }, include: { account: true } });
  if (!r || r.account.userId !== session.userId) return { error: "Not found." };
  await prisma.recurring.update({ where: { id }, data: { active } });
  return { success: active ? "Instruction resumed." : "Instruction paused." };
}

export async function deleteRecurringAction(
  id: string,
): Promise<{ error?: string; success?: string }> {
  const session = await requireCustomer();
  const r = await prisma.recurring.findUnique({ where: { id }, include: { account: true } });
  if (!r || r.account.userId !== session.userId) return { error: "Not found." };
  await prisma.recurring.delete({ where: { id } });
  return { success: "Instruction cancelled." };
}
