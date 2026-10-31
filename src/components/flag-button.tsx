"use client";

import { useTransition } from "react";
import { flagTransactionAction } from "@/lib/admin-actions";
import { buttonClasses } from "@/components/ui";

export function FlagButton({
  transactionId,
  flagged,
}: {
  transactionId: string;
  flagged: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(async () => { await flagTransactionAction(transactionId, !flagged); })}
      disabled={pending}
      className={
        flagged
          ? buttonClasses("ghost") + " !px-3 !py-1 text-xs"
          : buttonClasses("danger") + " !px-3 !py-1 text-xs"
      }
    >
      {pending ? "…" : flagged ? "Clear flag" : "⚑ Flag"}
    </button>
  );
}
