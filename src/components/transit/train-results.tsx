"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Train, Clock, Star, MapPin, Info, ChevronDown, RotateCcw } from "lucide-react";
import type { TrainRoute } from "@/server/transit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { Price } from "@/components/ui/price";
import { Checkbox } from "@/components/ui/field";
import { Dialog, DialogContent } from "@/components/ui/overlays";
import { buildQueryString, cn } from "@/lib/utils";

interface Filters {
  classes: string[];
  trainTypes: string[];
  maxPrice: number;
}

const TRAIN_TYPES = [
  { value: "express", label: "Express" },
  { value: "superfast", label: "Superfast" },
  { value: "vande-bharat", label: "Vande Bharat" },
  { value: "rajdhani", label: "Rajdhani" },
  { value: "shatabdi", label: "Shatabdi" },
];

type SortKey = "price" | "duration" | "depart";

export function TrainResults({
  routes,
  query,
}: {
  routes: TrainRoute[];
  query: Record<string, string>;
}) {
  const router = useRouter();
  const [sort, setSort] = React.useState<SortKey>("price");
  const [detail, setDetail] = React.useState<TrainRoute | null>(null);

  const priceCeiling = React.useMemo(
    () => (routes.length ? Math.max(...routes.map((r) => r.startingPriceINR)) : 0),
    [routes],
  );

  const allClasses = React.useMemo(() => {
    const map = new Map<string, string>();
    routes.forEach((r) => r.classes.forEach((c) => map.set(c.code, c.label)));
    return [...map.entries()].sort();
  }, [routes]);

  const [filters, setFilters] = React.useState<Filters>({
    classes: [],
    trainTypes: [],
    maxPrice: priceCeiling,
  });

  React.useEffect(() => {
    setFilters((f) => ({ ...f, maxPrice: priceCeiling }));
  }, [priceCeiling]);

  const filtered = React.useMemo(() => {
    const result = routes.filter((r) => {
      if (filters.classes.length && !r.classes.some((c) => filters.classes.includes(c.code))) return false;
      if (filters.trainTypes.length && !filters.trainTypes.includes(r.trainType)) return false;
      if (filters.maxPrice && r.startingPriceINR > filters.maxPrice) return false;
      return true;
    });

    return result.sort((a, b) => {
      if (sort === "price") return a.startingPriceINR - b.startingPriceINR;
      if (sort === "duration") return a.durationMinutes - b.durationMinutes;
      return a.departureTime.localeCompare(b.departureTime) || 0;
    });
  }, [routes, filters, sort]);

  const select = (route: TrainRoute) => {
    router.push(`/train/review${buildQueryString({ ...query, offer: route.id })}`);
  };

  const reset = () =>
    setFilters({ classes: [], trainTypes: [], maxPrice: priceCeiling });

  const activeFilters =
    filters.classes.length + filters.trainTypes.length + (filters.maxPrice < priceCeiling ? 1 : 0);

  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
      <aside aria-label="Train filters" className="lg:sticky lg:top-28 lg:h-fit">
        <div className="rounded-2xl border border-hairline bg-white p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-midnight-900">Filters</h2>
            {activeFilters > 0 ? (
              <button
                type="button"
                onClick={reset}
                className="flex items-center gap-1 text-xs font-semibold text-lagoon-700 hover:underline"
              >
                <RotateCcw className="size-3" aria-hidden />
                Reset
              </button>
            ) : null}
          </div>

          <div className="space-y-6">
            <fieldset>
              <legend className="mb-2.5 text-[0.8125rem] font-semibold text-midnight-800">Train type</legend>
              <div className="space-y-2">
                {TRAIN_TYPES.map((t) => (
                  <Checkbox
                    key={t.value}
                    id={`type-${t.value}`}
                    checked={filters.trainTypes.includes(t.value)}
                    label={t.label}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        trainTypes: e.target.checked
                          ? [...f.trainTypes, t.value]
                          : f.trainTypes.filter((v) => v !== t.value),
                      }))
                    }
                  />
                ))}
              </div>
            </fieldset>

            {allClasses.length ? (
              <fieldset>
                <legend className="mb-2.5 text-[0.8125rem] font-semibold text-midnight-800">Class</legend>
                <div className="space-y-2">
                  {allClasses.map(([code, label]) => (
                    <Checkbox
                      key={code}
                      id={`class-${code}`}
                      checked={filters.classes.includes(code)}
                      label={label}
                      onChange={(e) =>
                        setFilters((f) => ({
                          ...f,
                          classes: e.target.checked
                            ? [...f.classes, code]
                            : f.classes.filter((v) => v !== code),
                        }))
                      }
                    />
                  ))}
                </div>
              </fieldset>
            ) : null}

            {priceCeiling > 0 ? (
              <fieldset>
                <legend className="mb-2.5 text-[0.8125rem] font-semibold text-midnight-800">
                  Max price
                </legend>
                <input
                  type="range"
                  min={0}
                  max={priceCeiling}
                  step={100}
                  value={filters.maxPrice}
                  onChange={(e) => setFilters((f) => ({ ...f, maxPrice: Number(e.target.value) }))}
                  className="w-full accent-lagoon-600"
                  aria-label="Maximum price"
                />
                <p className="mt-1.5 text-right text-xs font-semibold text-midnight-900">
                  <Price amountINR={filters.maxPrice} className="text-xs" />
                </p>
              </fieldset>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted" aria-live="polite">
            <span className="font-semibold text-midnight-900">{filtered.length}</span>{" "}
            {filtered.length === 1 ? "train" : "trains"}
            {activeFilters > 0 ? " after filters" : ""}
          </p>

          <div className="flex gap-1 rounded-full border border-hairline p-1" role="group" aria-label="Sort trains">
            {(
              [
                ["price", "Cheapest"],
                ["duration", "Fastest"],
                ["depart", "Departure"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSort(key)}
                aria-pressed={sort === key}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  sort === key ? "bg-midnight-900 text-white" : "text-midnight-600 hover:bg-sand-100",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-hairline bg-sand-50 p-12 text-center">
            <Train className="mx-auto size-8 text-midnight-300" aria-hidden />
            <h3 className="mt-4 text-lg text-midnight-900">No trains match those filters</h3>
            <p className="mt-2 text-sm text-muted">Loosen a filter, or reset and start again.</p>
            <Button variant="outline" className="mt-5" onClick={reset}>
              Reset filters
            </Button>
          </div>
        ) : (
          <ul className="space-y-4">
            {filtered.map((route) => (
              <li key={route.id}>
                <TrainCard route={route} onSelect={() => select(route)} onDetails={() => setDetail(route)} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        {detail ? (
          <DialogContent title="Train details" size="lg">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-midnight-900">
                    {detail.trainNumber} · {detail.trainName}
                  </p>
                  <p className="text-sm text-muted capitalize">{detail.trainType.replace(/-/g, " ")}</p>
                </div>
                <Price amountINR={detail.startingPriceINR} className="text-2xl" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-hairline p-4">
                  <p className="text-xs text-muted">Departs</p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-midnight-900">{detail.departureTime}</p>
                  <p className="text-sm text-muted">{detail.from}</p>
                </div>
                <div className="rounded-xl border border-hairline p-4">
                  <p className="text-xs text-muted">Arrives</p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-midnight-900">{detail.arrivalTime}</p>
                  <p className="text-sm text-muted">{detail.to}</p>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-bold text-midnight-900">Available classes</h3>
                <div className="space-y-2">
                  {detail.classes.map((c) => (
                    <div key={c.code} className="flex items-center justify-between rounded-lg border border-hairline px-4 py-3">
                      <span className="text-sm font-medium text-midnight-800">{c.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted">{c.available} seats</span>
                        <Price amountINR={c.priceINR} className="text-sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl bg-sand-50 p-4">
                <div>
                  <p className="text-xs text-muted">Starting from</p>
                  <Price amountINR={detail.startingPriceINR} className="text-xl" />
                </div>
                <Button variant="accent" size="lg" onClick={() => select(detail)}>
                  Book now
                </Button>
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}

function TrainCard({
  route,
  onSelect,
  onDetails,
}: {
  route: TrainRoute;
  onSelect: () => void;
  onDetails: () => void;
}) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const runningDays = route.daysOfWeek.map((d) => days[d]).join(" ");

  return (
    <article className="rounded-2xl border border-hairline bg-white p-5 transition-shadow hover:shadow-tile">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-lagoon-50 text-lagoon-700">
              <Train className="size-5" aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-midnight-900">
                {route.trainNumber} · {route.trainName}
              </p>
              <p className="text-xs text-muted capitalize">{route.trainType.replace(/-/g, " ")}</p>
            </div>
            <span className="ml-auto flex items-center gap-1 rounded-full bg-gild-50 px-2 py-1 text-xs font-semibold text-gild-700">
              <Star className="size-3" aria-hidden />
              {route.rating}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div>
              <p className="text-lg font-bold tabular-nums text-midnight-900">{route.departureTime}</p>
              <p className="flex items-center gap-1 text-xs text-muted">
                <MapPin className="size-3" aria-hidden />
                {route.from}
              </p>
            </div>

            <div className="flex-1 text-center">
              <p className="text-xs text-muted">{route.durationHours}h {route.durationMinutes}m</p>
              <div className="relative my-1 h-px bg-hairline">
                <Train className="absolute -top-[7px] left-1/2 size-3.5 -translate-x-1/2 bg-white text-lagoon-600" aria-hidden />
              </div>
              <p className="text-[0.625rem] font-medium text-muted">{runningDays}</p>
            </div>

            <div className="text-right">
              <p className="text-lg font-bold tabular-nums text-midnight-900">{route.arrivalTime}</p>
              <p className="flex items-center justify-end gap-1 text-xs text-muted">
                {route.to}
                <MapPin className="size-3" aria-hidden />
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {route.classes.map((c) => (
              <span key={c.code} className="rounded-md bg-sand-100 px-2 py-1 text-[0.625rem] font-semibold text-midnight-600">
                {c.label}
              </span>
            ))}
          </div>
        </div>

        <div className="shrink-0 lg:w-44 lg:border-l lg:border-hairline lg:pl-5">
          <div className="lg:text-right">
            <Price amountINR={route.startingPriceINR} className="text-xl" />
            <p className="text-[0.625rem] text-muted">per person</p>
          </div>
          <div className="mt-3 flex gap-2 lg:justify-end">
            <Button variant="accent" onClick={onSelect} className="lg:w-full">
              Book
            </Button>
            <Button variant="ghost" size="sm" onClick={onDetails} className="lg:w-full">
              Details
              <ChevronDown aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
