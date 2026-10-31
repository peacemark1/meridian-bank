import Link from "next/link";
import { cn } from "@/lib/cn";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-navy-100 bg-white shadow-[0_1px_3px_rgba(11,31,58,0.08)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-navy-100 px-5 py-4">
      <div>
        <h2 className="font-display text-lg text-navy-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-navy-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export const buttonClasses = (variant: "primary" | "gold" | "ghost" | "danger" = "primary") =>
  cn(
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-500 disabled:opacity-50",
    variant === "primary" && "bg-navy-900 text-white hover:bg-navy-700",
    variant === "gold" && "bg-gold-400 text-navy-950 hover:bg-gold-300",
    variant === "ghost" && "border border-navy-200 bg-white text-navy-800 hover:bg-navy-50",
    variant === "danger" && "bg-red-700 text-white hover:bg-red-600",
  );

export function LinkButton({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: "primary" | "gold" | "ghost" | "danger";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={cn(buttonClasses(variant), className)}>
      {children}
    </Link>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "green" | "red" | "gold" | "navy";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tone === "neutral" && "bg-navy-100 text-navy-700",
        tone === "green" && "bg-emerald-100 text-emerald-800",
        tone === "red" && "bg-red-100 text-red-700",
        tone === "gold" && "bg-gold-100 text-gold-600",
        tone === "navy" && "bg-navy-900 text-gold-300",
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-5 py-10 text-center text-sm text-navy-400">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M3 7h18v13H3zM3 10h18M8 14h8" />
      </svg>
      {message}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl text-navy-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-navy-400">{description}</p>}
      </div>
      {children}
    </div>
  );
}
