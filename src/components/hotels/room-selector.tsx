"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Users, BedDouble, Utensils, Check, X, Loader2, Info, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Price } from "@/components/ui/price";
import { Badge } from "@/components/ui/primitives";
import { SmartImage } from "@/components/ui/smart-image";
import { getQuote, type QuoteResult } from "@/server/actions/booking";
import { buildQueryString, cn, daysBetween, futureDateInput, toDateInput } from "@/lib/utils";

export interface RoomOption {
  key: string;
  name: string;
  description: string;
  image?: string;
  maxOccupancy: number;
  bedType: string;
  sizeSqft?: number;
  amenities: string[];
  mealPlan: string;
  pricePerNightINR: number;
  originalPricePerNightINR?: number;
  refundable: boolean;
  cancellationRule: string;
  roomsAvailable: number;
}

const MEAL_LABELS: Record<string, string> = {
  room_only: "Room only",
  breakfast: "Breakfast included",
  half_board: "Breakfast + dinner",
  full_board: "All meals",
  all_inclusive: "All inclusive",
};

/**
 * Room picker.
 *
 * Dates and occupancy live here; the moment a room is selected we ask the server
 * for the real total (nights × rate + taxes) rather than multiplying in the
 * browser, so the number on the button is the number that gets charged.
 */
export function RoomSelector({
  slug,
  rooms,
  checkInDefault,
  checkOutDefault,
}: {
  slug: string;
  rooms: RoomOption[];
  checkInDefault?: string;
  checkOutDefault?: string;
}) {
  const router = useRouter();

  const [checkIn, setCheckIn] = React.useState(
    checkInDefault || futureDateInput(14),
  );
  const [checkOut, setCheckOut] = React.useState(
    checkOutDefault || futureDateInput(17),
  );
  const [roomCount, setRoomCount] = React.useState(1);
  const [adults, setAdults] = React.useState(2);
  const [children, setChildren] = React.useState(0);
  const [selected, setSelected] = React.useState(rooms[0]?.key ?? "");

  const [quote, setQuote] = React.useState<QuoteResult["quote"] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const nights = daysBetween(checkIn, checkOut);

  const intent = React.useMemo(
    () => ({
      type: "hotel" as const,
      itemSlug: slug,
      roomKey: selected,
      checkIn,
      checkOut,
      rooms: roomCount,
      adults,
      children,
      infants: 0,
      addOns: [],
      pickupRequired: false,
      paymentMode: "full" as const,
    }),
    [slug, selected, checkIn, checkOut, roomCount, adults, children],
  );

  React.useEffect(() => {
    if (!selected) return;

    let cancelled = false;
    // Flag "loading" the instant the room/dates change, ahead of the
    // debounced re-quote below — deliberate, not an accidental sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    const timer = setTimeout(async () => {
      const result = await getQuote(intent);
      if (cancelled) return;

      if (result.ok && result.quote) {
        setQuote(result.quote);
        setError(null);
      } else {
        setQuote(null);
        setError(result.message ?? "We couldn't price those dates.");
      }
      setLoading(false);
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [intent, selected]);

  const book = () => {
    router.push(
      `/checkout${buildQueryString({
        type: "hotel",
        slug,
        room: selected,
        checkIn,
        checkOut,
        rooms: roomCount,
        adults,
        children,
      })}`,
    );
  };

  return (
    <div>
      {/* --------------------------------- Dates --------------------------------- */}
      <div className="rounded-2xl border border-hairline bg-white p-4 shadow-tile">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Check-in" htmlFor="rs-in">
            <Input
              id="rs-in"
              type="date"
              value={checkIn}
              min={toDateInput(new Date())}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </Field>

          <Field label="Check-out" htmlFor="rs-out">
            <Input
              id="rs-out"
              type="date"
              value={checkOut}
              min={checkIn}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </Field>

          <Field label="Rooms" htmlFor="rs-rooms">
            <Select
              id="rs-rooms"
              value={roomCount}
              onChange={(e) => setRoomCount(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Adults" htmlFor="rs-adults">
              <Select id="rs-adults" value={adults} onChange={(e) => setAdults(Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Children" htmlFor="rs-children">
              <Select
                id="rs-children"
                value={children}
                onChange={(e) => setChildren(Number(e.target.value))}
              >
                {[0, 1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>

        <p className="mt-3 text-xs text-muted">
          {nights > 0
            ? `${nights} ${nights === 1 ? "night" : "nights"} · ${roomCount} ${roomCount === 1 ? "room" : "rooms"} · ${adults + children} guests`
            : "Choose a check-out date after your check-in date."}
        </p>
      </div>

      {/* --------------------------------- Rooms --------------------------------- */}
      <ul className="mt-6 space-y-4">
        {rooms.map((room) => {
          const active = room.key === selected;

          return (
            <li key={room.key}>
              <article
                className={cn(
                  "overflow-hidden rounded-2xl border bg-white transition-colors",
                  active ? "border-lagoon-400 ring-1 ring-lagoon-400" : "border-hairline",
                )}
              >
                <div className="flex flex-col sm:flex-row">
                  {room.image ? (
                    <div className="relative aspect-16/10 shrink-0 sm:aspect-auto sm:w-56">
                      <SmartImage
                        src={room.image}
                        alt={room.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 224px"
                        className="object-cover"
                      />
                    </div>
                  ) : null}

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-display text-lg text-midnight-900">{room.name}</h3>
                        <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted">
                          {room.description}
                        </p>
                      </div>

                      {room.roomsAvailable <= 3 ? (
                        <Badge tone="sunset" size="sm">
                          Only {room.roomsAvailable} left
                        </Badge>
                      ) : null}
                    </div>

                    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
                      <li className="flex items-center gap-1.5">
                        <Users className="size-3.5" aria-hidden />
                        Sleeps {room.maxOccupancy}
                      </li>
                      <li className="flex items-center gap-1.5">
                        <BedDouble className="size-3.5" aria-hidden />
                        {room.bedType}
                      </li>
                      {room.sizeSqft ? (
                        <li className="flex items-center gap-1.5">
                          <Maximize2 className="size-3.5" aria-hidden />
                          {room.sizeSqft} sq ft
                        </li>
                      ) : null}
                      <li className="flex items-center gap-1.5">
                        <Utensils className="size-3.5" aria-hidden />
                        {MEAL_LABELS[room.mealPlan] ?? room.mealPlan}
                      </li>
                    </ul>

                    <p className="mt-3 flex items-center gap-1.5 text-xs">
                      {room.refundable ? (
                        <>
                          <Check className="size-3.5 text-emerald-600" aria-hidden />
                          <span className="text-emerald-700">{room.cancellationRule}</span>
                        </>
                      ) : (
                        <>
                          <X className="size-3.5 text-red-500" aria-hidden />
                          <span className="text-red-600">Non-refundable rate</span>
                        </>
                      )}
                    </p>

                    <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-5">
                      <div>
                        <Price
                          amountINR={room.pricePerNightINR}
                          original={room.originalPricePerNightINR}
                          className="text-xl"
                        />
                        <p className="text-[0.625rem] text-muted">per night, excl. taxes</p>
                      </div>

                      <Button
                        variant={active ? "accent" : "outline"}
                        onClick={() => setSelected(room.key)}
                        aria-pressed={active}
                      >
                        {active ? (
                          <>
                            <Check aria-hidden />
                            Selected
                          </>
                        ) : (
                          "Select room"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Totals for the selected room */}
                {active ? (
                  <div className="border-t border-hairline bg-sand-50 p-5" aria-live="polite">
                    {error ? (
                      <p className="flex items-start gap-2 text-xs text-amber-900">
                        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                        {error}
                      </p>
                    ) : !quote ? (
                      <p className="flex items-center gap-2 text-xs text-muted">
                        <Loader2 className="size-3.5 animate-spin" aria-hidden />
                        Calculating your total…
                      </p>
                    ) : (
                      <div className={cn("transition-opacity", loading && "opacity-50")}>
                        <dl className="space-y-1.5">
                          {quote.lines.map((line, i) => (
                            <div
                              key={`${line.label}-${i}`}
                              className="flex items-baseline justify-between gap-3 text-xs"
                            >
                              <dt className="text-muted">{line.label}</dt>
                              <dd className="shrink-0 tabular-nums text-midnight-800">
                                <Price amountINR={line.amountINR} className="text-xs font-medium" />
                              </dd>
                            </div>
                          ))}
                        </dl>

                        <div className="mt-3 flex items-center justify-between gap-4 border-t border-hairline pt-3">
                          <div>
                            <p className="text-xs text-muted">Total for {nights} nights</p>
                            <Price amountINR={quote.totalINR} className="text-xl" />
                          </div>
                          <Button size="lg" variant="accent" onClick={book} disabled={loading}>
                            Book this room
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
