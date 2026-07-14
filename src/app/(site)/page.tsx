import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { getSettings } from "@/lib/settings";
import {
  getActiveOffers,
  getBlogPosts,
  getDepartureCities,
  getDestinations,
  getFeaturedReviews,
  getHotelCities,
  getLiveActivity,
  getPackagesByCollection,
  getVisaCountries,
} from "@/server/catalog";

import { Hero } from "@/components/home/hero";
import { UnifiedSearch } from "@/components/search/unified-search";
import { DestinationExplorer } from "@/components/home/destination-explorer";
import { PackageRail } from "@/components/packages/package-rail";
import { TripBuilder } from "@/components/forms/trip-builder";
import { TravelMap } from "@/components/home/travel-map";
import { Experiences } from "@/components/home/experiences";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { LiveActivity } from "@/components/home/live-activity";
import { Offers } from "@/components/home/offers";
import { Testimonials } from "@/components/home/testimonials";
import { Inspiration } from "@/components/home/inspiration";
import { LeadCapture } from "@/components/home/lead-capture";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/primitives";

export const revalidate = 300;

export default async function HomePage() {
  const settings = await getSettings();

  // One parallel fan-out rather than a waterfall — every rail is independent.
  const [
    destinations,
    trendingIntl,
    bestOfIndia,
    honeymoon,
    family,
    luxury,
    adventure,
    weekend,
    groupDepartures,
    flightInclusive,
    offers,
    reviews,
    posts,
    liveActivity,
    hotelCities,
    departureCities,
    visaCountries,
  ] = await Promise.all([
    getDestinations({ limit: 24 }),
    getPackagesByCollection("trending-international", 8),
    getPackagesByCollection("best-of-india", 8),
    getPackagesByCollection("honeymoon-escapes", 8),
    getPackagesByCollection("family-holidays", 8),
    getPackagesByCollection("luxury-getaways", 8),
    getPackagesByCollection("adventure-tours", 8),
    getPackagesByCollection("weekend-breaks", 8),
    getPackagesByCollection("group-departures", 8),
    getPackagesByCollection("flight-inclusive", 8),
    getActiveOffers(5),
    getFeaturedReviews(8),
    getBlogPosts({ limit: 4 }),
    settings.homepage.liveActivityEnabled ? getLiveActivity() : Promise.resolve(null),
    getHotelCities(),
    getDepartureCities(),
    getVisaCountries(),
  ]);

  const sections = settings.homepage.sections ?? {};
  const on = (key: string) => sections[key] !== false;

  const heroSlides = settings.homepage.heroSlides?.length
    ? settings.homepage.heroSlides
    : destinations.slice(0, 5).map((d) => ({
        url: d.heroImage,
        alt: d.heroAlt,
        location: `${d.name}, ${d.country}`,
      }));

  const destinationOptions = destinations.map((d) => ({ name: d.name, slug: d.slug }));
  const visaOptions = (visaCountries as { country: string; slug: string }[]).map((v) => ({
    country: v.country,
    slug: v.slug,
  }));

  return (
    <>
      <Hero
        headline={settings.homepage.heroHeadline}
        subheadline={settings.homepage.heroSubheadline}
        slides={heroSlides}
        videoUrl={settings.homepage.heroVideoUrl}
        mediaKind={settings.homepage.heroMediaKind}
      >
        <UnifiedSearch
          destinations={destinationOptions}
          cities={hotelCities}
          visaCountries={visaOptions}
          enabled={{
            flights: settings.features.flightsEnabled,
            hotels: settings.features.hotelsEnabled,
            activities: settings.features.activitiesEnabled,
            visa: settings.features.visaEnabled,
            cabs: settings.features.cabsEnabled,
          }}
        />
      </Hero>

      {/* Departure-city hints for the package search datalist. */}
      <datalist id="departure-cities">
        {departureCities.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      {on("liveActivity") ? <LiveActivity data={liveActivity} /> : null}

      {on("destinations") ? <DestinationExplorer destinations={destinations} /> : null}

      {on("trendingInternational") ? (
        <PackageRail
          eyebrow="Far away"
          title="Trending international trips"
          description="Where our travellers are actually going this season — not where a supplier wants to push inventory."
          packages={trendingIntl}
          viewAllHref="/packages?scope=international"
        />
      ) : null}

      {on("bestOfIndia") ? (
        <PackageRail
          eyebrow="Closer to home"
          title="Best of India"
          description="Short flights, long memories. The subcontinent, planned by people who grew up travelling it."
          packages={bestOfIndia}
          viewAllHref="/packages?scope=domestic"
          tone="dark"
        />
      ) : null}

      {on("tripBuilder") ? <TripBuilderSection destinations={destinationOptions} /> : null}

      {on("honeymoon") ? (
        <PackageRail
          eyebrow="Just the two of you"
          title="Honeymoon escapes"
          description="Private transfers, late checkouts, and a designer who quietly tells the hotel it's your honeymoon."
          packages={honeymoon}
          viewAllHref="/packages?tripType=honeymoon"
        />
      ) : null}

      {on("map") ? <TravelMap destinations={destinations} /> : null}

      {on("family") ? (
        <PackageRail
          eyebrow="All ages"
          title="Family holidays"
          description="Pacing that works for a six-year-old and a sixty-year-old on the same trip."
          packages={family}
          viewAllHref="/packages?tripType=family"
        />
      ) : null}

      {on("experiences") ? <Experiences /> : null}

      {on("luxury") ? (
        <PackageRail
          eyebrow="No compromises"
          title="Luxury getaways"
          description="Suites, private guides, and the kind of restaurant reservations that are hard to get."
          packages={luxury}
          viewAllHref="/packages?tripType=luxury"
          tone="dark"
        />
      ) : null}

      {on("offers") ? <Offers offers={offers} /> : null}

      {on("adventure") ? (
        <PackageRail
          eyebrow="Earn the view"
          title="Adventure tours"
          description="Certified guides, honest grading, and the right answer when the weather says no."
          packages={adventure}
          viewAllHref="/packages?tripType=adventure"
        />
      ) : null}

      {on("whyUs") ? <WhyChooseUs trustPoints={settings.homepage.trustPoints} /> : null}

      {on("weekend") ? (
        <PackageRail
          eyebrow="Friday to Sunday"
          title="Weekend breaks"
          description="Three days, no leave burnt, back in time for Monday."
          packages={weekend}
          viewAllHref="/packages?tripType=weekend"
          columns={4}
        />
      ) : null}

      {on("groupDepartures") ? (
        <PackageRail
          eyebrow="Fixed dates"
          title="Group departures"
          description="Set dates, guaranteed departures, and a small group that stays small."
          packages={groupDepartures}
          viewAllHref="/packages?tripStyle=group"
          tone="dark"
        />
      ) : null}

      {on("testimonials") ? <Testimonials reviews={reviews} /> : null}

      {on("flightInclusive") ? (
        <PackageRail
          eyebrow="One price, door to door"
          title="Flight-inclusive deals"
          description="Return flights, stays, transfers and taxes — in one number, with nothing hidden underneath it."
          packages={flightInclusive}
          viewAllHref="/packages?flightsIncluded=1"
        />
      ) : null}

      {on("blog") ? <Inspiration posts={posts.items} /> : null}

      {on("leadCapture") ? <LeadCapture whatsapp={settings.contact.whatsapp} /> : null}
    </>
  );
}

/* -------------------------------------------------------------------------- */

function TripBuilderSection({ destinations }: { destinations: { name: string; slug: string }[] }) {
  return (
    <section className="section-y wash-ivory">
      <div className="container-page">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-16">
          <Reveal>
            <div className="lg:sticky lg:top-28">
              <SectionHeading
                eyebrow="Build your own trip"
                title="Nothing here quite right? Then let's start from scratch."
                description="Tell us the shape of the trip you want. A designer builds a first-draft itinerary — costed, honest, and yours to argue with. No payment, no obligation."
              />

              <ul className="mt-8 space-y-3">
                {[
                  "A real itinerary in 24 hours, not a brochure",
                  "Priced line by line — you see what each night costs",
                  "Revise it as many times as you like before you commit",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-lagoon-600 text-white">
                      <Sparkles className="size-3" aria-hidden />
                    </span>
                    <span className="text-[0.9375rem] text-muted">{item}</span>
                  </li>
                ))}
              </ul>

              <Button asChild variant="ghost" className="mt-6 -ml-3">
                <Link href="/customise-my-trip">
                  Open the full planner
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <TripBuilder destinations={destinations} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
