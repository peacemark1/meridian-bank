"use client";

import { useState, useTransition } from "react";
import { depositAction, withdrawAction } from "@/lib/bank";
import { buttonClasses } from "@/components/ui";
import { currencySymbol } from "@/lib/money";
import type { ActionState } from "@/lib/bank";

interface AccountOption {
  id: string;
  label: string;
}

export function DepositWithdrawForm({
  accounts,
  mode,
  currency = "USD",
}: {
  accounts: AccountOption[];
  mode: "deposit" | "withdraw";
  currency?: string;
}) {
  const [state, setState] = useState<ActionState>({});
  const [pending, startTransition] = useTransition();
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");

  function submit(formData: FormData) {
    const amount = String(formData.get("amount") ?? "");
    const description = String(formData.get("description") ?? "");
    startTransition(async () => {
      const result =
        mode === "deposit"
          ? await depositAction(accountId, amount, description)
          : await withdrawAction(accountId, amount);
      setState(result);
      const form = document.getElementById("dw-form") as HTMLFormElement | null;
      if (result.success) form?.reset();
    });
  }

  return (
    <form id="dw-form" action={submit} className="space-y-4 px-5 py-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-navy-800">Account</label>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm outline-none focus:border-navy-500"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="amount" className="mb-1 block text-sm font-medium text-navy-800">
          Amount ({currency})
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-2.5 text-sm text-navy-400">
            {currencySymbol(currency)}
          </span>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            className="w-full rounded-lg border border-navy-200 bg-white py-2 pl-7 pr-3 text-sm outline-none focus:border-navy-500"
            placeholder="250.00"
          />
        </div>
      </div>
      {mode === "deposit" && (
        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-navy-800">
            Note <span className="text-navy-400">(optional)</span>
          </label>
          <input
            id="description"
            name="description"
            className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm outline-none focus:border-navy-500"
            placeholder="Payroll check #1042"
          />
        </div>
      )}

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state.success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
      )}

      <button type="submit" disabled={pending} className={buttonClasses(mode === "deposit" ? "gold" : "primary")}>
        {pending ? "Processing…" : mode === "deposit" ? "Make deposit" : "Withdraw cash"}
      </button>
    </form>
  );
}
