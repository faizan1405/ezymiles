"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  MessageCircle,
  Phone,
  Loader2,
  Info,
  CalendarRange,
  Users,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { Price } from "@/components/ui/price";
import { WishlistButton } from "./wishlist-button";
import { CallbackDialog } from "@/components/forms/callback-dialog";
import { getQuote, type QuoteResult } from "@/server/actions/booking";
import { buildQueryString, cn, formatDate, futureDateInput, toDateInput, whatsappLink } from "@/lib/utils";
import type { IPriceLine } from "@/models";

export interface BookingCardVariant {
  key: string;
  label: string;
  hotelCategory: number;
  durationDays: number;
  pricePerAdultINR: number;
  originalPricePerAdultINR?: number;
}

export interface BookingCardDeparture {
  id: string;
  date: string;
  departureCity: string;
  seatsLeft: number;
  status: string;
  priceAdjustmentINR: number;
}

/**
 * The conversion surface.
 *
 * It never calculates a price locally: every change re-quotes on the server, so
 * what the traveller sees is exactly what the server will charge. While a quote
 * is in flight the previous total stays on screen (dimmed) rather than
 * collapsing the layout.
 */
export function BookingCard({
  packageSlug,
  packageId,
  packageTitle,
  variants,
  departures,
  whatsappNumber,
  phoneNumber,
  className,
}: {
  packageSlug: string;
  packageId: string;
  packageTitle: string;
  variants: BookingCardVariant[];
  departures: BookingCardDeparture[];
  whatsappNumber: string;
  phoneNumber: string;
  className?: string;
}) {
  const router = useRouter();

  const [variantKey, setVariantKey] = React.useState(variants[0]?.key ?? "");
  const [departureId, setDepartureId] = React.useState(departures[0]?.id ?? "");
  const [travelDate, setTravelDate] = React.useState(
    departures.length ? "" : futureDateInput(30),
  );
  const [adults, setAdults] = React.useState(2);
  const [children, setChildren] = React.useState(0);
  const [quote, setQuote] = React.useState<QuoteResult["quote"] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [callbackOpen, setCallbackOpen] = React.useState(false);

  const intent = React.useMemo(
    () => ({
      type: "package" as const,
      itemSlug: packageSlug,
      variantKey: variantKey || undefined,
      departureId: departureId || undefined,
      travelDate: departureId ? undefined : travelDate || undefined,
      adults,
      children,
      infants: 0,
      addOns: [],
      pickupRequired: false,
      paymentMode: "full" as const,
    }),
    [packageSlug, variantKey, departureId, travelDate, adults, children],
  );

  // Re-quote on every change, debounced so a stepper spam doesn't hammer the server.
  React.useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    const timer = setTimeout(async () => {
      const result = await getQuote(intent);
      if (cancelled) return;

      if (result.ok && result.quote) {
        setQuote(result.quote);
        setError(null);
      } else {
        setError(result.message ?? "We couldn't price that combination.");
      }
      setLoading(false);
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [intent]);

  const goToCheckout = () => {
    router.push(
      `/checkout${buildQueryString({
        type: "package",
        slug: packageSlug,
        variant: variantKey,
        departure: departureId,
        date: departureId ? "" : travelDate,
        adults,
        children,
      })}`,
    );
  };

  const selectedVariant = variants.find((v) => v.key === variantKey) ?? variants[0];
  const bookable = !error && Boolean(quote);

  return (
    <>
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-hairline bg-surface shadow-lift",
          className,
        )}
      >
        {/* --------------------------------- Price --------------------------------- */}
        <div className="border-b border-hairline p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
                {quote ? "Total for your selection" : "Starting from"}
              </p>

              <div className={cn("mt-1 transition-opacity", loading && "opacity-45")}>
                {quote ? (
                  <Price amountINR={quote.totalINR} className="text-3xl" />
                ) : (
                  <Price
                    amountINR={selectedVariant?.pricePerAdultINR ?? 0}
                    original={selectedVariant?.originalPricePerAdultINR}
                    className="text-3xl"
                  />
                )}
              </div>

              <p className="mt-1 text-xs text-muted">
                {quote
                  ? `${adults + children} ${adults + children === 1 ? "traveller" : "travellers"}, taxes included`
                  : "per person, twin sharing"}
              </p>
            </div>

            <WishlistButton
              packageId={packageId}
              title={packageTitle}
              variant="floating"
              className="border border-hairline bg-white shadow-none"
            />
          </div>
        </div>

        {/* -------------------------------- Selection ------------------------------- */}
        <div className="space-y-4 p-5">
          {variants.length > 1 ? (
            <Field label="Package option" htmlFor="bk-variant">
              <Select
                id="bk-variant"
                value={variantKey}
                onChange={(e) => setVariantKey(e.target.value)}
              >
                {variants.map((v) => (
                  <option key={v.key} value={v.key}>
                    {v.label} · {v.hotelCategory}★ · {v.durationDays} days
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}

          {departures.length ? (
            <Field label="Departure date" htmlFor="bk-departure">
              <Select
                id="bk-departure"
                value={departureId}
                onChange={(e) => setDepartureId(e.target.value)}
              >
                {departures.map((d) => (
                  <option key={d.id} value={d.id} disabled={d.status === "sold_out"}>
                    {formatDate(d.date)} · from {d.departureCity}
                    {d.status === "sold_out"
                      ? " · sold out"
                      : d.seatsLeft <= 4
                        ? ` · ${d.seatsLeft} seats left`
                        : ""}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <Field label="Preferred start date" htmlFor="bk-date">
              <input
                id="bk-date"
                type="date"
                value={travelDate}
                min={toDateInput(new Date())}
                onChange={(e) => setTravelDate(e.target.value)}
                className="h-12 w-full rounded-xl border border-hairline bg-white px-3.5 text-[0.9375rem] focus:border-lagoon-500 focus:outline-none focus:ring-4 focus:ring-lagoon-500/12"
              />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Adults" htmlFor="bk-adults">
              <Select
                id="bk-adults"
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Children" htmlFor="bk-children">
              <Select
                id="bk-children"
                value={children}
                onChange={(e) => setChildren(Number(e.target.value))}
              >
                {Array.from({ length: 7 }, (_, i) => i).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {/* ------------------------------- Breakdown ------------------------------- */}
          <div aria-live="polite">
            {error ? (
              <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                {error}
              </p>
            ) : quote ? (
              <PriceBreakdown lines={quote.lines} totalINR={quote.totalINR} loading={loading} />
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted">
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Pricing your selection…
              </div>
            )}
          </div>

          {/* --------------------------------- CTAs ---------------------------------- */}
          <div className="space-y-2 pt-1">
            <Button
              block
              size="lg"
              variant="accent"
              onClick={goToCheckout}
              disabled={!bookable}
              loading={loading && !quote}
            >
              Book now
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setCallbackOpen(true)}>
                <Phone aria-hidden />
                Callback
              </Button>
              <Button asChild variant="outline">
                <a
                  href={whatsappLink(
                    whatsappNumber,
                    `Hi! I'd like to customise the "${packageTitle}" package.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle aria-hidden />
                  WhatsApp
                </a>
              </Button>
            </div>

            <Button asChild block variant="ghost" size="sm">
              <a href={`/customise-my-trip?destination=${encodeURIComponent(packageTitle)}`}>
                <Sparkles aria-hidden />
                Customise this package
              </a>
            </Button>
          </div>

          {quote?.deposit.allowed ? (
            <p className="rounded-xl bg-lagoon-50 p-3 text-xs leading-relaxed text-lagoon-900">
              Hold your dates with a{" "}
              <span className="font-semibold">{quote.deposit.percent}% deposit</span> — pay the
              balance closer to departure.
            </p>
          ) : null}

          <ul className="space-y-1.5 border-t border-hairline pt-4">
            <li className="flex items-center gap-2 text-xs text-muted">
              <ShieldCheck className="size-3.5 shrink-0 text-lagoon-600" aria-hidden />
              Payments verified server-side
            </li>
            <li className="flex items-center gap-2 text-xs text-muted">
              <CalendarRange className="size-3.5 shrink-0 text-lagoon-600" aria-hidden />
              Free date changes up to 30 days before travel
            </li>
            <li className="flex items-center gap-2 text-xs text-muted">
              <Users className="size-3.5 shrink-0 text-lagoon-600" aria-hidden />
              A named designer stays with your trip
            </li>
          </ul>

          <p className="text-center text-xs text-muted">
            Or call{" "}
            <a href={`tel:${phoneNumber.replace(/\s/g, "")}`} className="font-semibold text-midnight-900 hover:underline">
              {phoneNumber}
            </a>
          </p>
        </div>
      </div>

      <CallbackDialog
        open={callbackOpen}
        onOpenChange={setCallbackOpen}
        subject={{ kind: "package", refId: packageId, title: packageTitle, slug: packageSlug }}
      />
    </>
  );
}

function PriceBreakdown({
  lines,
  totalINR,
  loading,
}: {
  lines: IPriceLine[];
  totalINR: number;
  loading: boolean;
}) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className={cn("rounded-xl bg-sand-50 p-3 transition-opacity", loading && "opacity-45")}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between text-xs font-semibold text-midnight-800"
      >
        <span>Price breakdown</span>
        <span className="text-lagoon-700">{expanded ? "Hide" : "Show"}</span>
      </button>

      {expanded ? (
        <dl className="mt-3 space-y-1.5 border-t border-hairline pt-3">
          {lines.map((line, i) => (
            <div key={`${line.label}-${i}`} className="flex items-baseline justify-between gap-3 text-xs">
              <dt className={cn("text-muted", line.kind === "discount" && "text-emerald-700")}>
                {line.label}
              </dt>
              <dd
                className={cn(
                  "shrink-0 font-medium tabular-nums text-midnight-800",
                  line.kind === "discount" && "text-emerald-700",
                )}
              >
                <Price amountINR={line.amountINR} className="text-xs font-medium" />
              </dd>
            </div>
          ))}
          <div className="flex items-baseline justify-between gap-3 border-t border-hairline pt-2 text-sm">
            <dt className="font-semibold text-midnight-900">Total</dt>
            <dd className="font-bold text-midnight-900">
              <Price amountINR={totalINR} className="text-sm" />
            </dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}
