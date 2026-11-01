import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Wordmark } from "@/components/wordmark";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/");

  return (
    <main className="flex min-h-screen flex-col bg-navy-950 md:flex-row">
      {/* Brand side */}
      <div className="flex flex-col justify-between bg-navy-900 p-10 md:w-[45%]">
        <Wordmark light href={null} />
        <div className="py-12">
          <h2 className="font-display text-3xl text-gold-300">
            “Safety and soundness, since 1892.”
          </h2>
          <p className="mt-3 text-sm text-navy-200">
            Online banking for Meridian private clients — review your balances,
            move funds, and manage your relationship in confidence.
          </p>
        </div>
        <p className="text-xs text-navy-400">
          Member FDIC. Deposits insured up to $250,000 per depositor, per ownership category.
        </p>
      </div>

      {/* Form side */}
      <div className="flex flex-1 flex-col justify-center bg-white p-10">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="font-display text-2xl text-navy-900">Sign in to Online Banking</h1>
          <p className="mt-1 mb-6 text-sm text-navy-400">
            Use your Meridian account credentials.
          </p>
          <LoginForm />
          <div className="mt-5 rounded-lg bg-navy-50 border border-navy-100 px-3 py-2.5 text-xs text-navy-500">
            🔐 We will never contact you asking for your password, PIN, or one-time code.
            Suspicious activity? Call (212) 555-0189. Member FDIC — deposits insured to $250,000.
          </div>
          <div className="mt-6 flex items-center justify-between text-sm">
            <Link href="/register" className="font-semibold text-navy-600 hover:underline">
              Open an account →
            </Link>
            <Link href="/" className="text-navy-400 hover:underline">
              ← Return to the homepage
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
