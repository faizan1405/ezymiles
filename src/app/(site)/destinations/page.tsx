import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Clock, CalendarRange, Layers, Compass } from "lucide-react";

import { getDestinations } from "@/server/catalog";
import { SmartImage } from "@/components/ui/smart-image";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Price } from "@/components/ui/price";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { pluralise } from "@/lib/utils";

export const revalidate = 900;

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const scope = typeof sp.scope === "string" ? sp.scope : undefined;

  const title =
    scope === "domestic"
      ? "Destinations in India"
      : scope === "international"
        ? "International destinations"
        : "Destinations";

  return {
    title,
    description:
      "Every destination we actively plan — with starting prices, ideal trip lengths and the months that actually work.",
    alternates: { canonical: "/destinations" },
  };
}

export default async function DestinationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const scope = typeof sp.scope === "string" ? (sp.scope as "domestic" | "international") : undefined;

  const destinations = await getDestinations({ scope, limit: 60 });

  const grouped = destinations.reduce<Record<string, typeof destinations>>((acc, d) => {
    const key = d.scope === "domestic" ? "India" : "International";
    (acc[key] ??= []).push(d);
    return acc;
  }, {});

  return (
    <>
      <header className="border-b border-hairline wash-ivory pb-12 pt-8">
        <div className="container-page">
          <Breadcrumbs items={[{ name: "Destinations", href: "/destinations" }]} />

          <div className="mt-6 max-w-3xl">
            <h1 className="text-3xl leading-tight text-midnight-900 sm:text-4xl lg:text-5xl">
              Places we know well enough to argue about
            </h1>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              We&apos;d rather plan twenty destinations properly than list two hundred badly. Each one
              below has a designer who has been there and will tell you honestly when it isn&apos;t the
              right month.
            </p>
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            {[
              { label: "All", href: "/destinations", active: !scope },
              { label: "India", href: "/destinations?scope=domestic", active: scope === "domestic" },
              {
                label: "International",
                href: "/destinations?scope=international",
                active: scope === "international",
              },
            ].map((tab) => (
              <Link
                key={tab.label}
                href={tab.href}
                aria-current={tab.active ? "page" : undefined}
                className={
                  tab.active
                    ? "rounded-full bg-midnight-900 px-4 py-2.5 text-sm font-semibold text-white"
                    : "rounded-full border border-hairline px-4 py-2.5 text-sm font-semibold text-midnight-700 transition-colors hover:bg-white"
                }
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <div className="container-page section-y">
        {destinations.length === 0 ? (
          <EmptyState
            icon={<Compass />}
            title="No destinations published yet"
            description="Destinations appear here as soon as they're published from the admin panel."
            action={
              <Button asChild variant="accent">
                <Link href="/customise-my-trip">Tell us where you want to go</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-16">
            {Object.entries(grouped).map(([group, items]) => (
              <section key={group}>
                <Reveal>
                  <h2 className="text-2xl text-midnight-900 sm:text-3xl">{group}</h2>
                  <p className="mt-1.5 text-sm text-muted">
                    {pluralise(items.length, "destination")}
                  </p>
                </Reveal>

                <RevealGroup as="ul" className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((d) => (
                    <RevealItem as="li" key={d.id}>
                      <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-surface shadow-tile transition-all duration-500 hover:-translate-y-1 hover:shadow-lift motion-reduce:hover:translate-y-0">
                        <div className="relative aspect-16/10 overflow-hidden">
                          <SmartImage
                            src={d.heroImage}
                            alt={d.heroAlt}
                            fill
                            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:group-hover:scale-100"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-midnight-950/60 to-transparent" />
                          <p className="absolute bottom-3 left-4 flex items-center gap-1.5 text-xs font-semibold text-white">
                            <MapPin className="size-3.5" aria-hidden />
                            {d.country}
                          </p>
                        </div>

                        <div className="flex flex-1 flex-col p-5">
                          <h3 className="font-display text-xl text-midnight-900">
                            <Link
                              href={`/destinations/${d.slug}`}
                              className="after:absolute after:inset-0 hover:text-lagoon-800"
                            >
                              {d.name}
                            </Link>
                          </h3>

                          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                            {d.summary}
                          </p>

                          <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
                            <div className="flex items-center gap-1.5">
                              <Clock className="size-3.5" aria-hidden />
                              <dt className="sr-only">Ideal length</dt>
                              <dd>{d.recommendedDurationDays} days</dd>
                            </div>
                            {d.bestMonths.length ? (
                              <div className="flex items-center gap-1.5">
                                <CalendarRange className="size-3.5" aria-hidden />
                                <dt className="sr-only">Best months</dt>
                                <dd>{d.bestMonths.slice(0, 3).join(", ")}</dd>
                              </div>
                            ) : null}
                            <div className="flex items-center gap-1.5">
                              <Layers className="size-3.5" aria-hidden />
                              <dt className="sr-only">Packages</dt>
                              <dd>{pluralise(d.packageCount, "package")}</dd>
                            </div>
                          </dl>

                          <div className="mt-auto pt-5">
                            <p className="text-[0.625rem] uppercase tracking-wide text-muted">
                              Starting from
                            </p>
                            <Price amountINR={d.startingPriceINR} className="text-lg" />
                          </div>
                        </div>
                      </article>
                    </RevealItem>
                  ))}
                </RevealGroup>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
