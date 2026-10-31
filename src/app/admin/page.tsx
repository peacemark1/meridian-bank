import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { centsToDollars } from "@/lib/money";
import { Card, CardHeader, Badge, PageHeader } from "@/components/ui";

export const metadata = { title: "Admin overview" };

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-navy-400">{label}</p>
      <p className="mt-2 font-display text-3xl text-navy-900">{value}</p>
      {note && <p className="mt-1 text-xs text-navy-400">{note}</p>}
    </Card>
  );
}

/** Hand-rolled SVG bar chart — daily deposit/withdraw volume for last 14 days. */
async function VolumeChart() {
  const since = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000);
  since.setHours(0, 0, 0, 0);

  const txns = await prisma.transaction.findMany({
    where: {
      type: { in: ["DEPOSIT", "WITHDRAW", "TRANSFER_IN", "TRANSFER_OUT", "PAYMENT_IN", "PAYMENT_OUT"] },
      createdAt: { gte: since },
    },
    select: { amountCents: true, type: true, createdAt: true },
  });

  const days: { label: string; inflow: number; outflow: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
    days.push({
      label: d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" }),
      inflow: 0,
      outflow: 0,
    });
  }
  for (const t of txns) {
    const idx = Math.floor((t.createdAt.getTime() - since.getTime()) / 86_400_000);
    if (idx >= 0 && idx < 14) {
      if (t.type === "DEPOSIT" || t.type === "TRANSFER_IN" || t.type === "PAYMENT_IN")
        days[idx].inflow += t.amountCents;
      else days[idx].outflow += t.amountCents;
    }
  }

  const max = Math.max(1, ...days.flatMap((d) => [d.inflow, d.outflow]));
  const H = 120;

  return (
    <div className="px-5 pb-5 pt-2">
      <div className="flex items-end gap-1" style={{ height: H }}>
        {days.map((d, i) => (
          <div key={i} className="group relative flex flex-1 items-end justify-center gap-px" title={`${d.label}: in ${centsToDollars(d.inflow)} / out ${centsToDollars(d.outflow)}`}>
            <div
              className="w-1/2 rounded-t bg-navy-800"
              style={{ height: `${(d.inflow / max) * H}px` }}
            />
            <div
              className="w-1/2 rounded-t bg-gold-400"
              style={{ height: `${(d.outflow / max) * H}px` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-navy-400">
        {days.map((d, i) => (
          <span key={i} className="flex-1 text-center">
            {d.label}
          </span>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-navy-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-navy-800" /> Inflow
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-gold-400" /> Outflow
        </span>
      </div>
    </div>
  );
}

export default async function AdminPage() {
  await requireAdmin();

  const [users, accounts, txns, flagged, requests] = await Promise.all([
    prisma.user.count(),
    prisma.account.findMany({ where: { status: "ACTIVE" }, select: { balanceCents: true } }),
    prisma.transaction.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.transaction.count({ where: { isFlagged: true } }),
    prisma.moneyRequest.count({ where: { status: "PENDING" } }),
  ]);

  const totalDeposits = accounts.reduce((s, a) => s + a.balanceCents, 0);

  const typeTone: Record<string, "green" | "red" | "neutral" | "gold"> = {
    DEPOSIT: "green",
    TRANSFER_IN: "green",
    PAYMENT_IN: "green",
    ADJUSTMENT: "gold",
  };

  return (
    <>
      <PageHeader title="Bank operations" description="First National Meridian Bank — internal overview" />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Customers" value={String(users)} note="registered users" />
        <Stat label="Deposits on book" value={centsToDollars(totalDeposits)} note={`${accounts.length} active accounts`} />
        <Stat label="Flagged transactions" value={String(flagged)} note="awaiting review" />
        <Stat label="Pending requests" value={String(requests)} note="money requests in flight" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Daily money flow" subtitle="Last 14 days across all accounts" />
          <VolumeChart />
        </Card>
        <Card>
          <CardHeader title="Latest ledger entries" />
          <ul className="divide-y divide-navy-100">
            {txns.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2 px-5 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-navy-900">
                    {t.type.replaceAll("_", " ").toLowerCase()}
                  </p>
                  <p className="truncate font-mono text-[10px] text-navy-400">{t.reference}</p>
                </div>
                <span
                  className={
                    typeTone[t.type] === "green"
                      ? "whitespace-nowrap font-semibold text-emerald-600"
                      : "whitespace-nowrap font-semibold text-navy-700"
                  }
                >
                  {centsToDollars(t.amountCents)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
