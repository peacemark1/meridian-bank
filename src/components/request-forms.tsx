"use client";

import { useActionState, useTransition } from "react";
import { requestMoneyAction, respondRequestAction, type ActionState } from "@/lib/bank";
import { currencySymbol } from "@/lib/money";
import { buttonClasses } from "@/components/ui";

const initial: ActionState = {};

export function RequestForm({ currency = "USD" }: { currency?: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    (prev, formData) => requestMoneyAction(formData),
    initial,
  );

  return (
    <form action={action} className="space-y-4 px-5 py-5">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-navy-800">
          Request from (email)
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm outline-none focus:border-navy-500"
          placeholder="friend@example.com"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="rq-amount" className="mb-1 block text-sm font-medium text-navy-800">
            Amount ({currency})
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-2.5 text-sm text-navy-400">
              {currencySymbol(currency)}
            </span>
            <input
              id="rq-amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              className="w-full rounded-lg border border-navy-200 bg-white py-2 pl-7 pr-3 text-sm outline-none focus:border-navy-500"
              placeholder="35.00"
            />
          </div>
        </div>
        <div>
          <label htmlFor="note" className="mb-1 block text-sm font-medium text-navy-800">
            Note
          </label>
          <input
            id="note"
            name="note"
            maxLength={140}
            className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm outline-none focus:border-navy-500"
            placeholder="Concert tickets"
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

      <button type="submit" disabled={pending} className={buttonClasses("primary")}>
        {pending ? "Sending request…" : "Send request"}
      </button>
    </form>
  );
}

export function RespondButtons({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();

  function respond(decision: "PAY" | "DECLINE") {
    startTransition(async () => {
      await respondRequestAction(requestId, decision);
    });
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => respond("PAY")}
        disabled={pending}
        className={buttonClasses("gold") + " !px-3 !py-1.5 text-xs"}
      >
        Pay now
      </button>
      <button
        onClick={() => respond("DECLINE")}
        disabled={pending}
        className={buttonClasses("ghost") + " !px-3 !py-1.5 text-xs"}
      >
        Decline
      </button>
    </div>
  );
}
