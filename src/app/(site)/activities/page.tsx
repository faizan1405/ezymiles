import type { Metadata } from "next";
import Link from "next/link";
import { Ticket } from "lucide-react";

import { getActivities, getDestinations, type ActivityFilter } from "@/server/catalog";
import { ActivityCard } from "@/components/activities/activity-card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { ACTIVITY_CATEGORIES } from "@/config/site";
import { buildQueryString } from "@/lib/utils";

export const revalidate = 600;

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const label = ACTIVITY_CATEGORIES.find((c) => c.slug === category)?.label;

  return {
    title: label ? `${label} experiences` : "Activities & experiences",
    description:
      "Guided experiences, day tours and once-in-a-trip activities — booked in advance, with real guides and honest safety information.",
    alternates: { canonical: "/activities" },
    robots: Object.keys(sp).length > 0 ? { index: false, follow: true } : undefined,
  };
}

function one(sp: SearchParams, key: string) {
  const v = sp[key];
  return typeof v === "string" && v ? v : undefined;
}

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const filter: ActivityFilter = {
    category: one(sp, "category"),
    destinationSlug: one(sp, "destination"),
    query: one(sp, "q"),
    sort: (one(sp, "sort") ?? "recommended") as ActivityFilter["sort"],
    page: Math.max(1, Number(one(sp, "page") ?? 1) || 1),
    pageSize: 12,
  };

  const [result, destinations] = await Promise.all([
    getActivities(filter),
    getDestinations({ limit: 40 }),
  ]);

  const activeCategory = ACTIVITY_CATEGORIES.find((c) => c.slug === filter.category);

  const buildHref = (page: number) => {
    const params: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(sp)) {
      if (key !== "page" && typeof value === "string") params[key] = value;
    }
    return `/activities${buildQueryString({ ...params, page })}`;
  };

  return (
    <>
      <header className="border-b border-hairline wash-ivory pb-12 pt-8">
        <div className="container-page">
          <Breadcrumbs items={[{ name: "Activities", href: "/activities" }]} />

          <div className="mt-6 max-w-3xl">
            <h1 className="text-3xl leading-tight text-midnight-900 sm:text-4xl lg:text-5xl">
              {activeCategory ? activeCategory.label : "The bit you'll actually remember"}
            </h1>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              Book the experiences separately or fold them into a package. Every listing states what&apos;s
              included, what isn&apos;t, and what the safety brief involves.
            </p>
          </div>

          {/* Category chips */}
          <div className="no-scrollbar -mx-5 mt-7 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
            <Link
              href="/activities"
              aria-current={!filter.category ? "page" : undefined}
              className={
                !filter.category
                  ? "shrink-0 rounded-full bg-midnight-900 px-4 py-2.5 text-sm font-semibold text-white"
                  : "shrink-0 rounded-full border border-hairline bg-white px-4 py-2.5 text-sm font-semibold text-midnight-700 transition-colors hover:border-midnight-300"
              }
            >
              All
            </Link>
            {ACTIVITY_CATEGORIES.map((c) => {
              const active = filter.category === c.slug;
              return (
                <Link
                  key={c.slug}
                  href={`/activities?category=${c.slug}`}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "shrink-0 rounded-full bg-midnight-900 px-4 py-2.5 text-sm font-semibold text-white"
                      : "shrink-0 rounded-full border border-hairline bg-white px-4 py-2.5 text-sm font-semibold text-midnight-700 transition-colors hover:border-midnight-300"
                  }
                >
                  {c.label}
                </Link>
              );
            })}
          </div>

          {destinations.length ? (
            <form className="mt-4 flex flex-wrap items-center gap-2" action="/activities">
              {filter.category ? (
                <input type="hidden" name="category" value={filter.category} />
              ) : null}
              <label htmlFor="dest-filter" className="text-xs font-semibold text-muted">
                Destination
              </label>
              <select
                id="dest-filter"
                name="destination"
                defaultValue={filter.destinationSlug ?? ""}
                className="h-10 rounded-full border border-hairline bg-white px-4 text-sm"
              >
                <option value="">Anywhere</option>
                {destinations.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.name}
                  </option>
                ))}
              </select>
              <Button type="submit" size="sm" variant="outline">
                Apply
              </Button>
            </form>
          ) : null}
        </div>
      </header>

      <div className="container-page section-y">
        <p className="mb-6 text-sm text-muted" aria-live="polite">
          <span className="font-semibold text-midnight-900">{result.total}</span>{" "}
          {result.total === 1 ? "experience" : "experiences"}
        </p>

        {result.items.length === 0 ? (
          <EmptyState
            icon={<Ticket />}
            title="No experiences match that"
            description="Try a different category, or ask us — we can usually arrange it privately."
            action={
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild variant="accent">
                  <Link href="/contact">Ask us to arrange it</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/activities">Clear filters</Link>
                </Button>
              </div>
            }
          />
        ) : (
          <>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {result.items.map((a) => (
                <li key={a.id}>
                  <ActivityCard activity={a} />
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
