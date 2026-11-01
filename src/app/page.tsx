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
      <header className="border-b border-navy-800/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Wordmark light href={null} />
          <div className="flex items-center gap-6">
            <a
              href="#contact"
              className="hidden text-sm text-navy-200 transition-colors hover:text-white md:block"
            >
              Private Client Desk
            </a>
            <a
              href="/login"
              className="rounded-lg bg-gold-400 px-5 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-300"
            >
              Client Sign In
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 pt-16 pb-20">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-gold-300">
          Private Banking &amp; Wealth Reserve · Member FDIC
        </p>
        <h1 className="font-display text-5xl leading-tight text-white">
          Discretion is our
          <span className="block text-gold-300">oldest asset.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-navy-200">
          First National Meridian is a relationship bank for private clients —
          custodians of family wealth since 1892. One dedicated banker. One
          confidential relationship. The kind of attention no app-only
          institution can offer.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="/login"
            className="rounded-lg bg-gold-400 px-6 py-3 font-semibold text-navy-950 transition-colors hover:bg-gold-300"
          >
            Client Sign In
          </a>
          <a
            href="/register"
            className="rounded-lg border border-navy-400 px-6 py-3 font-semibold text-navy-100 transition-colors hover:bg-navy-800"
          >
            Apply for an Account
          </a>
        </div>

        {/* Relationship metrics */}
        <div className="mt-14 grid gap-x-10 gap-y-6 border-t border-navy-800/70 pt-8 sm:grid-cols-4">
          {[
            { n: "1892", l: "Chartered by Act of the New York Legislature" },
            { n: "$5.4B", l: "Assets under administration" },
            { n: "24,600", l: "Private client relationships under management" },
            { n: "1 : 60", l: "Relationship managers to clients — no call centers" },
          ].map((m) => (
            <div key={m.n}>
              <p className="font-display text-3xl text-gold-300">{m.n}</p>
              <p className="mt-1 text-xs leading-relaxed text-navy-300">{m.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Private services */}
      <section className="border-t border-navy-800 bg-navy-900">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-3xl text-white">
            Services reserved for our clients
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-navy-200">
            Every relationship is led by a named banker with signature authority —
            not a ticket queue. Your affairs are handled the way they were in 1892:
            quietly, personally, and on your terms.
          </p>
          <div className="mt-10 grid gap-x-12 gap-y-10 sm:grid-cols-2">
            {[
              {
                h: "Dedicated Relationship Managers",
                p: "A single banker — reachable by direct line — who knows your accounts, your signature, and your preferences. No scripts, no queues.",
              },
              {
                h: "Private Wealth & Reserve Savings",
                p: "Reserve accounts with preferred tiering on balances above $100,000, reviewed quarterly by our portfolio desk.",
              },
              {
                h: "Discreet Payments & Wires",
                p: "Same-day domestic wires, overnight batch payments, and standing instructions executed by our operations vault — each instruction confirmed directly to you.",
              },
              {
                h: "Trust & Estate Services",
                p: "Fiduciary administration, estate settlement, and generation-skipping planning, in partnership with counsel you appoint.",
              },
              {
                h: "Curated Lending",
                p: "Secured lines against securities, fine art, and private company equity. Underwriting committee decisions within three business days.",
              },
              {
                h: "Absolute Confidentiality",
                p: "Client information is shared inside the bank strictly on a need-to-know basis, with every access recorded and audited by our compliance desk.",
              },
            ].map((item) => (
              <div key={item.h} className="border-l-2 border-navy-700 pl-5">
                <h3 className="font-display text-xl text-gold-300">{item.h}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-200">{item.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security + branches */}
      <section className="border-t border-navy-800">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl text-white">Safety, in writing</h2>
            <ul className="mt-5 space-y-4 text-sm leading-relaxed text-navy-200">
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" aria-hidden />
                <span>
                  Deposits insured by the FDIC up to $250,000 per depositor, per
                  ownership category — the full faith and credit of the United States.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" aria-hidden />
                <span>
                  Every transfer, adjustment, and internal view is written to a
                  double-entry ledger with a unique reference, auditable to the cent.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" aria-hidden />
                <span>
                  Online banking sessions are signed and tamper-evident; privileged
                  staff actions require elevated credentials.
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-2xl text-white">Our offices</h2>
            <ul className="mt-5 space-y-4 text-sm leading-relaxed text-navy-200">
              {[
                { c: "New York — Head Office", a: "1 Meridian Row, Financial District" },
                { c: "Chicago", a: "208 North LaSalle Street, Suite 1900" },
                { c: "Dallas", a: "2900 Cedar Springs Road, Uptown Tower" },
              ].map((b) => (
                <li key={b.c}>
                  <p className="font-medium text-white">{b.c}</p>
                  <p className="mt-0.5 text-navy-300">{b.a}</p>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-navy-300">Office hours 8:30 – 5:00 ET · Private appointments available after hours.</p>
          </div>
        </div>
      </section>

      {/* Membership */}
      <section className="border-t border-navy-800 bg-navy-900">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-14 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl text-white">Membership is by application.</h2>
            <p className="mt-2 text-sm leading-relaxed text-navy-200">
              New relationships open with a personal checking account and a reserve
              savings account, subject to our standard minimum opening deposits and
              verification. Applications are reviewed the same business day.
            </p>
          </div>
          <a
            href="/register"
            className="shrink-0 rounded-lg bg-gold-400 px-6 py-3 font-semibold text-navy-950 transition-colors hover:bg-gold-300"
          >
            Apply for an Account
          </a>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="border-t border-navy-800">
        <div className="mx-auto max-w-6xl px-6 py-12 text-sm text-navy-200">
          <h2 className="font-display text-xl text-gold-300">Private Client Desk</h2>
          <p className="mt-3">
            Telephone <span className="text-white">(212) 555-0189</span> ·
            Secure messages through online banking are answered within one business day.
          </p>
        </div>
      </section>

      <footer className="border-t border-navy-800 py-8 text-xs text-navy-400">
        <div className="mx-auto max-w-6xl space-y-2 px-6 text-center">
          <p>
            First National Meridian Bank · Corporate Charter No. C-1892 · NMLS #410772 ·
            Routing (ABA) #021000089 · A New York state-chartered commercial bank
          </p>
          <p>
            Deposit products are offered only at our banking offices. Credit and
            lending products are subject to credit approval. Member FDIC · Equal
            Housing Lender
          </p>
          <p className="pt-2 font-medium tracking-wide text-navy-300">
            © {new Date().getFullYear()} First National Meridian Bank — all rights reserved
          </p>
        </div>
      </footer>
    </main>
  );
}
