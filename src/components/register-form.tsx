"use client";

import { useActionState } from "react";
import { registerAction, type AuthState } from "@/app/auth-actions";
import { buttonClasses } from "@/components/ui";

const initial: AuthState = {};

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initial);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-navy-800">
          Full name
        </label>
        <input
          id="name"
          name="name"
          required
          className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
          placeholder="Margaret Ellsworth"
        />
      </div>
      <div>
        <label htmlFor="remail" className="mb-1 block text-sm font-medium text-navy-800">
          Email address
        </label>
        <input
          id="remail"
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="rpassword" className="mb-1 block text-sm font-medium text-navy-800">
          Password <span className="text-navy-400">(min 8 characters)</span>
        </label>
        <input
          id="rpassword"
          name="password"
          type="password"
          minLength={8}
          required
          className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
          placeholder="••••••••"
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button type="submit" disabled={pending} className={buttonClasses("primary") + " w-full"}>
        {pending ? "Submitting your application…" : "Submit application"}
      </button>
      <p className="text-center text-xs text-navy-400">
        By submitting you agree to the Deposit Account Agreement and the bank's
        Funds Availability Policy. Your relationship banker will confirm activation.
      </p>
    </form>
  );
}
