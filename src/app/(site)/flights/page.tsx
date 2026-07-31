import type { Metadata } from "next";
import Link from "next/link";
import { Plane, ShieldCheck, Headset, Wallet } from "lucide-react";

import { UnifiedSearch } from "@/components/search/unified-search";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SectionHeading } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { DataSourceBadge } from "@/components/flights/data-source-badge";
import { getDestinations, getHotelCities, getVisaCountries } from "@/server/catalog";
import { getSettings } from "@/lib/settings";
import { integrations } from "@/lib/env";

export const metadata: Metadata = {
  title: "Flights",
  description:
    "Search flights, compare fares and book with a human on the other end. Every fare is clearly labelled as live, cached, or estimated.",
  alternates: { canonical: "/flights" },
};

export default async function FlightsPage() {
  const [settings, destinations, cities, visaCountries] = await Promise.all([
    getSettings(),
    getDestinations({ limit: 24 }),
    getHotelCities(),
    getVisaCountries(),
  ]);

  const isLive = integrations.liveFlights;

  return (
    <>
      <header className="border-b border-hairline wash-ivory pb-12 pt-8">
        <div className="container-page">
          <Breadcrumbs items={[{ name: "Flights", href: "/flights" }]} />

          <div className="mt-6 max-w-3xl">
            <h1 className="text-3xl leading-tight text-midnight-900 sm:text-4xl lg:text-5xl">
              Flights, without the dark patterns
            </h1>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              No fake countdowns, no &ldquo;3 people are looking at this&rdquo;. Just fares, clearly
              labelled for where they came from, and a person you can call if something goes wrong at
              the airport.
            </p>
          </div>

          <div className="mt-8">
            <UnifiedSearch
              variant="page"
              destinations={destinations.map((d) => ({ name: d.name, slug: d.slug }))}
              cities={cities}
              visaCountries={(visaCountries as { country: string; slug: string }[]).map((v) => ({
                country: v.country,
                slug: v.slug,
              }))}
              enabled={{
                flights: settings.features.flightsEnabled,
                hotels: settings.features.hotelsEnabled,
                activities: settings.features.activitiesEnabled,
                visa: settings.features.visaEnabled,
                cabs: settings.features.cabsEnabled,
              }}
            />
          </div>
        </div>
      </header>

      {/* ----------------------------- Data provenance ---------------------------- */}
      <section className="border-b border-hairline bg-white py-8">
        <div className="container-page">
          <div className="flex flex-col gap-4 rounded-2xl border border-hairline bg-sand-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Plane className="mt-0.5 size-5 shrink-0 text-lagoon-700" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-midnight-900">
                  {isLive ? "Live supplier inventory" : "No flight supplier connected"}
                </p>
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted">
                  {isLive
                    ? "Fares are retrieved from our contracted flight supplier and re-confirmed before payment."
                    : "No flight supplier is connected yet, so search is unavailable. Connect an authorised supplier (Amadeus, Travelport or a consolidator) to enable live inventory."}
                </p>
              </div>
            </div>
            <DataSourceBadge source={isLive ? "live" : "estimated"} className="shrink-0" />
          </div>
        </div>
      </section>

      {/* -------------------------------- Why us --------------------------------- */}
      <section className="section-y">
        <div className="container-page">
          <SectionHeading
            eyebrow="What you get"
            title="A booking engine, plus someone who answers the phone"
            align="center"
            className="text-center"
          />

          <ul className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                Icon: ShieldCheck,
                title: "Fares labelled honestly",
                body: "Live, cached, or estimated — stated on every single result. You always know what you're looking at.",
              },
              {
                Icon: Headset,
                title: "Disruption support",
                body: "If a flight is cancelled while you're travelling with us, we rebook it. You don't sit in a queue.",
              },
              {
                Icon: Wallet,
                title: "Bundled with the trip",
                body: "Add flights to any package and pay once, with the deposit option applying to the whole booking.",
              },
            ].map(({ Icon, title, body }) => (
              <li key={title}>
                <span className="flex size-12 items-center justify-center rounded-2xl wash-ocean text-white">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-5 font-display text-lg text-midnight-900">{title}</h3>
                <p className="mt-2 text-[0.875rem] leading-relaxed text-muted">{body}</p>
              </li>
            ))}
          </ul>

          <div className="mt-12 text-center">
            <Button asChild size="lg" variant="outline">
              <Link href="/contact">Ask us to find a fare manually</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
