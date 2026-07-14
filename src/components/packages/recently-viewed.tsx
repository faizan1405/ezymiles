"use client";

import * as React from "react";
import Link from "next/link";
import { useRecentlyViewed } from "@/store/preferences";
import { SmartImage } from "@/components/ui/smart-image";
import { Price } from "@/components/ui/price";
import type { PackageCardDTO } from "@/types";
import { formatDuration } from "@/lib/utils";

/**
 * Records the current package locally, then renders the other recently-seen
 * ones. Kept client-side and anonymous — no tracking cookie, no server write.
 */
export function RecentlyViewed({ currentSlug }: { currentSlug: string }) {
  const slugs = useRecentlyViewed((s) => s.slugs);
  const push = useRecentlyViewed((s) => s.push);
  const [items, setItems] = React.useState<PackageCardDTO[]>([]);

  React.useEffect(() => {
    push(currentSlug);
  }, [currentSlug, push]);

  const others = React.useMemo(
    () => slugs.filter((s) => s !== currentSlug).slice(0, 4),
    [slugs, currentSlug],
  );

  React.useEffect(() => {
    if (!others.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems([]);
      return;
    }

    const controller = new AbortController();

    fetch(`/api/packages/by-slug?slugs=${others.join(",")}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data: { items: PackageCardDTO[] }) => setItems(data.items ?? []))
      .catch(() => setItems([]));

    return () => controller.abort();
  }, [others]);

  if (items.length === 0) return null;

  return (
    <section className="border-t border-hairline bg-white py-12">
      <div className="container-page">
        <h2 className="text-xl text-midnight-900">Recently viewed</h2>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p) => (
            <li key={p.id}>
              <Link
                href={`/packages/${p.slug}`}
                className="group flex gap-3 rounded-2xl border border-hairline p-3 transition-all hover:-translate-y-0.5 hover:shadow-tile motion-reduce:hover:translate-y-0"
              >
                <div className="relative size-16 shrink-0 overflow-hidden rounded-xl">
                  <SmartImage
                    src={p.heroImage}
                    alt={p.heroAlt}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-midnight-900 group-hover:text-lagoon-800">
                    {p.title}
                  </p>
                  <p className="mt-0.5 text-[0.6875rem] text-muted">
                    {formatDuration(p.durationDays, p.durationNights)}
                  </p>
                  <Price amountINR={p.startingPriceINR} className="mt-1 text-sm" compact />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
