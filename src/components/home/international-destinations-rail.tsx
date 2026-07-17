import Link from "next/link";
import { ArrowUpRight, Compass } from "lucide-react";
import type { DestinationCardDTO } from "@/types";
import { DestinationRailCard } from "@/components/destinations/destination-rail-card";
import { Carousel } from "@/components/ui/carousel";
import { EmptyState, SectionHeading } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

/**
 * "Explore international destinations" — a curated rail (admin-controlled
 * via `packageFeatured` + `displayOrder`), distinct from the tabbed
 * `DestinationExplorer` above it. Renders as a swipeable carousel below `lg`
 * and a grid above it, mirroring `PackageRail`. Unlike `PackageRail` this
 * renders an explicit empty state instead of disappearing when the curated
 * list is empty, since it's meant to always occupy this slot on the page.
 */
export function InternationalDestinationsRail({ destinations }: { destinations: DestinationCardDTO[] }) {
  return (
    <section className="section-y bg-canvas">
      <div className="container-page">
        <SectionHeading
          eyebrow="Pick a coastline"
          title="Explore international destinations"
          description="A short list, chosen because we've actually planned trips there — not every country we could theoretically book."
          action={
            <Button asChild variant="outline">
              <Link href="/destinations?scope=international">
                All international destinations
                <ArrowUpRight aria-hidden />
              </Link>
            </Button>
          }
        />

        {destinations.length === 0 ? (
          <EmptyState
            className="mt-10"
            icon={<Compass />}
            title="No destinations curated yet"
            description="Mark a destination for the international rail from the admin panel and it'll appear here."
            action={
              <Button asChild variant="accent">
                <Link href="/customise-my-trip">Tell us where you want to go</Link>
              </Button>
            }
          />
        ) : (
          <>
            {/* Mobile / tablet: swipeable rail */}
            <div className="mt-10 lg:hidden">
              <Carousel
                ariaLabel="Explore international destinations"
                slideClassName="w-[85%] xs:w-[78%] sm:w-[48%] md:w-[42%]"
              >
                {destinations.map((d) => (
                  <DestinationRailCard
                    key={d.id}
                    destination={d}
                    href={`/destinations/${d.slug}`}
                    ctaHref={`/packages?destination=${d.slug}`}
                    ctaLabel="Explore trips"
                  />
                ))}
              </Carousel>
            </div>

            {/* Desktop: grid */}
            <ul className="mt-10 hidden gap-5 lg:grid lg:grid-cols-4">
              {destinations.slice(0, 8).map((d) => (
                <li key={d.id}>
                  <DestinationRailCard
                    destination={d}
                    href={`/destinations/${d.slug}`}
                    ctaHref={`/packages?destination=${d.slug}`}
                    ctaLabel="Explore trips"
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
