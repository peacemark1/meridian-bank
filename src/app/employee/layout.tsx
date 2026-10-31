import { requireStaff, getSessionUser } from "@/lib/auth";
import { PortalShell, icons, Icon, type NavItem } from "@/components/portal-shell";

const nav: NavItem[] = [
  { href: "/employee", label: "Customer Directory", icon: <Icon path={icons.users} /> },
  { href: "/employee/flags", label: "Flagged Activity", icon: <Icon path={icons.search} /> },
];

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  await requireStaff();
  const user = await getSessionUser();
  if (!user) return null;

  return (
    <PortalShell nav={nav} user={user} roleLabel="Branch Operations">
      {children}
    </PortalShell>
  );
}
