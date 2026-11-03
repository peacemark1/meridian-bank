import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { centsToDollars, formatAccountNumber } from "@/lib/money";
import { Card, CardHeader, Badge, EmptyState, PageHeader, LinkButton } from "@/components/ui";
import { AccountControls } from "@/components/account-controls";
import Link from "next/link";

export const metadata = { title: "Customers & accounts" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();

  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        }
      : {},
    include: { accounts: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Customers & accounts"
        description="Search the book of business, open accounts, review ledgers, adjust balances."
      >
        <LinkButton href="/admin/new-customer" variant="gold">
          + New account opening
        </LinkButton>
      </PageHeader>

      <form action="/admin/users" className="mb-5 flex max-w-md gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name or email…"
          className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm outline-none focus:border-navy-500"
        />
        <button type="submit" className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700">
          Search
        </button>
      </form>

      <div className="space-y-4">
        {users.length === 0 && <EmptyState message={`No matches for “${query}”.`} />}
        {users.map((u) => (
          <Card key={u.id}>
            <CardHeader
              title={u.name}
              subtitle={`${u.email} · ${u.role.toLowerCase()} · joined ${new Date(u.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`}
              action={u.role !== "CUSTOMER" ? <Badge tone="navy">{u.role}</Badge> : undefined}
            />
            <div className="divide-y divide-navy-100">
              {u.accounts.map((a) => (
                <div key={a.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <Link
                        href={`/admin/accounts/${a.id}`}
                        className="font-medium text-navy-900 hover:text-navy-500 hover:underline"
                      >
                        {a.type === "CHECKING" ? "Checking" : "Savings"}{" "}
                        <span className="font-mono text-xs text-navy-400">
                          {formatAccountNumber(a.accountNumber)}
                        </span>
                      </Link>
                      <p className="mt-0.5 text-sm text-navy-500">
                        {centsToDollars(a.balanceCents, u.currency)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={a.status === "ACTIVE" ? "green" : "red"}>
                        {a.status}
                      </Badge>
                      <Badge tone="neutral">
                        {a.type === "CHECKING" ? "Checking" : "Savings"}
                      </Badge>
                    </div>
                  </div>
                  <AccountControls accountId={a.id} status={a.status} />
                </div>
              ))}
              {u.accounts.length === 0 && (
                <p className="px-5 py-4 text-sm text-navy-400">No accounts.</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
