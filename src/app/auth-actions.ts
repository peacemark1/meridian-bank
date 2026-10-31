"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth";

export interface AuthState {
  error?: string;
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Enter your email and password." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return { error: "Incorrect email or password." };

  await setSessionCookie(user.id, user.role as "CUSTOMER" | "EMPLOYEE" | "ADMIN");
  redirect(user.role === "CUSTOMER" ? "/dashboard" : user.role === "EMPLOYEE" ? "/employee" : "/admin");
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (name.length < 2) return { error: "Enter your full name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "CUSTOMER",
      accounts: {
        create: [
          { type: "CHECKING", accountNumber: await nextAccountNumber("4") },
          { type: "SAVINGS", accountNumber: await nextAccountNumber("9") },
        ],
      },
    },
  });

  await setSessionCookie(user.id, "CUSTOMER");
  redirect("/dashboard");
}

/** Sequential-ish unique account numbers, prefixed by product line. */
async function nextAccountNumber(prefix: string) {
  const count = await prisma.account.count();
  return `${prefix}400${String(1290000 + count * 7 + Math.floor(Math.random() * 7)).padStart(10, "0")}`;
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
