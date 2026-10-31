import Link from "next/link";
import { cn } from "@/lib/cn";

export function Wordmark({
  className,
  light = false,
  href = "/",
}: {
  className?: string;
  light?: boolean;
  href?: string | null;
}) {
  const inner = (
    <span className={cn("flex items-center gap-3", className)}>
      <svg width="40" height="40" viewBox="0 0 48 48" fill="none" aria-hidden>
        <rect x="2" y="2" width="44" height="44" rx="8" fill={light ? "#c9a227" : "#0b1f3a"} />
        <path
          d="M24 9l12 5v3H12v-3l12-5z"
          fill={light ? "#0b1f3a" : "#c9a227"}
        />
        <path
          d="M15 30v-9h3v9h-3zm7 0v-9h3v9h-3zm7 0v-9h3v9h-3z
             M12 31h24v3H12v-3z"
          fill={light ? "#0b1f3a" : "#c9a227"}
        />
        <path d="M12 17h24v2H12v-2z" fill={light ? "#0b1f3a" : "#c9a227"} />
      </svg>
      <span className="leading-tight">
        <span
          className={cn(
            "block font-display text-lg tracking-wide",
            light ? "text-gold-300" : "text-navy-900",
          )}
        >
          First National Meridian
        </span>
        <span
          className={cn(
            "block text-[10px] font-semibold uppercase tracking-[0.28em]",
            light ? "text-gold-200/80" : "text-navy-500",
          )}
        >
          Bank · Est. 1892
        </span>
      </span>
    </span>
  );
  return href ? (
    <Link href={href} className="inline-flex">
      {inner}
    </Link>
  ) : (
    inner
  );
}
