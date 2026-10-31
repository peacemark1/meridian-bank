import { requireAdmin, getSessionUser } from "@/lib/auth";
import { PortalShell, icons, Icon, type NavItem } from "@/components/portal-shell";

const nav: NavItem[] = [
  { href: "/admin", label: "Overview", icon: <Icon path={icons.stats} /> },
  { href: "/admin/users", label: "Customers & Accounts", icon: <Icon path={icons.users} /> },
  { href: "/admin/oversight", label: "Transaction Oversight", icon: <Icon path={icons.search} /> },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const user = await getSessionUser();
  if (!user) return null;

  return (
    <PortalShell nav={nav} user={user} roleLabel="Vault Ops · Admin">
      {children}
    </PortalShell>
  );
}
