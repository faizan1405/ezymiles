import { Radio, Database, Calculator, FlaskConical } from "lucide-react";
import { DATA_SOURCES, type DataSource } from "@/config/site";
import { cn } from "@/lib/utils";

const META: Record<DataSource, { Icon: typeof Radio; className: string; tooltip: string }> = {
  live: {
    Icon: Radio,
    className: "bg-emerald-50 text-emerald-800",
    tooltip: "Fetched from the supplier just now.",
  },
  cached: {
    Icon: Database,
    className: "bg-sky-50 text-sky-800",
    tooltip: "Recently fetched from the supplier and re-used. Re-confirmed before payment.",
  },
  estimated: {
    Icon: Calculator,
    className: "bg-amber-50 text-amber-800",
    tooltip: "An estimate based on historical fares — not a bookable quote.",
  },
  demo: {
    Icon: FlaskConical,
    className: "bg-sand-100 text-midnight-700",
    tooltip:
      "Demo data generated for this environment. Not live airline inventory and not ticketable.",
  },
};

/**
 * Every fare on the site carries one of these. A traveller should never have to
 * guess whether what they are looking at is real supplier inventory.
 */
export function DataSourceBadge({
  source,
  className,
}: {
  source: DataSource;
  className?: string;
}) {
  const { Icon, className: tone, tooltip } = META[source];
  const { label } = DATA_SOURCES[source];

  return (
    <span
      title={tooltip}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.625rem] font-bold uppercase tracking-wide",
        tone,
        className,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {label}
      <span className="sr-only">. {tooltip}</span>
    </span>
  );
}
