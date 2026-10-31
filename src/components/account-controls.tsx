"use client";

import { useState, useTransition } from "react";
import { adjustBalanceAction, type ActionState } from "@/lib/bank";
import { setAccountStatusAction } from "@/lib/admin-actions";
import { buttonClasses } from "@/components/ui";

const initial: ActionState = {};

export function AccountControls({
  accountId,
  status,
}: {
  accountId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const [adjusting, setAdjusting] = useState(false);
  const [msg, setMsg] = useState<ActionState>({});
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  function adjust(sign: "credit" | "debit") {
    const raw = amount.trim();
    if (!raw) return;
    const value = sign === "debit" && !raw.startsWith("-") ? `-${raw}` : raw;
    startTransition(async () => {
      const result = await adjustBalanceAction(accountId, value, reason || "Vault adjustment");
      setMsg(result);
      if (result.success) {
        setAmount("");
        setReason("");
        setAdjusting(false);
      }
    });
  }

  function toggleFreeze() {
    startTransition(async () => {
      const result = await setAccountStatusAction(
        accountId,
        status === "FROZEN" ? "ACTIVE" : "FROZEN",
      );
      setMsg(result);
    });
  }

  return (
    <div className="mt-3 border-t border-navy-100 pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={toggleFreeze} disabled={pending} className={buttonClasses(status === "FROZEN" ? "gold" : "danger") + " !px-3 !py-1.5 text-xs"}>
          {status === "FROZEN" ? "Unfreeze account" : "Freeze account"}
        </button>
        <button
          onClick={() => setAdjusting((v) => !v)}
          className={buttonClasses("ghost") + " !px-3 !py-1.5 text-xs"}
        >
          {adjusting ? "Cancel adjustment" : "Adjust balance"}
        </button>
      </div>

      {adjusting && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="Amount (e.g. 500 or -500)"
            className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm outline-none focus:border-navy-500"
          />
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (required)"
            className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm outline-none focus:border-navy-500"
          />
          <div className="col-span-2 flex gap-2">
            <button onClick={() => adjust("credit")} disabled={pending} className={buttonClasses("primary") + " !px-3 !py-1.5 text-xs"}>
              Apply credit
            </button>
            <button onClick={() => adjust("debit")} disabled={pending} className={buttonClasses("danger") + " !px-3 !py-1.5 text-xs"}>
              Apply debit
            </button>
          </div>
        </div>
      )}

      {msg.error && <p className="mt-2 text-xs text-red-600">{msg.error}</p>}
      {msg.success && <p className="mt-2 text-xs text-emerald-600">{msg.success}</p>}
    </div>
  );
}
