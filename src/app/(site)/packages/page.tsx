import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Compass } from "lucide-react";
import {
  getDepartureCities,
  getDestinations,
  getPackages,
  type PackageFilter,
} from "@/server/catalog";
import { getSettings } from "@/lib/settings";
import { PackageCard, PackageCardSkeleton } from "@/components/packages/package-card";
import { PackageFilters } from "@/components/packages/package-filters";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { buildQueryString, cn } from "@/lib/utils";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const settings = await getSettings();

  const scope = typeof sp.scope === "string" ? sp.scope : undefined;
  const tripType = typeof sp.tripType === "string" ? sp.tripType : undefined;

  const title = scope === "domestic"
    ? "India holiday packages"
    : scope === "international"
      ? "International holiday packages"
      : tripType
        ? `${tripType[0].toUpperCase()}${tripType.slice(1)} holiday packages`
        : "Holiday packages";

  return {
    title,
    description: `${title} designed around your dates, your budget and your pace. Transparent pricing, verified stays and 24/7 support from ${settings.brand.name}.`,
    alternates: { canonical: "/packages" },
    // Filtered permutations shouldn't compete with the canonical listing in search.
    robots: Object.keys(sp).length > 1 ? { index: false, follow: true } : { index: true, follow: true },
  };
}

function one(sp: SearchParams, key: string): string | undefined {
  const v = sp[key];
  return typeof v === "string" && v ? v : undefined;
}

function many(sp: SearchParams, key: string): string[] {
  const v = sp[key];
  if (Array.isArray(v)) return v;
  if (typeof v === "string" && v) return [v];
  return [];
}

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const view = one(sp, "view") === "list" ? "list" : "grid";
  const sort = (one(sp, "sort") ?? "recommended") as NonNullable<PackageFilter["sort"]>;
  const page = Math.max(1, Number(one(sp, "page") ?? 1) || 1);

  const filter: PackageFilter = {
    scope: one(sp, "scope") as PackageFilter["scope"],
    destinationSlug: one(sp, "destination"),
    tripType: one(sp, "tripType"),
    collection: one(sp, "collection"),
    minPrice: one(sp, "minPrice") ? Number(one(sp, "minPrice")) : undefined,
    maxPrice: one(sp, "maxPrice") ? Number(one(sp, "maxPrice")) : undefined,
    minDuration: one(sp, "minDuration") ? Number(one(sp, "minDuration")) : undefined,
    maxDuration: one(sp, "maxDuration") ? Number(one(sp, "maxDuration")) : undefined,
    hotelCategory: many(sp, "hotelCategory").map(Number).filter(Boolean),
    flightsIncluded: one(sp, "flightsIncluded") === "1",
    mealsIncluded: one(sp, "mealsIncluded") === "1",
    activitiesIncluded: one(sp, "activitiesIncluded") === "1",
    minRating: one(sp, "minRating") ? Number(one(sp, "minRating")) : undefined,
    tripStyle: one(sp, "tripStyle") as PackageFilter["tripStyle"],
    fixedDeparture: one(sp, "fixedDeparture") === "1",
    instantConfirmation: one(sp, "instantConfirmation") === "1",
    departureCity: one(sp, "departureCity"),
    season: one(sp, "season"),
    query: one(sp, "q"),
    sort,
    page,
    pageSize: 9,
  };

  const [result, destinations, departureCities] = await Promise.all([
    getPackages(filter),
    getDestinations({ limit: 40 }),
    getDepartureCities(),
  ]);

  const buildHref = (nextPage: number) => {
    const params: Record<string, string | string[] | undefined> = {};
    for (const [key, value] of Object.entries(sp)) {
      if (key === "page") continue;
      if (value !== undefined) params[key] = value;
    }
    return `/packages${buildQueryString({ ...params, page: nextPage })}`;
  };

  const heading =
    filter.scope === "domestic"
      ? "Holidays in India"
      : filter.scope === "international"
        ? "International holidays"
        : "Every holiday we run";

  return (
    <>
      {/* --------------------------------- Header --------------------------------- */}
      <header className="border-b border-hairline wash-ivory pb-12 pt-8">
        <div className="container-page">
          <Breadcrumbs items={[{ name: "Packages", href: "/packages" }]} />

          <div className="mt-6 max-w-3xl">
            <h1 className="text-3xl leading-tight text-midnight-900 sm:text-4xl lg:text-5xl">
              {heading}
            </h1>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              Filter by budget, length, style and what&apos;s actually included. Every price below is
              per person, and every inclusion is stated plainly — no asterisks waiting at checkout.
            </p>
          </div>
        </div>
      </header>

      {/* --------------------------------- Results -------------------------------- */}
      <div className="container-page section-y">
        <Suspense fallback={<ResultsSkeleton view={view} />}>
          <div className="grid gap-10 lg:grid-cols-[17rem_1fr]">
            <div className="lg:contents">
              <PackageFilters
                destinations={destinations.map((d) => ({ name: d.name, slug: d.slug }))}
                departureCities={departureCities}
                total={result.total}
                view={view}
                sort={sort}
              />
            </div>

            <div className="min-w-0 lg:col-start-2 lg:row-start-1">
              {result.items.length === 0 ? (
                <EmptyState
                  icon={<Compass />}
                  title="No packages match those filters"
                  description="Loosen a filter or two — or tell us what you're after and we'll build it from scratch."
                  action={
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button asChild variant="accent">
                        <Link href="/customise-my-trip">Design a custom trip</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href="/packages">Clear all filters</Link>
                      </Button>
                    </div>
                  }
                />
              ) : (
                <>
                  <ul
                    className={cn(
                      "grid gap-8",
                      view === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1",
                    )}
                  >
                    {result.items.map((pkg) => (
                      <li key={pkg.id}>
                        <PackageCard pkg={pkg} layout={view} />
                      </li>
                    ))}
                  </ul>

                  <Pagination
                    page={result.page}
                    totalPages={result.totalPages}
                    buildHref={buildHref}
                    className="mt-12"
                  />
                </>
              )}
            </div>
          </div>
        </Suspense>
      </div>

      {/* ---------------------------------- SEO ----------------------------------- */}
      <section className="border-t border-hairline bg-white py-14">
        <div className="container-page prose-ezymiles max-w-3xl">
          <h2 className="text-2xl text-midnight-900">Choosing a holiday package</h2>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
            A package should save you time, not flexibility. Everything listed here can be shortened,
            extended, upgraded to a different hotel tier, or rebuilt around a different route — the
            listed price is a starting point from a real, costed itinerary rather than a teaser.
          </p>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
            Prices are per person on twin-sharing basis unless stated otherwise, and include the
            inclusions shown on each card. Flights, visas and travel insurance are included only where
            the card says so. If you&apos;re travelling solo, a single-occupancy supplement applies and
            is shown before you pay.
          </p>
        </div>
      </section>
    </>
  );
}

function ResultsSkeleton({ view }: { view: "grid" | "list" }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
      <div className="hidden lg:block">
        <div className="skeleton h-[40rem] rounded-2xl" />
      </div>
      <ul className={cn("grid gap-6", view === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1")}>
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i}>
            <PackageCardSkeleton layout={view} />
          </li>
        ))}
      </ul>
    </div>
  );
}
