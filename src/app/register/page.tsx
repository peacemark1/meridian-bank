import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Wordmark } from "@/components/wordmark";
import { RegisterForm } from "@/components/register-form";

export const metadata = { title: "Apply for an account" };

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy-950 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <Wordmark href={null} />
        <h1 className="mt-6 font-display text-2xl text-navy-900">Apply for an account</h1>
        <p className="mt-1 mb-6 text-sm text-navy-400">
          Personal checking and reserve savings, reviewed the same business day.
        </p>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-navy-400">
          Already a customer?{" "}
          <Link href="/login" className="font-semibold text-navy-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
