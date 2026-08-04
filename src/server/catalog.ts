import "server-only";
import { cache } from "react";
import type { QueryFilter, PipelineStage } from "mongoose";
import { tryConnectDB } from "@/lib/db";
import {
  Activity,
  BlogPost,
  Booking,
  Destination,
  FAQ,
  Hotel,
  Offer,
  Package,
  Review,
  VisaCountry,
  type IPackage,
  type IDestination,
} from "@/models";
import { serialise, clamp, sanitiseImageUrl } from "@/lib/utils";
import type {
  ActivityCardDTO,
  BlogCardDTO,
  DestinationCardDTO,
  HotelCardDTO,
  OfferDTO,
  PackageCardDTO,
  PaginatedResult,
  ReviewDTO,
} from "@/types";

const PUBLISHED = { status: "published", deletedAt: null } as const;

function normaliseScope(value: unknown): "domestic" | "international" | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim().toLowerCase();
  if (v === "domestic" || v === "international") return v;
  if (v === "india" || v === "in" || v === "dom") return "domestic";
  if (v === "intl" || v === "int" || v === "abroad" || v === "world") return "international";
  return undefined;
}

/* -------------------------------------------------------------------------- */
/*                                   Mappers                                   */
/* -------------------------------------------------------------------------- */

type PackageLean = IPackage & { destination?: { name?: string } | null };

function toPackageCard(p: PackageLean): PackageCardDTO {
  return {
    id: String(p._id),
    slug: p.slug,
    title: p.title,
    subtitle: p.subtitle ?? "",
    destinationName:
      typeof p.destination === "object" && p.destination && "name" in p.destination
        ? (p.destination.name ?? "")
        : "",
    citiesCovered: p.citiesCovered ?? [],
    scope: p.scope,
    durationDays: p.durationDays,
    durationNights: p.durationNights,
    heroImage: sanitiseImageUrl(p.heroImage?.url ?? ""),
    heroAlt: p.heroImage?.alt || p.title,
    startingPriceINR: p.startingPriceINR,
    originalPriceINR: p.originalPriceINR,
    priceBasis: p.priceBasis,
    tripTypes: p.tripTypes ?? [],
    hotelCategory: p.hotelCategory,
    flightsIncluded: p.flightsIncluded,
    mealsIncluded: p.mealsIncluded,
    activitiesIncluded: p.activitiesIncluded,
    transfersIncluded: p.transfersIncluded,
    visaIncluded: p.visaIncluded,
    tripStyle: p.tripStyle,
    instantConfirmation: p.instantConfirmation,
    ratingAverage: p.ratingAverage,
    ratingCount: p.ratingCount,
    isTrending: p.isTrending,
    isBestseller: p.isBestseller,
    isFeatured: p.isFeatured,
  };
}

function toDestinationCard(d: IDestination, packageCount = 0): DestinationCardDTO {
  return {
    id: String(d._id),
    slug: d.slug,
    name: d.name,
    country: d.country,
    scope: d.scope,
    themes: d.themes ?? [],
    heroImage: sanitiseImageUrl(d.heroImage?.url ?? ""),
    heroAlt: d.heroImage?.alt || d.name,
    summary: d.summary ?? "",
    startingPriceINR: d.startingPriceINR,
    recommendedDurationDays: d.recommendedDurationDays,
    bestMonths: d.bestMonths ?? [],
    packageCount,
    coordinates: d.coordinates ?? { lat: 0, lng: 0 },
    isTrending: d.isTrending,
    packageFeatured: d.packageFeatured,
  };
}

/* -------------------------------------------------------------------------- */
/*                                Destinations                                 */
/* -------------------------------------------------------------------------- */

export interface DestinationFilter {
  scope?: "domestic" | "international";
  theme?: string;
  trending?: boolean;
  /** Curated into the "Explore international destinations" homepage rail. */
  packageFeatured?: boolean;
  /** Curated into the "Popular hotel destinations" collection. */
  hotelFeatured?: boolean;
  limit?: number;
}

/** Destinations plus a live package count, in one round trip. */
export const getDestinations = cache(
  async (filter: DestinationFilter = {}): Promise<DestinationCardDTO[]> => {
    if (!(await tryConnectDB())) return [];

    const match: QueryFilter<IDestination> = { ...PUBLISHED };
    if (filter.scope) match.scope = filter.scope;
    if (filter.theme) match.themes = filter.theme;
    if (filter.trending) match.isTrending = true;
    if (filter.packageFeatured) match.packageFeatured = true;
    if (filter.hotelFeatured) match.hotelFeatured = true;

    const pipeline: PipelineStage[] = [
      { $match: match },
      { $sort: { displayOrder: 1, isFeatured: -1, isTrending: -1, startingPriceINR: 1 } },
      { $limit: clamp(filter.limit ?? 12, 1, 60) },
      {
        $lookup: {
          from: "packages",
          let: { destId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$destination", "$$destId"] },
                status: "published",
                deletedAt: null,
              },
            },
            { $count: "count" },
          ],
          as: "packageStats",
        },
      },
    ];

    try {
      const rows = await Destination.aggregate(pipeline);
      return rows.map((r) =>
        toDestinationCard(
          serialise(r) as IDestination,
          (r.packageStats?.[0]?.count as number | undefined) ?? 0,
        ),
      );
    } catch (error) {
      console.error("[getDestinations]", error);
      return [];
    }
  },
);

export const getDestinationBySlug = cache(async (slug: string) => {
  if (!(await tryConnectDB())) return null;

  try {
    const doc = await Destination.findOne({ slug, deletedAt: null }).lean();
    if (!doc || doc.status !== "published") return null;
    return serialise(doc) as unknown as IDestination;
  } catch {
    return null;
  }
});

export const getAllDestinationSlugs = cache(async (): Promise<string[]> => {
  if (!(await tryConnectDB())) return [];
  try {
    const rows = await Destination.find(PUBLISHED).select("slug").lean();
    return rows.map((r) => r.slug);
  } catch {
    return [];
  }
});

/* -------------------------------------------------------------------------- */
/*                                  Packages                                   */
/* -------------------------------------------------------------------------- */

export interface PackageFilter {
  scope?: "domestic" | "international";
  destinationSlug?: string;
  destinationId?: string;
  tripType?: string;
  collection?: string;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
  hotelCategory?: number[];
  flightsIncluded?: boolean;
  mealsIncluded?: boolean;
  activitiesIncluded?: boolean;
  minRating?: number;
  tripStyle?: "group" | "private";
  fixedDeparture?: boolean;
  instantConfirmation?: boolean;
  departureCity?: string;
  season?: string;
  query?: string;
  sort?: "recommended" | "price_asc" | "price_desc" | "duration_asc" | "duration_desc" | "rating";
  page?: number;
  pageSize?: number;
}

const SORTS: Record<string, Record<string, 1 | -1>> = {
  recommended: { isFeatured: -1, isBestseller: -1, ratingAverage: -1 },
  price_asc: { startingPriceINR: 1 },
  price_desc: { startingPriceINR: -1 },
  duration_asc: { durationDays: 1 },
  duration_desc: { durationDays: -1 },
  rating: { ratingAverage: -1, ratingCount: -1 },
};

async function buildPackageQuery(filter: PackageFilter): Promise<QueryFilter<IPackage>> {
  const q: QueryFilter<IPackage> = { ...PUBLISHED };

  if (filter.scope) q.scope = normaliseScope(filter.scope) ?? filter.scope;
  if (filter.tripType) q.tripTypes = filter.tripType;
  if (filter.collection) q.collections = filter.collection;
  if (filter.tripStyle) q.tripStyle = filter.tripStyle;
  if (filter.departureCity) q.departureCities = filter.departureCity;
  if (filter.season) q.recommendedSeason = filter.season;
  if (filter.flightsIncluded) q.flightsIncluded = true;
  if (filter.mealsIncluded) q.mealsIncluded = true;
  if (filter.activitiesIncluded) q.activitiesIncluded = true;
  if (filter.instantConfirmation) q.instantConfirmation = true;
  if (filter.fixedDeparture) q["departures.isFixedDeparture"] = true;
  if (filter.hotelCategory?.length) {
    q.hotelCategory = { $in: filter.hotelCategory as (3 | 4 | 5)[] };
  }
  if (filter.minRating) q.ratingAverage = { $gte: filter.minRating };

  if (filter.minPrice != null || filter.maxPrice != null) {
    q.startingPriceINR = {};
    if (filter.minPrice != null) q.startingPriceINR.$gte = filter.minPrice;
    if (filter.maxPrice != null) q.startingPriceINR.$lte = filter.maxPrice;
  }

  if (filter.minDuration != null || filter.maxDuration != null) {
    q.durationDays = {};
    if (filter.minDuration != null) q.durationDays.$gte = filter.minDuration;
    if (filter.maxDuration != null) q.durationDays.$lte = filter.maxDuration;
  }

  if (filter.destinationId) {
    q.$or = [{ destination: filter.destinationId }, { additionalDestinations: filter.destinationId }];
  } else if (filter.destinationSlug) {
    const dest = await Destination.findOne({ slug: filter.destinationSlug }).select("_id").lean();
    if (!dest) return { _id: { $exists: false } } as QueryFilter<IPackage>;
    q.$or = [{ destination: dest._id }, { additionalDestinations: dest._id }];
  }

  if (filter.query) {
    const rx = new RegExp(escapeRegex(filter.query), "i");
    q.$and = [
      {
        $or: [{ title: rx }, { subtitle: rx }, { citiesCovered: rx }, { overview: rx }],
      },
    ];
  }

  return q;
}

export async function getPackages(
  filter: PackageFilter = {},
): Promise<PaginatedResult<PackageCardDTO>> {
  const page = Math.max(1, filter.page ?? 1);
  const pageSize = clamp(filter.pageSize ?? 9, 1, 48);

  if (!(await tryConnectDB())) {
    return { items: [], total: 0, page, pageSize, totalPages: 0 };
  }

  try {
    const query = await buildPackageQuery(filter);
    const sort = SORTS[filter.sort ?? "recommended"] ?? SORTS.recommended;

    const [rows, total] = await Promise.all([
      Package.find(query)
        .populate("destination", "name slug")
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Package.countDocuments(query),
    ]);

    return {
      items: (serialise(rows) as unknown as PackageLean[]).map(toPackageCard),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error("[getPackages]", error);
    return { items: [], total: 0, page, pageSize, totalPages: 0 };
  }
}

/** Collection rails on the homepage. */
export const getPackagesByCollection = cache(
  async (collection: string, limit = 8): Promise<PackageCardDTO[]> => {
    if (!(await tryConnectDB())) return [];
    try {
      const rows = await Package.find({ ...PUBLISHED, collections: collection })
        .populate("destination", "name slug")
        .sort({ isFeatured: -1, ratingAverage: -1 })
        .limit(limit)
        .lean();
      return (serialise(rows) as unknown as PackageLean[]).map(toPackageCard);
    } catch {
      return [];
    }
  },
);

export type HomepageData = {
  destinations: DestinationCardDTO[];
  internationalDestinations: DestinationCardDTO[];
  collections: Record<string, PackageCardDTO[]>;
  offers: OfferDTO[];
  reviews: ReviewDTO[];
  posts: Awaited<ReturnType<typeof getBlogPosts>>;
  liveActivity: Awaited<ReturnType<typeof getLiveActivity>>;
  hotelCities: string[];
  departureCities: string[];
  visaCountries: unknown[];
};

/** Fetch all public homepage data with a bounded number of database round trips. */
export const getHomepageData = cache(async (liveActivityEnabled: boolean): Promise<HomepageData> => {
  if (!(await tryConnectDB())) {
    return {
      destinations: [],
      internationalDestinations: [],
      collections: Object.create(null),
      offers: [],
      reviews: [],
      posts: { items: [], total: 0, page: 1, pageSize: 4, totalPages: 0 },
      liveActivity: null,
      hotelCities: [],
      departureCities: [],
      visaCountries: [],
    };
  }

  const collectionKeys = [
    "trending-international",
    "best-of-india",
    "honeymoon-escapes",
    "family-holidays",
    "affordable-getaways",
    "adventure-tours",
    "weekend-breaks",
    "group-departures",
    "flight-inclusive",
  ];

  try {
    const [destinationRows, packageRows, secondary] = await Promise.all([
      Destination.aggregate([
        { $match: PUBLISHED },
        { $sort: { displayOrder: 1, isFeatured: -1, isTrending: -1, startingPriceINR: 1 } },
        { $limit: 24 },
        {
          $lookup: {
            from: "packages",
            let: { destId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$destination", "$$destId"] }, ...PUBLISHED } },
              { $count: "count" },
            ],
            as: "packageStats",
          },
        },
      ]),
      Package.aggregate([
        { $match: { ...PUBLISHED, collections: { $in: collectionKeys } } },
        { $sort: { isFeatured: -1, ratingAverage: -1 } },
        { $limit: 72 },
        { $lookup: { from: "destinations", localField: "destination", foreignField: "_id", as: "destination" } },
        { $unwind: { path: "$destination", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            title: 1, slug: 1, subtitle: 1, destination: { name: 1, slug: 1 }, citiesCovered: 1,
            scope: 1, durationDays: 1, durationNights: 1, heroImage: 1, startingPriceINR: 1,
            originalPriceINR: 1, priceBasis: 1, tripTypes: 1, hotelCategory: 1, flightsIncluded: 1,
            mealsIncluded: 1, activitiesIncluded: 1, transfersIncluded: 1, visaIncluded: 1,
            tripStyle: 1, instantConfirmation: 1, ratingAverage: 1, ratingCount: 1,
            isTrending: 1, isBestseller: 1, isFeatured: 1, collections: 1,
          },
        },
      ]),
      Promise.all([
        getActiveOffers(5),
        getFeaturedReviews(8),
        getBlogPosts({ limit: 4 }),
        liveActivityEnabled ? getLiveActivity() : Promise.resolve(null),
        getHotelCities(),
        getDepartureCities(),
        getVisaCountries(),
      ]),
    ]);

    const destinations = destinationRows.map((row) =>
      toDestinationCard(serialise(row) as IDestination, row.packageStats?.[0]?.count ?? 0),
    );
    const SCOPE_BY_COLLECTION: Record<string, "domestic" | "international" | undefined> = {
      "trending-international": "international",
      "best-of-india": "domestic",
    };

    const expectedScope = (key: string) => SCOPE_BY_COLLECTION[key];

    const collections: Record<string, PackageCardDTO[]> = Object.fromEntries(
      collectionKeys.map((key) => [
        key,
        (serialise(packageRows.filter((row) => {
          if (!row.collections?.includes(key)) return false;
          const scope = expectedScope(key);
          return !scope || normaliseScope(row.scope) === scope;
        })) as unknown as PackageLean[])
          .slice(0, 8)
          .map(toPackageCard),
      ]),
    );

    const curatedIntl = destinations.filter((d) => d.packageFeatured);
    const internationalDestinations =
      curatedIntl.length > 0
        ? curatedIntl.slice(0, 12)
        : destinations.filter((d) => d.scope === "international").slice(0, 12);

    return {
      destinations,
      internationalDestinations,
      collections,
      offers: secondary[0],
      reviews: secondary[1],
      posts: secondary[2],
      liveActivity: secondary[3],
      hotelCities: secondary[4],
      departureCities: secondary[5],
      visaCountries: secondary[6],
    };
  } catch (error) {
    console.error("[getHomepageData]", error);
    return {
      destinations: [], internationalDestinations: [], collections: Object.create(null), offers: [], reviews: [],
      posts: { items: [], total: 0, page: 1, pageSize: 4, totalPages: 0 }, liveActivity: null,
      hotelCities: [], departureCities: [], visaCountries: [],
    };
  }
});

export const getPackageBySlug = cache(async (slug: string) => {
  if (!(await tryConnectDB())) return null;
  try {
    const doc = await Package.findOne({ slug, deletedAt: null })
      .populate("destination", "name slug country scope coordinates")
      .lean();
    if (!doc || doc.status !== "published") return null;
    return serialise(doc) as unknown as IPackage & {
      destination: { _id: string; name: string; slug: string; country: string; scope: string };
    };
  } catch {
    return null;
  }
});

export const getAllPackageSlugs = cache(async (): Promise<string[]> => {
  if (!(await tryConnectDB())) return [];
  try {
    const rows = await Package.find(PUBLISHED).select("slug").lean();
    return rows.map((r) => r.slug);
  } catch {
    return [];
  }
});

export const getRelatedPackages = cache(
  async (packageId: string, destinationId: string, limit = 4): Promise<PackageCardDTO[]> => {
    if (!(await tryConnectDB())) return [];
    try {
      const rows = await Package.find({
        ...PUBLISHED,
        _id: { $ne: packageId },
        $or: [{ destination: destinationId }, { additionalDestinations: destinationId }],
      })
        .populate("destination", "name slug")
        .sort({ ratingAverage: -1 })
        .limit(limit)
        .lean();

      if (rows.length >= limit) {
        return (serialise(rows) as unknown as PackageLean[]).map(toPackageCard);
      }

      // Backfill with anything else strong so the rail is never half-empty.
      const extra = await Package.find({
        ...PUBLISHED,
        _id: { $ne: packageId, $nin: rows.map((r) => r._id) },
      })
        .populate("destination", "name slug")
        .sort({ isFeatured: -1, ratingAverage: -1 })
        .limit(limit - rows.length)
        .lean();

      return (serialise([...rows, ...extra]) as unknown as PackageLean[]).map(toPackageCard);
    } catch {
      return [];
    }
  },
);

export const getPackagesByIds = cache(async (ids: string[]): Promise<PackageCardDTO[]> => {
  if (!ids.length || !(await tryConnectDB())) return [];
  try {
    const rows = await Package.find({ _id: { $in: ids }, ...PUBLISHED })
      .populate("destination", "name slug")
      .lean();
    return (serialise(rows) as unknown as PackageLean[]).map(toPackageCard);
  } catch {
    return [];
  }
});

/** Distinct departure cities across the published catalogue, for filter chips. */
export const getDepartureCities = cache(async (): Promise<string[]> => {
  if (!(await tryConnectDB())) return [];
  try {
    const cities = await Package.distinct("departureCities", PUBLISHED);
    return (cities as string[]).filter(Boolean).sort();
  } catch {
    return [];
  }
});

/* -------------------------------------------------------------------------- */
/*                                 Activities                                  */
/* -------------------------------------------------------------------------- */

export interface ActivityFilter {
  category?: string;
  destinationSlug?: string;
  city?: string;
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "recommended" | "price_asc" | "price_desc" | "rating";
  page?: number;
  pageSize?: number;
}

export async function getActivities(
  filter: ActivityFilter = {},
): Promise<PaginatedResult<ActivityCardDTO>> {
  const page = Math.max(1, filter.page ?? 1);
  const pageSize = clamp(filter.pageSize ?? 9, 1, 48);

  if (!(await tryConnectDB())) return { items: [], total: 0, page, pageSize, totalPages: 0 };

  try {
    const q: QueryFilter<unknown> = { ...PUBLISHED };
    if (filter.category) q.category = filter.category;
    if (filter.city) q.city = filter.city;
    if (filter.query) {
      const rx = new RegExp(escapeRegex(filter.query), "i");
      q.$or = [{ title: rx }, { city: rx }, { summary: rx }];
    }
    if (filter.minPrice != null || filter.maxPrice != null) {
      q.pricePerAdultINR = {};
      if (filter.minPrice != null) q.pricePerAdultINR.$gte = filter.minPrice;
      if (filter.maxPrice != null) q.pricePerAdultINR.$lte = filter.maxPrice;
    }
    if (filter.destinationSlug) {
      const dest = await Destination.findOne({ slug: filter.destinationSlug }).select("_id").lean();
      if (!dest) return { items: [], total: 0, page, pageSize, totalPages: 0 };
      q.destination = dest._id;
    }

    const sortMap = {
      recommended: { isFeatured: -1, ratingAverage: -1 },
      price_asc: { pricePerAdultINR: 1 },
      price_desc: { pricePerAdultINR: -1 },
      rating: { ratingAverage: -1 },
    } as const;

    const [rows, total] = await Promise.all([
      Activity.find(q)
        .sort(sortMap[filter.sort ?? "recommended"])
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Activity.countDocuments(q),
    ]);

    const items: ActivityCardDTO[] = serialise(rows).map((a) => ({
      id: String(a._id),
      slug: a.slug,
      title: a.title,
      city: a.city,
      category: a.category,
      heroImage: sanitiseImageUrl(a.heroImage?.url ?? ""),
      heroAlt: a.heroImage?.alt || a.title,
      summary: a.summary ?? "",
      durationMinutes: a.durationMinutes,
      pricePerAdultINR: a.pricePerAdultINR,
      originalPriceINR: a.originalPriceINR,
      ratingAverage: a.ratingAverage,
      ratingCount: a.ratingCount,
      instantConfirmation: a.instantConfirmation,
    }));

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  } catch (error) {
    console.error("[getActivities]", error);
    return { items: [], total: 0, page, pageSize, totalPages: 0 };
  }
}

export const getActivityBySlug = cache(async (slug: string) => {
  if (!(await tryConnectDB())) return null;
  try {
    const doc = await Activity.findOne({ slug, deletedAt: null })
      .populate("destination", "name slug")
      .lean();
    if (!doc || doc.status !== "published") return null;
    return serialise(doc);
  } catch {
    return null;
  }
});

/* -------------------------------------------------------------------------- */
/*                                   Hotels                                    */
/* -------------------------------------------------------------------------- */

export interface HotelFilter {
  city?: string;
  destinationSlug?: string;
  starCategory?: number[];
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  query?: string;
  sort?: "recommended" | "price_asc" | "price_desc" | "rating";
  page?: number;
  pageSize?: number;
}

export async function getHotels(filter: HotelFilter = {}): Promise<PaginatedResult<HotelCardDTO>> {
  const page = Math.max(1, filter.page ?? 1);
  const pageSize = clamp(filter.pageSize ?? 9, 1, 48);

  if (!(await tryConnectDB())) return { items: [], total: 0, page, pageSize, totalPages: 0 };

  try {
    const q: QueryFilter<unknown> = { ...PUBLISHED };
    if (filter.city) q.city = new RegExp(`^${escapeRegex(filter.city)}$`, "i");
    if (filter.propertyType) q.propertyType = filter.propertyType;
    if (filter.starCategory?.length) q.starCategory = { $in: filter.starCategory };
    if (filter.query) {
      const rx = new RegExp(escapeRegex(filter.query), "i");
      q.$or = [{ name: rx }, { city: rx }, { summary: rx }];
    }
    if (filter.minPrice != null || filter.maxPrice != null) {
      q.startingPriceINR = {};
      if (filter.minPrice != null) q.startingPriceINR.$gte = filter.minPrice;
      if (filter.maxPrice != null) q.startingPriceINR.$lte = filter.maxPrice;
    }
    if (filter.destinationSlug) {
      const dest = await Destination.findOne({ slug: filter.destinationSlug }).select("_id").lean();
      if (!dest) return { items: [], total: 0, page, pageSize, totalPages: 0 };
      q.destination = dest._id;
    }

    const sortMap = {
      recommended: { isFeatured: -1, ratingAverage: -1 },
      price_asc: { startingPriceINR: 1 },
      price_desc: { startingPriceINR: -1 },
      rating: { ratingAverage: -1 },
    } as const;

    const [rows, total] = await Promise.all([
      Hotel.find(q)
        .sort(sortMap[filter.sort ?? "recommended"])
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Hotel.countDocuments(q),
    ]);

    const items: HotelCardDTO[] = serialise(rows).map((h) => ({
      id: String(h._id),
      slug: h.slug,
      name: h.name,
      city: h.city,
      country: h.country,
      starCategory: h.starCategory,
      propertyType: h.propertyType,
      heroImage: sanitiseImageUrl(h.heroImage?.url ?? ""),
      heroAlt: h.heroImage?.alt || h.name,
      summary: h.summary ?? "",
      amenities: h.amenities ?? [],
      startingPriceINR: h.startingPriceINR,
      ratingAverage: h.ratingAverage,
      ratingCount: h.ratingCount,
    }));

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  } catch (error) {
    console.error("[getHotels]", error);
    return { items: [], total: 0, page, pageSize, totalPages: 0 };
  }
}

export const getHotelBySlug = cache(async (slug: string) => {
  if (!(await tryConnectDB())) return null;
  try {
    const doc = await Hotel.findOne({ slug, deletedAt: null })
      .populate("destination", "name slug")
      .lean();
    if (!doc || doc.status !== "published") return null;
    return serialise(doc);
  } catch {
    return null;
  }
});

export const getHotelCities = cache(async (): Promise<string[]> => {
  if (!(await tryConnectDB())) return [];
  try {
    const cities = await Hotel.distinct("city", PUBLISHED);
    return (cities as string[]).filter(Boolean).sort();
  } catch {
    return [];
  }
});

/* -------------------------------------------------------------------------- */
/*                                    Visa                                     */
/* -------------------------------------------------------------------------- */

export const getVisaCountries = cache(async () => {
  if (!(await tryConnectDB())) return [];
  try {
    const rows = await VisaCountry.find(PUBLISHED).sort({ isPopular: -1, country: 1 }).lean();
    return serialise(rows);
  } catch {
    return [];
  }
});

export const getVisaCountryBySlug = cache(async (slug: string) => {
  if (!(await tryConnectDB())) return null;
  try {
    const doc = await VisaCountry.findOne({ slug, deletedAt: null }).lean();
    if (!doc || doc.status !== "published") return null;
    return serialise(doc);
  } catch {
    return null;
  }
});

/* -------------------------------------------------------------------------- */
/*                            Offers / reviews / blog                          */
/* -------------------------------------------------------------------------- */

export const getActiveOffers = cache(async (limit = 6): Promise<OfferDTO[]> => {
  if (!(await tryConnectDB())) return [];
  try {
    const now = new Date();
    const rows = await Offer.find({
      isActive: true,
      startsAt: { $lte: now },
      endsAt: { $gte: now },
    })
      .sort({ order: 1 })
      .limit(limit)
      .lean();

    return serialise(rows).map((o) => ({
      id: String(o._id),
      slug: o.slug,
      title: o.title,
      kind: o.kind,
      headline: o.headline,
      description: o.description,
      image: o.image?.url ?? "",
      couponCode: o.couponCode,
      discountLabel: o.discountLabel,
      ctaLabel: o.ctaLabel,
      ctaHref: o.ctaHref,
      endsAt: String(o.endsAt),
    }));
  } catch {
    return [];
  }
});

export const getFeaturedReviews = cache(async (limit = 8): Promise<ReviewDTO[]> => {
  if (!(await tryConnectDB())) return [];
  try {
    const rows = await Review.find({ status: "approved" })
      .sort({ isFeatured: -1, rating: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return serialise(rows).map((r) => ({
      id: String(r._id),
      authorName: r.authorName,
      authorPhoto: r.authorPhoto,
      authorLocation: r.authorLocation,
      destination: r.destination,
      rating: r.rating,
      title: r.title,
      body: r.body,
      videoUrl: r.videoUrl,
      isVerifiedBooking: r.isVerifiedBooking,
      travelledOn: r.travelledOn ? String(r.travelledOn) : undefined,
      subjectTitle: r.subject?.title,
    }));
  } catch {
    return [];
  }
});

export const getReviewsForSubject = cache(
  async (refId: string, limit = 10): Promise<ReviewDTO[]> => {
    if (!(await tryConnectDB())) return [];
    try {
      const rows = await Review.find({ "subject.refId": refId, status: "approved" })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return serialise(rows).map((r) => ({
        id: String(r._id),
        authorName: r.authorName,
        authorPhoto: r.authorPhoto,
        authorLocation: r.authorLocation,
        destination: r.destination,
        rating: r.rating,
        title: r.title,
        body: r.body,
        videoUrl: r.videoUrl,
        isVerifiedBooking: r.isVerifiedBooking,
        travelledOn: r.travelledOn ? String(r.travelledOn) : undefined,
        subjectTitle: r.subject?.title,
      }));
    } catch {
      return [];
    }
  },
);

export const getBlogPosts = cache(
  async (opts: { category?: string; limit?: number; page?: number } = {}) => {
    const page = Math.max(1, opts.page ?? 1);
    const pageSize = clamp(opts.limit ?? 9, 1, 24);

    if (!(await tryConnectDB())) {
      return { items: [] as BlogCardDTO[], total: 0, page, pageSize, totalPages: 0 };
    }

    try {
      const q: QueryFilter<unknown> = { ...PUBLISHED };
      if (opts.category) q.category = opts.category;

      const [rows, total] = await Promise.all([
        BlogPost.find(q)
          .sort({ isFeatured: -1, publishedAt: -1 })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .lean(),
        BlogPost.countDocuments(q),
      ]);

      const items: BlogCardDTO[] = serialise(rows).map((b) => ({
        id: String(b._id),
        slug: b.slug,
        title: b.title,
        excerpt: b.excerpt,
        coverImage: b.coverImage?.url ?? "",
        coverAlt: b.coverImage?.alt || b.title,
        category: b.category,
        readingMinutes: b.readingMinutes,
        publishedAt: String(b.publishedAt ?? b.createdAt),
        authorName: b.author?.name ?? "Editorial Team",
      }));

      return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    } catch {
      return { items: [] as BlogCardDTO[], total: 0, page, pageSize, totalPages: 0 };
    }
  },
);

export const getBlogPostBySlug = cache(async (slug: string) => {
  if (!(await tryConnectDB())) return null;
  try {
    const doc = await BlogPost.findOne({ slug, deletedAt: null }).lean();
    if (!doc || doc.status !== "published") return null;
    return serialise(doc);
  } catch {
    return null;
  }
});

export const getBlogCategories = cache(async (): Promise<string[]> => {
  if (!(await tryConnectDB())) return [];
  try {
    const cats = await BlogPost.distinct("category", PUBLISHED);
    return (cats as string[]).filter(Boolean).sort();
  } catch {
    return [];
  }
});

export const getFAQs = cache(async (group?: string) => {
  if (!(await tryConnectDB())) return [];
  try {
    const q: QueryFilter<unknown> = { isActive: true };
    if (group) q.group = group;
    const rows = await FAQ.find(q).sort({ group: 1, order: 1 }).lean();
    return serialise(rows);
  } catch {
    return [];
  }
});

/* -------------------------------------------------------------------------- */
/*                            Live activity (real data)                        */
/* -------------------------------------------------------------------------- */

/**
 * Genuine, database-derived social proof. No invented "someone just booked"
 * notifications â€” if there is no data, the section renders nothing.
 */
export const getLiveActivity = cache(async () => {
  if (!(await tryConnectDB())) return null;

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);
    const now = new Date();

    const [recentDestinations, upcomingDepartures, confirmedTravellers, upcomingTours] =
      await Promise.all([
        Booking.aggregate([
          { $match: { status: { $in: ["confirmed", "completed"] }, createdAt: { $gte: thirtyDaysAgo } } },
          { $group: { _id: "$item.title", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),
        Package.aggregate([
          { $match: { ...PUBLISHED, "departures.isFixedDeparture": true } },
          { $unwind: "$departures" },
          {
            $match: {
              "departures.date": { $gte: now },
              "departures.status": { $in: ["open", "filling_fast"] },
            },
          },
          { $sort: { "departures.date": 1 } },
          { $limit: 4 },
          {
            $project: {
              title: 1,
              slug: 1,
              date: "$departures.date",
              seatsLeft: { $subtract: ["$departures.seatsTotal", "$departures.seatsBooked"] },
              seatsTotal: "$departures.seatsTotal",
            },
          },
        ]),
        Booking.countDocuments({ status: { $in: ["confirmed", "completed"] } }),
        Booking.countDocuments({ status: "confirmed", travelDate: { $gte: now } }),
      ]);

    return serialise({
      recentDestinations: recentDestinations.map((r) => ({
        title: String(r._id ?? ""),
        count: r.count as number,
      })),
      upcomingDepartures: upcomingDepartures.map((d) => ({
        title: d.title as string,
        slug: d.slug as string,
        date: String(d.date),
        seatsLeft: d.seatsLeft as number,
        seatsTotal: d.seatsTotal as number,
      })),
      confirmedTravellers,
      upcomingTours,
    });
  } catch {
    return null;
  }
});

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
