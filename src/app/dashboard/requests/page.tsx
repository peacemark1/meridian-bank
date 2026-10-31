import { requireCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { centsToDollars } from "@/lib/money";
import { Card, CardHeader, Badge, EmptyState, PageHeader } from "@/components/ui";
import { RequestForm, RespondButtons } from "@/components/request-forms";

export const metadata = { title: "Money requests" };

export default async function RequestsPage() {
  const session = await requireCustomer();

  const [incoming, outgoing] = await Promise.all([
    prisma.moneyRequest.findMany({
      where: { recipientId: session.userId },
      include: { requester: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.moneyRequest.findMany({
      where: { requesterId: session.userId },
      include: { recipient: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const statusTone = {
    PENDING: "gold",
    PAID: "green",
    DECLINED: "red",
  } as const;

  return (
    <>
      <PageHeader
        title="Money requests"
        description="Ask anyone with a Meridian account to pay you — one tap for them."
      />
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader title="New request" />
          <RequestForm />
        </Card>

        <Card className="md:col-span-2">
          <CardHeader title="Requests to you" subtitle="Approve to pay instantly from your checking account" />
          {incoming.length === 0 ? (
            <EmptyState message="You haven't received any money requests yet." />
          ) : (
            <ul className="divide-y divide-navy-100">
              {incoming.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-navy-900">
                      {centsToDollars(r.amountCents)}{" "}
                      <span className="font-normal text-navy-500">
                        from {r.requester.name}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-navy-400">
                      {r.note || "No note"} · ref {r.reference}
                    </p>
                  </div>
                  {r.status === "PENDING" ? (
                    <RespondButtons requestId={r.id} />
                  ) : (
                    <Badge tone={statusTone[r.status as keyof typeof statusTone]}>
                      {r.status}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Requests you sent" />
        {outgoing.length === 0 ? (
          <EmptyState message="No outgoing requests yet — try the form above." />
        ) : (
          <ul className="divide-y divide-navy-100">
            {outgoing.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-navy-900">
                    {centsToDollars(r.amountCents)}{" "}
                    <span className="font-normal text-navy-500">to {r.recipient.name}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-navy-400">
                    {r.note || "No note"} · ref {r.reference}
                  </p>
                </div>
                <Badge tone={statusTone[r.status as keyof typeof statusTone]}>{r.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
