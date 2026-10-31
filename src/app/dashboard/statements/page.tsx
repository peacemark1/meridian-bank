import Link from "next/link";
import { requireCustomer, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { centsToDollars, formatAccountNumber, txnTypeLabels } from "@/lib/money";
import { Card, CardHeader, Badge, EmptyState, PageHeader, buttonClasses } from "@/components/ui";

export const metadata = { title: "Statements" };

export default async function StatementsPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  const session = await requireCustomer();
  const user = await getSessionUser();
  const params = await searchParams;

  const accounts = await prisma.account.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "asc" },
  });

  const selectedId =
    params.account && accounts.some((a) => a.id === params.account)
      ? params.account
      : accounts[0]?.id;
  const selected = accounts.find((a) => a.id === selectedId);

  const rows = selected
    ? await prisma.transaction.findMany({
        where: { accountId: selected.id },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    : [];

  return (
    <>
      <PageHeader title="Account statements" description="Full transaction history, exportable as CSV.">
        {selected && (
          <Link
            href={`/api/statements/export?account=${selected.id}`}
            prefetch={false}
            className={buttonClasses("ghost") + " no-underline"}
          >
            ↓ Export CSV
          </Link>
        )}
      </PageHeader>

      {/* account picker */}
      <div className="mb-5 flex flex-wrap gap-2">
        {accounts.map((a) => (
          <Link
            key={a.id}
            href={`/dashboard/statements?account=${a.id}`}
            className={
              a.id === selectedId
                ? buttonClasses("primary")
                : buttonClasses("ghost")
            }
          >
            {a.type === "CHECKING" ? "Checking" : "Savings"} ····{a.accountNumber.slice(-4)}
          </Link>
        ))}
      </div>

      <Card>
        <div className="border-b-2 border-navy-900 px-5 pt-5 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-display text-xl text-navy-900">First National Meridian Bank</p>
              <p className="text-[10px] leading-relaxed text-navy-400">
                200 Meridian Plaza · New York, NY 10004 · (212) 555-0189
                <br />
                Member FDIC · Equal Housing Lender
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-navy-800">
                Account Statement
              </p>
              <p className="text-[11px] text-navy-400">
                Generated{" "}
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          {selected && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded border border-navy-200 bg-navy-50 px-3 py-2">
              <p className="font-mono text-xs tracking-wider text-navy-900">
                ⑆ {formatAccountNumber(selected.routingNumber)} ⑆ {formatAccountNumber(selected.accountNumber)} ⑆
              </p>
              <p className="text-[11px] text-navy-500">
                {user?.name} · {selected.type === "CHECKING" ? "Meridian Everyday Checking" : "Meridian Silverleaf Savings"}
                {selected.nickname && !selected.nickname.includes("Everyday") && !selected.nickname.includes("Silverleaf") ? ` · ${selected.nickname}` : ""}
              </p>
            </div>
          )}
        </div>
        <CardHeader
          title={selected ? `Meridian ${selected.type === "CHECKING" ? "Checking" : "Savings"}` : "Statement"}
          subtitle={selected ? `Current balance ${centsToDollars(selected.balanceCents)} · last 100 entries` : undefined}
          action={
            selected && (
              <Link
                href={`/api/statements/export?account=${selected.id}`}
                prefetch={false}
                className={buttonClasses("ghost")}
              >
                ↓ Export CSV
              </Link>
            )
          }
        />
        {rows.length === 0 ? (
          <EmptyState message="No transactions on this account yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wider text-navy-400">
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-3 py-3 font-semibold">Reference</th>
                  <th className="px-3 py-3 font-semibold">Description</th>
                  <th className="px-3 py-3 text-right font-semibold">Amount</th>
                  <th className="px-5 py-3 text-right font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {rows.map((t) => {
                  const incoming =
                    t.type === "DEPOSIT" || t.type === "TRANSFER_IN" || t.type === "PAYMENT_IN" ||
                    (t.type === "ADJUSTMENT" && t.description.startsWith("Credit"));
                  return (
                    <tr key={t.id} className="hover:bg-navy-50">
                      <td className="whitespace-nowrap px-5 py-3 text-navy-500">
                        {new Date(t.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-navy-400">
                        {t.reference}
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-navy-800">{txnTypeLabels[t.type] ?? t.type}</span>
                        {t.description && (
                          <span className="text-navy-400"> — {t.description}</span>
                        )}
                        {t.isFlagged && (
                          <span className="ml-2">
                            <Badge tone="red">Flagged</Badge>
                          </span>
                        )}
                      </td>
                      <td
                        className={
                          incoming
                            ? "whitespace-nowrap px-3 py-3 text-right font-semibold text-emerald-600"
                            : "whitespace-nowrap px-3 py-3 text-right font-semibold text-navy-900"
                        }
                      >
                        {incoming ? "+" : "−"}
                        {centsToDollars(t.amountCents)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right text-navy-500">
                        {centsToDollars(t.balanceAfterCents)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
