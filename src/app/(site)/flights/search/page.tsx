import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Users, Plane } from "lucide-react";

import { searchFlights, type FlightSearchQuery } from "@/server/flights";
import { FlightResults } from "@/components/flights/flight-results";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Skeleton } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { formatDate, futureDateInput } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Flight search results",
  // Result pages are query-specific and must never be indexed.
  robots: { index: false, follow: false },
};

type SearchParams = Record<string, string | string[] | undefined>;

function one(sp: SearchParams, key: string, fallback = "") {
  const v = sp[key];
  return typeof v === "string" && v ? v : fallback;
}

export default async function FlightSearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const from = one(sp, "from").toUpperCase();
  const to = one(sp, "to").toUpperCase();

  if (!from || !to) {
    return (
      <div className="container-page section-y text-center">
        <Plane className="mx-auto size-10 text-midnight-300" aria-hidden />
        <h1 className="mt-5 text-3xl text-midnight-900">Tell us where you&apos;re going</h1>
        <p className="mt-3 text-muted">We need a departure and an arrival airport to search.</p>
        <Button asChild variant="accent" className="mt-7">
          <Link href="/flights">Back to flight search</Link>
        </Button>
      </div>
    );
  }

  const query: FlightSearchQuery = {
    tripType: (one(sp, "tripType", "one_way") as FlightSearchQuery["tripType"]) ?? "one_way",
    from,
    to,
    departDate: one(sp, "departDate", futureDateInput(21)),
    returnDate: one(sp, "returnDate") || undefined,
    adults: Math.max(1, Number(one(sp, "adults", "1")) || 1),
    children: Math.max(0, Number(one(sp, "children", "0")) || 0),
    infants: Math.max(0, Number(one(sp, "infants", "0")) || 0),
    cabinClass: one(sp, "cabinClass", "economy"),
    nonStopOnly: one(sp, "nonStop") === "1",
  };

  const passthrough: Record<string, string> = {
    tripType: query.tripType,
    from: query.from,
    to: query.to,
    departDate: query.departDate,
    returnDate: query.returnDate ?? "",
    adults: String(query.adults),
    children: String(query.children),
    infants: String(query.infants),
    cabinClass: query.cabinClass,
  };

  const travellers = query.adults + query.children + query.infants;

  return (
    <>
      <header className="border-b border-hairline bg-white pb-6 pt-6">
        <div className="container-page">
          <Breadcrumbs
            items={[
              { name: "Flights", href: "/flights" },
              { name: `${from} → ${to}`, href: "#" },
            ]}
          />

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-2.5 text-2xl text-midnight-900 sm:text-3xl">
                {from}
                <ArrowRight className="size-5 text-lagoon-600" aria-hidden />
                {to}
              </h1>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                <span>{formatDate(query.departDate)}</span>
                {query.returnDate ? (
                  <>
                    <span aria-hidden>·</span>
                    <span>Returning {formatDate(query.returnDate)}</span>
                  </>
                ) : null}
                <span aria-hidden>·</span>
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" aria-hidden />
                  {travellers} {travellers === 1 ? "traveller" : "travellers"}
                </span>
                <span aria-hidden>·</span>
                <span className="capitalize">{query.cabinClass.replace("_", " ")}</span>
              </p>
            </div>

            <Button asChild variant="outline">
              <Link href="/flights">Change search</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container-page section-y !pt-10">
        <Suspense fallback={<ResultsSkeleton />}>
          <Results query={query} passthrough={passthrough} />
        </Suspense>
      </div>
    </>
  );
}

async function Results({
  query,
  passthrough,
}: {
  query: FlightSearchQuery;
  passthrough: Record<string, string>;
}) {
  const result = await searchFlights(query);

  return (
    <FlightResults
      offers={result.offers}
      dataSource={result.dataSource}
      notice={result.notice}
      query={passthrough}
    />
  );
}

function ResultsSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
      <Skeleton className="hidden h-96 lg:block" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    </div>
  );
}
