import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { getFlightProvider, type FlightSearchQuery } from "@/server/flights";
import { FlightReview } from "@/components/flights/flight-review";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { buildQueryString } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Review your flight",
  robots: { index: false, follow: false },
};

type SearchParams = Record<string, string | string[] | undefined>;

function one(sp: SearchParams, key: string, fallback = "") {
  const v = sp[key];
  return typeof v === "string" && v ? v : fallback;
}

export default async function FlightReviewPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const offerId = one(sp, "offer");

  const query: FlightSearchQuery = {
    tripType: (one(sp, "tripType", "one_way") as FlightSearchQuery["tripType"]) ?? "one_way",
    from: one(sp, "from").toUpperCase(),
    to: one(sp, "to").toUpperCase(),
    departDate: one(sp, "departDate"),
    returnDate: one(sp, "returnDate") || undefined,
    adults: Math.max(1, Number(one(sp, "adults", "1")) || 1),
    children: Math.max(0, Number(one(sp, "children", "0")) || 0),
    infants: Math.max(0, Number(one(sp, "infants", "0")) || 0),
    cabinClass: one(sp, "cabinClass", "economy"),
  };

  const backHref = `/flights/search${buildQueryString({
    tripType: query.tripType,
    from: query.from,
    to: query.to,
    departDate: query.departDate,
    returnDate: query.returnDate ?? "",
    adults: query.adults,
    children: query.children,
    infants: query.infants,
    cabinClass: query.cabinClass,
  })}`;

  const provider = getFlightProvider();
  const offer =
    offerId && query.from && query.to && query.departDate
      ? await provider.getOffer(offerId, query).catch(() => null)
      : null;

  if (!offer) {
    return (
      <div className="container-page section-y">
        <EmptyState
          icon={<AlertTriangle />}
          title="That fare is no longer available"
          description="Fares move. Nothing has been charged — search again and we'll show you what's bookable right now."
          action={
            <Button asChild variant="accent">
              <Link href={backHref}>Back to results</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()]);

  return (
    <div className="container-page section-y !pt-8">
      <Breadcrumbs
        items={[
          { name: "Flights", href: "/flights" },
          { name: `${query.from} → ${query.to}`, href: backHref },
          { name: "Review", href: "#" },
        ]}
      />

      <div className="mt-6 max-w-2xl">
        <h1 className="text-3xl text-midnight-900 sm:text-4xl">Review and confirm</h1>
        <p className="mt-3 text-[0.9375rem] text-muted">
          We re-check this fare with the supplier on our server before charging anything. If it has
          moved, we&apos;ll tell you rather than quietly charging the new price.
        </p>
      </div>

      <div className="mt-10">
        <FlightReview
          offer={offer}
          query={query}
          brandName={settings.brand.name}
          defaults={{ name: user?.name ?? undefined, email: user?.email ?? undefined }}
        />
      </div>
    </div>
  );
}
