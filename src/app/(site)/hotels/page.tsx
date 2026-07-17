import type { Metadata } from "next";
import Link from "next/link";
import { BedDouble, MapPin, Star, Wifi, Waves, Utensils, Dumbbell, Car } from "lucide-react";

import { getHotels, getHotelCities, getDestinations, getDestinationBySlug, type HotelFilter } from "@/server/catalog";
import { SmartImage } from "@/components/ui/smart-image";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Pagination } from "@/components/ui/pagination";
import { Price } from "@/components/ui/price";
import { Badge, EmptyState, Rating } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { HotelSearchBar } from "@/components/hotels/hotel-search-bar";
import { HotelDestinationsRail } from "@/components/hotels/hotel-destinations-rail";
import { buildQueryString } from "@/lib/utils";

export const revalidate = 600;

type SearchParams = Record<string, string | string[] | undefined>;

export const metadata: Metadata = {
  title: "Hotels & resorts",
  description:
    "Hand-checked hotels, resorts and villas. Real photos, honest descriptions, and clear cancellation rules before you pay.",
  alternates: { canonical: "/hotels" },
};

const AMENITY_ICONS: Record<string, typeof Wifi> = {
  wifi: Wifi,
  pool: Waves,
  restaurant: Utensils,
  gym: Dumbbell,
  parking: Car,
};

function one(sp: SearchParams, key: string) {
  const v = sp[key];
  return typeof v === "string" && v ? v : undefined;
}

export default async function HotelsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const stars = (sp.star ? (Array.isArray(sp.star) ? sp.star : [sp.star]) : [])
    .map(Number)
    .filter(Boolean);

  const destinationSlug = one(sp, "destination");

  const filter: HotelFilter = {
    query: one(sp, "q"),
    city: one(sp, "city"),
    destinationSlug,
    starCategory: stars,
    sort: (one(sp, "sort") ?? "recommended") as HotelFilter["sort"],
    page: Math.max(1, Number(one(sp, "page") ?? 1) || 1),
    pageSize: 9,
  };

  // The curated destinations rail is a browse aid for the unfiltered view —
  // once someone has searched or filtered, results speak for themselves.
  const hasActiveFilters = Boolean(filter.query || filter.city || destinationSlug || stars.length);

  const [result, cities, hotelDestinations, filterDestination] = await Promise.all([
    getHotels(filter),
    getHotelCities(),
    hasActiveFilters ? Promise.resolve([]) : getDestinations({ hotelFeatured: true, limit: 14 }),
    destinationSlug ? getDestinationBySlug(destinationSlug) : Promise.resolve(null),
  ]);

  const checkIn = one(sp, "checkIn");
  const checkOut = one(sp, "checkOut");

  const buildHref = (page: number) => {
    const params: Record<string, string | string[] | undefined> = {};
    for (const [key, value] of Object.entries(sp)) {
      if (key !== "page" && value !== undefined) params[key] = value;
    }
    return `/hotels${buildQueryString({ ...params, page })}`;
  };

  return (
    <>
      <header className="border-b border-hairline wash-ivory pb-10 pt-8">
        <div className="container-page">
          <Breadcrumbs items={[{ name: "Hotels", href: "/hotels" }]} />

          <div className="mt-6 max-w-3xl">
            <h1 className="text-3xl leading-tight text-midnight-900 sm:text-4xl lg:text-5xl">
              Stays we&apos;d book ourselves
            </h1>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              Every property here has been inspected or stayed in. If the service slips, we take it off
              the list — that&apos;s the whole vetting policy.
            </p>
          </div>

          <div className="mt-8">
            <HotelSearchBar cities={cities} defaults={{ q: filter.query, checkIn, checkOut }} />
          </div>
        </div>
      </header>

      {!hasActiveFilters ? <HotelDestinationsRail destinations={hotelDestinations} /> : null}

      <div className="container-page section-y !pt-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted" aria-live="polite">
            <span className="font-semibold text-midnight-900">{result.total}</span>{" "}
            {result.total === 1 ? "property" : "properties"}
          </p>

          <div className="flex flex-wrap gap-2">
            {[3, 4, 5].map((s) => {
              const active = stars.includes(s);
              const nextStars = active ? stars.filter((x) => x !== s) : [...stars, s];
              const params: Record<string, string | string[] | undefined> = {};
              for (const [key, value] of Object.entries(sp)) {
                if (key !== "star" && key !== "page" && value !== undefined) params[key] = value;
              }

              return (
                <Link
                  key={s}
                  href={`/hotels${buildQueryString({ ...params, star: nextStars.map(String) })}`}
                  aria-pressed={active}
                  className={
                    active
                      ? "flex items-center gap-1 rounded-full bg-midnight-900 px-3.5 py-2 text-sm font-semibold text-white"
                      : "flex items-center gap-1 rounded-full border border-hairline bg-white px-3.5 py-2 text-sm font-semibold text-midnight-700 hover:border-midnight-300"
                  }
                >
                  {s}
                  <Star className="size-3.5 fill-current" aria-hidden />
                </Link>
              );
            })}
          </div>
        </div>

        {result.items.length === 0 ? (
          <EmptyState
            icon={<BedDouble />}
            title={
              filterDestination
                ? `No properties in ${filterDestination.name} yet`
                : "No properties match that search"
            }
            description={
              filterDestination
                ? "We don't have a published property there yet — tell us your dates and we'll find one for you."
                : "Try a different city or loosen the star filter — or ask us and we'll find something."
            }
            action={
              <Button asChild variant="accent">
                <Link href="/contact">Ask us to find a stay</Link>
              </Button>
            }
          />
        ) : (
          <>
            <ul className="grid gap-6 lg:grid-cols-2">
              {result.items.map((h) => (
                <li key={h.id}>
                  <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-surface shadow-tile transition-all duration-500 hover:-translate-y-1 hover:shadow-lift motion-reduce:hover:translate-y-0 sm:flex-row">
                    <div className="relative aspect-16/10 shrink-0 overflow-hidden sm:aspect-auto sm:w-64">
                      <SmartImage
                        src={h.heroImage}
                        alt={h.heroAlt}
                        fill
                        sizes="(max-width: 640px) 100vw, 256px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:group-hover:scale-100"
                      />
                      {h.isDemoData ? (
                        <Badge tone="warning" size="sm" className="absolute left-3 top-3">
                          Demo rates
                        </Badge>
                      ) : null}
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="flex items-center gap-1 text-[0.6875rem] font-bold uppercase tracking-wider text-lagoon-700">
                            {Array.from({ length: h.starCategory }).map((_, i) => (
                              <Star key={i} className="size-3 fill-gild-400 text-gild-400" aria-hidden />
                            ))}
                            <span className="ml-1">{h.propertyType}</span>
                          </p>
                          <h2 className="mt-1.5 font-display text-lg leading-snug text-midnight-900">
                            <Link
                              href={`/hotels/${h.slug}`}
                              className="after:absolute after:inset-0 hover:text-lagoon-800"
                            >
                              {h.name}
                            </Link>
                          </h2>
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                            <MapPin className="size-3.5" aria-hidden />
                            {h.city}, {h.country}
                          </p>
                        </div>

                        {h.ratingCount > 0 ? <Rating value={h.ratingAverage} count={h.ratingCount} /> : null}
                      </div>

                      <p className="mt-3 line-clamp-2 text-[0.8125rem] leading-relaxed text-muted">
                        {h.summary}
                      </p>

                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {h.amenities.slice(0, 5).map((a) => {
                          const Icon = AMENITY_ICONS[a.toLowerCase()] ?? Star;
                          return (
                            <li
                              key={a}
                              className="flex items-center gap-1 rounded-lg bg-sand-100 px-2 py-1 text-[0.6875rem] font-medium capitalize text-midnight-700"
                            >
                              <Icon className="size-3" aria-hidden />
                              {a}
                            </li>
                          );
                        })}
                      </ul>

                      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                        <div>
                          <Price amountINR={h.startingPriceINR} className="text-lg" />
                          <p className="text-[0.625rem] text-muted">per night, excl. taxes</p>
                        </div>
                        <span className="relative z-10 rounded-full bg-midnight-900 px-4 py-2 text-xs font-semibold text-white">
                          View rooms
                        </span>
                      </div>
                    </div>
                  </article>
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
    </>
  );
}
