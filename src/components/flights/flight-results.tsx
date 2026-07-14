"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plane, Clock, Briefcase, Info, ChevronDown, RotateCcw, Luggage } from "lucide-react";
import type { FlightOffer } from "@/server/flights/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { Price } from "@/components/ui/price";
import { Checkbox } from "@/components/ui/field";
import { Dialog, DialogContent } from "@/components/ui/overlays";
import { DataSourceBadge } from "./data-source-badge";
import { buildQueryString, cn, formatMinutes } from "@/lib/utils";
import type { DataSource } from "@/config/site";

interface Filters {
  airlines: string[];
  stops: number[];
  departWindows: string[];
  refundableOnly: boolean;
  maxPrice: number;
}

const DEPART_WINDOWS = [
  { key: "early", label: "Before 6 am", test: (h: number) => h < 6 },
  { key: "morning", label: "6 am – 12 pm", test: (h: number) => h >= 6 && h < 12 },
  { key: "afternoon", label: "12 pm – 6 pm", test: (h: number) => h >= 12 && h < 18 },
  { key: "evening", label: "After 6 pm", test: (h: number) => h >= 18 },
];

type SortKey = "price" | "duration" | "depart" | "arrive";

export function FlightResults({
  offers,
  dataSource,
  notice,
  query,
}: {
  offers: FlightOffer[];
  dataSource: DataSource;
  notice?: string;
  query: Record<string, string>;
}) {
  const router = useRouter();
  const [sort, setSort] = React.useState<SortKey>("price");
  const [detail, setDetail] = React.useState<FlightOffer | null>(null);

  const priceCeiling = React.useMemo(
    () => (offers.length ? Math.max(...offers.map((o) => o.fare.totalForPartyINR)) : 0),
    [offers],
  );

  const [filters, setFilters] = React.useState<Filters>({
    airlines: [],
    stops: [],
    departWindows: [],
    refundableOnly: false,
    maxPrice: 0,
  });

  // Resets the price ceiling filter whenever the underlying result set changes.
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilters((f) => ({ ...f, maxPrice: priceCeiling }));
  }, [priceCeiling]);

  const airlines = React.useMemo(() => {
    const map = new Map<string, { code: string; name: string; minFare: number }>();
    for (const o of offers) {
      const existing = map.get(o.airlineCode);
      if (!existing || o.fare.totalForPartyINR < existing.minFare) {
        map.set(o.airlineCode, {
          code: o.airlineCode,
          name: o.airlineName,
          minFare: o.fare.totalForPartyINR,
        });
      }
    }
    return [...map.values()].sort((a, b) => a.minFare - b.minFare);
  }, [offers]);

  const filtered = React.useMemo(() => {
    const result = offers.filter((o) => {
      if (filters.airlines.length && !filters.airlines.includes(o.airlineCode)) return false;
      if (filters.stops.length && !filters.stops.includes(Math.min(o.stops, 2))) return false;
      if (filters.refundableOnly && !o.fare.refundable) return false;
      if (filters.maxPrice && o.fare.totalForPartyINR > filters.maxPrice) return false;

      if (filters.departWindows.length) {
        const hour = new Date(o.outbound[0].departAt).getHours();
        const matches = filters.departWindows.some((key) =>
          DEPART_WINDOWS.find((w) => w.key === key)?.test(hour),
        );
        if (!matches) return false;
      }

      return true;
    });

    return result.sort((a, b) => {
      if (sort === "price") return a.fare.totalForPartyINR - b.fare.totalForPartyINR;
      if (sort === "duration") return a.totalDurationMinutes - b.totalDurationMinutes;
      if (sort === "depart") {
        return new Date(a.outbound[0].departAt).getTime() - new Date(b.outbound[0].departAt).getTime();
      }
      const aLast = a.outbound[a.outbound.length - 1];
      const bLast = b.outbound[b.outbound.length - 1];
      return new Date(aLast.arriveAt).getTime() - new Date(bLast.arriveAt).getTime();
    });
  }, [offers, filters, sort]);

  const select = (offer: FlightOffer) => {
    router.push(`/flights/review${buildQueryString({ ...query, offer: offer.id })}`);
  };

  const reset = () =>
    setFilters({ airlines: [], stops: [], departWindows: [], refundableOnly: false, maxPrice: priceCeiling });

  const activeFilters =
    filters.airlines.length +
    filters.stops.length +
    filters.departWindows.length +
    (filters.refundableOnly ? 1 : 0) +
    (filters.maxPrice < priceCeiling ? 1 : 0);

  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
      {/* -------------------------------- Filters -------------------------------- */}
      <aside aria-label="Flight filters" className="lg:sticky lg:top-28 lg:h-fit">
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
              <legend className="mb-2.5 text-[0.8125rem] font-semibold text-midnight-800">Stops</legend>
              <div className="space-y-2">
                {[
                  { value: 0, label: "Non-stop" },
                  { value: 1, label: "1 stop" },
                  { value: 2, label: "2+ stops" },
                ].map((s) => (
                  <Checkbox
                    key={s.value}
                    id={`stops-${s.value}`}
                    checked={filters.stops.includes(s.value)}
                    label={s.label}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        stops: e.target.checked
                          ? [...f.stops, s.value]
                          : f.stops.filter((v) => v !== s.value),
                      }))
                    }
                  />
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2.5 text-[0.8125rem] font-semibold text-midnight-800">
                Departure time
              </legend>
              <div className="space-y-2">
                {DEPART_WINDOWS.map((w) => (
                  <Checkbox
                    key={w.key}
                    id={`depart-${w.key}`}
                    checked={filters.departWindows.includes(w.key)}
                    label={w.label}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        departWindows: e.target.checked
                          ? [...f.departWindows, w.key]
                          : f.departWindows.filter((v) => v !== w.key),
                      }))
                    }
                  />
                ))}
              </div>
            </fieldset>

            {airlines.length ? (
              <fieldset>
                <legend className="mb-2.5 text-[0.8125rem] font-semibold text-midnight-800">Airlines</legend>
                <div className="space-y-2">
                  {airlines.map((a) => (
                    <div key={a.code} className="flex items-center justify-between gap-2">
                      <Checkbox
                        id={`airline-${a.code}`}
                        checked={filters.airlines.includes(a.code)}
                        label={a.name}
                        onChange={(e) =>
                          setFilters((f) => ({
                            ...f,
                            airlines: e.target.checked
                              ? [...f.airlines, a.code]
                              : f.airlines.filter((v) => v !== a.code),
                          }))
                        }
                      />
                      <Price
                        amountINR={a.minFare}
                        className="shrink-0 text-[0.6875rem] font-medium text-muted"
                        compact
                      />
                    </div>
                  ))}
                </div>
              </fieldset>
            ) : null}

            <fieldset>
              <legend className="mb-2.5 text-[0.8125rem] font-semibold text-midnight-800">Fare type</legend>
              <Checkbox
                id="refundable"
                checked={filters.refundableOnly}
                label="Refundable fares only"
                onChange={(e) => setFilters((f) => ({ ...f, refundableOnly: e.target.checked }))}
              />
            </fieldset>

            {priceCeiling > 0 ? (
              <fieldset>
                <legend className="mb-2.5 text-[0.8125rem] font-semibold text-midnight-800">
                  Max total price
                </legend>
                <input
                  type="range"
                  min={0}
                  max={priceCeiling}
                  step={500}
                  value={filters.maxPrice}
                  onChange={(e) => setFilters((f) => ({ ...f, maxPrice: Number(e.target.value) }))}
                  className="w-full accent-lagoon-600"
                  aria-label="Maximum total price"
                />
                <p className="mt-1.5 text-right text-xs font-semibold text-midnight-900">
                  <Price amountINR={filters.maxPrice} className="text-xs" />
                </p>
              </fieldset>
            ) : null}
          </div>
        </div>
      </aside>

      {/* -------------------------------- Results -------------------------------- */}
      <div className="min-w-0">
        {notice ? (
          <p className="mb-5 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[0.8125rem] leading-relaxed text-amber-900">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            {notice}
          </p>
        ) : null}

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted" aria-live="polite">
            <span className="font-semibold text-midnight-900">{filtered.length}</span>{" "}
            {filtered.length === 1 ? "flight" : "flights"}
            {activeFilters > 0 ? " after filters" : ""}
          </p>

          <div className="flex gap-1 rounded-full border border-hairline p-1" role="group" aria-label="Sort flights">
            {(
              [
                ["price", "Cheapest"],
                ["duration", "Fastest"],
                ["depart", "Departure"],
                ["arrive", "Arrival"],
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
            <Plane className="mx-auto size-8 text-midnight-300" aria-hidden />
            <h3 className="mt-4 text-lg text-midnight-900">No flights match those filters</h3>
            <p className="mt-2 text-sm text-muted">Loosen a filter, or reset and start again.</p>
            <Button variant="outline" className="mt-5" onClick={reset}>
              Reset filters
            </Button>
          </div>
        ) : (
          <ul className="space-y-4">
            {filtered.map((offer) => (
              <li key={offer.id}>
                <OfferCard
                  offer={offer}
                  dataSource={dataSource}
                  onSelect={() => select(offer)}
                  onDetails={() => setDetail(offer)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* -------------------------------- Details -------------------------------- */}
      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        {detail ? (
          <DialogContent title="Flight details" size="lg">
            <div className="space-y-6">
              <ItinerarySegments title="Outbound" segments={detail.outbound} />
              {detail.inbound ? <ItinerarySegments title="Return" segments={detail.inbound} /> : null}

              <div>
                <h3 className="mb-3 text-sm font-bold text-midnight-900">Baggage</h3>
                <ul className="flex flex-wrap gap-2">
                  <li className="flex items-center gap-1.5 rounded-lg bg-sand-100 px-3 py-2 text-xs font-medium text-midnight-700">
                    <Luggage className="size-3.5" aria-hidden />
                    {detail.fare.baggage}
                  </li>
                  <li className="flex items-center gap-1.5 rounded-lg bg-sand-100 px-3 py-2 text-xs font-medium text-midnight-700">
                    <Briefcase className="size-3.5" aria-hidden />
                    {detail.fare.cabinBaggage}
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-bold text-midnight-900">Fare rules</h3>
                <ul className="space-y-1.5">
                  {detail.fare.fareRules.map((rule) => (
                    <li key={rule} className="text-[0.8125rem] leading-relaxed text-muted">
                      • {rule}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl bg-sand-50 p-4">
                <div>
                  <p className="text-xs text-muted">Total for all travellers</p>
                  <Price amountINR={detail.fare.totalForPartyINR} className="text-xl" />
                </div>
                <Button variant="accent" size="lg" onClick={() => select(detail)}>
                  Select this flight
                </Button>
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function OfferCard({
  offer,
  dataSource,
  onSelect,
  onDetails,
}: {
  offer: FlightOffer;
  dataSource: DataSource;
  onSelect: () => void;
  onDetails: () => void;
}) {
  return (
    <article className="rounded-2xl border border-hairline bg-white p-5 transition-shadow hover:shadow-tile">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1 space-y-4">
          <Leg segments={offer.outbound} stops={offer.stops} />
          {offer.inbound ? (
            <>
              <hr className="border-hairline" />
              <Leg segments={offer.inbound} stops={0} isReturn />
            </>
          ) : null}
        </div>

        <div className="shrink-0 border-hairline lg:w-52 lg:border-l lg:pl-5">
          <div className="flex items-end justify-between gap-3 lg:flex-col lg:items-end">
            <div className="lg:text-right">
              <Price amountINR={offer.fare.totalForPartyINR} className="text-2xl" />
              <p className="text-[0.625rem] text-muted">total, all travellers</p>
              <div className="mt-1.5">
                <DataSourceBadge source={dataSource} />
              </div>
            </div>

            <div className="flex gap-2 lg:mt-4 lg:w-full lg:flex-col">
              <Button variant="accent" onClick={onSelect} className="lg:w-full">
                Select
              </Button>
              <Button variant="ghost" size="sm" onClick={onDetails} className="lg:w-full">
                Details
                <ChevronDown aria-hidden />
              </Button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5 lg:justify-end">
            {offer.fare.refundable ? (
              <Badge tone="success" size="sm">
                Refundable
              </Badge>
            ) : (
              <Badge tone="neutral" size="sm">
                Non-refundable
              </Badge>
            )}
            {offer.fare.seatsRemaining && offer.fare.seatsRemaining <= 4 ? (
              <Badge tone="sunset" size="sm">
                {offer.fare.seatsRemaining} seats left
              </Badge>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function Leg({
  segments,
  stops,
  isReturn,
}: {
  segments: FlightOffer["outbound"];
  stops: number;
  isReturn?: boolean;
}) {
  const first = segments[0];
  const last = segments[segments.length - 1];

  const total = segments.reduce((sum, s) => sum + s.durationMinutes, 0);

  const time = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div className="flex items-center gap-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sand-100 text-[0.6875rem] font-bold text-midnight-800">
        {first.airlineCode}
      </div>

      <div className="grid flex-1 grid-cols-[auto_1fr_auto] items-center gap-3">
        <div>
          <p className="text-lg font-bold tabular-nums text-midnight-900">{time(first.departAt)}</p>
          <p className="text-xs text-muted">{first.from}</p>
        </div>

        <div className="text-center">
          <p className="flex items-center justify-center gap-1 text-[0.6875rem] text-muted">
            <Clock className="size-3" aria-hidden />
            {formatMinutes(total)}
          </p>
          <div className="relative my-1 h-px bg-hairline">
            <Plane
              className={cn(
                "absolute -top-[7px] left-1/2 size-3.5 -translate-x-1/2 bg-white text-lagoon-600",
                isReturn && "rotate-180",
              )}
              aria-hidden
            />
          </div>
          <p className="text-[0.6875rem] font-medium text-muted">
            {stops === 0 ? "Non-stop" : `${stops} ${stops === 1 ? "stop" : "stops"}`}
            {segments.length > 1 ? ` · ${segments[0].to}` : ""}
          </p>
        </div>

        <div className="text-right">
          <p className="text-lg font-bold tabular-nums text-midnight-900">{time(last.arriveAt)}</p>
          <p className="text-xs text-muted">{last.to}</p>
        </div>
      </div>

      <p className="hidden w-28 shrink-0 truncate text-xs text-muted sm:block">{first.airlineName}</p>
    </div>
  );
}

function ItinerarySegments({
  title,
  segments,
}: {
  title: string;
  segments: FlightOffer["outbound"];
}) {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  return (
    <div>
      <h3 className="mb-3 text-sm font-bold text-midnight-900">{title}</h3>
      <ol className="space-y-3">
        {segments.map((s, i) => (
          <li key={`${s.flightNumber}-${i}`} className="rounded-xl border border-hairline p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-midnight-900">
                {s.airlineName} · {s.flightNumber}
              </p>
              <p className="text-xs text-muted">{formatMinutes(s.durationMinutes)}</p>
            </div>
            <div className="mt-2.5 grid gap-2 text-[0.8125rem] sm:grid-cols-2">
              <p className="text-muted">
                <span className="font-semibold text-midnight-800">{s.from}</span> {fmt(s.departAt)}
                <span className="block text-xs">{s.fromAirport}</span>
              </p>
              <p className="text-muted sm:text-right">
                <span className="font-semibold text-midnight-800">{s.to}</span> {fmt(s.arriveAt)}
                <span className="block text-xs">{s.toAirport}</span>
              </p>
            </div>
            {s.aircraft ? <p className="mt-2 text-xs text-muted">Aircraft: {s.aircraft}</p> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
