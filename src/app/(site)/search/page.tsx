import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";

import { getActivities, getDestinations, getPackages } from "@/server/catalog";
import { PackageCard } from "@/components/packages/package-card";
import { ActivityCard } from "@/components/activities/activity-card";
import { SmartImage } from "@/components/ui/smart-image";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";

export const metadata: Metadata = {
  title: "Search",
  // Search-result URLs are user-generated and shouldn't compete in an index.
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const query = (typeof sp.q === "string" ? sp.q : "").trim();

  if (!query) {
    return (
      <div className="container-page section-y">
        <EmptyState
          icon={<SearchX />}
          title="What are you looking for?"
          description="Search a destination, a package or an experience from the header."
          action={
            <Button asChild variant="accent">
              <Link href="/packages">Browse everything</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const [packages, activities, allDestinations] = await Promise.all([
    getPackages({ query, pageSize: 9 }),
    getActivities({ query, pageSize: 4 }),
    getDestinations({ limit: 60 }),
  ]);

  const term = query.toLowerCase();
  const destinations = allDestinations
    .filter(
      (d) =>
        d.name.toLowerCase().includes(term) ||
        d.country.toLowerCase().includes(term) ||
        d.summary.toLowerCase().includes(term),
    )
    .slice(0, 6);

  const total = packages.total + activities.total + destinations.length;

  return (
    <div className="container-page section-y !pt-8">
      <Breadcrumbs items={[{ name: "Search", href: "/search" }]} />

      <header className="mt-6">
        <h1 className="text-3xl text-midnight-900 sm:text-4xl">
          Results for &ldquo;{query}&rdquo;
        </h1>
        <p className="mt-2 text-[0.9375rem] text-muted" aria-live="polite">
          {total} {total === 1 ? "result" : "results"} across destinations, packages and experiences.
        </p>
      </header>

      {total === 0 ? (
        <EmptyState
          className="mt-12"
          icon={<SearchX />}
          title={`Nothing matched "${query}"`}
          description="Try a country, a city, or a travel style — or tell us what you're after and we'll plan it from scratch."
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild variant="accent">
                <Link href="/customise-my-trip">Design a custom trip</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/packages">Browse all packages</Link>
              </Button>
            </div>
          }
        />
      ) : (
        <div className="mt-12 space-y-16">
          {destinations.length ? (
            <section>
              <h2 className="text-2xl text-midnight-900">Destinations</h2>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {destinations.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/destinations/${d.slug}`}
                      className="group flex items-center gap-4 rounded-2xl border border-hairline bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-tile motion-reduce:hover:translate-y-0"
                    >
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl">
                        <SmartImage
                          src={d.heroImage}
                          alt={d.heroAlt}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-midnight-900 group-hover:text-lagoon-800">
                          {d.name}
                        </p>
                        <p className="truncate text-xs text-muted">{d.country}</p>
                        <Price amountINR={d.startingPriceINR} className="mt-1 text-sm" compact />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {packages.items.length ? (
            <section>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl text-midnight-900">Packages</h2>
                {packages.total > packages.items.length ? (
                  <Link
                    href={`/packages?q=${encodeURIComponent(query)}`}
                    className="text-sm font-semibold text-lagoon-700 hover:underline"
                  >
                    See all {packages.total}
                  </Link>
                ) : null}
              </div>

              <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {packages.items.map((p) => (
                  <li key={p.id}>
                    <PackageCard pkg={p} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {activities.items.length ? (
            <section>
              <h2 className="text-2xl text-midnight-900">Experiences</h2>
              <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {activities.items.map((a) => (
                  <li key={a.id}>
                    <ActivityCard activity={a} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
