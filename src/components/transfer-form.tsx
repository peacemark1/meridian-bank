"use client";

import { useState, useActionState } from "react";
import { transferAction, type ActionState } from "@/lib/bank";
import { currencySymbol } from "@/lib/money";
import { buttonClasses } from "@/components/ui";
import { cn } from "@/lib/cn";

interface AccountOption {
  id: string;
  label: string;
}

const initial: ActionState = {};

export function TransferForm({
  accounts,
  contacts,
  currency = "USD",
}: {
  accounts: AccountOption[];
  contacts: { accountNumber: string; label: string }[];
  currency?: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    (prev, formData) => transferAction(formData),
    initial,
  );
  const [kind, setKind] = useState<"own" | "external">("own");

  return (
    <form action={action} className="space-y-4 px-5 py-5">
      {/* mode tabs */}
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-navy-100 p-1">
        {(["own", "external"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
              kind === k ? "bg-white text-navy-900 shadow-sm" : "text-navy-500 hover:text-navy-800",
            )}
          >
            {k === "own" ? "Between my accounts" : "Pay another customer"}
          </button>
        ))}
      </div>
      <input type="hidden" name="kind" value={kind} />

      <div>
        <label htmlFor="fromAccountId" className="mb-1 block text-sm font-medium text-navy-800">
          From account
        </label>
        <select
          id="fromAccountId"
          name="fromAccountId"
          required
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
        <label htmlFor="toAccountNumber" className="mb-1 block text-sm font-medium text-navy-800">
          {kind === "own" ? "To account" : "Recipient account number"}
        </label>
        {kind === "own" ? (
          <select
            id="toAccountNumber"
            name="toAccountNumber"
            required
            className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm outline-none focus:border-navy-500"
          >
            {contacts.map((c) => (
              <option key={c.accountNumber} value={c.accountNumber}>
                {c.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id="toAccountNumber"
            name="toAccountNumber"
            required
            inputMode="numeric"
            className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-navy-500"
            placeholder="4400 0129 0000"
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="t-amount" className="mb-1 block text-sm font-medium text-navy-800">
            Amount ({currency})
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-2.5 text-sm text-navy-400">
              {currencySymbol(currency)}
            </span>
            <input
              id="t-amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              className="w-full rounded-lg border border-navy-200 bg-white py-2 pl-7 pr-3 text-sm outline-none focus:border-navy-500"
              placeholder="100.00"
            />
          </div>
        </div>
        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-navy-800">
            Memo <span className="text-navy-400">(optional)</span>
          </label>
          <input
            id="description"
            name="description"
            maxLength={140}
            className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm outline-none focus:border-navy-500"
            placeholder="Rent — October"
          />
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state.success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
      )}

      <button type="submit" disabled={pending} className={buttonClasses("gold")}>
        {pending ? "Sending…" : kind === "own" ? "Transfer now" : "Send payment"}
      </button>
    </form>
  );
}
