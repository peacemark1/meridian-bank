import Link from "next/link";
import { requireCustomer, getSessionUser } from "@/lib/auth";
import { advanceBusinessClock } from "@/lib/clock";
import { prisma } from "@/lib/prisma";
import { centsToDollars, formatAccountNumber, txnTypeLabels, txnColor } from "@/lib/money";
import { Card, CardHeader, Badge, EmptyState, PageHeader, LinkButton, buttonClasses } from "@/components/ui";

export const metadata = { title: "Overview" };

const typeTone: Record<string, "green" | "red" | "neutral" | "gold"> = {
  DEPOSIT: "green",
  TRANSFER_IN: "green",
  PAYMENT_IN: "green",
  ADJUSTMENT: "gold",
};

export default async function DashboardPage() {
  const session = await requireCustomer();
  const user = await getSessionUser();
  await advanceBusinessClock();
  const currency = user?.currency ?? "USD";

  const accounts = await prisma.account.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "asc" },
    include: { user: true },
  });

  const accountIds = accounts.map((a) => a.id);
  const pendingItems = await prisma.transaction.findMany({
    where: { accountId: { in: accountIds }, status: { in: ["PENDING", "DECLINED"] } },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
  const activeRecurrings = await prisma.recurring.count({
    where: { account: { userId: session.userId }, active: true },
  });
  const recent = await prisma.transaction.findMany({
    where: { accountId: { in: accountIds } },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const pendingIncoming = await prisma.moneyRequest.findMany({
    where: { recipientId: session.userId, status: "PENDING" },
    include: { requester: true },
  });

  const messages = await prisma.accountUpdate.findMany({
    where: { account: { userId: session.userId } },
    include: { author: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const total = accounts
    .filter((a) => a.status === "ACTIVE")
    .reduce((sum, a) => sum + a.balanceCents, 0);

  return (
    <>
      <PageHeader
        title={`Good day, ${user?.name.split(" ")[0]}.`}
        description="Here's where your money stands today."
      >
        <div className="flex gap-2">
          <LinkButton href="/dashboard/transfer" variant="gold">
            Move money
          </LinkButton>
          <LinkButton href="/dashboard/statements" variant="ghost">
            Statements
          </LinkButton>
        </div>
      </PageHeader>

      {pendingIncoming.length > 0 && (
        <Card className="mb-6 border-gold-300 bg-gold-100/50">
          <div className="flex items-center justify-between px-5 py-4">
            <p className="text-sm text-gold-600">
              <strong>{pendingIncoming.length}</strong> money request
              {pendingIncoming.length > 1 ? "s" : ""} waiting for your response — totaling{" "}
              <strong>
                {centsToDollars(pendingIncoming.reduce((s, r) => s + r.amountCents, 0), currency)}
              </strong>
            </p>
            <Link href="/dashboard/requests" className={buttonClasses("gold")}>
              Review
            </Link>
          </div>
        </Card>
      )}

      {pendingItems.length > 0 && (
        <Card className="mb-6 border-gold-200 bg-gold-50/50">
          <CardHeader title="In the overnight batch" subtitle="Pending and declined items on your accounts" />
          <ul className="divide-y divide-gold-100">
            {pendingItems.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-navy-900">
                    {centsToDollars(t.amountCents, currency)}{" "}
                    <span className="font-normal text-navy-500">{t.type === "PAYMENT_OUT" ? "payment" : "transfer"}</span>
                  </p>
                  <p className="text-xs text-navy-400">{t.description || t.reference}</p>
                </div>
                {t.status === "PENDING" ? (
                  <Badge tone="gold">
                    Posts {t.postAt ? new Date(t.postAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "soon"}
                  </Badge>
                ) : (
                  <Badge tone="red">Declined</Badge>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {activeRecurrings > 0 && (
        <Card className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
            <p className="text-navy-700">
              📅 <strong>{activeRecurrings}</strong> standing instruction{activeRecurrings > 1 ? "s" : ""} active
            </p>
            <LinkButton href="/dashboard/recurring" variant="ghost" className="!px-3 !py-1.5 text-xs">
              Manage
            </LinkButton>
          </div>
        </Card>
      )}

      {/* Secure messages */}
      {messages.length > 0 && (
        <Card className="mb-6">
          <CardHeader
            title="Secure messages"
            subtitle="From your Meridian banking team"
            action={<Badge tone="gold">Encrypted</Badge>}
          />
          <ul className="divide-y divide-navy-100">
            {messages.map((m) => (
              <li key={m.id} className="px-5 py-4">
                <p className="text-sm font-semibold text-navy-900">{m.title}</p>
                <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-navy-600">
                  {m.body}
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-wider text-navy-400">
                  {m.author.name} · {new Date(m.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Total */}
      <div className="mb-6 rounded-2xl bg-navy-950 px-8 py-7 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-navy-300">
          Total relationship balance
        </p>
        <p className="mt-2 font-display text-4xl text-gold-300">{centsToDollars(total, currency)}</p>
        <p className="mt-2 text-xs text-navy-300">
          Deposits at First National Meridian Bank are FDIC-insured to $250,000 per depositor.
        </p>
      </div>

      {/* Account cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {accounts.map((a) => (
          <Card key={a.id} className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg text-navy-900">
                Meridian {a.type === "CHECKING" ? "Checking" : "Savings"}
              </h3>
              <Badge tone={a.status === "ACTIVE" ? "green" : "red"}>
                {a.status === "ACTIVE" ? "Active" : "Frozen"}
              </Badge>
            </div>
            <p className="mt-1 font-mono text-xs text-navy-400">
              ···· {formatAccountNumber(a.accountNumber)}
            </p>
            <p className="mt-4 font-display text-3xl text-navy-900">
              {centsToDollars(a.balanceCents, currency)}
            </p>
          </Card>
        ))}
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader
          title="Recent activity"
          subtitle="Your last 8 transactions across all accounts"
          action={
            <Link href="/dashboard/statements" className="text-sm font-semibold text-navy-600 hover:underline">
              View all →
            </Link>
          }
        />
        {recent.length === 0 ? (
          <EmptyState message="No transactions yet. Head to Deposit / Withdraw to get started." />
        ) : (
          <ul className="divide-y divide-navy-100">
            {recent.map((t) => {
              const incoming = typeTone[t.type] === "green";
              return (
                <li key={t.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-navy-900">
                      {txnTypeLabels[t.type] ?? t.type}
                    </p>
                    <p className="text-xs text-navy-400">
                      {new Date(t.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {" · "}
                      {t.reference}
                      {t.status === "PENDING" && " · PENDING"}
                      {t.status === "DECLINED" && " · DECLINED"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={
                        incoming
                          ? "text-sm font-semibold text-emerald-600"
                          : "text-sm font-semibold text-navy-900"
                      }
                    >
                      {incoming ? "+" : "−"}
                      {centsToDollars(t.amountCents, currency)}
                    </p>
                    <p className="text-xs text-navy-400">
                      {txnColor(t.type)}
                      bal {centsToDollars(t.balanceAfterCents, currency)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
