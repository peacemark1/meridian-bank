"use client";

import { useActionState } from "react";
import { createCustomerAction, type CreateCustomerState } from "@/lib/admin-create";
import { buttonClasses, Card, CardHeader } from "@/components/ui";
import { formatAccountNumber } from "@/lib/money";

const initial: CreateCustomerState = {};

export function NewCustomerForm() {
  const [state, action, pending] = useActionState(createCustomerAction, initial);

  if (state.created) {
    const c = state.created;
    return (
      <Card>
        <CardHeader
          title="Accounts opened ✓"
          subtitle={`Welcome kit for ${c.name}`}
        />
        <div className="space-y-4 px-5 py-5">
          <div className="rounded-lg border border-gold-300 bg-gold-100/60 px-4 py-3 text-sm text-gold-600">
            <strong>One-time temporary sign-in</strong> — copy it now; it is shown only once.
            <br />
            Email <code className="font-mono">{c.email}</code> · Temporary password{" "}
            <code className="font-mono font-bold">{c.tempPassword}</code>
            <br />
            <span className="text-xs">
              (Customer is prompted to change it at first sign-in in a full deployment.)
            </span>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wider text-navy-400">
                <th className="py-2 font-semibold">Product</th>
                <th className="py-2 font-semibold">Account number</th>
                <th className="py-2 text-right font-semibold">Opening deposit</th>
              </tr>
            </thead>
            <tbody>
              {c.accounts.map((a) => (
                <tr key={a.id}>
                  <td className="py-2 font-medium text-navy-900">
                    {a.type === "CHECKING" ? "Meridian Everyday Checking" : "Silverleaf Savings"}
                  </td>
                  <td className="py-2 font-mono">{formatAccountNumber(a.accountNumber)}</td>
                  <td className="py-2 text-right">
                    {((a.balanceCents / 100).toFixed(2))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-xs text-navy-400">
            Routing/ABA 021000089 · Wire instructions are issued per-account on request.
            The customer also received a welcome letter under Secure Messages.
          </p>

          <form action="/admin/new-customer">
            <button type="submit" className={buttonClasses("primary")}>
              Open another account
            </button>
          </form>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="New account opening (form NMB-2)"
        subtitle="Branch-generated accounts are effective immediately"
      />
      <form action={action} className="space-y-4 px-5 py-5">
        <fieldset className="space-y-3">
          <legend className="mb-1 text-xs font-bold uppercase tracking-wider text-navy-400">
            Customer
          </legend>
          <input
            name="name"
            required
            placeholder="Full legal name (e.g. Eleanor M. Vanderbilt)"
            className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm outline-none focus:border-navy-500"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="email"
              type="email"
              required
              placeholder="Email address"
              className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm outline-none focus:border-navy-500"
            />
            <input
              name="phone"
              placeholder="Daytime phone (optional)"
              className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm outline-none focus:border-navy-500"
            />
          </div>
          <input
            name="city"
            placeholder="Home city, ST (e.g. Larchmont, NY)"
            className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm outline-none focus:border-navy-500"
          />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="mb-1 text-xs font-bold uppercase tracking-wider text-navy-400">
            Products & opening deposits
          </legend>
          <label className="flex items-center gap-3 rounded-lg border border-navy-200 px-3 py-2.5">
            <input type="checkbox" name="openChecking" defaultChecked className="accent-navy-900" />
            <span className="flex-1 text-sm text-navy-900">
              Meridian Everyday Checking
              <span className="block text-xs text-navy-400">
                Fee-free debit · Zelle-style payments · overdraft grace to $50 · APY 0.01%
              </span>
            </span>
            <span className="text-right text-xs text-navy-500">
              minimum
              <br />
              <strong>$25.00</strong>
            </span>
            <input
              name="checkingDeposit"
              type="number"
              step="0.01"
              placeholder="Initial deposit $"
              className="w-32 rounded-md border border-navy-200 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-navy-200 px-3 py-2.5">
            <input type="checkbox" name="openSavings" className="accent-navy-900" />
            <span className="flex-1 text-sm text-navy-900">
              Meridian Silverleaf Savings
              <span className="block text-xs text-navy-400">
                Tiered APY 3.75%→4.10% · 6 free withdrawals/cycle
              </span>
            </span>
            <span className="text-right text-xs text-navy-500">
              minimum
              <br />
              <strong>$100.00</strong>
            </span>
            <input
              name="savingsDeposit"
              type="number"
              step="0.01"
              placeholder="Initial deposit $"
              className="w-32 rounded-md border border-navy-200 px-2 py-1.5 text-sm"
            />
          </label>
        </fieldset>

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}

        <button type="submit" disabled={pending} className={buttonClasses("gold")}>
          {pending ? "Opening accounts…" : "Open accounts & issue credentials"}
        </button>
        <p className="text-xs text-navy-400">
          By submitting, the branch attests the signature card and CIP exceptions are in the
          customer file. Form NMB-2 rev. 2024-07.
        </p>
      </form>
    </Card>
  );
}
