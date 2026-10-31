import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const COOKIE = "meridian_session";
const SECRET = process.env.AUTH_SECRET ?? "meridian-demo-secret-do-not-use";
const MAX_AGE = 60 * 60 * 24 * 7; // one week

export type Role = "CUSTOMER" | "EMPLOYEE" | "ADMIN";

export interface SessionPayload {
  userId: string;
  role: Role;
  exp: number; // unix seconds
}

function sign(data: string) {
  return createHmac("sha256", SECRET).update(data).digest("base64url");
}

export function createToken(userId: string, role: Role) {
  const payload: SessionPayload = {
    userId,
    role,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string, role: Role) {
  const jar = await cookies();
  jar.set(COOKIE, createToken(userId, role), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  return verifyToken(jar.get(COOKIE)?.value);
}

/** Redirects to /login when there's no session. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireCustomer() {
  const session = await requireUser();
  if (session.role !== "CUSTOMER" && session.role !== "ADMIN") redirect("/login");
  return session;
}

export async function requireStaff() {
  const session = await requireUser();
  if (session.role !== "ADMIN" && session.role !== "EMPLOYEE") redirect("/dashboard");
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (session.role !== "ADMIN") redirect("/dashboard");
  return session;
}

export async function getSessionUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.userId } });
}

export function newId() {
  return randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
}

export function newRef(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}
