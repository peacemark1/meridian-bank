"use client";

import { useActionState, useTransition } from "react";
import { createRecurringAction, toggleRecurringAction, deleteRecurringAction, type RecurringState } from "@/lib/recurring-actions";
import { currencySymbol } from "@/lib/money";
import { buttonClasses } from "@/components/ui";

const initial: RecurringState = {};

export function NewRecurringForm({
  accounts,
  currency = "USD",
}: {
  accounts: { id: string; label: string }[];
  currency?: string;
}) {
  const [state, action, pending] = useActionState<RecurringState, FormData>(
    (prev, fd) => createRecurringAction(prev, fd),
    initial,
  );

  return (
    <form action={action} className="space-y-4 px-5 py-5">
      <div>
        <label htmlFor="rfrom" className="mb-1 block text-sm font-medium text-navy-800">
          Pay from
        </label>
        <select
          id="rfrom"
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
        <label htmlFor="rto" className="mb-1 block text-sm font-medium text-navy-800">
          To account number
        </label>
        <input
          id="rto"
          name="toAccountNumber"
          required
          inputMode="numeric"
          className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-navy-500"
          placeholder="4400 4052 1271"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <label htmlFor="ramount" className="mb-1 block text-sm font-medium text-navy-800">
            Each run
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-2.5 text-sm text-navy-400">{currencySymbol(currency)}</span>
            <input
              id="ramount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              className="w-full rounded-lg border border-navy-200 bg-white py-2 pl-7 pr-3 text-sm outline-none focus:border-navy-500"
              placeholder="120.00"
            />
          </div>
        </div>
        <div>
          <label htmlFor="rcadence" className="mb-1 block text-sm font-medium text-navy-800">
            Schedule
          </label>
          <select
            id="rcadence"
            name="cadence"
            className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm outline-none focus:border-navy-500"
          >
            <option value="MONTHLY">Monthly</option>
            <option value="BIWEEKLY">Every 2 weeks</option>
            <option value="WEEKLY">Weekly</option>
          </select>
        </div>
        <div>
          <label htmlFor="rlabel" className="mb-1 block text-sm font-medium text-navy-800">
            Label
          </label>
          <input
            id="rlabel"
            name="label"
            maxLength={60}
            className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm outline-none focus:border-navy-500"
            placeholder="Rent"
          />
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state.success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.success}</p>
      )}
      <button type="submit" disabled={pending} className={buttonClasses("primary")}>
        {pending ? "Scheduling…" : "Schedule standing instruction"}
      </button>
    </form>
  );
}

export function RecurringControls({ id, active }: { id: string; active: boolean }) {
  const [pending, startTransition] = useTransition();

  function toggle(next: boolean) {
    startTransition(async () => {
      await toggleRecurringAction(id, next);
    });
  }
  function remove() {
    if (!window.confirm("Cancel this standing instruction permanently?")) return;
    startTransition(async () => {
      await deleteRecurringAction(id);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => toggle(!active)}
        disabled={pending}
        className={buttonClasses("ghost") + " !px-3 !py-1 text-xs"}
      >
        {active ? "Pause" : "Resume"}
      </button>
      <button
        onClick={remove}
        disabled={pending}
        className={buttonClasses("danger") + " !px-3 !py-1 text-xs"}
      >
        Cancel instruction
      </button>
    </div>
  );
}
