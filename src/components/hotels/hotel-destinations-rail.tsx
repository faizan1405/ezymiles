import Link from "next/link";
import { Globe2 } from "lucide-react";
import type { DestinationCardDTO } from "@/types";
import { DestinationRailCard } from "@/components/destinations/destination-rail-card";
import { Carousel } from "@/components/ui/carousel";
import { EmptyState, SectionHeading } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

/**
 * "Popular hotel destinations" — a curated browse aid shown on the
 * unfiltered `/hotels` listing. Every card routes into the existing hotel
 * search (`/hotels?destination=slug`), which already renders a real result
 * grid or, if nothing is published yet for that destination, the search
 * page's own empty state with a link into the enquiry flow — there is no
 * separate/duplicated "coming soon" flow to keep in sync.
 */
export function HotelDestinationsRail({ destinations }: { destinations: DestinationCardDTO[] }) {
  return (
    <section className="border-b border-hairline bg-canvas py-12 sm:py-14">
      <div className="container-page">
        <SectionHeading
          eyebrow="Where to stay"
          title="Popular hotel destinations"
          description="Browse by destination, then filter by star rating and dates once you're in."
        />

        {destinations.length === 0 ? (
          <EmptyState
            className="mt-10"
            icon={<Globe2 />}
            title="No hotel destinations published yet"
            description="Once destinations are marked for the hotel section from the admin panel, they'll appear here."
            action={
              <Button asChild variant="accent">
                <Link href="/contact">Ask us to find a stay</Link>
              </Button>
            }
          />
        ) : (
          <>
            {/* Mobile / tablet: swipeable rail */}
            <div className="mt-10 lg:hidden">
              <Carousel ariaLabel="Popular hotel destinations" slideClassName="w-[68%] xs:w-[58%] sm:w-[38%] md:w-[30%]">
                {destinations.map((d) => (
                  <DestinationRailCard
                    key={d.id}
                    destination={d}
                    href={`/hotels?destination=${d.slug}`}
                    ctaHref={`/hotels?destination=${d.slug}`}
                    ctaLabel="Find hotels"
                  />
                ))}
              </Carousel>
            </div>

            {/* Desktop: grid */}
            <ul className="mt-10 hidden gap-5 lg:grid lg:grid-cols-5">
              {destinations.slice(0, 10).map((d) => (
                <li key={d.id}>
                  <DestinationRailCard
                    destination={d}
                    href={`/hotels?destination=${d.slug}`}
                    ctaHref={`/hotels?destination=${d.slug}`}
                    ctaLabel="Find hotels"
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
