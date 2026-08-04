import "server-only";
import { cache } from "react";
import { tryConnectDB } from "@/lib/db";
import { Destination, Package, Offer } from "@/models";
import { serialise } from "@/lib/utils";
import { ACTIVITY_CATEGORIES, TRIP_TYPES } from "@/config/site";

export interface NavDestination {
  name: string;
  slug: string;
  country: string;
  startingPriceINR: number;
  heroImage: string;
}

export interface NavPackage {
  title: string;
  slug: string;
  startingPriceINR: number;
  durationDays: number;
  heroImage: string;
}

export interface NavPromo {
  title: string;
  headline: string;
  image: string;
  href: string;
  ctaLabel: string;
  discountLabel: string;
}

export interface NavData {
  domestic: { destinations: NavDestination[]; packages: NavPackage[] };
  international: { destinations: NavDestination[]; packages: NavPackage[] };
  activityCategories: { slug: string; label: string }[];
  tripTypes: { slug: string; label: string }[];
  promo: NavPromo | null;
}

const EMPTY: NavData = {
  domestic: { destinations: [], packages: [] },
  international: { destinations: [], packages: [] },
  activityCategories: ACTIVITY_CATEGORIES.map((c) => ({ slug: c.slug, label: c.label })),
  tripTypes: TRIP_TYPES.map((t) => ({ slug: t.slug, label: t.label })),
  promo: null,
};

/**
 * Mega-menu content. Read-only and heavily reused, so it is memoised per request
 * and degrades to an empty (but still navigable) menu when the DB is down.
 */
export const getNavData = cache(async (): Promise<NavData> => {
  const connected = await tryConnectDB();
  if (!connected) return EMPTY;

  try {
    const now = new Date();

    const [destinations, packages, promo] = await Promise.all([
      Destination.find({ status: "published", deletedAt: null })
        .select("name slug country scope startingPriceINR heroImage isFeatured isTrending")
        .sort({ isFeatured: -1, isTrending: -1, name: 1 })
        .limit(24)
        .lean(),
      Package.find({ status: "published", deletedAt: null })
        .select("title slug scope startingPriceINR durationDays heroImage isTrending isBestseller")
        .sort({ isTrending: -1, isBestseller: -1, ratingAverage: -1 })
        .limit(12)
        .lean(),
      Offer.findOne({ isActive: true, startsAt: { $lte: now }, endsAt: { $gte: now } })
        .sort({ order: 1 })
        .lean(),
    ]);

    const mapDest = (scope: "domestic" | "international"): NavDestination[] =>
      destinations
        .filter((d) => {
          const s = typeof d.scope === "string" ? d.scope.trim().toLowerCase() : "";
          return s === scope;
        })
        .slice(0, 10)
        .map((d) => ({
          name: d.name,
          slug: d.slug,
          country: d.country,
          startingPriceINR: d.startingPriceINR,
          heroImage: d.heroImage?.url ?? "",
        }));
    const mapPkg = (scope: "domestic" | "international"): NavPackage[] =>
      packages
        .filter((p) => {
          const s = typeof p.scope === "string" ? p.scope.trim().toLowerCase() : "";
          return s === scope;
        })
        .slice(0, 3)
        .map((p) => ({
          title: p.title,
          slug: p.slug,
          startingPriceINR: p.startingPriceINR,
          durationDays: p.durationDays,
          heroImage: p.heroImage?.url ?? "",
        }));

    return serialise({
      domestic: { destinations: mapDest("domestic"), packages: mapPkg("domestic") },
      international: { destinations: mapDest("international"), packages: mapPkg("international") },
      activityCategories: EMPTY.activityCategories,
      tripTypes: EMPTY.tripTypes,
      promo: promo
        ? {
            title: promo.title,
            headline: promo.headline,
            image: promo.image?.url ?? "",
            href: promo.ctaHref,
            ctaLabel: promo.ctaLabel,
            discountLabel: promo.discountLabel,
          }
        : null,
    });
  } catch {
    return EMPTY;
  }
});
