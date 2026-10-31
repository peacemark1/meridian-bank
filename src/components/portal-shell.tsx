"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/auth-actions";
import { Wordmark } from "@/components/wordmark";
import { cn } from "@/lib/cn";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function Icon({ path }: { path: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={path} />
    </svg>
  );
}

export const icons = {
  home: "M3 11l9-8 9 8M5 10v10h14V10",
  accounts: "M3 6h18v12H3z M3 10h18",
  transfer: "M4 7h13l-3-3M20 17H7l3 3",
  requests: "M12 2v20M2 12h20M5 5l14 14M19 5L5 19",
  repeat: "M17 2l4 4-4 4M3 10V8a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 14v2a4 4 0 0 1-4 4H3",
  statements: "M6 3h9l5 5v13H6zM14 3v6h6M9 13h6M9 17h6",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-5-5",
  users: "M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21c0-4 3.6-6 8-6s8 2 8 6",
  stats: "M4 20V10M10 20V4M16 20v-8M22 20H2",
  menu: "M4 6h16M4 12h16M4 18h16",
};

function NavLinks({ nav, onNavigate }: { nav: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {nav.map((item) => {
        const isCurrent = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isCurrent
                ? "bg-navy-800 text-white"
                : "text-navy-200 hover:bg-navy-800 hover:text-white",
            )}
          >
            <span className={isCurrent ? "text-gold-300" : "text-gold-300/80"}>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserBlock({ user, roleLabel }: { user: { name: string; email: string }; roleLabel: string }) {
  return (
    <div className="border-t border-navy-800 px-4 py-4">
      <p className="truncate text-sm font-semibold text-white">{user.name}</p>
      <p className="truncate text-xs text-navy-300">{user.email}</p>
      <p className="mt-1 inline-flex rounded-full bg-gold-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-300">
        {roleLabel}
      </p>
      <form action={logoutAction} className="mt-3">
        <button
          type="submit"
          className="w-full rounded-lg border border-navy-700 px-3 py-2 text-sm text-navy-200 transition-colors hover:bg-navy-800"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

export function PortalShell({
  nav,
  user,
  roleLabel,
  children,
}: {
  nav: NavItem[];
  user: { name: string; email: string };
  roleLabel: string;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between bg-navy-950 px-4 py-3 text-white md:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="rounded-lg border border-navy-700 p-2 text-gold-300"
        >
          <Icon path={icons.menu} />
        </button>
        <Wordmark light href={null} />
        <span className="w-9" aria-hidden />
      </header>
      <div className="h-14 md:hidden" aria-hidden />

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-navy-950 text-navy-100 md:flex">
        <div className="border-b border-navy-800 px-5 py-5">
          <Wordmark light href={null} />
        </div>
        <NavLinks nav={nav} />
        <UserBlock user={user} roleLabel={roleLabel} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal>
          <div
            className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-navy-950 text-navy-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-navy-800 px-4 py-4">
              <Wordmark light href={null} />
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="rounded-lg border border-navy-700 p-1.5 text-gold-300"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M5 5l14 14M19 5L5 19" />
                </svg>
              </button>
            </div>
            <NavLinks nav={nav} onNavigate={() => setDrawerOpen(false)} />
            <UserBlock user={user} roleLabel={roleLabel} />
          </aside>
        </div>
      )}

      {/* Content */}
      <main className="min-w-0 flex-1 bg-navy-50/60">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
