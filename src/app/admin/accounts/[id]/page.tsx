import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { centsToDollars, formatAccountNumber, txnTypeLabels } from "@/lib/money";
import { Card, CardHeader, Badge, PageHeader, LinkButton, buttonClasses } from "@/components/ui";
import { AccountControls } from "@/components/account-controls";
import { MemoComposer } from "@/components/memo-composer";
import { FlagButton } from "@/components/flag-button";
import { PendingControls } from "@/components/pending-controls";
import { advanceBusinessClock } from "@/lib/clock";

export const metadata = { title: "Account detail" };

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const account = await prisma.account.findUnique({
    where: { id },
    include: {
      user: true,
      transactions: { orderBy: { createdAt: "asc" } },
      updates: { include: { author: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!account) notFound();
  await advanceBusinessClock();
  const currency = account.user.currency;

  const APY = account.type === "SAVINGS" ? "3.98%" : "0.01%";
  const product =
    account.type === "CHECKING" ? "Meridian Everyday Checking" : "Meridian Silverleaf Savings";

  return (
    <>
      <PageHeader
        title={`${product} ····${account.accountNumber.slice(-4)}`}
        description={`${account.user.name} · ${account.user.email}${account.user.phone ? ` · ${account.user.phone}` : ""}`}
      >
        <div className="flex gap-2">
          <LinkButton href="/admin/users" variant="ghost">
            ← All customers
          </LinkButton>
        </div>
      </PageHeader>

      {/* Account spec sheet — styled like a core-system record */}
      <Card className="mb-6 overflow-hidden">
        <div className="grid gap-px bg-navy-100 sm:grid-cols-3">
          <div className="bg-white px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-navy-400">
              Account number (MICR)
            </p>
            <p className="mt-1 font-mono text-lg tracking-wider text-navy-900">
              {formatAccountNumber(account.accountNumber)}
            </p>
          </div>
          <div className="bg-white px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-navy-400">
              Routing / ABA
            </p>
            <p className="mt-1 font-mono text-lg tracking-wider text-navy-900">
              {formatAccountNumber(account.routingNumber)}
            </p>
          </div>
          <div className="bg-white px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-navy-400">
              Ledger balance
            </p>
            <p className="mt-1 font-display text-2xl text-navy-900">
              {centsToDollars(account.balanceCents, currency)}
            </p>
          </div>
          <div className="bg-white px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-navy-400">
              Product
            </p>
            <p className="mt-1 text-sm text-navy-900">{product}</p>
            <p className="text-xs text-navy-400">APY {APY} · renews monthly</p>
          </div>
          <div className="bg-white px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-navy-400">
              Opened
            </p>
            <p className="mt-1 text-sm text-navy-900">
              {new Date(account.openedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <p className="text-xs text-navy-400">
              Branch: New York · Plaza (037)
            </p>
          </div>
          <div className="bg-white px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-navy-400">
              Status
            </p>
            <p className="mt-1">
              <Badge tone={account.status === "ACTIVE" ? "green" : "red"}>{account.status}</Badge>
            </p>
            <p className="mt-1 text-xs text-navy-400">
              {account.status === "ACTIVE" ? "All channels open" : "Deposits & debits blocked"}
            </p>
          </div>
        </div>
        <div className="border-t border-navy-100 px-5 py-4">
          <AccountControls accountId={account.id} status={account.status} />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Ledger */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Account ledger"
            subtitle={`${account.transactions.length} entries · running balance shown`}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-100 text-left text-[10px] uppercase tracking-widest text-navy-400">
                  <th className="px-5 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Entry</th>
                  <th className="px-3 py-2.5 text-right">Amount</th>
                  <th className="px-5 py-2.5 text-right">Balance</th>
                  <th className="px-2 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {[...account.transactions].reverse().map((t) => {
                  const incoming =
                    t.type === "DEPOSIT" || t.type.endsWith("_IN") ||
                    (t.type === "ADJUSTMENT" && t.description.startsWith("Credit"));
                  return (
                    <tr key={t.id} className={t.isFlagged ? "bg-red-50/50" : ""}>
                      <td className="whitespace-nowrap px-5 py-2 text-navy-500">
                        {new Date(t.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-3 py-2">
                        {txnTypeLabels[t.type]}
                        {t.status === "PENDING" && (
                          <span className="ml-2 rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-bold text-gold-600">
                            PENDING · posts {t.postAt ? new Date(t.postAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "soon"}
                          </span>
                        )}
                        {t.status === "DECLINED" && (
                          <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                            DECLINED
                          </span>
                        )}
                        <span className="block text-[11px] text-navy-400">
                          {t.description} · {t.reference}
                        </span>
                      </td>
                      <td className={"whitespace-nowrap px-3 py-2 text-right font-semibold " + (incoming ? "text-emerald-600" : "text-navy-900")}>
                        {incoming ? "+" : "−"}
                        {centsToDollars(t.amountCents, currency)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-2 text-right text-navy-500">
                        {centsToDollars(t.balanceAfterCents, currency)}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {t.status === "PENDING" ? (
                          <PendingControls transactionId={t.id} />
                        ) : (
                          <FlagButton transactionId={t.id} flagged={t.isFlagged} />
                        )}
                      </td>
                    </tr>
                  );
                })}
                {account.transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-navy-400">
                      No ledger entries yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Memos */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Post secure message" subtitle="Appears on the customer's dashboard" />
            <MemoComposer accountId={account.id} />
          </Card>
          <Card>
            <CardHeader title="Message history" subtitle={`${account.updates.length} on file`} />
            <ul className="divide-y divide-navy-100">
              {account.updates.map((u) => (
                <li key={u.id} className="px-5 py-4">
                  <p className="text-sm font-semibold text-navy-900">{u.title}</p>
                  <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-navy-600">
                    {u.body}
                  </p>
                  <p className="mt-2 text-[10px] uppercase tracking-wider text-navy-400">
                    {u.author.name} · {new Date(u.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </li>
              ))}
              {account.updates.length === 0 && (
                <li className="px-5 py-6 text-center text-sm text-navy-400">
                  No messages on file.
                </li>
              )}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
