"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Compass,
  Plane,
  BedDouble,
  Ticket,
  Stamp,
  Car,
  Search,
  Minus,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/overlays";
import {
  ACTIVITY_CATEGORIES,
  HOTEL_CATEGORIES,
  TRAVEL_CLASSES,
  TRIP_TYPES,
  VISA_TYPES,
} from "@/config/site";
import { buildQueryString, cn, toDateInput } from "@/lib/utils";

type TabKey = "packages" | "flights" | "hotels" | "activities" | "visa" | "cabs";

const TABS: { key: TabKey; label: string; Icon: typeof Compass }[] = [
  { key: "packages", label: "Holiday Packages", Icon: Compass },
  { key: "flights", label: "Flights", Icon: Plane },
  { key: "hotels", label: "Hotels", Icon: BedDouble },
  { key: "activities", label: "Activities", Icon: Ticket },
  { key: "visa", label: "Visa", Icon: Stamp },
  { key: "cabs", label: "Cabs", Icon: Car },
];

const today = () => toDateInput(new Date());
const inDays = (n: number) => toDateInput(new Date(Date.now() + n * 86_400_000));

export function UnifiedSearch({
  destinations = [],
  cities = [],
  visaCountries = [],
  enabled,
  variant = "hero",
}: {
  destinations?: { name: string; slug: string }[];
  cities?: string[];
  visaCountries?: { country: string; slug: string }[];
  enabled: {
    flights: boolean;
    hotels: boolean;
    activities: boolean;
    visa: boolean;
    cabs: boolean;
  };
  variant?: "hero" | "page";
}) {
  const [tab, setTab] = React.useState<TabKey>("packages");
  const reduced = useReducedMotion();

  const visibleTabs = TABS.filter((t) => {
    if (t.key === "packages") return true;
    return enabled[t.key as keyof typeof enabled];
  });

  return (
    <div
      className={cn(
        "rounded-3xl",
        variant === "hero"
          ? "border border-hairline bg-white p-2 shadow-panel"
          : "border border-hairline bg-surface p-2 shadow-lift",
      )}
    >
      {/* --------------------------------- Tabs --------------------------------- */}
      <div
        role="tablist"
        aria-label="Search by service"
        className="no-scrollbar flex gap-1 overflow-x-auto px-1 pt-1"
      >
        {visibleTabs.map(({ key, label, Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={active}
              aria-controls={`search-panel-${key}`}
              id={`search-tab-${key}`}
              onClick={() => setTab(key)}
              className={cn(
                "relative flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-[0.8125rem] font-semibold transition-colors duration-200",
                active ? "text-midnight-950" : "text-midnight-500 hover:text-midnight-800",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="search-tab-pill"
                  className="absolute inset-0 rounded-2xl bg-sand-100"
                  transition={{ duration: reduced ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
                />
              ) : null}
              <Icon className="relative size-4" aria-hidden />
              <span className="relative whitespace-nowrap">{label}</span>
            </button>
          );
        })}
      </div>

      {/* -------------------------------- Panels -------------------------------- */}
      <div className="p-3 pt-4 sm:p-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            id={`search-panel-${tab}`}
            role="tabpanel"
            aria-labelledby={`search-tab-${tab}`}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {tab === "packages" ? <PackageSearch destinations={destinations} /> : null}
            {tab === "flights" ? <FlightSearch /> : null}
            {tab === "hotels" ? <HotelSearch cities={cities} /> : null}
            {tab === "activities" ? <ActivitySearch destinations={destinations} /> : null}
            {tab === "visa" ? <VisaSearch countries={visaCountries} /> : null}
            {tab === "cabs" ? <CabSearch /> : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                             Traveller stepper                               */
/* -------------------------------------------------------------------------- */

function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 20,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <p className="text-sm font-semibold text-midnight-900">{label}</p>
        {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className="flex size-9 items-center justify-center rounded-full border border-hairline text-midnight-800 transition-colors hover:bg-sand-50 disabled:opacity-35"
        >
          <Minus className="size-4" aria-hidden />
        </button>
        <span className="w-8 text-center text-sm font-bold tabular-nums text-midnight-900" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          className="flex size-9 items-center justify-center rounded-full border border-hairline text-midnight-800 transition-colors hover:bg-sand-50 disabled:opacity-35"
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function TravellerPicker({
  adults,
  childCount,
  infants,
  onChange,
  showInfants = false,
  label = "Travellers",
}: {
  adults: number;
  /** Named childCount, not children — a JSX prop literally named "children" is
   *  reserved by React for nested content, not a numeric traveller count. */
  childCount: number;
  infants?: number;
  onChange: (next: { adults: number; children: number; infants: number }) => void;
  showInfants?: boolean;
  label?: string;
}) {
  const total = adults + childCount + (infants ?? 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-12 w-full items-center justify-between rounded-xl border border-hairline bg-white px-3.5 text-left text-[0.9375rem] text-midnight-900 transition-colors hover:border-midnight-300"
        >
          <span>
            {total} {total === 1 ? "traveller" : "travellers"}
          </span>
          <Plus className="size-4 text-midnight-400" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <p className="mb-1 text-eyebrow text-lagoon-700">{label}</p>
        <div className="divide-y divide-hairline">
          <Stepper
            label="Adults"
            hint="12 years and above"
            value={adults}
            min={1}
            onChange={(v) => onChange({ adults: v, children: childCount, infants: infants ?? 0 })}
          />
          <Stepper
            label="Children"
            hint="2 – 11 years"
            value={childCount}
            onChange={(v) => onChange({ adults, children: v, infants: infants ?? 0 })}
          />
          {showInfants ? (
            <Stepper
              label="Infants"
              hint="Under 2 years"
              value={infants ?? 0}
              max={adults}
              onChange={(v) => onChange({ adults, children: childCount, infants: v })}
            />
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const SubmitButton = ({ label }: { label: string }) => (
  <Button type="submit" size="lg" variant="accent" className="h-12 w-full lg:w-auto lg:px-8">
    <Search aria-hidden />
    {label}
  </Button>
);

/* -------------------------------------------------------------------------- */
/*                              Holiday packages                               */
/* -------------------------------------------------------------------------- */

function PackageSearch({ destinations }: { destinations: { name: string; slug: string }[] }) {
  const router = useRouter();
  const [pax, setPax] = React.useState({ adults: 2, children: 0, infants: 0 });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    router.push(
      `/packages${buildQueryString({
        destination: String(form.get("destination") ?? ""),
        departureCity: String(form.get("departureCity") ?? ""),
        startDate: String(form.get("startDate") ?? ""),
        tripType: String(form.get("tripType") ?? ""),
        maxPrice: String(form.get("budget") ?? ""),
        adults: pax.adults,
        children: pax.children,
      })}`,
    );
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr_auto]">
      <Field label="Destination" htmlFor="pk-destination">
        <Select id="pk-destination" name="destination" defaultValue="">
          <option value="">Anywhere</option>
          {destinations.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Departure city" htmlFor="pk-from">
        <Input id="pk-from" name="departureCity" placeholder="Delhi" list="departure-cities" />
      </Field>

      <Field label="Travel date" htmlFor="pk-date">
        <Input id="pk-date" name="startDate" type="date" min={today()} defaultValue={inDays(30)} />
      </Field>

      <Field label="Travellers" htmlFor="pk-pax">
        <TravellerPicker adults={pax.adults} childCount={pax.children} onChange={setPax} />
      </Field>

      <Field label="Trip type" htmlFor="pk-type">
        <Select id="pk-type" name="tripType" defaultValue="">
          <option value="">Any style</option>
          {TRIP_TYPES.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.label}
            </option>
          ))}
        </Select>
      </Field>

      <div className="flex items-end">
        <SubmitButton label="Search" />
      </div>

      <input type="hidden" name="budget" value="" />
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Flights                                   */
/* -------------------------------------------------------------------------- */

function FlightSearch() {
  const router = useRouter();
  const [tripType, setTripType] = React.useState<"one_way" | "round_trip" | "multi_city">(
    "round_trip",
  );
  const [pax, setPax] = React.useState({ adults: 1, children: 0, infants: 0 });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    router.push(
      `/flights/search${buildQueryString({
        tripType,
        from: String(form.get("from") ?? "").toUpperCase(),
        to: String(form.get("to") ?? "").toUpperCase(),
        departDate: String(form.get("departDate") ?? ""),
        returnDate: tripType === "round_trip" ? String(form.get("returnDate") ?? "") : "",
        adults: pax.adults,
        children: pax.children,
        infants: pax.infants,
        cabinClass: String(form.get("cabinClass") ?? "economy"),
        nonStop: form.get("nonStop") ? "1" : "",
      })}`,
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div role="radiogroup" aria-label="Trip type" className="flex flex-wrap gap-1.5">
        {(
          [
            ["round_trip", "Round trip"],
            ["one_way", "One way"],
            ["multi_city", "Multi-city"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={tripType === value}
            onClick={() => setTripType(value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[0.8125rem] font-semibold transition-colors",
              tripType === value
                ? "bg-midnight-900 text-white"
                : "bg-sand-100 text-midnight-600 hover:bg-sand-200",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tripType === "multi_city" ? (
        <p className="rounded-xl bg-sand-50 p-3 text-xs text-muted">
          Multi-city itineraries are priced by hand. Add your first leg below and we&apos;ll pick up
          the rest of the routing with you directly.
        </p>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]">
        <Field label="From" htmlFor="fl-from">
          <Input
            id="fl-from"
            name="from"
            required
            placeholder="DEL"
            maxLength={3}
            className="uppercase"
            list="airport-codes"
          />
        </Field>

        <Field label="To" htmlFor="fl-to">
          <Input
            id="fl-to"
            name="to"
            required
            placeholder="DXB"
            maxLength={3}
            className="uppercase"
            list="airport-codes"
          />
        </Field>

        <Field label="Departure" htmlFor="fl-depart">
          <Input id="fl-depart" name="departDate" type="date" required min={today()} defaultValue={inDays(21)} />
        </Field>

        <Field label="Return" htmlFor="fl-return">
          <Input
            id="fl-return"
            name="returnDate"
            type="date"
            min={today()}
            defaultValue={inDays(28)}
            disabled={tripType !== "round_trip"}
          />
        </Field>

        <Field label="Travellers & class" htmlFor="fl-pax">
          <TravellerPicker
            adults={pax.adults}
            childCount={pax.children}
            infants={pax.infants}
            showInfants
            onChange={setPax}
          />
        </Field>

        <div className="flex items-end">
          <SubmitButton label="Search flights" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Select name="cabinClass" defaultValue="economy" className="h-10 w-auto max-w-48 text-sm">
          {TRAVEL_CLASSES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-midnight-700">
          <input
            type="checkbox"
            name="nonStop"
            className="size-4 rounded accent-lagoon-600"
          />
          Non-stop only
        </label>
      </div>

      <datalist id="airport-codes">
        {AIRPORTS.map((a) => (
          <option key={a.code} value={a.code}>
            {a.city} — {a.name}
          </option>
        ))}
      </datalist>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Hotels                                   */
/* -------------------------------------------------------------------------- */

function HotelSearch({ cities }: { cities: string[] }) {
  const router = useRouter();
  const [pax, setPax] = React.useState({ adults: 2, children: 0, infants: 0 });
  const [rooms, setRooms] = React.useState(1);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    router.push(
      `/hotels${buildQueryString({
        q: String(form.get("city") ?? ""),
        checkIn: String(form.get("checkIn") ?? ""),
        checkOut: String(form.get("checkOut") ?? ""),
        rooms,
        adults: pax.adults,
        children: pax.children,
        star: String(form.get("star") ?? ""),
      })}`,
    );
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto]">
      <Field label="City or property" htmlFor="ht-city">
        <Input id="ht-city" name="city" placeholder="Goa, Udaipur, Dubai…" list="hotel-cities" />
        <datalist id="hotel-cities">
          {cities.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>

      <Field label="Check-in" htmlFor="ht-in">
        <Input id="ht-in" name="checkIn" type="date" min={today()} defaultValue={inDays(14)} />
      </Field>

      <Field label="Check-out" htmlFor="ht-out">
        <Input id="ht-out" name="checkOut" type="date" min={today()} defaultValue={inDays(17)} />
      </Field>

      <Field label="Rooms" htmlFor="ht-rooms">
        <Select
          id="ht-rooms"
          value={rooms}
          onChange={(e) => setRooms(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "room" : "rooms"}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Guests" htmlFor="ht-pax">
        <TravellerPicker adults={pax.adults} childCount={pax.children} onChange={setPax} label="Guests" />
      </Field>

      <div className="flex items-end">
        <SubmitButton label="Search hotels" />
      </div>

      <input type="hidden" name="star" value="" />
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Activities                                 */
/* -------------------------------------------------------------------------- */

function ActivitySearch({ destinations }: { destinations: { name: string; slug: string }[] }) {
  const router = useRouter();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    router.push(
      `/activities${buildQueryString({
        destination: String(form.get("destination") ?? ""),
        date: String(form.get("date") ?? ""),
        participants: String(form.get("participants") ?? ""),
        category: String(form.get("category") ?? ""),
      })}`,
    );
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr_auto]">
      <Field label="Destination" htmlFor="ac-dest">
        <Select id="ac-dest" name="destination" defaultValue="">
          <option value="">Anywhere</option>
          {destinations.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Date" htmlFor="ac-date">
        <Input id="ac-date" name="date" type="date" min={today()} defaultValue={inDays(7)} />
      </Field>

      <Field label="Participants" htmlFor="ac-pax">
        <Select id="ac-pax" name="participants" defaultValue="2">
          {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "person" : "people"}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Category" htmlFor="ac-cat">
        <Select id="ac-cat" name="category" defaultValue="">
          <option value="">All experiences</option>
          {ACTIVITY_CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </Select>
      </Field>

      <div className="flex items-end">
        <SubmitButton label="Find experiences" />
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/*                                     Visa                                    */
/* -------------------------------------------------------------------------- */

function VisaSearch({ countries }: { countries: { country: string; slug: string }[] }) {
  const router = useRouter();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const slug = String(form.get("country") ?? "");

    router.push(
      slug
        ? `/visa/${slug}${buildQueryString({
            type: String(form.get("visaType") ?? ""),
            nationality: String(form.get("nationality") ?? ""),
            date: String(form.get("date") ?? ""),
          })}`
        : "/visa",
    );
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-3 lg:grid-cols-[1fr_1.3fr_1fr_1fr_auto]">
      <Field label="Nationality" htmlFor="vs-nat">
        <Select id="vs-nat" name="nationality" defaultValue="Indian">
          <option value="Indian">Indian</option>
          <option value="NRI">NRI / OCI</option>
          <option value="Other">Other</option>
        </Select>
      </Field>

      <Field label="Destination country" htmlFor="vs-country">
        <Select id="vs-country" name="country" defaultValue="">
          <option value="">Select a country</option>
          {countries.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.country}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Travel date" htmlFor="vs-date">
        <Input id="vs-date" name="date" type="date" min={today()} defaultValue={inDays(45)} />
      </Field>

      <Field label="Visa type" htmlFor="vs-type">
        <Select id="vs-type" name="visaType" defaultValue="tourist">
          {VISA_TYPES.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </Select>
      </Field>

      <div className="flex items-end">
        <SubmitButton label="Check requirements" />
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/*                                     Cabs                                    */
/* -------------------------------------------------------------------------- */

function CabSearch() {
  const router = useRouter();
  const [mode, setMode] = React.useState<"airport" | "local" | "outstation">("airport");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    router.push(
      `/cabs${buildQueryString({
        mode,
        pickup: String(form.get("pickup") ?? ""),
        drop: String(form.get("drop") ?? ""),
        date: String(form.get("date") ?? ""),
        time: String(form.get("time") ?? ""),
      })}`,
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div role="radiogroup" aria-label="Transfer type" className="flex flex-wrap gap-1.5">
        {(
          [
            ["airport", "Airport transfer"],
            ["local", "Local rental"],
            ["outstation", "Outstation"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={mode === value}
            onClick={() => setMode(value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[0.8125rem] font-semibold transition-colors",
              mode === value
                ? "bg-midnight-900 text-white"
                : "bg-sand-100 text-midnight-600 hover:bg-sand-200",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.3fr_1.3fr_1fr_1fr_auto]">
        <Field label="Pickup" htmlFor="cb-pickup">
          <Input id="cb-pickup" name="pickup" required placeholder="Airport terminal, hotel, address…" />
        </Field>

        <Field label={mode === "local" ? "Coverage area" : "Drop"} htmlFor="cb-drop">
          <Input
            id="cb-drop"
            name="drop"
            required={mode !== "local"}
            placeholder={mode === "local" ? "City centre, 8 hrs" : "Destination address"}
          />
        </Field>

        <Field label="Date" htmlFor="cb-date">
          <Input id="cb-date" name="date" type="date" min={today()} defaultValue={inDays(3)} />
        </Field>

        <Field label="Time" htmlFor="cb-time">
          <Input id="cb-time" name="time" type="time" defaultValue="09:00" />
        </Field>

        <div className="flex items-end">
          <SubmitButton label="Get quote" />
        </div>
      </div>
    </form>
  );
}

/** Common Indian + regional departure airports, for the datalist hint. */
const AIRPORTS = [
  { code: "DEL", city: "Delhi", name: "Indira Gandhi Intl" },
  { code: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Maharaj Intl" },
  { code: "BLR", city: "Bengaluru", name: "Kempegowda Intl" },
  { code: "MAA", city: "Chennai", name: "Chennai Intl" },
  { code: "HYD", city: "Hyderabad", name: "Rajiv Gandhi Intl" },
  { code: "CCU", city: "Kolkata", name: "Netaji Subhas Chandra Bose Intl" },
  { code: "GOI", city: "Goa", name: "Dabolim" },
  { code: "COK", city: "Kochi", name: "Cochin Intl" },
  { code: "AMD", city: "Ahmedabad", name: "Sardar Vallabhbhai Patel Intl" },
  { code: "DXB", city: "Dubai", name: "Dubai Intl" },
  { code: "SIN", city: "Singapore", name: "Changi" },
  { code: "BKK", city: "Bangkok", name: "Suvarnabhumi" },
  { code: "DPS", city: "Bali", name: "Ngurah Rai Intl" },
  { code: "CDG", city: "Paris", name: "Charles de Gaulle" },
  { code: "LHR", city: "London", name: "Heathrow" },
  { code: "MLE", city: "Malé", name: "Velana Intl" },
  { code: "KTM", city: "Kathmandu", name: "Tribhuvan Intl" },
  { code: "CMB", city: "Colombo", name: "Bandaranaike Intl" },
];

export { HOTEL_CATEGORIES };
