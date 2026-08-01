"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bus, Clock, Star, MapPin, Info, ChevronDown, RotateCcw } from "lucide-react";
import type { BusRoute } from "@/server/transit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { Price } from "@/components/ui/price";
import { Checkbox } from "@/components/ui/field";
import { Dialog, DialogContent } from "@/components/ui/overlays";
import { buildQueryString, cn } from "@/lib/utils";

interface Filters {
  types: string[];
  maxPrice: number;
  amenities: string[];
}

const BUS_TYPES = [
  { value: "ac-sleeper", label: "AC Sleeper" },
  { value: "non-ac-sleeper", label: "Non-AC Sleeper" },
  { value: "ac-seater", label: "AC Seater" },
  { value: "non-ac-seater", label: "Non-AC Seater" },
  { value: "volvo", label: "Volvo" },
];

const AMENITIES = ["WiFi", "Charging", "Blanket", "Water", "Snacks", "Reading light", "Reclining seat"];

type SortKey = "price" | "duration" | "depart";

export function BusResults({
  routes,
  query,
}: {
  routes: BusRoute[];
  query: Record<string, string>;
}) {
  const router = useRouter();
  const [sort, setSort] = React.useState<SortKey>("price");
  const [detail, setDetail] = React.useState<BusRoute | null>(null);

  const priceCeiling = React.useMemo(
    () => (routes.length ? Math.max(...routes.map((r) => r.startingPriceINR)) : 0),
    [routes],
  );

  const allAmenities = React.useMemo(() => {
    const set = new Set<string>();
    routes.forEach((r) => r.amenities.forEach((a) => set.add(a)));
    return [...set];
  }, [routes]);

  const [filters, setFilters] = React.useState<Filters>({
    types: [],
    maxPrice: priceCeiling,
    amenities: [],
  });

  React.useEffect(() => {
    setFilters((f) => ({ ...f, maxPrice: priceCeiling }));
  }, [priceCeiling]);

  const filtered = React.useMemo(() => {
    const result = routes.filter((r) => {
      if (filters.types.length && !filters.types.includes(r.type)) return false;
      if (filters.maxPrice && r.startingPriceINR > filters.maxPrice) return false;
      if (filters.amenities.length && !filters.amenities.every((a) => r.amenities.includes(a))) return false;
      return true;
    });

    return result.sort((a, b) => {
      if (sort === "price") return a.startingPriceINR - b.startingPriceINR;
      if (sort === "duration") return a.durationMinutes - b.durationMinutes;
      return a.departureTime.localeCompare(b.departureTime) || 0;
    });
  }, [routes, filters, sort]);

  const select = (route: BusRoute) => {
    router.push(`/bus/review${buildQueryString({ ...query, offer: route.id })}`);
  };

  const reset = () =>
    setFilters({ types: [], maxPrice: priceCeiling, amenities: [] });

  const activeFilters =
    filters.types.length + filters.amenities.length + (filters.maxPrice < priceCeiling ? 1 : 0);

  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
      <aside aria-label="Bus filters" className="lg:sticky lg:top-28 lg:h-fit">
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
              <legend className="mb-2.5 text-[0.8125rem] font-semibold text-midnight-800">Bus type</legend>
              <div className="space-y-2">
                {BUS_TYPES.map((t) => (
                  <Checkbox
                    key={t.value}
                    id={`type-${t.value}`}
                    checked={filters.types.includes(t.value)}
                    label={t.label}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        types: e.target.checked
                          ? [...f.types, t.value]
                          : f.types.filter((v) => v !== t.value),
                      }))
                    }
                  />
                ))}
              </div>
            </fieldset>

            {allAmenities.length ? (
              <fieldset>
                <legend className="mb-2.5 text-[0.8125rem] font-semibold text-midnight-800">Amenities</legend>
                <div className="space-y-2">
                  {allAmenities.map((a) => (
                    <Checkbox
                      key={a}
                      id={`amenity-${a}`}
                      checked={filters.amenities.includes(a)}
                      label={a}
                      onChange={(e) =>
                        setFilters((f) => ({
                          ...f,
                          amenities: e.target.checked
                            ? [...f.amenities, a]
                            : f.amenities.filter((v) => v !== a),
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
                  step={50}
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
            {filtered.length === 1 ? "bus" : "buses"}
            {activeFilters > 0 ? " after filters" : ""}
          </p>

          <div className="flex gap-1 rounded-full border border-hairline p-1" role="group" aria-label="Sort buses">
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
            <Bus className="mx-auto size-8 text-midnight-300" aria-hidden />
            <h3 className="mt-4 text-lg text-midnight-900">No buses match those filters</h3>
            <p className="mt-2 text-sm text-muted">Loosen a filter, or reset and start again.</p>
            <Button variant="outline" className="mt-5" onClick={reset}>
              Reset filters
            </Button>
          </div>
        ) : (
          <ul className="space-y-4">
            {filtered.map((route) => (
              <li key={route.id}>
                <BusCard route={route} onSelect={() => select(route)} onDetails={() => setDetail(route)} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        {detail ? (
          <DialogContent title="Bus details" size="lg">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-midnight-900">{detail.operator}</p>
                  <p className="text-sm text-muted capitalize">{detail.type.replace(/-/g, " ")}</p>
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
                <h3 className="mb-2 text-sm font-bold text-midnight-900">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {detail.amenities.map((a) => (
                    <span key={a} className="rounded-lg bg-sand-100 px-3 py-1.5 text-xs font-medium text-midnight-700">
                      {a}
                    </span>
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

function BusCard({
  route,
  onSelect,
  onDetails,
}: {
  route: BusRoute;
  onSelect: () => void;
  onDetails: () => void;
}) {
  return (
    <article className="rounded-2xl border border-hairline bg-white p-5 transition-shadow hover:shadow-tile">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-lagoon-50 text-lagoon-700">
              <Bus className="size-5" aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-midnight-900">{route.operator}</p>
              <p className="text-xs text-muted capitalize">{route.type.replace(/-/g, " ")}</p>
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
                <Bus className="absolute -top-[7px] left-1/2 size-3.5 -translate-x-1/2 bg-white text-lagoon-600" aria-hidden />
              </div>
              <p className="text-[0.625rem] font-medium text-muted capitalize">{route.type.replace(/-/g, " ")}</p>
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
            {route.amenities.map((a) => (
              <span key={a} className="rounded-md bg-sand-100 px-2 py-1 text-[0.625rem] font-semibold text-midnight-600">
                {a}
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
