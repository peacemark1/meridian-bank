import { requireCustomer, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatAccountNumber } from "@/lib/money";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import { DepositWithdrawForm } from "@/components/deposit-withdraw-form";

export const metadata = { title: "Deposit / Withdraw" };

export default async function ActionsPage() {
  const session = await requireCustomer();
  const user = await getSessionUser();
  const currency = user?.currency ?? "USD";
  const accounts = await prisma.account.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "asc" },
  });

  const options = accounts.map((a) => ({
    id: a.id,
    label: `${a.type === "CHECKING" ? "Checking" : "Savings"} ····${a.accountNumber.slice(-4)}`,
  }));

  return (
    <>
      <PageHeader
        title="Teller window"
        description="Make cash deposits and withdrawals — just like the branch, without the drive."
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader title="Make a deposit" subtitle="Funds available immediately" />
          <DepositWithdrawForm accounts={options} mode="deposit" currency={currency} />
        </Card>
        <Card>
          <CardHeader title="Withdraw cash" subtitle="Up to your available balance" />
          <DepositWithdrawForm accounts={options} mode="withdraw" currency={currency} />
        </Card>
      </div>
    </>
  );
}
