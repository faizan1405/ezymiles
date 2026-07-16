import Link from "next/link";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------- Page header ------------------------------- */

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl text-midnight-900 sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1.5 text-sm text-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

/* --------------------------------- Panel ---------------------------------- */

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-hairline bg-white", className)}>
      {title ? (
        <div className="flex items-center justify-between gap-4 border-b border-hairline px-5 py-4">
          <h2 className="text-sm font-bold text-midnight-900">{title}</h2>
          {action}
        </div>
      ) : null}
      <div className={title ? "p-5" : "p-5"}>{children}</div>
    </section>
  );
}

/* -------------------------------- Stat tile -------------------------------- */

export function StatTile({
  label,
  value,
  sub,
  delta,
  href,
  tone = "default",
}: {
  label: string;
  value: string | number;
  sub?: string;
  /** Percentage change vs the previous comparable period. */
  delta?: number | null;
  href?: string;
  tone?: "default" | "warning" | "success";
}) {
  const Trend = delta == null ? Minus : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;

  const body = (
    <div
      className={cn(
        "h-full rounded-2xl border p-5 transition-colors",
        tone === "warning"
          ? "border-sunset-200 bg-sunset-50"
          : tone === "success"
            ? "border-emerald-200 bg-emerald-50"
            : "border-hairline bg-white",
        href && "hover:border-midnight-300",
      )}
    >
      <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl text-midnight-900">{value}</p>

      <div className="mt-1.5 flex items-center gap-2">
        {delta != null ? (
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-semibold",
              delta > 0 ? "text-emerald-700" : delta < 0 ? "text-red-600" : "text-muted",
            )}
          >
            <Trend className="size-3.5" aria-hidden />
            {delta > 0 ? "+" : ""}
            {delta}%
          </span>
        ) : null}
        {sub ? <span className="text-xs text-muted">{sub}</span> : null}
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

/** Percentage change, guarding against divide-by-zero on a fresh database. */
export function delta(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

/* --------------------------------- Table ---------------------------------- */

export function Table({ children, caption }: { children: React.ReactNode; caption: string }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-hairline bg-white">
      <table className="w-full min-w-[48rem] text-sm">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function Th({
  children,
  className,
}: {
  /** Optional: action columns have no visible header. */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "whitespace-nowrap px-5 py-3 text-left text-[0.625rem] font-bold uppercase tracking-wider text-muted",
        className,
      )}
    >
      {children ?? <span className="sr-only">Actions</span>}
    </th>
  );
}

export function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={cn("px-5 py-4 align-middle text-midnight-800", className)}>{children}</td>;
}

export function TableEmpty({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-16 text-center text-sm text-muted">
        {message}
      </td>
    </tr>
  );
}

/* ------------------------------- Status pill ------------------------------- */

const TONES = {
  neutral: "bg-sand-100 text-midnight-700",
  success: "bg-emerald-50 text-emerald-800",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-red-50 text-red-700",
  info: "bg-sky-50 text-sky-800",
  lagoon: "bg-lagoon-50 text-lagoon-800",
} as const;

export function StatusPill({
  status,
  tone = "neutral",
}: {
  status: string;
  tone?: keyof typeof TONES;
}) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold capitalize",
        TONES[tone],
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

/** Shared status→tone mapping so the same state looks the same everywhere. */
export const STATUS_TONE: Record<string, keyof typeof TONES> = {
  // bookings
  draft: "neutral",
  pending_payment: "warning",
  confirmed: "success",
  completed: "info",
  cancellation_requested: "warning",
  cancelled: "danger",
  failed: "danger",
  // leads
  new: "lagoon",
  contacted: "info",
  qualified: "info",
  proposal_sent: "warning",
  negotiation: "warning",
  won: "success",
  lost: "danger",
  junk: "neutral",
  // payments
  created: "neutral",
  authorised: "info",
  paid: "success",
  partially_paid: "warning",
  refunded: "info",
  partially_refunded: "info",
  // publish
  published: "success",
  scheduled: "info",
  archived: "neutral",
  // reviews
  pending: "warning",
  approved: "success",
  rejected: "danger",
  // tickets
  open: "warning",
  in_progress: "info",
  waiting_on_customer: "warning",
  resolved: "success",
  closed: "neutral",
  // visa
  submitted: "info",
  documents_pending: "warning",
  under_review: "info",
  lodged_with_embassy: "info",
  // refunds
  requested: "warning",
  processing: "info",
};
