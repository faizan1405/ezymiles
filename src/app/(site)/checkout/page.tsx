import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";

import { CheckoutFlow, type CheckoutItem } from "@/components/booking/checkout-flow";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { getActivityBySlug, getHotelBySlug, getPackageBySlug, getVisaCountryBySlug } from "@/server/catalog";
import { formatDuration, daysBetween } from "@/lib/utils";
import type { BookingIntentInput } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Checkout",
  // A checkout URL carries a specific selection; it has no business in an index.
  robots: { index: false, follow: false },
};

type SearchParams = Record<string, string | string[] | undefined>;

function one(sp: SearchParams, key: string) {
  const v = sp[key];
  return typeof v === "string" && v ? v : undefined;
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const type = one(sp, "type");
  const slug = one(sp, "slug");

  if (!type || !slug) redirect("/packages");

  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()]);

  const adults = Math.max(1, Number(one(sp, "adults") ?? 1) || 1);
  const children = Math.max(0, Number(one(sp, "children") ?? 0) || 0);

  const intent = {
    type: type as BookingIntentInput["type"],
    itemSlug: slug,
    adults,
    children,
    infants: 0,
    variantKey: one(sp, "variant"),
    departureId: one(sp, "departure"),
    travelDate: one(sp, "date"),
    roomKey: one(sp, "room"),
    checkIn: one(sp, "checkIn"),
    checkOut: one(sp, "checkOut"),
    rooms: one(sp, "rooms") ? Number(one(sp, "rooms")) : undefined,
    slotTime: one(sp, "slot"),
    visaType: one(sp, "visaType"),
    addOns: [],
    pickupRequired: one(sp, "pickup") === "1",
    paymentMode: "full" as const,
  } satisfies BookingIntentInput;

  const item = await resolveItem(type, slug, intent);

  if (!item) {
    return (
      <div className="container-page section-y">
        <EmptyState
          icon={<AlertTriangle />}
          title="We couldn't find what you were booking"
          description="That item may have been removed or is no longer published. Nothing has been charged."
          action={
            <Button asChild variant="accent">
              <Link href="/packages">Browse packages</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page section-y !pt-8">
      <Breadcrumbs items={[{ name: "Checkout", href: "/checkout" }]} />

      <div className="mt-6 max-w-2xl">
        <h1 className="text-3xl text-midnight-900 sm:text-4xl">Complete your booking</h1>
        <p className="mt-3 text-[0.9375rem] text-muted">
          Three short steps. Your total is recalculated on our server at every one — the number you
          see is the number you pay.
        </p>
      </div>

      {!user ? (
        <p className="mt-6 rounded-2xl bg-sand-50 p-4 text-sm text-muted">
          Booking as a guest.{" "}
          <Link
            href={`/login?callbackUrl=${encodeURIComponent("/checkout")}`}
            className="font-semibold text-lagoon-700 underline hover:no-underline"
          >
            Sign in
          </Link>{" "}
          to keep this trip in your account and track it later.
        </p>
      ) : null}

      <div className="mt-10">
        <CheckoutFlow
          intent={intent}
          item={item}
          brandName={settings.brand.name}
          defaults={{
            name: user?.name ?? undefined,
            email: user?.email ?? undefined,
          }}
        />
      </div>
    </div>
  );
}

/** Resolves the display summary. Pricing is derived separately, server-side. */
async function resolveItem(
  type: string,
  slug: string,
  intent: BookingIntentInput,
): Promise<CheckoutItem | null> {
  if (type === "package") {
    const pkg = await getPackageBySlug(slug);
    if (!pkg) return null;

    const departure = intent.departureId
      ? pkg.departures.find((d) => String(d._id) === intent.departureId)
      : undefined;

    return {
      title: pkg.title,
      image: pkg.heroImage?.url,
      subtitle: `${formatDuration(pkg.durationDays, pkg.durationNights)} · ${pkg.citiesCovered.slice(0, 3).join(", ")}`,
      travelDate: departure ? String(departure.date) : intent.travelDate,
      endDate: departure?.returnDate ? String(departure.returnDate) : undefined,
    };
  }

  if (type === "hotel") {
    const hotel = await getHotelBySlug(slug);
    if (!hotel) return null;

    const nights =
      intent.checkIn && intent.checkOut ? daysBetween(intent.checkIn, intent.checkOut) : 0;

    return {
      title: hotel.name,
      image: hotel.heroImage?.url,
      subtitle: `${hotel.city} · ${nights} ${nights === 1 ? "night" : "nights"} · ${intent.rooms ?? 1} room(s)`,
      travelDate: intent.checkIn,
      endDate: intent.checkOut,
    };
  }

  if (type === "activity") {
    const activity = await getActivityBySlug(slug);
    if (!activity) return null;

    return {
      title: activity.title,
      image: activity.heroImage?.url,
      subtitle: `${activity.city}${intent.slotTime ? ` · ${intent.slotTime}` : ""}`,
      travelDate: intent.travelDate,
    };
  }

  if (type === "visa") {
    const country = await getVisaCountryBySlug(slug);
    if (!country) return null;

    return {
      title: `${country.country} visa assistance`,
      image: country.heroImage?.url,
      subtitle: `${intent.visaType ?? "Tourist"} visa · ${intent.adults} applicant(s)`,
      travelDate: intent.travelDate,
    };
  }

  return null;
}
