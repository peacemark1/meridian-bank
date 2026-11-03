import { requireCustomer, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { centsToDollars, formatAccountNumber } from "@/lib/money";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import { TransferForm } from "@/components/transfer-form";

export const metadata = { title: "Transfer money" };

export default async function TransferPage() {
  const session = await requireCustomer();
  const user = await getSessionUser();
  const currency = user?.currency ?? "USD";

  const myAccounts = await prisma.account.findMany({
    where: { userId: session.userId, status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
  });

  const accountOptions = myAccounts.map((a) => ({
    id: a.id,
    label: `${a.type === "CHECKING" ? "Checking" : "Savings"} ····${a.accountNumber.slice(-4)} — ${centsToDollars(a.balanceCents, currency)}`,
  }));

  const ownTargets = myAccounts.map((a) => ({
    accountNumber: a.accountNumber,
    label: `${a.type === "CHECKING" ? "Checking" : "Savings"} ····${a.accountNumber.slice(-4)}`,
  }));

  // recent payees from payment history, for convenience
  const recentPayments = await prisma.transaction.findMany({
    where: { accountId: { in: myAccounts.map((a) => a.id) }, type: "PAYMENT_OUT" },
    include: { counterparty: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const payees = new Map<string, string>();
  for (const p of recentPayments) {
    if (p.counterparty && p.counterparty.userId !== session.userId) {
      payees.set(p.counterparty.accountNumber, p.counterparty.user.name);
    }
  }
  const externalContacts = [
    ...[...payees.entries()].map(([accountNumber, name]) => ({
      accountNumber,
      label: `${name} ····${accountNumber.slice(-4)}`,
    })),
  ];

  return (
    <>
      <PageHeader
        title="Move money"
        description="Instant transfers between your accounts, and payments to any Meridian customer."
      />
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader title="New transfer" subtitle="Runs on MeridianNet — settles in seconds" />
          <TransferForm accounts={accountOptions} contacts={ownTargets} currency={currency} />
        </Card>
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-display text-md text-navy-900">Wire limits</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-navy-500">
              <li>Between own accounts — unlimited</li>
              <li>Customer payments — up to $250,000/day</li>
              <li>Larger wires — visit a branch, 1 business day</li>
            </ul>
          </Card>
          {externalContacts.length > 0 && (
            <Card className="p-5">
              <h3 className="font-display text-md text-navy-900">Recent payees</h3>
              <ul className="mt-2 space-y-2 text-sm text-navy-600">
                {externalContacts.slice(0, 5).map((c) => (
                  <li key={c.accountNumber} className="flex justify-between">
                    <span>{c.label.split(" ····")[0]}</span>
                    <span className="font-mono text-xs text-navy-400">
                      {formatAccountNumber(c.accountNumber)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
