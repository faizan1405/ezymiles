import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { DestinationCardDTO } from "@/types";
import { SmartImage } from "@/components/ui/smart-image";
import { cn } from "@/lib/utils";

/**
 * A destination card for curated rails (homepage "Explore international
 * destinations", the hotels page "Popular hotel destinations"). The card
 * title is a stretched link to `href`; `ctaLabel`/`ctaHref` render a second,
 * explicitly-labelled action so the two link targets can differ (e.g. the
 * destination page vs. a filtered package/hotel search) without nesting one
 * interactive element inside another.
 */
export function DestinationRailCard({
  destination: d,
  href,
  ctaLabel,
  ctaHref,
  className,
}: {
  destination: DestinationCardDTO;
  href: string;
  ctaLabel: string;
  ctaHref: string;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl bg-midnight-950 shadow-tile transition-shadow duration-500 hover:shadow-float",
        className,
      )}
    >
      <div className="relative aspect-4/5">
        <SmartImage
          src={d.heroImage}
          alt={d.heroAlt}
          fill
          sizes="(max-width: 640px) 78vw, (max-width: 1024px) 45vw, 22vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:group-hover:scale-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight-950 via-midnight-950/30 to-transparent" />
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5">
        <div>
          <p className="text-[0.625rem] font-bold uppercase tracking-widest text-lagoon-300">
            {d.country}
          </p>
          <h3 className="mt-1 font-display text-xl text-white">
            <Link href={href} className="after:absolute after:inset-0">
              {d.name}
            </Link>
          </h3>
        </div>

        <Link
          href={ctaHref}
          className="relative z-10 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-2 text-xs font-semibold text-midnight-900 transition-colors hover:bg-white"
        >
          {ctaLabel}
          <ArrowUpRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
