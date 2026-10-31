import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Wordmark } from "@/components/wordmark";

export default async function LandingPage() {
  const session = await getSession();
  if (session)
    redirect(
      session.role === "CUSTOMER"
        ? "/dashboard"
        : session.role === "EMPLOYEE"
          ? "/employee"
          : "/admin",
    );

  return (
    <main className="min-h-screen bg-navy-950 text-white">
      {/* Top bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Wordmark light href={null} />
        <a
          href="/login"
          className="rounded-lg bg-gold-400 px-5 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-300"
        >
          Sign in
        </a>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-14 pb-20">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-gold-300">
          Member FDIC · Equal Housing Lender
        </p>
        <h1 className="font-display text-5xl leading-tight text-white">
          Banking on a Solid Foundation
          <span className="block text-gold-300">since 1892.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-navy-200">
          For over a century, First National Meridian Bank has served families and businesses
          across three states — with the same promise we started with: your money, kept safe,
          and treated with respect.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="/login"
            className="rounded-lg bg-gold-400 px-6 py-3 font-semibold text-navy-950 transition-colors hover:bg-gold-300"
          >
            Sign in to Online Banking
          </a>
          <a
            href="/register"
            className="rounded-lg border border-navy-400 px-6 py-3 font-semibold text-navy-100 transition-colors hover:bg-navy-800"
          >
            Open an account
          </a>
        </div>

        {/* Credential card */}
        <div className="mt-12 rounded-xl border border-navy-700 bg-navy-900/70 p-6 text-sm">
          <p className="mb-3 font-semibold uppercase tracking-wider text-gold-300">
            Demo accounts — this is a prototype environment
          </p>
          <div className="grid gap-x-10 gap-y-2 text-navy-100 sm:grid-cols-3">
            <p>
              <span className="block text-navy-400">Customer</span>
              <code className="text-gold-200">margaret@meridian.demo</code>
              <span className="mx-1">·</span>Password <code className="text-gold-200">demo1234</code>
            </p>
            <p>
              <span className="block text-navy-400">Employee</span>
              <code className="text-gold-200">tina@meridian.demo</code>
              <span className="mx-1">·</span>Password <code className="text-gold-200">demo1234</code>
            </p>
            <p>
              <span className="block text-navy-400">Admin (vault ops)</span>
              <code className="text-gold-200">admin@meridian.demo</code>
              <span className="mx-1">·</span>Password <code className="text-gold-200">demo1234</code>
            </p>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-t border-navy-800 bg-navy-900">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 sm:grid-cols-3">
          {[
            { h: "FDIC Insured", p: "Deposits insured up to $250,000 per depositor — the full faith and credit of the United States government." },
            { h: "131 Years of Service", p: "Chartered in 1892. We have never missed a dividend and never will." },
            { h: "Real Branches, Real People", p: "Walk into any Meridian branch in New York, Chicago, or Dallas and speak to a banker, not a kiosk." },
          ].map((item) => (
            <div key={item.h}>
              <h3 className="font-display text-xl text-gold-300">{item.h}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-200">{item.p}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-navy-800 py-8 text-center text-xs text-navy-400">
        <p className="mb-2">
          First National Meridian Bank · NMLS #410772 · Routing #021000089 · A New York
          state-chartered commercial bank
        </p>
        <p>
          © {new Date().getFullYear()} First National Meridian Bank · Member FDIC · Equal Housing
          Lender · This is a fictional demo bank; no real money is involved.
        </p>
      </footer>
    </main>
  );
}
