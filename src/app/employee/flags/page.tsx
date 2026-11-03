import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { centsToDollars, txnTypeLabels } from "@/lib/money";
import { Card, CardHeader, EmptyState, PageHeader } from "@/components/ui";
import { FlagButton } from "@/components/flag-button";

export const metadata = { title: "Flagged activity" };

export default async function EmployeeFlagsPage() {
  await requireStaff();
  const flagged = await prisma.transaction.findMany({
    where: { isFlagged: true },
    include: { account: { include: { user: true } }, counterparty: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Flagged activity"
        description="Transactions tagged by branch staff — review and forward to compliance."
      />
      <Card>
        <CardHeader title={`${flagged.length} flagged transaction${flagged.length === 1 ? "" : "s"}`} />
        {flagged.length === 0 ? (
          <EmptyState message="Nothing flagged right now. From the ledger, flag anything that looks off — e.g. round-dollar repeated transfers at odd hours." />
        ) : (
          <ul className="divide-y divide-navy-100">
            {flagged.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-navy-900">
                    {txnTypeLabels[t.type]} — {centsToDollars(t.amountCents, t.account.user.currency)}
                  </p>
                  <p className="text-xs text-navy-500">
                    {t.account.user.name} (····{t.account.accountNumber.slice(-4)})
                    {t.counterparty ? ` ↔ ${t.counterparty.user.name}` : ""} ·{" "}
                    {new Date(t.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="mt-1 text-xs text-navy-400">
                    {t.flagNote} · ref {t.reference}
                  </p>
                </div>
                <FlagButton transactionId={t.id} flagged={true} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
