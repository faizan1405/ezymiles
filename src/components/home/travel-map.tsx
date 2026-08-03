"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/components/ui/reduced-motion-context";
import { ArrowRight, CalendarRange, Layers } from "lucide-react";
import type { DestinationCardDTO } from "@/types";
import { Price } from "@/components/ui/price";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/primitives";
import { SmartImage } from "@/components/ui/smart-image";
import { cn, pluralise } from "@/lib/utils";

/**
 * Dot-matrix world plot.
 *
 * Deliberately not a tile map: no third-party script, no API key, ~4 KB of
 * markup, and it renders identically offline. Land is approximated on a 6°
 * graticule; markers are placed with a true equirectangular projection, so
 * relative geography is honest even though the coastline is stylised.
 */

/** Land cells per 6° row, from +84° to -78° latitude. Each pair is [startCol, endCol] on a 60-column (6°) grid. */
const LAND_ROWS: [number, number][][] = [
  [[11, 17], [21, 26], [32, 33], [44, 58]],
  [[8, 18], [21, 27], [42, 59]],
  [[2, 7], [8, 19], [22, 27], [31, 34], [35, 59]],
  [[1, 7], [8, 20], [24, 27], [30, 34], [35, 59]],
  [[1, 6], [8, 21], [28, 29], [30, 34], [35, 59]],
  [[2, 21], [28, 29], [30, 36], [37, 59]],
  [[3, 21], [29, 37], [38, 50], [51, 59]],
  [[3, 20], [29, 36], [37, 44], [45, 59]],
  [[3, 19], [29, 38], [38, 43], [44, 48], [49, 59]],
  [[4, 14], [28, 40], [40, 43], [44, 47], [48, 56]],
  [[5, 13], [14, 16], [27, 36], [36, 41], [41, 43], [44, 47], [48, 53]],
  [[8, 14], [15, 17], [27, 40], [41, 42], [45, 47], [48, 53], [54, 55]],
  [[10, 14], [16, 25], [28, 40], [45, 46], [48, 53], [54, 55]],
  [[17, 26], [28, 41], [48, 56]],
  [[17, 27], [29, 41], [49, 57]],
  [[17, 27], [29, 41], [50, 59]],
  [[18, 27], [29, 40], [41, 42], [51, 59]],
  [[18, 26], [30, 39], [41, 42], [50, 59]],
  [[19, 26], [31, 38], [49, 59]],
  [[20, 25], [32, 37], [50, 58], [59, 59]],
  [[20, 24], [52, 56], [59, 59]],
  [[21, 24], [59, 59]],
  [[21, 23]],
  [],
  [[0, 59]],
  [[0, 59]],
  [[0, 59]],
];

const COLS = 60;
const TOP_LAT = 84;
const STEP = 6;

function project(lat: number, lng: number) {
  return {
    x: ((lng + 180) / 360) * 100,
    y: ((90 - lat) / 180) * 100,
  };
}

export function TravelMap({ destinations }: { destinations: DestinationCardDTO[] }) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const reduced = useReducedMotion();

  const plotted = destinations.filter(
    (d) => d.coordinates && (d.coordinates.lat !== 0 || d.coordinates.lng !== 0),
  );

  const active = plotted.find((d) => d.id === activeId) ?? null;

  if (destinations.length === 0) return null;

  return (
    <section className="section-y bg-midnight-950 text-white">
      <div className="container-page">
        <SectionHeading
          eyebrow="The atlas"
          title="Point at somewhere. We'll tell you when to go."
          description="Every marker is a place we actively plan. Tap one for the starting price, the season that actually works, and how many itineraries we run there."
          tone="dark"
          align="center"
          className="text-center"
        />

        {/* ------------------------------- Desktop map ------------------------------ */}
        <div className="relative mt-12 hidden md:block">
          <div className="relative mx-auto aspect-2/1 w-full max-w-5xl">
            {/* Land dots */}
            <svg
              viewBox="0 0 600 300"
              className="absolute inset-0 size-full"
              aria-hidden
              focusable="false"
            >
              {LAND_ROWS.map((ranges, row) =>
                ranges.flatMap(([start, end]) =>
                  Array.from({ length: end - start + 1 }, (_, i) => {
                    const col = start + i;
                    if (col >= COLS) return null;
                    const lat = TOP_LAT - row * STEP;
                    const lng = -180 + col * STEP + STEP / 2;
                    const { x, y } = project(lat, lng);
                    return (
                      <circle
                        key={`${row}-${col}`}
                        cx={(x / 100) * 600}
                        cy={(y / 100) * 300}
                        r={1.6}
                        className="fill-white/12"
                      />
                    );
                  }).filter(Boolean),
                ),
              )}
            </svg>

            {/* Markers */}
            {plotted.map((d, i) => {
              const { x, y } = project(d.coordinates.lat, d.coordinates.lng);
              const isActive = d.id === activeId;

              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setActiveId(isActive ? null : d.id)}
                  onMouseEnter={() => setActiveId(d.id)}
                  onFocus={() => setActiveId(d.id)}
                  aria-label={`${d.name}, ${d.country}`}
                  aria-expanded={isActive}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.4,
                      delay: reduced ? 0 : Math.min(i * 0.06, 1),
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="relative flex size-3 items-center justify-center"
                  >
                    {!reduced ? (
                      <span
                        className={cn(
                          "absolute inline-flex size-3 rounded-full",
                          isActive ? "bg-gild-400" : "bg-lagoon-400",
                          "animate-pulse-ring",
                        )}
                      />
                    ) : null}
                    <span
                      className={cn(
                        "relative inline-flex rounded-full ring-2 transition-all duration-300",
                        isActive
                          ? "size-3.5 bg-gild-400 ring-gild-400/40"
                          : "size-2.5 bg-lagoon-400 ring-lagoon-400/30 hover:size-3",
                      )}
                    />
                  </motion.span>

                  <span
                    className={cn(
                      "pointer-events-none absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap text-[0.625rem] font-semibold transition-opacity duration-300",
                      isActive ? "text-gild-300 opacity-100" : "text-midnight-200 opacity-0 lg:opacity-100",
                    )}
                  >
                    {d.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detail card */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
            <AnimatePresence mode="wait">
              {active ? (
                <motion.div
                  key={active.id}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="pointer-events-auto flex w-[min(34rem,90%)] items-center gap-4 rounded-2xl border border-midnight-700 bg-midnight-900 p-4"
                >
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl">
                    <SmartImage
                      src={active.heroImage}
                      alt={active.heroAlt}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[0.625rem] font-bold uppercase tracking-widest text-lagoon-300">
                      {active.country}
                    </p>
                    <p className="truncate font-display text-lg text-white">{active.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.6875rem] text-midnight-100">
                      <span className="flex items-center gap-1">
                        <CalendarRange className="size-3" aria-hidden />
                        {active.bestMonths.slice(0, 3).join(", ") || "Year-round"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="size-3" aria-hidden />
                        {pluralise(active.packageCount, "package")}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <Price amountINR={active.startingPriceINR} className="text-sm text-white" compact />
                      <span className="ml-1 text-[0.625rem] text-midnight-200">starting</span>
                    </div>
                  </div>

                  <Button asChild size="sm" variant="accent" className="shrink-0">
                    <Link href={`/destinations/${active.slug}`}>
                      Explore
                      <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                </motion.div>
              ) : (
                <motion.p
                  key="hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-midnight-300"
                >
                  Hover or tap a marker to see details
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ------------------------------ Mobile fallback --------------------------- */}
        <ul className="mt-10 grid gap-3 md:hidden">
          {plotted.slice(0, 6).map((d) => (
            <li key={d.id}>
              <Link
                href={`/destinations/${d.slug}`}
                className="flex items-center gap-3 rounded-2xl border border-midnight-800 bg-midnight-900 p-3 transition-colors active:bg-midnight-800"
              >
                <div className="relative size-14 shrink-0 overflow-hidden rounded-xl">
                  <SmartImage src={d.heroImage} alt={d.heroAlt} fill sizes="56px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{d.name}</p>
                  <p className="truncate text-xs text-midnight-200">
                    {d.country} · {pluralise(d.packageCount, "package")}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <Price amountINR={d.startingPriceINR} className="text-sm text-white" compact />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
