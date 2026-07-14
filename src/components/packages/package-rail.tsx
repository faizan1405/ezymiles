import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { PackageCardDTO } from "@/types";
import { PackageCard } from "./package-card";
import { Carousel } from "@/components/ui/carousel";
import { SectionHeading } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * A collection rail.
 *
 * Renders as a swipeable carousel below `lg` and a structured grid above it —
 * the same cards, laid out for the input device rather than forcing horizontal
 * scrolling on a large screen.
 */
export function PackageRail({
  eyebrow,
  title,
  description,
  packages,
  viewAllHref,
  tone = "light",
  className,
  columns = 3,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  packages: PackageCardDTO[];
  viewAllHref: string;
  tone?: "light" | "dark";
  className?: string;
  columns?: 3 | 4;
}) {
  if (packages.length === 0) return null;

  return (
    <section
      className={cn(
        "section-y",
        tone === "dark" ? "bg-midnight-950 text-white" : "bg-canvas",
        className,
      )}
    >
      <div className="container-page">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
          tone={tone}
          action={
            <Button asChild variant={tone === "dark" ? "glass" : "outline"}>
              <Link href={viewAllHref}>
                View all
                <ArrowUpRight aria-hidden />
              </Link>
            </Button>
          }
        />

        {/* Mobile / tablet: swipeable rail */}
        <div className="mt-10 lg:hidden">
          <Carousel
            ariaLabel={title}
            slideClassName="w-[85%] xs:w-[78%] sm:w-[48%] md:w-[42%]"
          >
            {packages.map((p) => (
              <PackageCard key={p.id} pkg={p} />
            ))}
          </Carousel>
        </div>

        {/* Desktop: grid */}
        <ul
          className={cn(
            "mt-10 hidden gap-6 lg:grid",
            columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
          )}
        >
          {packages.slice(0, columns === 4 ? 8 : 6).map((p) => (
            <li key={p.id}>
              <PackageCard pkg={p} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
