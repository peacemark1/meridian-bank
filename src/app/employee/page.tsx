import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { centsToDollars, formatAccountNumber } from "@/lib/money";
import { Card, CardHeader, Badge, EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "Customer directory" };

export default async function EmployeePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireStaff();
  const { q } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();

  const users = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      ...(query ? { OR: [{ name: { contains: query } }, { email: { contains: query } }] } : {}),
    },
    include: {
      accounts: { select: { id: true, type: true, accountNumber: true, balanceCents: true, status: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Customer directory"
        description="Read-only view of customer accounts — you can flag transactions for compliance."
      />

      <form action="/employee" className="mb-5 flex max-w-md gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search customers…"
          className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm outline-none focus:border-navy-500"
        />
        <button type="submit" className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700">
          Search
        </button>
      </form>

      <div className="space-y-4">
        {users.length === 0 && <EmptyState message={`No customers match “${query}”.`} />}
        {users.map((u) => (
          <Card key={u.id}>
            <CardHeader title={u.name} subtitle={u.email} />
            <div className="grid gap-px bg-navy-50 sm:grid-cols-2">
              {u.accounts.map((a) => (
                <div key={a.id} className="bg-white px-5 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-navy-900">
                      {a.type === "CHECKING" ? "Checking" : "Savings"}
                    </p>
                    <Badge tone={a.status === "ACTIVE" ? "green" : "red"}>{a.status}</Badge>
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-navy-400">
                    {formatAccountNumber(a.accountNumber)}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-navy-900">
                    {centsToDollars(a.balanceCents)}
                  </p>
                </div>
              ))}
              {u.accounts.length === 0 && (
                <p className="bg-white px-5 py-4 text-sm text-navy-400">No accounts.</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
