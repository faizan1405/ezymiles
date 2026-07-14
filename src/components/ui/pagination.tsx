import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Server-rendered pagination — real links, so results are crawlable, shareable
 * and work with the back button. No client JavaScript involved.
 */
export function Pagination({
  page,
  totalPages,
  buildHref,
  className,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);

  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-center gap-1.5", className)}>
      <PageLink
        href={buildHref(page - 1)}
        disabled={page <= 1}
        label="Previous page"
        icon={<ChevronLeft className="size-4" aria-hidden />}
      />

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-2 text-sm text-muted" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "flex size-10 items-center justify-center rounded-full text-sm font-semibold transition-colors",
              p === page
                ? "bg-midnight-900 text-white"
                : "text-midnight-700 hover:bg-sand-100",
            )}
          >
            {p}
          </Link>
        ),
      )}

      <PageLink
        href={buildHref(page + 1)}
        disabled={page >= totalPages}
        label="Next page"
        icon={<ChevronRight className="size-4" aria-hidden />}
      />
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  label,
  icon,
}: {
  href: string;
  disabled: boolean;
  label: string;
  icon: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled
        className="flex size-10 cursor-not-allowed items-center justify-center rounded-full border border-hairline text-midnight-300"
      >
        {icon}
        <span className="sr-only">{label}</span>
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={label}
      className="flex size-10 items-center justify-center rounded-full border border-hairline text-midnight-800 transition-colors hover:bg-sand-50"
    >
      {icon}
    </Link>
  );
}

function pageWindow(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const out: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);

  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("…");

  out.push(total);
  return out;
}
