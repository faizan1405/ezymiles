"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, CalendarRange, Clock, Layers, Eye } from "lucide-react";
import type { DestinationCardDTO } from "@/types";
import { SmartImage } from "@/components/ui/smart-image";
import { Price } from "@/components/ui/price";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/overlays";
import { EmptyState, SectionHeading } from "@/components/ui/primitives";
import { Tilt } from "@/components/ui/reveal";
import { cn, pluralise } from "@/lib/utils";

type TabKey =
  | "trending"
  | "india"
  | "international"
  | "beach"
  | "mountains"
  | "adventure"
  | "honeymoon"
  | "weekend";

const TABS: { key: TabKey; label: string }[] = [
  { key: "trending", label: "Trending" },
  { key: "india", label: "India" },
  { key: "international", label: "International" },
  { key: "beach", label: "Beach" },
  { key: "mountains", label: "Mountains" },
  { key: "adventure", label: "Adventure" },
  { key: "honeymoon", label: "Honeymoon" },
  { key: "weekend", label: "Weekend Trips" },
];

function matches(d: DestinationCardDTO, tab: TabKey) {
  switch (tab) {
    case "trending":
      return d.isTrending;
    case "india":
      return d.scope === "domestic";
    case "international":
      return d.scope === "international";
    case "weekend":
      return d.themes.includes("weekend") || d.recommendedDurationDays <= 4;
    default:
      return d.themes.includes(tab);
  }
}

export function DestinationExplorer({ destinations }: { destinations: DestinationCardDTO[] }) {
  const [tab, setTab] = React.useState<TabKey>("trending");
  const [quickView, setQuickView] = React.useState<DestinationCardDTO | null>(null);
  const reduced = useReducedMotion();

  // Only show tabs that actually have destinations behind them.
  const availableTabs = TABS.filter((t) => destinations.some((d) => matches(d, t.key)));
  const activeTab = availableTabs.some((t) => t.key === tab) ? tab : (availableTabs[0]?.key ?? "trending");
  const visible = destinations.filter((d) => matches(d, activeTab)).slice(0, 8);

  return (
    <section className="section-y bg-canvas">
      <div className="container-page">
        <SectionHeading
          eyebrow="Where to next"
          title="Destinations we know inside out"
          description="Not a list of everywhere. A list of the places our designers have walked, eaten in, and can plan around your actual dates."
          action={
            <Button asChild variant="outline">
              <Link href="/destinations">
                All destinations
                <ArrowUpRight aria-hidden />
              </Link>
            </Button>
          }
        />

        {destinations.length === 0 ? (
          <EmptyState
            className="mt-10"
            icon={<Layers />}
            title="No destinations published yet"
            description="Once destinations are added from the admin panel, they'll appear here automatically."
            action={
              <Button asChild variant="accent">
                <Link href="/customise-my-trip">Tell us where you want to go</Link>
              </Button>
            }
          />
        ) : (
          <>
            <div
              role="tablist"
              aria-label="Destination categories"
              className="no-scrollbar -mx-5 mt-10 flex gap-1.5 overflow-x-auto px-5 sm:mx-0 sm:px-0"
            >
              {availableTabs.map((t) => {
                const active = t.key === activeTab;
                return (
                  <button
                    key={t.key}
                    role="tab"
                    type="button"
                    aria-selected={active}
                    onClick={() => setTab(t.key)}
                    className={cn(
                      "relative shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
                      active ? "text-white" : "text-midnight-600 hover:text-midnight-900",
                    )}
                  >
                    {active ? (
                      <motion.span
                        layoutId="dest-tab-pill"
                        className="absolute inset-0 rounded-full bg-midnight-900"
                        transition={{ duration: reduced ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
                      />
                    ) : null}
                    <span className="relative">{t.label}</span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.ul
                key={activeTab}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
              >
                {visible.map((d, i) => (
                  <motion.li
                    key={d.id}
                    initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: reduced ? 0 : i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <DestinationCard destination={d} onQuickView={() => setQuickView(d)} />
                  </motion.li>
                ))}
              </motion.ul>
            </AnimatePresence>
          </>
        )}
      </div>

      <QuickViewDialog
        destination={quickView}
        onOpenChange={(open) => !open && setQuickView(null)}
      />
    </section>
  );
}

function DestinationCard({
  destination: d,
  onQuickView,
}: {
  destination: DestinationCardDTO;
  onQuickView: () => void;
}) {
  return (
    <Tilt className="h-full">
      <article className="group relative h-full overflow-hidden rounded-2xl bg-midnight-950 shadow-tile transition-shadow duration-500 hover:shadow-float">
        <div className="relative aspect-3/4">
          <SmartImage
            src={d.heroImage}
            alt={d.heroAlt}
            fill
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 23vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:group-hover:scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-midnight-950 via-midnight-950/25 to-transparent" />
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="text-[0.625rem] font-bold uppercase tracking-widest text-lagoon-300">
            {d.country}
          </p>
          <h3 className="mt-1 font-display text-xl text-white">
            <Link href={`/destinations/${d.slug}`} className="after:absolute after:inset-0">
              {d.name}
            </Link>
          </h3>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] text-midnight-100">
            <span className="flex items-center gap-1">
              <Clock className="size-3" aria-hidden />
              {d.recommendedDurationDays} days
            </span>
            {d.bestMonths.length ? (
              <span className="flex items-center gap-1">
                <CalendarRange className="size-3" aria-hidden />
                {d.bestMonths.slice(0, 2).join(", ")}
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex items-end justify-between gap-2">
            <div>
              <p className="text-[0.625rem] uppercase tracking-wide text-midnight-200">Starting from</p>
              <Price amountINR={d.startingPriceINR} className="text-base text-white" compact />
            </div>
            <span className="rounded-full bg-midnight-800 px-2.5 py-1 text-[0.625rem] font-semibold text-white">
              {pluralise(d.packageCount, "package")}
            </span>
          </div>
        </div>

        {/* Quick view sits above the card link. */}
        <button
          type="button"
          onClick={onQuickView}
          aria-label={`Quick view of ${d.name}`}
          className="absolute right-3 top-3 z-10 flex size-9 translate-y-1 items-center justify-center rounded-full glass text-midnight-900 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100"
        >
          <Eye className="size-4" aria-hidden />
        </button>
      </article>
    </Tilt>
  );
}

function QuickViewDialog({
  destination: d,
  onOpenChange,
}: {
  destination: DestinationCardDTO | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(d)} onOpenChange={onOpenChange}>
      {d ? (
        <DialogContent title={d.name} description={d.country} size="lg">
          <div className="relative mb-5 aspect-16/9 overflow-hidden rounded-2xl">
            <SmartImage src={d.heroImage} alt={d.heroAlt} fill sizes="(max-width: 768px) 90vw, 42rem" className="object-cover" />
          </div>

          <p className="text-[0.9375rem] leading-relaxed text-muted">{d.summary}</p>

          <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="From" value={<Price amountINR={d.startingPriceINR} className="text-base" compact />} />
            <Stat label="Ideal length" value={`${d.recommendedDurationDays} days`} />
            <Stat label="Best months" value={d.bestMonths.slice(0, 3).join(", ") || "Year-round"} />
            <Stat label="Packages" value={String(d.packageCount)} />
          </dl>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="accent" size="lg" className="flex-1">
              <Link href={`/destinations/${d.slug}`}>Explore {d.name}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="flex-1">
              <Link href={`/packages?destination=${d.slug}`}>See packages</Link>
            </Button>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-sand-50 p-3">
      <dt className="text-[0.625rem] font-bold uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-midnight-900">{value}</dd>
    </div>
  );
}
