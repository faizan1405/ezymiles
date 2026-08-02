/**
 * Package seed data — extracted from seed.ts so it can be maintained
 * independently and seeded without running the full seed script.
 *
 * Each entry includes the full Package schema fields plus a
 * destinationSlug that maps to the destination document id.
 */

const img = (id: string, alt: string) => ({
  url: `https://images.unsplash.com/${id}?w=1600&q=80`,
  alt,
});

export const img_ = img;

const day = (n: number, city: string, title: string, description: string, hotel = "", activities: string[] = []) => ({
  day: n,
  city,
  title,
  description,
  meals: ["breakfast"] as ("breakfast" | "lunch" | "dinner")[],
  hotel,
  transfers: hotel ? "Private transfer" : "",
  activities,
  optionalExperiences: [],
});

export const day_ = day;

const variant = (
  key: string,
  label: string,
  hotelCategory: 3 | 4 | 5,
  pricePerAdultINR: number,
  originalPricePerAdultINR: number | undefined,
  isDefault: boolean,
  roomAmenities: string[],
  pricePerNightINR: number,
) => ({
  key,
  label,
  hotelCategory,
  durationDays: 6,
  durationNights: 5,
  pricePerAdultINR,
  pricePerChildINR: Math.round(pricePerAdultINR * 0.7),
  originalPricePerAdultINR,
  isDefault,
  description: label,
  rooms: [
    {
      key: `${key}-room`,
      name: label,
      description: `Standard room with ${label.toLowerCase()}.`,
      images: [img("photo-1537996194471-e657df975ab4", label)],
      maxAdults: 2,
      maxChildren: 1,
      maxOccupancy: 3,
      bedType: "King",
      sizeSqft: 400,
      amenities: roomAmenities,
      mealPlan: "breakfast" as const,
      pricePerNightINR,
      taxPercent: 12,
      refundable: true,
      cancellationRule: "Free cancellation up to 14 days before check-in.",
      roomsAvailable: 8,
    },
  ],
});

export const variant_ = variant;

export type PackageSeed = Record<string, unknown> & {
  title: string;
  slug: string;
  destinationSlug: string;
};

/**
 * Package seed records. Each follows the Package schema plus a
 * destinationSlug that maps to the Destination document slug.
 *
 * To add another package, append a new object below.
 */
export const packageSeeds: PackageSeed[] = [
  // 1. Bali
  {
    title: "Bali Honeymoon — Ubud & Uluwatu",
    slug: "bali-honeymoon-ubud-uluwatu",
    subtitle: "Rice-field villas, sunset dinner, and Nusa Penida.",
    destinationSlug: "bali",
    citiesCovered: ["Ubud", "Uluwatu", "Nusa Penida"],
    scope: "international",
    tripTypes: ["honeymoon", "beach"],
    collections: ["honeymoon-escapes", "trending-international"],
    durationDays: 6,
    durationNights: 5,
    heroImage: img("photo-1537996194471-e657df975ab4", "Bali villa view"),
    gallery: [img("photo-1552733407-5d5c46c3bb3b", "Temple at dusk")],
    overview: "Five nights split between Ubud and Uluwatu with a day on Nusa Penida.",
    highlights: ["Private pool villa", "Sunset clifftop dinner", "Nusa Penida day trip"],
    itinerary: [
      day(1, "Ubud", "Arrive", "Arrival and transfer to villa.", "Ubud villa"),
      day(2, "Ubud", "Temples", "Tegalalang, market, temple.", "Ubud villa", ["Tegalalang", "Market"]),
      day(3, "Nusa Penida", "Nusa Penida", "Kelingking, Angel's Billabong.", "Ubud villa", ["Kelingking"]),
      day(4, "Uluwatu", "Clifftops", "Transfer to Uluwatu.", "Uluwatu resort"),
      day(5, "Uluwatu", "Sunset", "Temple and dinner.", "Uluwatu resort", ["Temple", "Dinner"]),
      day(6, "Uluwatu", "Departure", "Airport transfer.", ""),
    ],
    variants: [
      variant("standard", "4★ Hotel", 4, 85000, 95000, true, ["WiFi", "Pool"], 12000),
      variant("luxury", "5★ Hotel", 5, 125000, undefined, false, ["Private pool", "Butler"], 22000),
    ],
    departures: [],
    departureCities: ["Delhi", "Mumbai"],
    flightsIncluded: true,
    mealsIncluded: true,
    activitiesIncluded: true,
    visaIncluded: true,
    transfersIncluded: true,
    hotelCategory: 4,
    tripStyle: "private",
    instantConfirmation: true,
    recommendedSeason: ["April", "May", "June"],
    inclusions: ["Flights", "5 nights", "Breakfast", "Transfers"],
    exclusions: ["Personal expenses"],
    importantInfo: [],
    visaDetails: "Visa on arrival for most nationalities.",
    cancellationPolicy: [{ window: "30+ days", charge: "10%" }],
    paymentPolicy: ["50% advance"],
    termsAndConditions: [],
    hotels: [],
    flightNote: "",
    faqs: [],
    isFeatured: true,
    isTrending: true,
    isBestseller: true,
    status: "published",
    isDemoData: true,
  },
];