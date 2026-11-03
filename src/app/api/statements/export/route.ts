import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { centsToPlain, txnTypeLabels } from "@/lib/money";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = new URL(request.url).searchParams.get("account") ?? "";
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: { user: true },
  });

  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (account.userId !== session.userId && session.role === "CUSTOMER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (session.role === "EMPLOYEE")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const txns = await prisma.transaction.findMany({
    where: { accountId: account.id },
    orderBy: { createdAt: "asc" },
  });

  const header = [
    "Date",
    "Reference",
    "Type",
    "Description",
    "Amount",
    "Balance After",
    "Flagged",
  ];
  const lines = txns.map((t) =>
    [
      new Date(t.createdAt).toISOString(),
      t.reference,
      txnTypeLabels[t.type] ?? t.type,
      `"${t.description.replace(/"/g, '""')}"`,
      `${t.type === "DEPOSIT" || t.type.endsWith("_IN") || t.description.startsWith("Credit") ? "" : "-"}${centsToPlain(t.amountCents)}`,
      centsToPlain(t.balanceAfterCents),
      t.isFlagged ? "YES" : "",
    ].join(","),
  );

  const csv = `Meridian Bank Statement,,\nAccount ${account.accountNumber} (${account.type}),${account.user.name},Currency: ${account.user.currency},\n\n${header.join(",")}\n${lines.join("\n")}\n`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="meridian-statement-${account.accountNumber}.csv"`,
    },
  });
}
