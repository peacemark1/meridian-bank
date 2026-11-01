import { requireCustomer } from "@/lib/auth";
import { advanceBusinessClock } from "@/lib/clock";
import { prisma } from "@/lib/prisma";
import { centsToDollars, formatAccountNumber } from "@/lib/money";
import { Card, CardHeader, Badge, EmptyState, PageHeader } from "@/components/ui";
import { NewRecurringForm, RecurringControls } from "@/components/recurring-forms";

export const metadata = { title: "Scheduled transfers" };

export default async function RecurringPage() {
  const session = await requireCustomer();
  await advanceBusinessClock();

  const accounts = await prisma.account.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "asc" },
  });

  const recurrings = await prisma.recurring.findMany({
    where: { account: { userId: session.userId } },
    include: { account: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Scheduled transfers"
        description="Standing instructions that move money automatically — weekly, biweekly, or monthly."
      />
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader title="New standing instruction" />
          <NewRecurringForm
            accounts={accounts.map((a) => ({
              id: a.id,
              label: `${a.type === "CHECKING" ? "Checking" : "Savings"} ····${a.accountNumber.slice(-4)} — ${centsToDollars(a.balanceCents)}`,
            }))}
          />
        </Card>

        <Card className="md:col-span-2">
          <CardHeader
            title="Your instructions"
            subtitle="Processed automatically by our operations vault"
          />
          {recurrings.length === 0 ? (
            <EmptyState message="No standing instructions yet — schedule one on the left (great for rent)." />
          ) : (
            <ul className="divide-y divide-navy-100">
              {recurrings.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-navy-900">
                      {centsToDollars(r.amountCents)}
                      <span className="ml-1 font-normal text-navy-500">
                        {r.cadence === "WEEKLY" ? "weekly" : r.cadence === "BIWEEKLY" ? "biweekly" : "monthly"}
                        {r.label ? ` — ${r.label}` : ""}
                      </span>
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-navy-400">
                      ····{r.account.accountNumber.slice(-4)} → {formatAccountNumber(r.toAccountNumber)} ·{" "}
                      {r.reference}
                    </p>
                    <p className="mt-1 text-xs text-navy-500">
                      <Badge tone={r.active ? "green" : "neutral"}>{r.active ? "Active" : "Paused"}</Badge>
                      {" "}
                      Next: {new Date(r.nextRunAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {r.lastError ? (
                        <span className="text-red-600"> · last run skipped: {r.lastError}</span>
                      ) : r.lastRunAt ? (
                        <> · last run {new Date(r.lastRunAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</>
                      ) : null}
                    </p>
                  </div>
                  <RecurringControls id={r.id} active={r.active} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
