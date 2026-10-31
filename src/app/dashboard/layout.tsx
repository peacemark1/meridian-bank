import { requireCustomer, getSessionUser } from "@/lib/auth";
import { PortalShell, icons, Icon, type NavItem } from "@/components/portal-shell";

const nav: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: <Icon path={icons.home} /> },
  { href: "/dashboard/transfer", label: "Transfer Money", icon: <Icon path={icons.transfer} /> },
  { href: "/dashboard/recurring", label: "Scheduled Transfers", icon: <Icon path={icons.requests} /> },
  { href: "/dashboard/actions", label: "Deposit / Withdraw", icon: <Icon path={icons.accounts} /> },
  { href: "/dashboard/requests", label: "Money Requests", icon: <Icon path={icons.requests} /> },
  { href: "/dashboard/statements", label: "Statements", icon: <Icon path={icons.statements} /> },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireCustomer();
  const user = await getSessionUser();
  if (!user) return null;

  return (
    <PortalShell nav={nav} user={user} roleLabel="Customer">
      {children}
    </PortalShell>
  );
}
