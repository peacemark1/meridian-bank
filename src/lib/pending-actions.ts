"use server";

import { postPendingNow, declinePending, advanceBusinessClock } from "@/lib/clock";
import { requireAdmin } from "@/lib/auth";

export async function postPendingNowAction(transactionId: string) {
  await requireAdmin();
  await postPendingNow(transactionId);
  await advanceBusinessClock();
}

export async function declinePendingAction(transactionId: string) {
  await requireAdmin();
  await declinePending(transactionId);
}
