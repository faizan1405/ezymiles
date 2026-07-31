"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Info, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/field";
import { Price } from "@/components/ui/price";
import { Badge } from "@/components/ui/primitives";
import { getQuote, type QuoteResult } from "@/server/actions/booking";
import { buildQueryString, cn, futureDateInput, toDateInput } from "@/lib/utils";

export interface ActivitySlotOption {
  time: string;
  label: string;
  placesLeft: number;
}

export interface ActivityAddOn {
  key: string;
  label: string;
  priceINR: number;
}

export function ActivityBookingCard({
  slug,
  slots,
  addOns,
  pickupAvailable,
  minParticipants,
  maxParticipants,
  instantConfirmation,
}: {
  slug: string;
  slots: ActivitySlotOption[];
  addOns: ActivityAddOn[];
  pickupAvailable: boolean;
  minParticipants: number;
  maxParticipants: number;
  instantConfirmation: boolean;
}) {
  const router = useRouter();

  const [date, setDate] = React.useState(futureDateInput(3));
  const [slotTime, setSlotTime] = React.useState(slots[0]?.time ?? "");
  const [adults, setAdults] = React.useState(Math.max(1, minParticipants));
  const [children, setChildren] = React.useState(0);
  const [selectedAddOns, setSelectedAddOns] = React.useState<string[]>([]);
  const [pickup, setPickup] = React.useState(false);
  const [pickupLocation, setPickupLocation] = React.useState("");

  const [quote, setQuote] = React.useState<QuoteResult["quote"] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const intent = React.useMemo(
    () => ({
      type: "activity" as const,
      itemSlug: slug,
      travelDate: date,
      slotTime,
      adults,
      children,
      infants: 0,
      addOns: selectedAddOns.map((key) => ({ key, quantity: adults + children })),
      pickupRequired: pickup,
      pickupLocation: pickup ? pickupLocation : undefined,
      paymentMode: "full" as const,
    }),
    [slug, date, slotTime, adults, children, selectedAddOns, pickup, pickupLocation],
  );

  React.useEffect(() => {
    let cancelled = false;
    // Flagging "loading" the instant the selection changes, ahead of the
    // debounced re-quote below, is the intended UX — not an accidental sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    const timer = setTimeout(async () => {
      const result = await getQuote(intent);
      if (cancelled) return;

      if (result.ok && result.quote) {
        setQuote(result.quote);
        setError(null);
      } else {
        setError(result.message ?? "We couldn't price that.");
      }
      setLoading(false);
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [intent]);

  const book = () => {
    router.push(
      `/checkout${buildQueryString({
        type: "activity",
        slug,
        date,
        slot: slotTime,
        adults,
        children,
        pickup: pickup ? "1" : "",
      })}`,
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-lift">
      <div className="border-b border-hairline p-5">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          {quote ? "Total" : "From"}
        </p>
        <div className={cn("mt-1 transition-opacity", loading && "opacity-45")}>
          <Price amountINR={quote?.totalINR ?? 0} className="text-3xl" />
        </div>
        <p className="mt-1 text-xs text-muted">
          {adults + children} {adults + children === 1 ? "participant" : "participants"}, taxes included
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {instantConfirmation ? (
            <Badge tone="success" size="sm">
              <Zap className="size-3" aria-hidden />
              Instant confirmation
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 p-5">
        <Field label="Date" htmlFor="ab-date">
          <Input
            id="ab-date"
            type="date"
            value={date}
            min={toDateInput(new Date())}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>

        {slots.length ? (
          <Field label="Time slot" htmlFor="ab-slot">
            <Select id="ab-slot" value={slotTime} onChange={(e) => setSlotTime(e.target.value)}>
              {slots.map((s) => (
                <option key={s.time} value={s.time} disabled={s.placesLeft <= 0}>
                  {s.time}
                  {s.label ? ` — ${s.label}` : ""}
                  {s.placesLeft <= 0
                    ? " · full"
                    : s.placesLeft <= 5
                      ? ` · ${s.placesLeft} places left`
                      : ""}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Adults" htmlFor="ab-adults">
            <Select id="ab-adults" value={adults} onChange={(e) => setAdults(Number(e.target.value))}>
              {Array.from({ length: maxParticipants }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Children" htmlFor="ab-children">
            <Select
              id="ab-children"
              value={children}
              onChange={(e) => setChildren(Number(e.target.value))}
            >
              {Array.from({ length: Math.max(1, maxParticipants - adults + 1) }, (_, i) => i).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {addOns.length ? (
          <fieldset>
            <legend className="mb-2 text-[0.8125rem] font-semibold text-midnight-800">Add-ons</legend>
            <div className="space-y-2">
              {addOns.map((a) => (
                <label
                  key={a.key}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-hairline p-3 transition-colors hover:bg-sand-50"
                >
                  <span className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={selectedAddOns.includes(a.key)}
                      onChange={(e) =>
                        setSelectedAddOns((prev) =>
                          e.target.checked ? [...prev, a.key] : prev.filter((k) => k !== a.key),
                        )
                      }
                      className="size-4 rounded accent-lagoon-600"
                    />
                    <span className="text-[0.8125rem] text-midnight-800">{a.label}</span>
                  </span>
                  <Price amountINR={a.priceINR} className="shrink-0 text-xs" />
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        {pickupAvailable ? (
          <div className="space-y-2">
            <Checkbox
              id="ab-pickup"
              checked={pickup}
              onChange={(e) => setPickup(e.target.checked)}
              label="I'd like hotel pickup"
            />
            {pickup ? (
              <Input
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="Hotel name or address"
                aria-label="Pickup location"
              />
            ) : null}
          </div>
        ) : null}

        <div aria-live="polite">
          {error ? (
            <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              {error}
            </p>
          ) : !quote ? (
            <p className="flex items-center gap-2 text-xs text-muted">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Pricing…
            </p>
          ) : null}
        </div>

        <Button
          block
          size="lg"
          variant="accent"
          onClick={book}
          disabled={Boolean(error) || !quote}
          loading={loading && !quote}
        >
          Book this experience
        </Button>

        <p className="flex items-center justify-center gap-1.5 text-[0.6875rem] text-muted">
          <ShieldCheck className="size-3.5 text-lagoon-600" aria-hidden />
          Total recalculated on our server
        </p>
      </div>
    </div>
  );
}
