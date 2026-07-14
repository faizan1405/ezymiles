"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, LayoutGrid, Rows3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Select } from "@/components/ui/field";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/overlays";
import { HOTEL_CATEGORIES, TRIP_TYPES } from "@/config/site";
import { cn, formatPrice } from "@/lib/utils";

export interface FilterState {
  scope?: string;
  tripType?: string;
  minPrice?: string;
  maxPrice?: string;
  minDuration?: string;
  maxDuration?: string;
  hotelCategory?: string[];
  flightsIncluded?: string;
  mealsIncluded?: string;
  activitiesIncluded?: string;
  minRating?: string;
  tripStyle?: string;
  fixedDeparture?: string;
  instantConfirmation?: string;
  departureCity?: string;
  destination?: string;
  season?: string;
}

const PRICE_MAX = 500_000;
const SEASONS = ["Spring", "Summer", "Monsoon", "Autumn", "Winter"];

/**
 * Filters write straight to the URL. That keeps the results server-rendered and
 * shareable, and the back button behaves the way people expect.
 */
export function PackageFilters({
  destinations,
  departureCities,
  total,
  view,
  sort,
}: {
  destinations: { name: string; slug: string }[];
  departureCities: string[];
  total: number;
  view: "grid" | "list";
  sort: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = React.useState(false);

  const setParam = React.useCallback(
    (updates: Record<string, string | string[] | undefined>) => {
      const next = new URLSearchParams(params.toString());

      for (const [key, value] of Object.entries(updates)) {
        next.delete(key);
        if (Array.isArray(value)) {
          value.forEach((v) => next.append(key, v));
        } else if (value) {
          next.set(key, value);
        }
      }

      // Any filter change resets to the first page.
      if (!("page" in updates)) next.delete("page");

      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  const get = (key: string) => params.get(key) ?? "";
  const getAll = (key: string) => params.getAll(key);
  const isOn = (key: string) => params.get(key) === "1";

  const activeCount = [
    "scope",
    "tripType",
    "minPrice",
    "maxPrice",
    "minDuration",
    "maxDuration",
    "hotelCategory",
    "flightsIncluded",
    "mealsIncluded",
    "activitiesIncluded",
    "minRating",
    "tripStyle",
    "fixedDeparture",
    "instantConfirmation",
    "departureCity",
    "destination",
    "season",
  ].filter((k) => params.getAll(k).length > 0).length;

  const clearAll = () => router.push(pathname, { scroll: false });

  const setView = (next: "grid" | "list") => setParam({ view: next, page: undefined });

  const panel = (
    <div className="space-y-7">
      <Group title="Destination">
        <Select value={get("destination")} onChange={(e) => setParam({ destination: e.target.value })}>
          <option value="">All destinations</option>
          {destinations.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
        </Select>
      </Group>

      <Group title="Region">
        <div className="flex gap-2">
          {[
            ["", "All"],
            ["domestic", "India"],
            ["international", "International"],
          ].map(([value, label]) => (
            <Chip
              key={label}
              active={get("scope") === value}
              onClick={() => setParam({ scope: value || undefined })}
            >
              {label}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Price per person">
        <PriceRange
          min={Number(get("minPrice")) || 0}
          max={Number(get("maxPrice")) || PRICE_MAX}
          onCommit={(min, max) =>
            setParam({
              minPrice: min > 0 ? String(min) : undefined,
              maxPrice: max < PRICE_MAX ? String(max) : undefined,
            })
          }
        />
      </Group>

      <Group title="Duration">
        <div className="flex flex-wrap gap-2">
          {[
            ["", "", "Any"],
            ["1", "3", "1 – 3 days"],
            ["4", "6", "4 – 6 days"],
            ["7", "9", "7 – 9 days"],
            ["10", "", "10+ days"],
          ].map(([min, max, label]) => {
            const active = get("minDuration") === min && get("maxDuration") === max;
            return (
              <Chip
                key={label}
                active={active}
                onClick={() =>
                  setParam({ minDuration: min || undefined, maxDuration: max || undefined })
                }
              >
                {label}
              </Chip>
            );
          })}
        </div>
      </Group>

      <Group title="Trip type">
        <div className="flex flex-wrap gap-2">
          {TRIP_TYPES.map((t) => (
            <Chip
              key={t.slug}
              active={get("tripType") === t.slug}
              onClick={() => setParam({ tripType: get("tripType") === t.slug ? undefined : t.slug })}
            >
              {t.label}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Hotel category">
        <div className="space-y-2">
          {HOTEL_CATEGORIES.map((h) => {
            const selected = getAll("hotelCategory");
            const checked = selected.includes(String(h.value));
            return (
              <Checkbox
                key={h.value}
                id={`hc-${h.value}`}
                checked={checked}
                label={h.label}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...selected, String(h.value)]
                    : selected.filter((v) => v !== String(h.value));
                  setParam({ hotelCategory: next });
                }}
              />
            );
          })}
        </div>
      </Group>

      <Group title="Inclusions">
        <div className="space-y-2">
          {[
            ["flightsIncluded", "Flights included"],
            ["mealsIncluded", "Meals included"],
            ["activitiesIncluded", "Activities included"],
          ].map(([key, label]) => (
            <Checkbox
              key={key}
              id={`inc-${key}`}
              checked={isOn(key)}
              label={label}
              onChange={(e) => setParam({ [key]: e.target.checked ? "1" : undefined })}
            />
          ))}
        </div>
      </Group>

      <Group title="Trip style">
        <div className="flex gap-2">
          {[
            ["", "Any"],
            ["private", "Private"],
            ["group", "Group"],
          ].map(([value, label]) => (
            <Chip
              key={label}
              active={get("tripStyle") === value}
              onClick={() => setParam({ tripStyle: value || undefined })}
            >
              {label}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Booking options">
        <div className="space-y-2">
          <Checkbox
            id="fixedDeparture"
            checked={isOn("fixedDeparture")}
            label="Fixed departure dates"
            onChange={(e) => setParam({ fixedDeparture: e.target.checked ? "1" : undefined })}
          />
          <Checkbox
            id="instantConfirmation"
            checked={isOn("instantConfirmation")}
            label="Instant confirmation"
            onChange={(e) => setParam({ instantConfirmation: e.target.checked ? "1" : undefined })}
          />
        </div>
      </Group>

      <Group title="Rating">
        <div className="flex gap-2">
          {["", "3", "4", "4.5"].map((r) => (
            <Chip
              key={r || "any"}
              active={get("minRating") === r}
              onClick={() => setParam({ minRating: r || undefined })}
            >
              {r ? `${r}★ +` : "Any"}
            </Chip>
          ))}
        </div>
      </Group>

      {departureCities.length ? (
        <Group title="Departure city">
          <Select
            value={get("departureCity")}
            onChange={(e) => setParam({ departureCity: e.target.value || undefined })}
          >
            <option value="">Any city</option>
            {departureCities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Group>
      ) : null}

      <Group title="Recommended season">
        <div className="flex flex-wrap gap-2">
          {SEASONS.map((s) => (
            <Chip
              key={s}
              active={get("season") === s}
              onClick={() => setParam({ season: get("season") === s ? undefined : s })}
            >
              {s}
            </Chip>
          ))}
        </div>
      </Group>
    </div>
  );

  return (
    <>
      {/* -------------------------------- Toolbar -------------------------------- */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted" aria-live="polite">
          <span className="font-semibold text-midnight-900">{total}</span>{" "}
          {total === 1 ? "package" : "packages"}
          {activeCount > 0 ? ` · ${activeCount} ${activeCount === 1 ? "filter" : "filters"} applied` : ""}
        </p>

        <div className="flex items-center gap-2">
          {activeCount > 0 ? (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <X aria-hidden />
              Clear
            </Button>
          ) : null}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden">
                <SlidersHorizontal aria-hidden />
                Filters
                {activeCount > 0 ? (
                  <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-midnight-900 text-[0.625rem] font-bold text-white">
                    {activeCount}
                  </span>
                ) : null}
              </Button>
            </SheetTrigger>
            <SheetContent title="Filters" side="bottom">
              <div className="p-5">{panel}</div>
              <div className="sticky bottom-0 border-t border-hairline bg-white p-4">
                <Button block size="lg" variant="accent" onClick={() => setOpen(false)}>
                  Show {total} {total === 1 ? "package" : "packages"}
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <label className="sr-only" htmlFor="sort-select">
            Sort packages
          </label>
          <Select
            id="sort-select"
            value={sort}
            onChange={(e) => setParam({ sort: e.target.value })}
            className="h-10 w-auto min-w-44 text-sm"
          >
            <option value="recommended">Recommended</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="duration_asc">Duration: shortest</option>
            <option value="duration_desc">Duration: longest</option>
            <option value="rating">Highest rated</option>
          </Select>

          <div
            className="hidden items-center gap-0.5 rounded-full border border-hairline p-1 sm:flex"
            role="group"
            aria-label="Result layout"
          >
            <button
              type="button"
              onClick={() => setView("grid")}
              aria-pressed={view === "grid"}
              aria-label="Grid view"
              className={cn(
                "flex size-8 items-center justify-center rounded-full transition-colors",
                view === "grid" ? "bg-midnight-900 text-white" : "text-midnight-500 hover:bg-sand-100",
              )}
            >
              <LayoutGrid className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              aria-label="List view"
              className={cn(
                "flex size-8 items-center justify-center rounded-full transition-colors",
                view === "list" ? "bg-midnight-900 text-white" : "text-midnight-500 hover:bg-sand-100",
              )}
            >
              <Rows3 className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------ Desktop rail ------------------------------ */}
      <aside className="hidden lg:block" aria-label="Filters">
        <div className="sticky top-28 max-h-[calc(100dvh-9rem)] overflow-y-auto rounded-2xl border border-hairline bg-surface p-6 pr-4">
          {panel}
        </div>
      </aside>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-[0.8125rem] font-bold text-midnight-900">{title}</legend>
      {children}
    </fieldset>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1.5 text-[0.8125rem] font-medium transition-colors",
        active
          ? "border-midnight-900 bg-midnight-900 text-white"
          : "border-hairline text-midnight-700 hover:border-midnight-300 hover:bg-sand-50",
      )}
    >
      {children}
    </button>
  );
}

function PriceRange({
  min,
  max,
  onCommit,
}: {
  min: number;
  max: number;
  onCommit: (min: number, max: number) => void;
}) {
  const [value, setValue] = React.useState(max);

  // Resyncs the local slider handle whenever the URL-driven max price changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setValue(max), [max]);

  return (
    <div>
      <input
        type="range"
        min={10_000}
        max={PRICE_MAX}
        step={10_000}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        onMouseUp={() => onCommit(min, value)}
        onTouchEnd={() => onCommit(min, value)}
        onKeyUp={() => onCommit(min, value)}
        className="w-full accent-lagoon-600"
        aria-label="Maximum price per person"
        aria-valuetext={formatPrice(value)}
      />
      <div className="mt-1.5 flex justify-between text-xs text-muted">
        <span>Up to</span>
        <span className="font-semibold text-midnight-900">
          {value >= PRICE_MAX ? "Any price" : formatPrice(value)}
        </span>
      </div>
    </div>
  );
}
