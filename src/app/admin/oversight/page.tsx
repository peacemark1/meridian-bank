import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { centsToDollars, txnTypeLabels } from "@/lib/money";
import { Card, CardHeader, Badge, EmptyState, PageHeader } from "@/components/ui";
import { FlagButton } from "@/components/flag-button";

export const metadata = { title: "Transaction oversight" };

export default async function OversightPage() {
  await requireAdmin();
  const txns = await prisma.transaction.findMany({
    include: { account: { include: { user: true } }, counterparty: { include: { user: true } } },
    orderBy: [{ createdAt: "desc" }],
    take: 60,
  });

  const flagged = txns.filter((t) => t.isFlagged);

  return (
    <>
      <PageHeader
        title="Transaction oversight"
        description="Full ledger visibility — flag anything suspicious for the compliance binder."
      />

      {flagged.length > 0 && (
        <Card className="mb-6 border-red-200 bg-red-50/60">
          <CardHeader title={`Flagged: ${flagged.length}`} />
          <ul className="divide-y divide-red-100">
            {flagged.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <p className="font-medium text-navy-900">
                    {txnTypeLabels[t.type]} {centsToDollars(t.amountCents)} —{" "}
                    {t.account.user.name}
                  </p>
                  <p className="text-xs text-navy-500">
                    {t.flagNote} · ref {t.reference}
                  </p>
                </div>
                <FlagButton transactionId={t.id} flagged={true} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <CardHeader title="Ledger (latest 60)" subtitle="Across all accounts" />
        {txns.length === 0 ? (
          <EmptyState message="No transactions recorded yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wider text-navy-400">
                  <th className="px-5 py-3 font-semibold">When</th>
                  <th className="px-3 py-3 font-semibold">Customer</th>
                  <th className="px-3 py-3 font-semibold">Entry</th>
                  <th className="px-3 py-3 text-right font-semibold">Amount</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {txns.map((t) => (
                  <tr key={t.id} className={t.isFlagged ? "bg-red-50/50" : "hover:bg-navy-50"}>
                    <td className="whitespace-nowrap px-5 py-2.5 text-navy-500">
                      {new Date(t.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-3 py-2.5 text-navy-800">
                      {t.account.user.name}
                      <span className="block text-xs text-navy-400">
                        ····{t.account.accountNumber.slice(-4)} ({t.account.type.toLowerCase()})
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-navy-800">{txnTypeLabels[t.type]}</span>
                      {t.counterparty && (
                        <span className="text-navy-400">
                          {" "}
                          ↔ {t.counterparty.user.name}
                        </span>
                      )}
                      <span className="block font-mono text-[10px] text-navy-300">
                        {t.reference}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold text-navy-900">
                      {centsToDollars(t.amountCents)}
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <FlagButton transactionId={t.id} flagged={t.isFlagged} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
