/**
 * Demo package seed script.
 *
 * Adds 10 realistic demo travel packages (and any destinations they need)
 * for testing the packages listing, search, filters, detail pages, wishlist,
 * enquiry, custom-trip and booking flows end to end.
 *
 * Run with `npm run seed:packages`.
 *
 * Idempotent: every write is a `$setOnInsert` keyed by a unique slug, so
 * running this script any number of times never creates duplicates and never
 * touches an existing document — demo or real. It never deletes or modifies
 * anything. Safe to run against the same database as `npm run seed`, in
 * either order, or entirely on its own.
 */
import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";

for (const file of [".env", ".env.local"]) {
  if (existsSync(file)) loadEnv({ path: file, override: true });
}

import mongoose from "mongoose";
import { Destination, Package } from "@/models";
import { destinationSeeds as baseDestinationSeeds } from "./seed-data";

const img = (id: string, alt: string) => ({
  url: `https://images.unsplash.com/${id}?w=1600&q=80`,
  alt,
});

function inDays(n: number) {
  return new Date(Date.now() + n * 86_400_000);
}

/** seatsBooked/seatsTotal → the same status buckets the live site uses. */
function departureStatus(seatsBooked: number, seatsTotal: number): "open" | "filling_fast" | "sold_out" {
  if (seatsBooked >= seatsTotal) return "sold_out";
  if (seatsBooked / seatsTotal >= 0.75) return "filling_fast";
  return "open";
}

async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Copy .env.example to .env.local first.");

  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || "ezymiles" });
  console.log(`Connected to ${uri.replace(/\/\/.*@/, "//<redacted>@")}`);
}

/* -------------------------------------------------------------------------- */
/*                                 Destinations                                */
/* -------------------------------------------------------------------------- */

interface NewDestinationSeed {
  name: string;
  slug: string;
  country: string;
  countryCode: string;
  region: string;
  scope: "domestic" | "international";
  themes: string[];
  summary: string;
  description: string;
  heroImage: { url: string; alt: string };
  gallery: { url: string; alt: string }[];
  startingPriceINR: number;
  recommendedDurationDays: number;
  bestMonths: string[];
  currencyUsed?: string;
  languages?: string[];
  timezone?: string;
  visaNote?: string;
  coordinates: { lat: number; lng: number };
  highlights: string[];
  faqs: { question: string; answer: string }[];
  isFeatured: boolean;
  isTrending: boolean;
  status: "draft" | "scheduled" | "published" | "archived";
}

// Destinations already defined in the main seed — reused as-is so this script
// never redefines them, and works whether or not `npm run seed` has run yet.
const REUSED_SLUGS = ["bali", "dubai", "kerala-backwaters"];
const reusedDestinations = baseDestinationSeeds.filter((d) => REUSED_SLUGS.includes(d.slug));

const NEW_DESTINATIONS: NewDestinationSeed[] = [
  {
    name: "Kashmir",
    slug: "kashmir",
    country: "India",
    countryCode: "IN",
    region: "North India",
    scope: "domestic",
    themes: ["honeymoon", "family", "weekend"],
    summary: "Alpine valleys, Mughal gardens, and a night on a houseboat over Dal Lake.",
    description:
      "Srinagar, Gulmarg and Pahalgam cover most of what people actually come to Kashmir for — a houseboat evening on Dal Lake, a gondola ride into snow, and valleys that don't need much explaining once you're standing in them. Roads between the three are short by Himalayan standards, which keeps this an easy first trip to the region.",
    heroImage: img("photo-1566837945700-30057527ade0", "A shikara gliding across Dal Lake at dawn"),
    gallery: [
      img("photo-1519681393784-d120267933ba", "Snow-covered slopes above Gulmarg"),
      img("photo-1483347756197-71ef80e95f73", "An alpine meadow near Pahalgam"),
    ],
    startingPriceINR: 22000,
    recommendedDurationDays: 5,
    bestMonths: ["Mar", "Apr", "May", "Sep", "Oct"],
    coordinates: { lat: 34.0837, lng: 74.7973 },
    highlights: [
      "A night on a deluxe houseboat over Dal Lake",
      "Gulmarg's Gondola into the snowline",
      "Betaab and Aru valleys near Pahalgam",
      "Srinagar's Mughal gardens",
    ],
    faqs: [
      {
        question: "Is Kashmir safe to visit right now?",
        answer:
          "Srinagar, Gulmarg and Pahalgam are the most-visited tourist circuit and see a steady flow of domestic travellers year-round. We follow local advisories and adjust routes if a specific area needs it.",
      },
    ],
    isFeatured: true,
    isTrending: true,
    status: "published",
  },
  {
    name: "Manali",
    slug: "manali",
    country: "India",
    countryCode: "IN",
    region: "North India",
    scope: "domestic",
    themes: ["adventure", "honeymoon", "weekend"],
    summary: "Pine forests, a ropeway into the snow, and an adventure-sports base for the Himalayas.",
    description:
      "Manali works as both a lazy hill-station break and a base for genuine adventure — Solang Valley's paragliding and zorbing, the Atal Tunnel drive, and Old Manali's café strip all sit within a short drive of each other. Road access from Delhi and Chandigarh is straightforward most of the year, snow permitting in winter.",
    heroImage: img("photo-1483728642387-6c3bdd6c93e5", "A pine-forested valley near Manali"),
    gallery: [
      img("photo-1516483638261-f4dbaf036963", "Snow-capped peaks of the Pir Panjal range"),
      img("photo-1519681393784-d120267933ba", "Adventure sports at Solang Valley"),
    ],
    startingPriceINR: 15000,
    recommendedDurationDays: 4,
    bestMonths: ["Mar", "Apr", "May", "Jun", "Sep", "Oct", "Dec"],
    coordinates: { lat: 32.2432, lng: 77.1892 },
    highlights: [
      "Solang Valley's ropeway and adventure sports zone",
      "The Atal Tunnel drive-through",
      "Vashisht's natural hot water springs",
      "Old Manali's café and market strip",
    ],
    faqs: [],
    isFeatured: false,
    isTrending: true,
    status: "published",
  },
  {
    name: "Goa",
    slug: "goa",
    country: "India",
    countryCode: "IN",
    region: "West India",
    scope: "domestic",
    themes: ["beach", "weekend", "family", "nightlife"],
    summary: "Beach shacks, old forts, and enough distance between North and South Goa to feel like two trips.",
    description:
      "North Goa runs on beach shacks, flea markets and nightlife around Baga and Calangute; South Goa is quieter, with Palolem's cove and the old Portuguese churches near Old Goa. Most first-time visitors do a bit of both rather than picking a side, and the drive between them is under two hours.",
    heroImage: img("photo-1507525428034-b723cf961d3e", "A palm-fringed beach on the Goan coast"),
    gallery: [
      img("photo-1519046904884-53103b34b206", "A quiet cove in North Goa"),
      img("photo-1559827260-dc66d52bef19", "Sunset at a Goan beach shack"),
    ],
    startingPriceINR: 12000,
    recommendedDurationDays: 4,
    bestMonths: ["Nov", "Dec", "Jan", "Feb"],
    coordinates: { lat: 15.2993, lng: 74.124 },
    highlights: [
      "Fort Aguada and Chapora Fort",
      "Anjuna's Wednesday flea market",
      "Old Goa's UNESCO-listed churches",
      "Palolem's quieter southern coastline",
    ],
    faqs: [],
    isFeatured: true,
    isTrending: true,
    status: "published",
  },
  {
    name: "Rajasthan",
    slug: "rajasthan",
    country: "India",
    countryCode: "IN",
    region: "North India",
    scope: "domestic",
    themes: ["luxury", "family", "group"],
    summary: "Forts, palaces and a desert city, strung along drives long enough to need a plan.",
    description:
      "Jaipur, Jodhpur and Udaipur each carry a genuinely different character — the pink city's bazaars, the blue city beneath Mehrangarh, and Udaipur's lakes and palaces. The drives between them run five to six hours each, so this is a trip that rewards a proper week rather than a rushed long weekend.",
    heroImage: img("photo-1524492412937-b28074a5d7da", "A hilltop fort overlooking Jaipur"),
    gallery: [
      img("photo-1477587458883-47145ed94245", "A grand Rajasthani palace courtyard"),
      img("photo-1599661046289-e31897846e41", "Jaipur's pink city streets"),
    ],
    startingPriceINR: 26000,
    recommendedDurationDays: 7,
    bestMonths: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
    coordinates: { lat: 26.9124, lng: 75.7873 },
    highlights: [
      "Amber Fort and City Palace in Jaipur",
      "Mehrangarh Fort above Jodhpur's Blue City",
      "Lake Pichola and Udaipur's City Palace",
      "Heritage palace-hotel stays, where you want them",
    ],
    faqs: [],
    isFeatured: true,
    isTrending: true,
    status: "published",
  },
  {
    name: "Thailand",
    slug: "thailand",
    country: "Thailand",
    countryCode: "TH",
    region: "Southeast Asia",
    scope: "international",
    themes: ["beach", "nightlife", "group", "family"],
    summary: "Bangkok's temples and Pattaya's islands, a genuinely easy first Southeast Asia trip.",
    description:
      "Bangkok and Pattaya together make one of the most straightforward international group tours from India — short flight time, visa on arrival, and a route that mixes temples, markets and beach islands without much backtracking.",
    heroImage: img("photo-1528181304800-259b08848526", "Longtail boats off a Thai island beach"),
    gallery: [
      img("photo-1552465011-b4e21bf6e79a", "A Bangkok temple at dusk"),
      img("photo-1552550049-db097c9480d1", "Limestone cliffs in the Andaman Sea"),
    ],
    startingPriceINR: 38000,
    recommendedDurationDays: 5,
    bestMonths: ["Nov", "Dec", "Jan", "Feb"],
    currencyUsed: "Thai Baht (THB)",
    languages: ["Thai", "English (tourist areas)"],
    timezone: "GMT+7",
    visaNote: "Visa on arrival or e-visa available for Indian passport holders.",
    coordinates: { lat: 13.7563, lng: 100.5018 },
    highlights: [
      "Bangkok's Grand Palace and Wat Arun",
      "Coral Island's beaches off Pattaya",
      "The Alcazar cabaret show",
      "Easy visa-on-arrival access for Indian passport holders",
    ],
    faqs: [],
    isFeatured: false,
    isTrending: true,
    status: "published",
  },
  {
    name: "Singapore",
    slug: "singapore",
    country: "Singapore",
    countryCode: "SG",
    region: "Southeast Asia",
    scope: "international",
    themes: ["family", "luxury", "group"],
    summary: "Gardens by the Bay, Sentosa, and a compact city that runs on time.",
    description:
      "Singapore rewards a short, dense visit — Gardens by the Bay, the Marina Bay skyline and Sentosa's Universal Studios all sit within a short taxi ride of each other, with a metro system easy enough for a family to use on their own.",
    heroImage: img("photo-1525625293386-3f8f99389edd", "The Marina Bay skyline at night"),
    gallery: [img("photo-1565967511849-76a60a516170", "Supertree Grove at Gardens by the Bay")],
    startingPriceINR: 52000,
    recommendedDurationDays: 7,
    bestMonths: ["Feb", "Mar", "Jul", "Aug"],
    currencyUsed: "Singapore Dollar (SGD)",
    languages: ["English", "Mandarin", "Malay", "Tamil"],
    timezone: "GMT+8",
    visaNote: "e-visa required in advance for Indian passport holders.",
    coordinates: { lat: 1.3521, lng: 103.8198 },
    highlights: [
      "Gardens by the Bay's Supertree Grove",
      "Universal Studios Singapore on Sentosa",
      "Marina Bay Sands SkyPark",
      "Easily combined with Malaysia for a longer trip",
    ],
    faqs: [],
    isFeatured: true,
    isTrending: false,
    status: "published",
  },
  {
    name: "Malaysia",
    slug: "malaysia",
    country: "Malaysia",
    countryCode: "MY",
    region: "Southeast Asia",
    scope: "international",
    themes: ["family", "group"],
    summary: "Petronas Towers, Batu Caves, and Genting's hill-top resort above Kuala Lumpur.",
    description:
      "Kuala Lumpur pairs city sightseeing — the Petronas Towers, Batu Caves — with an easy day trip up to Genting Highlands, making it a natural add-on to a Singapore itinerary or a standalone city break.",
    heroImage: img("photo-1596422846543-75c6fc197f07", "Kuala Lumpur's skyline with the Petronas Towers"),
    gallery: [img("photo-1596436889106-be35e843f974", "Kuala Lumpur's skyline at dusk")],
    startingPriceINR: 45000,
    recommendedDurationDays: 7,
    bestMonths: ["Feb", "Mar", "Jul", "Aug"],
    currencyUsed: "Malaysian Ringgit (MYR)",
    languages: ["Malay", "English"],
    timezone: "GMT+8",
    visaNote: "e-visa / visa-on-arrival available for Indian passport holders depending on entry category.",
    coordinates: { lat: 3.139, lng: 101.6869 },
    highlights: [
      "Petronas Towers observation deck",
      "Batu Caves' limestone temple",
      "Genting Highlands' cable car and hill resort",
      "A short flight or coach ride from Singapore",
    ],
    faqs: [],
    isFeatured: false,
    isTrending: false,
    status: "published",
  },
  {
    name: "Maldives",
    slug: "maldives",
    country: "Maldives",
    countryCode: "MV",
    region: "South Asia",
    scope: "international",
    themes: ["honeymoon", "luxury", "beach"],
    summary: "Overwater villas, house-reef snorkelling, and very little else on the itinerary — deliberately.",
    description:
      "A Maldives trip is mostly one decision — which atoll and which resort — followed by very few others. Overwater villas, a house reef right off your deck, and speedboat transfers instead of long drives make it one of the lowest-effort luxury trips to plan.",
    heroImage: img("photo-1514282401047-d79a71a590e8", "An overwater villa in the Maldives"),
    gallery: [
      img("photo-1573052905904-34ad8c27f0cc", "A turquoise lagoon around a Maldivian atoll"),
      img("photo-1540202404-a2f29016b523", "A private beach in the Maldives"),
    ],
    startingPriceINR: 95000,
    recommendedDurationDays: 5,
    bestMonths: ["Nov", "Dec", "Jan", "Feb", "Mar"],
    currencyUsed: "Maldivian Rufiyaa (MVR)",
    languages: ["Dhivehi", "English (resorts)"],
    timezone: "GMT+5",
    visaNote: "Free 30-day visa on arrival for all nationalities.",
    coordinates: { lat: 3.2028, lng: 73.2207 },
    highlights: [
      "Overwater villas with direct lagoon access",
      "House-reef snorkelling right off your deck",
      "Speedboat or seaplane resort transfers",
      "Free visa on arrival for Indian passport holders",
    ],
    faqs: [],
    isFeatured: true,
    isTrending: true,
    status: "published",
  },
];

async function seedDestinations() {
  const idBySlug = new Map<string, mongoose.Types.ObjectId>();
  const all = [...reusedDestinations, ...NEW_DESTINATIONS];

  let created = 0;
  for (const dest of all) {
    const before = await Destination.exists({ slug: dest.slug });
    const doc = await Destination.findOneAndUpdate(
      { slug: dest.slug },
      { $setOnInsert: dest },
      { upsert: true, returnDocument: "after" },
    );
    if (!before) created++;
    idBySlug.set(dest.slug, doc!._id);
  }

  console.log(`Destinations ready: ${all.length} total (${created} newly created).`);
  return idBySlug;
}

/* -------------------------------------------------------------------------- */
/*                                   Packages                                  */
/* -------------------------------------------------------------------------- */

interface DemoPackageSeed {
  title: string;
  slug: string;
  subtitle: string;
  destinationSlug: string;
  additionalDestinationSlugs?: string[];
  citiesCovered: string[];
  scope: "domestic" | "international";
  tripTypes: string[];
  collections: string[];
  durationDays: number;
  durationNights: number;
  heroImage: { url: string; alt: string };
  gallery: { url: string; alt: string }[];
  overview: string;
  highlights: string[];
  itinerary: {
    day: number;
    city: string;
    title: string;
    description: string;
    meals: ("breakfast" | "lunch" | "dinner")[];
    hotel?: string;
    transfers?: string;
    activities: string[];
    optionalExperiences: string[];
  }[];
  variants: {
    key: string;
    label: string;
    hotelCategory: 3 | 4 | 5;
    durationDays: number;
    durationNights: number;
    pricePerAdultINR: number;
    pricePerChildINR: number;
    singleSupplementINR: number;
    originalPricePerAdultINR?: number;
    isDefault: boolean;
  }[];
  departureSeeds: {
    inDays: number;
    departureCity: string;
    seatsTotal: number;
    seatsBooked: number;
    isFixedDeparture: boolean;
    isGuaranteed: boolean;
  }[];
  departureCities: string[];
  taxPercent: number;
  flightsIncluded: boolean;
  mealsIncluded: boolean;
  activitiesIncluded: boolean;
  visaIncluded: boolean;
  transfersIncluded: boolean;
  hotelCategory: 3 | 4 | 5;
  tripStyle: "group" | "private";
  instantConfirmation: boolean;
  recommendedSeason: string[];
  inclusions: string[];
  exclusions: string[];
  importantInfo: string[];
  visaDetails: string;
  cancellationPolicy: { window: string; charge: string }[];
  paymentPolicy: string[];
  termsAndConditions: string[];
  hotels: { city: string; name: string; category: number; nights: number; note?: string }[];
  flightNote?: string;
  transfersNote?: string;
  faqs: { question: string; answer: string }[];
  isFeatured: boolean;
  isTrending: boolean;
  isBestseller: boolean;
  status: "draft" | "scheduled" | "published" | "archived";
  seo: { title: string; description: string };
}

const DEMO_PACKAGES: DemoPackageSeed[] = [
  /* ---------------------------- 1. Kashmir ---------------------------- */
  {
    title: "Kashmir Scenic Escape",
    slug: "kashmir-scenic-escape",
    subtitle: "A houseboat night on Dal Lake, the Gulmarg Gondola, and Pahalgam's valleys.",
    destinationSlug: "kashmir",
    citiesCovered: ["Srinagar", "Gulmarg", "Pahalgam"],
    scope: "domestic",
    tripTypes: ["honeymoon", "family", "weekend"],
    collections: ["best-of-india", "honeymoon-escapes"],
    durationDays: 5,
    durationNights: 4,
    heroImage: img("photo-1566837945700-30057527ade0", "A shikara gliding across Dal Lake at dawn"),
    gallery: [
      img("photo-1519681393784-d120267933ba", "Snow-covered slopes above Gulmarg"),
      img("photo-1483347756197-71ef80e95f73", "Betaab Valley near Pahalgam"),
    ],
    overview:
      "Five days across Srinagar, Gulmarg and Pahalgam, with two nights on a deluxe houseboat over Dal Lake bookending a day in the snow at Gulmarg and a day among Pahalgam's valleys. Built around private transfers rather than a group bus, so the pace stays flexible.",
    highlights: [
      "Two nights on a deluxe houseboat over Dal Lake",
      "Gulmarg Gondola Stage 1 into the snowline",
      "Betaab and Aru valleys near Pahalgam",
      "Private car throughout — no shared coach transfers",
    ],
    itinerary: [
      {
        day: 1,
        city: "Srinagar",
        title: "Arrival and houseboat check-in",
        description:
          "Private transfer from Srinagar airport, then a shikara out to your houseboat on Dal Lake. Evening free.",
        meals: [],
        hotel: "Deluxe houseboat, Dal Lake",
        transfers: "Private airport transfer + shikara to the houseboat",
        activities: ["Shikara ride on Dal Lake"],
        optionalExperiences: ["Nishat and Shalimar Mughal gardens"],
      },
      {
        day: 2,
        city: "Gulmarg",
        title: "Into the snow at Gulmarg",
        description: "Private car to Gulmarg for the Gondola's first stage, with the afternoon free at altitude.",
        meals: ["breakfast"],
        hotel: "Gulmarg hillside hotel",
        transfers: "Private car, Srinagar to Gulmarg",
        activities: ["Gulmarg Gondola (Stage 1)"],
        optionalExperiences: ["Gondola Stage 2 to Apharwat Peak", "Snowboarding lesson"],
      },
      {
        day: 3,
        city: "Pahalgam",
        title: "Betaab and Aru valleys",
        description: "On to Pahalgam, with stops at Betaab Valley and, time permitting, Aru Valley.",
        meals: ["breakfast"],
        hotel: "Pahalgam riverside resort",
        transfers: "Private car, Gulmarg to Pahalgam",
        activities: ["Betaab Valley", "Aru Valley"],
        optionalExperiences: ["Chandanwari day trip", "Horse ride to Baisaran"],
      },
      {
        day: 4,
        city: "Srinagar",
        title: "Back to the lake",
        description: "Return to Srinagar for a second houseboat night, with a stop at the Shankaracharya Temple viewpoint.",
        meals: ["breakfast"],
        hotel: "Deluxe houseboat, Dal Lake",
        transfers: "Private car, Pahalgam to Srinagar",
        activities: ["Srinagar local market", "Shankaracharya Temple viewpoint"],
        optionalExperiences: ["Saffron farm visit (seasonal)"],
      },
      {
        day: 5,
        city: "Srinagar",
        title: "Departure",
        description: "Free morning, then a private transfer to the airport.",
        meals: ["breakfast"],
        transfers: "Private airport transfer",
        activities: [],
        optionalExperiences: [],
      },
    ],
    variants: [
      {
        key: "standard",
        label: "Standard — 3★/4★ stays",
        hotelCategory: 3,
        durationDays: 5,
        durationNights: 4,
        pricePerAdultINR: 22000,
        pricePerChildINR: 15000,
        singleSupplementINR: 6000,
        originalPricePerAdultINR: 26000,
        isDefault: true,
      },
      {
        key: "deluxe",
        label: "Deluxe — premium houseboat",
        hotelCategory: 4,
        durationDays: 5,
        durationNights: 4,
        pricePerAdultINR: 31000,
        pricePerChildINR: 21000,
        singleSupplementINR: 8500,
        isDefault: false,
      },
    ],
    departureSeeds: [
      { inDays: 35, departureCity: "Delhi", seatsTotal: 18, seatsBooked: 9, isFixedDeparture: true, isGuaranteed: true },
      { inDays: 65, departureCity: "Delhi", seatsTotal: 18, seatsBooked: 3, isFixedDeparture: false, isGuaranteed: false },
    ],
    departureCities: ["Delhi", "Mumbai", "Bengaluru"],
    taxPercent: 5,
    flightsIncluded: false,
    mealsIncluded: true,
    activitiesIncluded: true,
    visaIncluded: false,
    transfersIncluded: true,
    hotelCategory: 3,
    tripStyle: "private",
    instantConfirmation: true,
    recommendedSeason: ["Spring", "Summer", "Autumn"],
    inclusions: [
      "4 nights accommodation as per itinerary (2 on a deluxe houseboat)",
      "Daily breakfast",
      "All transfers by private car",
      "Gulmarg Gondola Stage 1 ticket",
      "Shikara ride on Dal Lake",
      "English/Hindi-speaking driver-guide",
    ],
    exclusions: [
      "Flights to/from Srinagar",
      "Gondola Stage 2 ticket",
      "Lunches and dinners except where specified",
      "Personal expenses and tips",
      "Travel insurance",
    ],
    importantInfo: [
      "Gulmarg Gondola Stage 2 closes without notice in poor weather — we don't guarantee it.",
      "Houseboats can rock gently on windy nights; let us know if that's a concern when booking.",
    ],
    visaDetails: "",
    cancellationPolicy: [
      { window: "More than 30 days before travel", charge: "10% of package cost" },
      { window: "15–30 days before travel", charge: "35% of package cost" },
      { window: "Less than 15 days before travel", charge: "75% of package cost" },
    ],
    paymentPolicy: ["25% deposit to confirm your booking.", "Balance due 15 days before travel."],
    termsAndConditions: [
      "Rates are per person on twin-sharing basis unless a single supplement is selected.",
      "Houseboat cabin allocation is per boat, not a guaranteed specific cabin.",
    ],
    hotels: [
      { city: "Srinagar", name: "Deluxe houseboat, Dal Lake", category: 4, nights: 2 },
      { city: "Gulmarg", name: "Gulmarg hillside hotel", category: 3, nights: 1 },
      { city: "Pahalgam", name: "Pahalgam riverside resort", category: 3, nights: 1 },
    ],
    transfersNote: "All transfers by private car with driver",
    faqs: [
      {
        question: "Is Gulmarg Gondola Stage 2 included?",
        answer:
          "No — Stage 1 is included in every variant. Stage 2 to Apharwat Peak is a paid optional experience, weather permitting.",
      },
      {
        question: "Is this trip suitable for small children?",
        answer:
          "Yes — the pace is gentle and most travel is by private car. Winter trips to Gulmarg do involve some snow walking.",
      },
    ],
    isFeatured: true,
    isTrending: true,
    isBestseller: false,
    status: "published",
    seo: {
      title: "Kashmir Scenic Escape — 5 Days / 4 Nights Package | eZyMiles",
      description:
        "A 5-day Kashmir holiday covering Srinagar, Gulmarg and Pahalgam with a deluxe houseboat stay, the Gulmarg Gondola and private transfers. Demo pricing for testing.",
    },
  },

  /* ---------------------------- 2. Manali ---------------------------- */
  {
    title: "Manali Adventure Getaway",
    slug: "manali-adventure-getaway",
    subtitle: "Solang Valley, the Atal Tunnel, and Vashisht's hot springs on a fixed group departure.",
    destinationSlug: "manali",
    citiesCovered: ["Manali", "Solang Valley", "Old Manali"],
    scope: "domestic",
    tripTypes: ["adventure", "group", "weekend"],
    collections: ["adventure-tours", "group-departures", "best-of-india"],
    durationDays: 4,
    durationNights: 3,
    heroImage: img("photo-1483728642387-6c3bdd6c93e5", "A pine-forested valley near Manali"),
    gallery: [
      img("photo-1516483638261-f4dbaf036963", "Snow-capped peaks of the Pir Panjal range"),
      img("photo-1519681393784-d120267933ba", "Adventure sports at Solang Valley"),
    ],
    overview:
      "A four-day fixed-departure group trip built around Manali's adventure-sports base — Solang Valley's ropeway and paragliding zone, the Atal Tunnel drive, and Vashisht's hot springs, with Old Manali's café strip left free for evenings.",
    highlights: [
      "Solang Valley ropeway and adventure sports zone",
      "The Atal Tunnel drive-through",
      "Vashisht's natural hot water springs",
      "Old Manali's café and market strip",
    ],
    itinerary: [
      {
        day: 1,
        city: "Manali",
        title: "Arrival",
        description: "Private transfer in from the Volvo drop point or Bhuntar airport, then a walk around Old Manali and Hadimba Temple.",
        meals: [],
        hotel: "Manali riverside hotel",
        transfers: "Private transfer from Bhuntar airport / Volvo drop point",
        activities: ["Hadimba Devi Temple", "Old Manali café walk"],
        optionalExperiences: ["Riverside bonfire evening"],
      },
      {
        day: 2,
        city: "Solang Valley",
        title: "Adventure day at Solang Valley",
        description: "A full day at Solang Valley — the ropeway, and the adventure sports zone for anyone who wants paragliding or zorbing.",
        meals: ["breakfast"],
        hotel: "Manali riverside hotel",
        transfers: "Private car to Solang Valley",
        activities: ["Solang Valley ropeway", "Adventure sports zone (paid at site)"],
        optionalExperiences: ["Paragliding tandem flight"],
      },
      {
        day: 3,
        city: "Manali",
        title: "Atal Tunnel and the hot springs",
        description: "A drive through the Atal Tunnel to Kothi's viewpoint, then Vashisht's hot water springs on the way back.",
        meals: ["breakfast"],
        hotel: "Manali riverside hotel",
        transfers: "Private car, permit arranged where required",
        activities: ["Atal Tunnel drive-through", "Kothi viewpoint", "Vashisht hot water springs"],
        optionalExperiences: ["Rohtang Pass extension (permit and weather permitting)"],
      },
      {
        day: 4,
        city: "Manali",
        title: "Departure",
        description: "Free time on Mall Road, then a private drop to your onward transport.",
        meals: ["breakfast"],
        transfers: "Private drop transfer",
        activities: ["Mall Road"],
        optionalExperiences: [],
      },
    ],
    variants: [
      {
        key: "standard",
        label: "Standard",
        hotelCategory: 3,
        durationDays: 4,
        durationNights: 3,
        pricePerAdultINR: 15000,
        pricePerChildINR: 10000,
        singleSupplementINR: 4000,
        originalPricePerAdultINR: 18000,
        isDefault: true,
      },
    ],
    departureSeeds: [
      { inDays: 20, departureCity: "Delhi", seatsTotal: 24, seatsBooked: 19, isFixedDeparture: true, isGuaranteed: true },
      { inDays: 50, departureCity: "Delhi", seatsTotal: 24, seatsBooked: 6, isFixedDeparture: true, isGuaranteed: false },
      { inDays: 80, departureCity: "Chandigarh", seatsTotal: 20, seatsBooked: 20, isFixedDeparture: true, isGuaranteed: true },
    ],
    departureCities: ["Delhi", "Chandigarh"],
    taxPercent: 5,
    flightsIncluded: false,
    mealsIncluded: true,
    activitiesIncluded: true,
    visaIncluded: false,
    transfersIncluded: true,
    hotelCategory: 3,
    tripStyle: "group",
    instantConfirmation: false,
    recommendedSeason: ["Summer", "Winter"],
    inclusions: [
      "3 nights accommodation in Manali",
      "Daily breakfast",
      "All sightseeing transfers by private vehicle",
      "Solang Valley ropeway ticket",
      "Vashisht hot springs entry",
      "Group tour manager on fixed departures",
    ],
    exclusions: [
      "Transport to/from Manali (flights/Volvo)",
      "Adventure activity charges at Solang Valley (paragliding, zorbing, etc.)",
      "Rohtang Pass permit fee, if applicable",
      "Lunches and dinners except where specified",
      "Personal expenses",
    ],
    importantInfo: [
      "Rohtang Pass and the Atal Tunnel can close at short notice due to snowfall or landslides — no refund is possible for closures outside our control.",
      "Adventure sports at Solang Valley are operated by local vendors and paid directly at the site.",
    ],
    visaDetails: "",
    cancellationPolicy: [
      { window: "More than 20 days before travel", charge: "15% of package cost" },
      { window: "7–20 days before travel", charge: "40% of package cost" },
      { window: "Less than 7 days before travel", charge: "90% of package cost" },
    ],
    paymentPolicy: ["30% deposit to confirm.", "Balance due 15 days before travel."],
    termsAndConditions: [
      "Group departures require a minimum of 8 travellers to guarantee the date.",
      "Room sharing is on twin/triple-sharing basis for group departures.",
    ],
    hotels: [{ city: "Manali", name: "Manali riverside hotel", category: 3, nights: 3 }],
    transfersNote: "Private vehicle for all sightseeing; inter-city transport to Manali is not included",
    faqs: [
      {
        question: "Is Rohtang Pass guaranteed on this itinerary?",
        answer:
          "No — it depends on the permit quota and weather on the day. Atal Tunnel and Kothi are reliable alternatives that don't depend on a permit.",
      },
      {
        question: "What's the minimum group size for a fixed departure?",
        answer: "8 travellers. If fewer join, we'll offer a private departure at an adjusted price instead of cancelling.",
      },
    ],
    isFeatured: false,
    isTrending: true,
    isBestseller: false,
    status: "published",
    seo: {
      title: "Manali Adventure Getaway — 4 Days / 3 Nights | eZyMiles",
      description:
        "A 4-day Manali holiday with Solang Valley, the Atal Tunnel and Vashisht's hot springs on a fixed group departure. Demo pricing for testing purposes.",
    },
  },

  /* ---------------------------- 3. Goa ---------------------------- */
  {
    title: "Goa Beach Holiday",
    slug: "goa-beach-holiday",
    subtitle: "North Goa's beaches and South Goa's churches, in one easy long weekend.",
    destinationSlug: "goa",
    citiesCovered: ["North Goa", "South Goa"],
    scope: "domestic",
    tripTypes: ["beach", "weekend", "family"],
    collections: ["weekend-breaks", "best-of-india", "family-holidays"],
    durationDays: 4,
    durationNights: 3,
    heroImage: img("photo-1507525428034-b723cf961d3e", "A palm-fringed beach on the Goan coast"),
    gallery: [
      img("photo-1519046904884-53103b34b206", "A quiet cove in North Goa"),
      img("photo-1559827260-dc66d52bef19", "Sunset at a Goan beach shack"),
    ],
    overview:
      "A four-day Goa break based in a North Goa beach resort, with full days built in for both North Goa's forts and markets and a South Goa day trip to the old churches and Palolem's quieter coastline.",
    highlights: [
      "Fort Aguada and Chapora Fort",
      "Anjuna's Wednesday flea market (seasonal)",
      "Old Goa's UNESCO-listed churches",
      "A day at Palolem's quieter southern coastline",
    ],
    itinerary: [
      {
        day: 1,
        city: "North Goa",
        title: "Arrival",
        description: "Private transfer to your North Goa beach resort, with the evening free at Baga Beach.",
        meals: [],
        hotel: "North Goa beach resort",
        transfers: "Private airport transfer",
        activities: ["Baga Beach evening walk"],
        optionalExperiences: ["Beach shack dinner with live music"],
      },
      {
        day: 2,
        city: "North Goa",
        title: "Forts and the flea market",
        description: "A full day covering Fort Aguada, Chapora Fort, and Anjuna's flea market where the date allows.",
        meals: ["breakfast"],
        hotel: "North Goa beach resort",
        transfers: "Private car, full day",
        activities: ["Fort Aguada", "Chapora Fort", "Anjuna flea market (Wed only, seasonal)"],
        optionalExperiences: ["Sunset cruise on the Mandovi River"],
      },
      {
        day: 3,
        city: "South Goa",
        title: "Old Goa and Palolem",
        description: "A day trip south to the Basilica of Bom Jesus and Se Cathedral, then Palolem's quieter beach.",
        meals: ["breakfast"],
        hotel: "North Goa beach resort",
        transfers: "Private car, full day",
        activities: ["Old Goa churches", "Palolem Beach"],
        optionalExperiences: ["Dolphin-spotting boat trip", "Spice plantation lunch tour"],
      },
      {
        day: 4,
        city: "North Goa",
        title: "Departure",
        description: "A free morning by the pool or beach, then a private transfer to the airport.",
        meals: ["breakfast"],
        transfers: "Private airport transfer",
        activities: [],
        optionalExperiences: [],
      },
    ],
    variants: [
      {
        key: "standard",
        label: "Standard",
        hotelCategory: 3,
        durationDays: 4,
        durationNights: 3,
        pricePerAdultINR: 12000,
        pricePerChildINR: 8000,
        singleSupplementINR: 3000,
        originalPricePerAdultINR: 15000,
        isDefault: true,
      },
      {
        key: "premium",
        label: "Premium — beachfront resort",
        hotelCategory: 4,
        durationDays: 4,
        durationNights: 3,
        pricePerAdultINR: 19000,
        pricePerChildINR: 13000,
        singleSupplementINR: 5000,
        isDefault: false,
      },
    ],
    departureSeeds: [
      { inDays: 15, departureCity: "Mumbai", seatsTotal: 30, seatsBooked: 11, isFixedDeparture: false, isGuaranteed: false },
      { inDays: 45, departureCity: "Bengaluru", seatsTotal: 30, seatsBooked: 4, isFixedDeparture: false, isGuaranteed: false },
      { inDays: 75, departureCity: "Delhi", seatsTotal: 30, seatsBooked: 0, isFixedDeparture: false, isGuaranteed: false },
    ],
    departureCities: ["Mumbai", "Bengaluru", "Delhi", "Pune"],
    taxPercent: 5,
    flightsIncluded: false,
    mealsIncluded: true,
    activitiesIncluded: true,
    visaIncluded: false,
    transfersIncluded: true,
    hotelCategory: 3,
    tripStyle: "private",
    instantConfirmation: true,
    recommendedSeason: ["Winter"],
    inclusions: [
      "3 nights beach resort accommodation",
      "Daily breakfast",
      "Airport transfers",
      "Full-day North Goa and South Goa sightseeing by private car",
      "Entry fees at forts and churches",
    ],
    exclusions: [
      "Flights to Goa",
      "Water sports at the beach (paid directly)",
      "Lunches and dinners except where specified",
      "Alcohol",
      "Personal expenses",
    ],
    importantInfo: [
      "Anjuna's flea market runs Wednesdays only, in season (Oct–Mar) — the itinerary adjusts automatically if your dates miss it.",
      "Peak season (20 Dec – 5 Jan) carries a mandatory gala-dinner surcharge at most resorts, billed separately by the hotel.",
    ],
    visaDetails: "",
    cancellationPolicy: [
      { window: "More than 15 days before travel", charge: "10% of package cost" },
      { window: "7–15 days before travel", charge: "30% of package cost" },
      { window: "Less than 7 days before travel", charge: "70% of package cost" },
    ],
    paymentPolicy: ["Full payment or 25% deposit to hold your dates.", "Balance due 10 days before travel."],
    termsAndConditions: [
      "Rates are per person on twin-sharing basis.",
      "Peak season hotel surcharges, if any, are payable directly at the property.",
    ],
    hotels: [
      {
        city: "North Goa",
        name: "North Goa beach resort",
        category: 3,
        nights: 3,
        note: "Beachfront property near Baga/Candolim",
      },
    ],
    transfersNote: "All transfers and sightseeing by private air-conditioned car",
    faqs: [
      {
        question: "Can we split nights between North and South Goa?",
        answer: "Yes — tell us when you enquire and we'll requote with a split stay instead of day trips.",
      },
      {
        question: "Is this a good trip for a family with young kids?",
        answer:
          "Yes — the pace is relaxed with beach time built in every day, and the resort pool is a good fallback on a hot afternoon.",
      },
    ],
    isFeatured: true,
    isTrending: true,
    isBestseller: true,
    status: "published",
    seo: {
      title: "Goa Beach Holiday — 4 Days / 3 Nights Package | eZyMiles",
      description:
        "A 4-day Goa beach holiday covering North and South Goa, forts, churches and beach time. Demo pricing for testing purposes.",
    },
  },

  /* ---------------------------- 4. Kerala Backwaters Experience ---------------------------- */
  {
    title: "Kerala Backwaters Experience",
    slug: "kerala-backwaters-experience",
    subtitle: "Munnar's tea gardens, an Alleppey houseboat night, and Kumarakom's lake resort.",
    destinationSlug: "kerala-backwaters",
    citiesCovered: ["Munnar", "Alleppey", "Kumarakom"],
    scope: "domestic",
    tripTypes: ["honeymoon", "family"],
    collections: ["best-of-india", "family-holidays", "honeymoon-escapes"],
    durationDays: 6,
    durationNights: 5,
    heroImage: img("photo-1602216056096-3b40cc0c9944", "A houseboat drifting through Kerala's backwaters at sunset"),
    gallery: [
      img("photo-1602308102967-be24da0a412e", "A palm-lined backwater canal"),
      img("photo-1587922546307-776227941871", "Tea gardens in the Western Ghats"),
    ],
    overview:
      "A six-day route that adds two full days in the Munnar hills before the backwaters — tea-garden scenery and a cooler climate, followed by an Alleppey houseboat night and two nights at a Kumarakom lake resort.",
    highlights: [
      "Two days among Munnar's tea gardens",
      "A full night aboard a private houseboat",
      "Kumarakom's bird sanctuary at dawn",
      "An optional Ayurvedic massage",
    ],
    itinerary: [
      {
        day: 1,
        city: "Munnar",
        title: "Arrival and drive to the hills",
        description: "Private transfer from Kochi up to Munnar, roughly four hours through the Western Ghats.",
        meals: [],
        hotel: "Munnar tea-estate resort",
        transfers: "Private transfer, Kochi to Munnar",
        activities: [],
        optionalExperiences: [],
      },
      {
        day: 2,
        city: "Munnar",
        title: "Tea gardens and dams",
        description: "A full day covering the Tea Museum, Mattupetty Dam and Echo Point.",
        meals: ["breakfast"],
        hotel: "Munnar tea-estate resort",
        transfers: "Private car, full day",
        activities: ["Tea Museum", "Mattupetty Dam", "Echo Point"],
        optionalExperiences: ["Eravikulam National Park (Nilgiri Tahr sighting, seasonal)"],
      },
      {
        day: 3,
        city: "Alleppey",
        title: "Board the houseboat",
        description: "Transfer to Alleppey and board your private houseboat by early afternoon, cruising the backwaters until sunset.",
        meals: ["lunch", "dinner"],
        hotel: "Private houseboat",
        transfers: "Private car, Munnar to Alleppey",
        activities: ["Backwater cruise"],
        optionalExperiences: [],
      },
      {
        day: 4,
        city: "Kumarakom",
        title: "Disembark and settle into the lake resort",
        description: "The morning cruise continues, then disembark by noon and transfer to a lakeside resort in Kumarakom.",
        meals: ["breakfast", "lunch"],
        hotel: "Kumarakom lake resort",
        transfers: "Private car after disembarking",
        activities: [],
        optionalExperiences: ["Ayurvedic massage"],
      },
      {
        day: 5,
        city: "Kumarakom",
        title: "Bird sanctuary at dawn",
        description: "An early visit to Kumarakom Bird Sanctuary, then a free afternoon by the lake.",
        meals: ["breakfast"],
        hotel: "Kumarakom lake resort",
        activities: ["Kumarakom Bird Sanctuary", "Village canal walk"],
        optionalExperiences: ["Kerala cooking class"],
      },
      {
        day: 6,
        city: "Kumarakom",
        title: "Departure",
        description: "Private transfer back to Kochi for onward travel.",
        meals: ["breakfast"],
        transfers: "Private transfer to Kochi airport",
        activities: [],
        optionalExperiences: [],
      },
    ],
    variants: [
      {
        key: "standard",
        label: "Standard",
        hotelCategory: 4,
        durationDays: 6,
        durationNights: 5,
        pricePerAdultINR: 34000,
        pricePerChildINR: 22000,
        singleSupplementINR: 9000,
        originalPricePerAdultINR: 40000,
        isDefault: true,
      },
    ],
    departureSeeds: [
      { inDays: 25, departureCity: "Kochi", seatsTotal: 16, seatsBooked: 5, isFixedDeparture: false, isGuaranteed: false },
      { inDays: 55, departureCity: "Bengaluru", seatsTotal: 16, seatsBooked: 2, isFixedDeparture: false, isGuaranteed: false },
    ],
    departureCities: ["Kochi", "Bengaluru", "Chennai"],
    taxPercent: 5,
    flightsIncluded: false,
    mealsIncluded: true,
    activitiesIncluded: true,
    visaIncluded: false,
    transfersIncluded: true,
    hotelCategory: 4,
    tripStyle: "private",
    instantConfirmation: true,
    recommendedSeason: ["Autumn", "Winter"],
    inclusions: [
      "5 nights accommodation as per itinerary (tea-estate resort, houseboat, lake resort)",
      "All meals on the houseboat",
      "Daily breakfast at hotels and resorts",
      "All transfers by private car",
      "Tea Museum and Mattupetty Dam entry",
    ],
    exclusions: [
      "Flights to/from Kochi",
      "Eravikulam National Park entry (seasonal, subject to closure)",
      "Ayurvedic treatments (optional add-on)",
      "Alcohol",
      "Personal expenses",
    ],
    importantInfo: [
      "Houseboat cabin allocation is per boat, not per person.",
      "Eravikulam National Park closes annually (typically Feb–Mar) for the Nilgiri Tahr breeding season — we substitute an equivalent excursion if it's closed.",
    ],
    visaDetails: "",
    cancellationPolicy: [
      { window: "More than 20 days before travel", charge: "10% of package cost" },
      { window: "10–20 days before travel", charge: "35% of package cost" },
      { window: "Less than 10 days before travel", charge: "75% of package cost" },
    ],
    paymentPolicy: ["25% deposit to confirm.", "Balance due 15 days before travel."],
    termsAndConditions: [
      "Rates are per person on twin-sharing basis.",
      "Houseboat category is subject to availability; an equivalent boat will be substituted if needed.",
    ],
    hotels: [
      { city: "Munnar", name: "Munnar tea-estate resort", category: 4, nights: 2 },
      { city: "Alleppey", name: "Private houseboat", category: 4, nights: 1 },
      { city: "Kumarakom", name: "Kumarakom lake resort", category: 4, nights: 2 },
    ],
    transfersNote: "All transfers by private air-conditioned car",
    faqs: [
      {
        question: "How is this different from a shorter Kerala weekend package?",
        answer:
          "This one adds two full days in the Munnar hills before the backwaters, so you get tea-garden scenery and a cooler climate alongside the houseboat experience.",
      },
      {
        question: "Is the houseboat private to us?",
        answer: "Yes — each cabin booking is on a private houseboat, not a shared vessel.",
      },
    ],
    isFeatured: true,
    isTrending: false,
    isBestseller: false,
    status: "published",
    seo: {
      title: "Kerala Backwaters Experience — 6 Days / 5 Nights | eZyMiles",
      description:
        "Munnar's tea gardens, an Alleppey houseboat night and Kumarakom's lake resort in one 6-day Kerala itinerary. Demo pricing for testing purposes.",
    },
  },

  /* ---------------------------- 5. Rajasthan ---------------------------- */
  {
    title: "Rajasthan Heritage Tour",
    slug: "rajasthan-heritage-tour",
    subtitle: "Jaipur, Jodhpur and Udaipur — forts, palaces and a lake city, with a palace-stay upgrade.",
    destinationSlug: "rajasthan",
    citiesCovered: ["Jaipur", "Jodhpur", "Udaipur"],
    scope: "domestic",
    tripTypes: ["luxury", "family", "group"],
    collections: ["best-of-india", "luxury-getaways", "group-departures"],
    durationDays: 7,
    durationNights: 6,
    heroImage: img("photo-1524492412937-b28074a5d7da", "A hilltop fort overlooking Jaipur"),
    gallery: [
      img("photo-1477587458883-47145ed94245", "A grand Rajasthani palace courtyard"),
      img("photo-1599661046289-e31897846e41", "Jaipur's pink city streets"),
    ],
    overview:
      "A seven-day circuit through Jaipur, Jodhpur and Udaipur — Amber Fort and the City Palace, Mehrangarh above the Blue City, and Lake Pichola in Udaipur — on a fixed group departure, with a palace-stay upgrade available.",
    highlights: [
      "Amber Fort and City Palace in Jaipur",
      "Mehrangarh Fort above Jodhpur's Blue City",
      "Lake Pichola and Udaipur's City Palace",
      "A heritage palace-hotel upgrade, if you want it",
    ],
    itinerary: [
      {
        day: 1,
        city: "Jaipur",
        title: "Arrival",
        description: "Private transfer to your Jaipur hotel, with the evening free at Bapu Bazaar.",
        meals: [],
        hotel: "Jaipur heritage hotel",
        transfers: "Private airport/rail transfer",
        activities: ["Bapu Bazaar"],
        optionalExperiences: [],
      },
      {
        day: 2,
        city: "Jaipur",
        title: "Amber Fort and the City Palace",
        description: "A full day covering Amber Fort, the City Palace and Hawa Mahal.",
        meals: ["breakfast"],
        hotel: "Jaipur heritage hotel",
        transfers: "Private car, full day",
        activities: ["Amber Fort", "City Palace", "Hawa Mahal (photo stop)"],
        optionalExperiences: ["Elephant-safe jeep ride up to Amber Fort"],
      },
      {
        day: 3,
        city: "Jodhpur",
        title: "On to the Blue City",
        description: "A five to six hour drive to Jodhpur, arriving in time for a sunset visit to Mehrangarh Fort.",
        meals: ["breakfast"],
        hotel: "Jodhpur boutique haveli",
        transfers: "Private car, Jaipur to Jodhpur",
        activities: ["Mehrangarh Fort sunset visit"],
        optionalExperiences: [],
      },
      {
        day: 4,
        city: "Jodhpur",
        title: "Jaswant Thada and the Blue City",
        description: "A relaxed day at Jaswant Thada and a walking tour through the Blue City's lanes.",
        meals: ["breakfast"],
        hotel: "Jodhpur boutique haveli",
        activities: ["Jaswant Thada", "Blue City walking tour"],
        optionalExperiences: ["Bishnoi village safari"],
      },
      {
        day: 5,
        city: "Udaipur",
        title: "On to the lake city",
        description: "A five to six hour drive to Udaipur, with a boat ride on Lake Pichola at sunset.",
        meals: ["breakfast"],
        hotel: "Udaipur lakeside hotel",
        transfers: "Private car, Jodhpur to Udaipur",
        activities: ["Lake Pichola boat ride"],
        optionalExperiences: [],
      },
      {
        day: 6,
        city: "Udaipur",
        title: "City Palace and the gardens",
        description: "A full day at Udaipur's City Palace, Saheliyon Ki Bari and Jagdish Temple.",
        meals: ["breakfast"],
        hotel: "Udaipur lakeside hotel",
        activities: ["City Palace, Udaipur", "Saheliyon Ki Bari"],
        optionalExperiences: ["Dinner cruise on Lake Pichola"],
      },
      {
        day: 7,
        city: "Udaipur",
        title: "Departure",
        description: "A free morning, then a private transfer to the airport.",
        meals: ["breakfast"],
        transfers: "Private airport transfer",
        activities: [],
        optionalExperiences: [],
      },
    ],
    variants: [
      {
        key: "standard",
        label: "Standard — 4★ hotels",
        hotelCategory: 4,
        durationDays: 7,
        durationNights: 6,
        pricePerAdultINR: 42000,
        pricePerChildINR: 30000,
        singleSupplementINR: 12000,
        originalPricePerAdultINR: 52000,
        isDefault: true,
      },
      {
        key: "palace",
        label: "Palace stays — heritage 5★ properties",
        hotelCategory: 5,
        durationDays: 7,
        durationNights: 6,
        pricePerAdultINR: 78000,
        pricePerChildINR: 54000,
        singleSupplementINR: 24000,
        isDefault: false,
      },
    ],
    departureSeeds: [
      { inDays: 28, departureCity: "Delhi", seatsTotal: 20, seatsBooked: 17, isFixedDeparture: true, isGuaranteed: true },
      { inDays: 58, departureCity: "Delhi", seatsTotal: 20, seatsBooked: 5, isFixedDeparture: true, isGuaranteed: false },
      { inDays: 90, departureCity: "Mumbai", seatsTotal: 16, seatsBooked: 0, isFixedDeparture: true, isGuaranteed: false },
    ],
    departureCities: ["Delhi", "Mumbai"],
    taxPercent: 5,
    flightsIncluded: false,
    mealsIncluded: true,
    activitiesIncluded: true,
    visaIncluded: false,
    transfersIncluded: true,
    hotelCategory: 4,
    tripStyle: "group",
    instantConfirmation: false,
    recommendedSeason: ["Autumn", "Winter"],
    inclusions: [
      "6 nights accommodation across Jaipur, Jodhpur and Udaipur",
      "Daily breakfast",
      "All inter-city transfers by private car",
      "Entry fees at Amber Fort, City Palace Jaipur, Mehrangarh, and City Palace Udaipur",
      "Lake Pichola boat ride",
    ],
    exclusions: [
      "Flights to Jaipur or from Udaipur",
      "Elephant/jeep ride up to Amber Fort",
      "Lunches and dinners except where specified",
      "Camera fees at monuments",
      "Personal expenses",
    ],
    importantInfo: [
      "Long inter-city drives (5-6 hours) are typical in Rajasthan — we build in a stop roughly midway on each leg.",
      "Mehrangarh and Amber Fort involve some uphill walking on uneven stone.",
    ],
    visaDetails: "",
    cancellationPolicy: [
      { window: "More than 30 days before travel", charge: "15% of package cost" },
      { window: "15–30 days before travel", charge: "40% of package cost" },
      { window: "Less than 15 days before travel", charge: "80% of package cost" },
    ],
    paymentPolicy: ["30% deposit to confirm.", "Balance due 21 days before travel."],
    termsAndConditions: [
      "Group departures require a minimum of 10 travellers to guarantee the date.",
      "Rates are per person on twin-sharing basis.",
    ],
    hotels: [
      { city: "Jaipur", name: "Jaipur heritage hotel", category: 4, nights: 2 },
      { city: "Jodhpur", name: "Jodhpur boutique haveli", category: 4, nights: 2 },
      { city: "Udaipur", name: "Udaipur lakeside hotel", category: 4, nights: 2 },
    ],
    transfersNote: "All inter-city transfers by private air-conditioned car with driver",
    faqs: [
      {
        question: "Is the palace variant worth the difference in price?",
        answer:
          "If a heritage palace stay is part of why you're visiting Rajasthan, yes — the standard variant uses well-rated 4★ hotels that are comfortable but not palaces.",
      },
      {
        question: "How long are the drives between cities?",
        answer:
          "Jaipur–Jodhpur and Jodhpur–Udaipur are both around 5-6 hours by road. We schedule a stop at a roadside heritage site or café on each leg.",
      },
    ],
    isFeatured: true,
    isTrending: true,
    isBestseller: true,
    status: "published",
    seo: {
      title: "Rajasthan Heritage Tour — 7 Days / 6 Nights | eZyMiles",
      description:
        "Jaipur, Jodhpur and Udaipur in one 7-day Rajasthan heritage circuit, with a palace-stay upgrade available. Demo pricing for testing purposes.",
    },
  },

  /* ---------------------------- 6. Dubai ---------------------------- */
  {
    title: "Dubai Family Holiday",
    slug: "dubai-family-holiday",
    subtitle: "Aquaventure Waterpark, Burj Khalifa, and a desert camp — flights and visa included.",
    destinationSlug: "dubai",
    citiesCovered: ["Dubai"],
    scope: "international",
    tripTypes: ["family", "luxury"],
    collections: ["family-holidays", "flight-inclusive", "trending-international"],
    durationDays: 5,
    durationNights: 4,
    heroImage: img("photo-1512453979798-5ea266f8880c", "Dubai skyline at dusk"),
    gallery: [
      img("photo-1518684079-3c830dcef090", "A desert dune at sunset"),
      img("photo-1587474260584-136574528ed5", "A theme park water slide"),
    ],
    overview:
      "A flight-inclusive five-day Dubai break built for families — a full day at Aquaventure Waterpark, Burj Khalifa's At the Top, and an overnight-feel desert safari with a BBQ dinner, all on private transfers.",
    highlights: [
      "A full day at Aquaventure Waterpark, Atlantis",
      "Burj Khalifa — At the Top",
      "A desert safari with a BBQ dinner",
      "Flights and UAE visa included",
    ],
    itinerary: [
      {
        day: 1,
        city: "Dubai",
        title: "Arrival",
        description: "Flight in, then a private transfer to your hotel with the evening free.",
        meals: ["breakfast"],
        hotel: "4★ family-friendly Dubai hotel",
        transfers: "Private airport transfer",
        activities: [],
        optionalExperiences: [],
      },
      {
        day: 2,
        city: "Dubai",
        title: "Theme park day",
        description: "A full day at Aquaventure Waterpark, Atlantis.",
        meals: ["breakfast"],
        hotel: "4★ family-friendly Dubai hotel",
        activities: ["Aquaventure Waterpark, Atlantis"],
        optionalExperiences: ["Legoland Dubai"],
      },
      {
        day: 3,
        city: "Dubai",
        title: "City sightseeing",
        description: "Dubai Mall, the Dubai Fountain show, and Burj Khalifa's At the Top observation deck.",
        meals: ["breakfast"],
        hotel: "4★ family-friendly Dubai hotel",
        activities: ["Dubai Mall", "Dubai Fountain show", "Burj Khalifa — At the Top"],
        optionalExperiences: ["Dubai Aquarium & Underwater Zoo"],
      },
      {
        day: 4,
        city: "Dubai",
        title: "Desert safari",
        description: "An afternoon dune drive and camel ride, followed by a desert camp BBQ dinner with entertainment.",
        meals: ["breakfast", "dinner"],
        hotel: "4★ family-friendly Dubai hotel",
        transfers: "4x4 dune transfer",
        activities: ["Dune drive", "Desert camp with BBQ dinner"],
        optionalExperiences: ["Falconry photo experience"],
      },
      {
        day: 5,
        city: "Dubai",
        title: "Departure",
        description: "A free morning, then a private transfer to the airport for your flight home.",
        meals: ["breakfast"],
        transfers: "Private airport transfer",
        activities: [],
        optionalExperiences: [],
      },
    ],
    variants: [
      {
        key: "standard",
        label: "Standard — flights included",
        hotelCategory: 4,
        durationDays: 5,
        durationNights: 4,
        pricePerAdultINR: 62000,
        pricePerChildINR: 44000,
        singleSupplementINR: 16000,
        originalPricePerAdultINR: 72000,
        isDefault: true,
      },
    ],
    departureSeeds: [
      { inDays: 40, departureCity: "Delhi", seatsTotal: 22, seatsBooked: 10, isFixedDeparture: false, isGuaranteed: false },
      { inDays: 70, departureCity: "Mumbai", seatsTotal: 22, seatsBooked: 4, isFixedDeparture: false, isGuaranteed: false },
    ],
    departureCities: ["Delhi", "Mumbai", "Bengaluru", "Hyderabad"],
    taxPercent: 5,
    flightsIncluded: true,
    mealsIncluded: true,
    activitiesIncluded: true,
    visaIncluded: true,
    transfersIncluded: true,
    hotelCategory: 4,
    tripStyle: "private",
    instantConfirmation: true,
    recommendedSeason: ["Winter"],
    inclusions: [
      "Return economy flights",
      "4 nights accommodation",
      "UAE visa processing",
      "Aquaventure Waterpark entry",
      "Burj Khalifa At the Top entry",
      "Desert safari with BBQ dinner",
      "All transfers",
    ],
    exclusions: [
      "Lunches (except the desert safari dinner)",
      "Legoland Dubai entry (optional add-on)",
      "Personal expenses",
      "Travel insurance",
    ],
    importantInfo: [
      "Aquaventure Waterpark tickets are date-specific once issued and generally non-changeable.",
      "The desert safari can be rescheduled by a day in case of sandstorm warnings.",
    ],
    visaDetails: "UAE visa included and processed on your behalf; approval rests with UAE immigration.",
    cancellationPolicy: [
      { window: "More than 21 days before travel", charge: "20% of package cost" },
      { window: "7–21 days before travel", charge: "50% of package cost" },
      { window: "Less than 7 days before travel", charge: "90% of package cost" },
    ],
    paymentPolicy: ["Full payment required due to flight ticketing."],
    termsAndConditions: [
      "Flight-inclusive packages are non-refundable on the flight portion once ticketed.",
      "Children's water park tickets follow the operator's height/age policy.",
    ],
    hotels: [
      {
        city: "Dubai",
        name: "4★ family-friendly Dubai hotel",
        category: 4,
        nights: 4,
        note: "Includes a kids' pool and daily breakfast buffet",
      },
    ],
    flightNote: "Return economy flights from your chosen departure city",
    transfersNote: "All airport and activity transfers included",
    faqs: [
      {
        question: "Is this suitable for young children?",
        answer:
          "Yes — Aquaventure and the desert camp both have family-friendly sections, and every transfer is private rather than shared.",
      },
      {
        question: "Can we swap Aquaventure for Legoland?",
        answer: "Yes, tell us when you enquire — it's a straightforward swap with a small price adjustment either way.",
      },
    ],
    isFeatured: true,
    isTrending: false,
    isBestseller: true,
    status: "published",
    seo: {
      title: "Dubai Family Holiday — 5 Days / 4 Nights, Flights Included | eZyMiles",
      description:
        "A flight-inclusive 5-day Dubai family holiday with Aquaventure Waterpark, Burj Khalifa and a desert safari. Demo pricing for testing purposes.",
    },
  },

  /* ---------------------------- 7. Bali ---------------------------- */
  {
    title: "Bali Honeymoon Package",
    slug: "bali-honeymoon-package",
    subtitle: "Seminyak's beach clubs, Ubud's rice fields, and a private candlelight dinner.",
    destinationSlug: "bali",
    citiesCovered: ["Seminyak", "Ubud", "Nusa Dua"],
    scope: "international",
    tripTypes: ["honeymoon", "luxury"],
    collections: ["honeymoon-escapes", "trending-international", "luxury-getaways"],
    durationDays: 6,
    durationNights: 5,
    heroImage: img("photo-1537996194471-e657df975ab4", "A private pool villa overlooking rice terraces"),
    gallery: [
      img("photo-1552733407-5d5c46c3bb3b", "A Balinese temple at dusk"),
      img("photo-1573790387438-4da905039392", "Rice terraces after rain"),
    ],
    overview:
      "Five nights split across Seminyak's beach clubs, Ubud's rice-field villas, and a final stay at a Nusa Dua beach resort, with one evening set aside for a private candlelight dinner in the Ubud rice fields.",
    highlights: [
      "Private pool villas in both Seminyak and Ubud",
      "Tegalalang Rice Terraces and Ubud's morning market",
      "A private candlelight dinner in the rice fields",
      "A closing stay at a Nusa Dua beach resort",
    ],
    itinerary: [
      {
        day: 1,
        city: "Seminyak",
        title: "Arrival",
        description: "Private transfer to your Seminyak villa, with a sunset beach club session to close the day.",
        meals: ["breakfast"],
        hotel: "Seminyak private pool villa",
        transfers: "Private airport transfer",
        activities: [],
        optionalExperiences: ["Seminyak beach club sunset session"],
      },
      {
        day: 2,
        city: "Seminyak",
        title: "A day with nothing planned",
        description: "A free day for the beach and the villa pool, with an optional couples spa treatment.",
        meals: ["breakfast"],
        hotel: "Seminyak private pool villa",
        activities: [],
        optionalExperiences: ["Couples spa treatment"],
      },
      {
        day: 3,
        city: "Ubud",
        title: "Move to the rice fields",
        description: "Transfer to Ubud, with a stop at Tegalalang Rice Terraces and the Ubud morning market.",
        meals: ["breakfast"],
        hotel: "Ubud rice-field pool villa",
        transfers: "Private transfer, Seminyak to Ubud",
        activities: ["Tegalalang Rice Terraces", "Ubud market"],
        optionalExperiences: ["Balinese cooking class"],
      },
      {
        day: 4,
        city: "Ubud",
        title: "A temple visit and a private dinner",
        description: "A morning visit to Tirta Empul Temple, then a private candlelight dinner set up in the rice fields.",
        meals: ["breakfast", "dinner"],
        hotel: "Ubud rice-field pool villa",
        activities: ["Tirta Empul Temple"],
        optionalExperiences: ["Private candlelight dinner in the rice fields"],
      },
      {
        day: 5,
        city: "Nusa Dua",
        title: "Move to the coast",
        description: "Transfer to a Nusa Dua beach resort for a final, low-key stay.",
        meals: ["breakfast"],
        hotel: "Nusa Dua beach resort",
        transfers: "Private transfer, Ubud to Nusa Dua",
        activities: [],
        optionalExperiences: ["Sunset dinner cruise"],
      },
      {
        day: 6,
        city: "Nusa Dua",
        title: "Departure",
        description: "A free morning, then a private transfer to the airport.",
        meals: ["breakfast"],
        transfers: "Private airport transfer",
        activities: [],
        optionalExperiences: [],
      },
    ],
    variants: [
      {
        key: "standard",
        label: "Standard — 4★ villas",
        hotelCategory: 4,
        durationDays: 6,
        durationNights: 5,
        pricePerAdultINR: 72000,
        pricePerChildINR: 48000,
        singleSupplementINR: 24000,
        originalPricePerAdultINR: 88000,
        isDefault: true,
      },
      {
        key: "premium",
        label: "Premium — 5★ private pool villas throughout",
        hotelCategory: 5,
        durationDays: 6,
        durationNights: 5,
        pricePerAdultINR: 110000,
        pricePerChildINR: 70000,
        singleSupplementINR: 34000,
        isDefault: false,
      },
    ],
    departureSeeds: [
      { inDays: 38, departureCity: "Delhi", seatsTotal: 14, seatsBooked: 6, isFixedDeparture: false, isGuaranteed: false },
      { inDays: 68, departureCity: "Mumbai", seatsTotal: 14, seatsBooked: 1, isFixedDeparture: false, isGuaranteed: false },
    ],
    departureCities: ["Delhi", "Mumbai", "Bengaluru"],
    taxPercent: 5,
    flightsIncluded: false,
    mealsIncluded: true,
    activitiesIncluded: true,
    visaIncluded: false,
    transfersIncluded: true,
    hotelCategory: 4,
    tripStyle: "private",
    instantConfirmation: true,
    recommendedSeason: ["Spring", "Summer", "Autumn"],
    inclusions: [
      "5 nights accommodation across Seminyak, Ubud and Nusa Dua",
      "Daily breakfast",
      "All private transfers",
      "Tegalalang Rice Terraces and Ubud market visit",
      "One candlelight dinner in Ubud",
    ],
    exclusions: [
      "International flights",
      "Indonesia visa on arrival fee",
      "Lunches and dinners except where specified",
      "Spa treatments (optional add-on)",
      "Travel insurance",
    ],
    importantInfo: [
      "Seminyak to Ubud traffic can take up to two hours — we schedule this transfer outside peak times where possible.",
      "Let us know at booking if you'd like the candlelight dinner moved to a different night.",
    ],
    visaDetails: "Visa on arrival for Indian passport holders, valid 30 days, extendable once for a further 30 days.",
    cancellationPolicy: [
      { window: "More than 45 days before travel", charge: "10% of package cost" },
      { window: "30–45 days before travel", charge: "30% of package cost" },
      { window: "15–29 days before travel", charge: "60% of package cost" },
      { window: "Less than 15 days before travel", charge: "100% of package cost" },
    ],
    paymentPolicy: ["25% deposit to confirm your booking.", "Balance due 21 days before travel."],
    termsAndConditions: [
      "Rates are per person on twin-sharing basis unless a single supplement is selected.",
      "Itinerary sequence may vary slightly based on local conditions.",
    ],
    hotels: [
      { city: "Seminyak", name: "Seminyak private pool villa", category: 4, nights: 2 },
      { city: "Ubud", name: "Ubud rice-field pool villa", category: 4, nights: 2 },
      { city: "Nusa Dua", name: "Nusa Dua beach resort", category: 4, nights: 1 },
    ],
    transfersNote: "All transfers by private car with driver",
    faqs: [
      {
        question: "Can we add Nusa Penida or the Gili Islands?",
        answer: "Yes — tell us when you enquire and we'll requote with an extra day or two added.",
      },
      {
        question: "Is the candlelight dinner really private?",
        answer: "Yes — it's set up exclusively for two, typically in the rice-field grounds of the Ubud villa.",
      },
    ],
    isFeatured: true,
    isTrending: true,
    isBestseller: true,
    status: "published",
    seo: {
      title: "Bali Honeymoon Package — 6 Days / 5 Nights | eZyMiles",
      description:
        "A 6-day Bali honeymoon across Seminyak, Ubud and Nusa Dua with private pool villas and a candlelight dinner. Demo pricing for testing purposes.",
    },
  },

  /* ---------------------------- 8. Thailand ---------------------------- */
  {
    title: "Thailand Group Tour",
    slug: "thailand-group-tour",
    subtitle: "Bangkok's temples and Pattaya's islands, on a flight-inclusive fixed departure.",
    destinationSlug: "thailand",
    citiesCovered: ["Bangkok", "Pattaya"],
    scope: "international",
    tripTypes: ["group", "beach", "nightlife"],
    collections: ["group-departures", "trending-international", "flight-inclusive"],
    durationDays: 5,
    durationNights: 4,
    heroImage: img("photo-1528181304800-259b08848526", "Longtail boats off a Thai island beach"),
    gallery: [
      img("photo-1552465011-b4e21bf6e79a", "A Bangkok temple at dusk"),
      img("photo-1552550049-db097c9480d1", "Limestone cliffs in the Andaman Sea"),
    ],
    overview:
      "A flight-inclusive five-day group tour covering Bangkok's Grand Palace and river temples, then a coach transfer to Pattaya for Coral Island and the Alcazar cabaret show, run on fixed departure dates with a tour manager throughout.",
    highlights: [
      "Bangkok's Grand Palace and Wat Arun",
      "Coral Island's beaches off Pattaya",
      "The Alcazar cabaret show",
      "A tour manager on every fixed departure",
    ],
    itinerary: [
      {
        day: 1,
        city: "Bangkok",
        title: "Arrival",
        description: "Flight in, then a private transfer to your hotel with the evening free.",
        meals: ["breakfast"],
        hotel: "Bangkok city hotel",
        transfers: "Private airport transfer",
        activities: [],
        optionalExperiences: ["Chao Phraya river dinner cruise"],
      },
      {
        day: 2,
        city: "Bangkok",
        title: "Temples and the Grand Palace",
        description: "A full day covering the Grand Palace, Wat Pho and Wat Arun.",
        meals: ["breakfast"],
        hotel: "Bangkok city hotel",
        activities: ["Grand Palace", "Wat Pho", "Wat Arun"],
        optionalExperiences: ["Floating market half-day trip"],
      },
      {
        day: 3,
        city: "Pattaya",
        title: "On to Pattaya",
        description: "A group coach transfer to Pattaya, then a boat trip to Coral Island (Koh Larn).",
        meals: ["breakfast"],
        hotel: "Pattaya beach hotel",
        transfers: "Group coach transfer, Bangkok to Pattaya",
        activities: ["Coral Island (Koh Larn) boat trip"],
        optionalExperiences: ["Parasailing at Coral Island"],
      },
      {
        day: 4,
        city: "Pattaya",
        title: "Alcazar and free beach time",
        description: "A free day at the beach, with an evening at the Alcazar cabaret show.",
        meals: ["breakfast"],
        hotel: "Pattaya beach hotel",
        activities: ["Alcazar cabaret show"],
        optionalExperiences: ["Nong Nooch Tropical Garden"],
      },
      {
        day: 5,
        city: "Bangkok",
        title: "Departure",
        description: "A group coach transfer back to Bangkok airport for your flight home.",
        meals: ["breakfast"],
        transfers: "Group coach transfer to airport",
        activities: [],
        optionalExperiences: [],
      },
    ],
    variants: [
      {
        key: "standard",
        label: "Standard — flights included",
        hotelCategory: 3,
        durationDays: 5,
        durationNights: 4,
        pricePerAdultINR: 45000,
        pricePerChildINR: 32000,
        singleSupplementINR: 12000,
        originalPricePerAdultINR: 54000,
        isDefault: true,
      },
    ],
    departureSeeds: [
      { inDays: 33, departureCity: "Delhi", seatsTotal: 28, seatsBooked: 24, isFixedDeparture: true, isGuaranteed: true },
      { inDays: 63, departureCity: "Mumbai", seatsTotal: 28, seatsBooked: 9, isFixedDeparture: true, isGuaranteed: false },
      { inDays: 93, departureCity: "Bengaluru", seatsTotal: 25, seatsBooked: 0, isFixedDeparture: true, isGuaranteed: false },
    ],
    departureCities: ["Delhi", "Mumbai", "Bengaluru"],
    taxPercent: 5,
    flightsIncluded: true,
    mealsIncluded: true,
    activitiesIncluded: true,
    visaIncluded: false,
    transfersIncluded: true,
    hotelCategory: 3,
    tripStyle: "group",
    instantConfirmation: false,
    recommendedSeason: ["Winter"],
    inclusions: [
      "Return economy flights",
      "4 nights accommodation (Bangkok + Pattaya)",
      "Daily breakfast",
      "Coral Island boat trip",
      "Alcazar cabaret show tickets",
      "Group tour manager throughout",
    ],
    exclusions: [
      "Thailand visa-on-arrival fee",
      "Lunches and dinners except where specified",
      "Optional excursions (floating market, parasailing, Nong Nooch)",
      "Personal expenses",
    ],
    importantInfo: [
      "This is a fixed-departure group tour — the itinerary sequence and hotel are common to the whole group and aren't customisable on the date shown.",
      "Coral Island boat trips can be shortened in rough sea conditions.",
    ],
    visaDetails:
      "Visa on arrival is available for Indian passport holders at a fee payable locally; an e-visa can also be arranged in advance on request.",
    cancellationPolicy: [
      { window: "More than 25 days before travel", charge: "20% of package cost" },
      { window: "10–25 days before travel", charge: "50% of package cost" },
      { window: "Less than 10 days before travel", charge: "90% of package cost" },
    ],
    paymentPolicy: ["Full payment required due to flight and group hotel block booking."],
    termsAndConditions: [
      "Group departures require a minimum of 15 travellers to guarantee the date.",
      "Rooms are on twin-sharing basis; a single supplement applies for solo travellers.",
    ],
    hotels: [
      { city: "Bangkok", name: "Bangkok city hotel", category: 3, nights: 2 },
      { city: "Pattaya", name: "Pattaya beach hotel", category: 3, nights: 2 },
    ],
    flightNote: "Return economy flights from your chosen departure city",
    transfersNote: "Group coach transfers between cities and to/from airports",
    faqs: [
      {
        question: "Can I join this tour solo?",
        answer:
          "Yes — a single supplement applies, shown before you pay. Solo travellers are common on this fixed-departure tour.",
      },
      {
        question: "Is the Thailand visa really not included?",
        answer:
          "Correct — it's a small fee paid on arrival (or arranged as an e-visa in advance), so we've kept it out of the headline price rather than bundling it in.",
      },
    ],
    isFeatured: false,
    isTrending: true,
    isBestseller: false,
    status: "published",
    seo: {
      title: "Thailand Group Tour — Bangkok & Pattaya, 5 Days / 4 Nights | eZyMiles",
      description:
        "A flight-inclusive 5-day group tour of Bangkok and Pattaya with fixed departures. Demo pricing for testing purposes.",
    },
  },

  /* ---------------------------- 9. Singapore + Malaysia ---------------------------- */
  {
    title: "Singapore and Malaysia Tour",
    slug: "singapore-malaysia-tour",
    subtitle: "Universal Studios Singapore, the Petronas Towers, and a day trip to Genting Highlands.",
    destinationSlug: "singapore",
    additionalDestinationSlugs: ["malaysia"],
    citiesCovered: ["Singapore", "Kuala Lumpur", "Genting Highlands"],
    scope: "international",
    tripTypes: ["family", "group"],
    collections: ["family-holidays", "trending-international", "group-departures"],
    durationDays: 7,
    durationNights: 6,
    heroImage: img("photo-1525625293386-3f8f99389edd", "The Marina Bay skyline at night"),
    gallery: [
      img("photo-1565967511849-76a60a516170", "Supertree Grove at Gardens by the Bay"),
      img("photo-1596422846543-75c6fc197f07", "Kuala Lumpur's skyline with the Petronas Towers"),
    ],
    overview:
      "A combined seven-day route through Singapore and Kuala Lumpur — Gardens by the Bay and Universal Studios on Sentosa, then the Petronas Towers, Batu Caves and a day trip up to Genting Highlands — with both countries' visas processed for you.",
    highlights: [
      "Universal Studios Singapore on Sentosa",
      "Gardens by the Bay's Supertree Grove",
      "The Petronas Towers observation deck",
      "A day trip to Genting Highlands by cable car",
    ],
    itinerary: [
      {
        day: 1,
        city: "Singapore",
        title: "Arrival",
        description: "Private transfer to your Singapore hotel, with a Marina Bay evening walk.",
        meals: ["breakfast"],
        hotel: "Singapore city hotel",
        transfers: "Private airport transfer",
        activities: [],
        optionalExperiences: ["Marina Bay Sands SkyPark visit"],
      },
      {
        day: 2,
        city: "Singapore",
        title: "Gardens by the Bay and the Merlion",
        description: "A full day covering Gardens by the Bay and Merlion Park.",
        meals: ["breakfast"],
        hotel: "Singapore city hotel",
        activities: ["Gardens by the Bay", "Merlion Park"],
        optionalExperiences: ["Singapore Flyer"],
      },
      {
        day: 3,
        city: "Singapore",
        title: "Sentosa Island",
        description: "A full day at Universal Studios Singapore on Sentosa Island.",
        meals: ["breakfast"],
        hotel: "Singapore city hotel",
        activities: ["Universal Studios Singapore"],
        optionalExperiences: ["S.E.A. Aquarium"],
      },
      {
        day: 4,
        city: "Kuala Lumpur",
        title: "On to Kuala Lumpur",
        description: "Transfer to Kuala Lumpur by flight or coach, depending on the departure date, with the evening free.",
        meals: ["breakfast"],
        hotel: "Kuala Lumpur city hotel",
        transfers: "Flight or coach transfer, Singapore to Kuala Lumpur",
        activities: [],
        optionalExperiences: [],
      },
      {
        day: 5,
        city: "Kuala Lumpur",
        title: "Petronas Towers and Batu Caves",
        description: "A full day covering the Petronas Towers observation deck and Batu Caves.",
        meals: ["breakfast"],
        hotel: "Kuala Lumpur city hotel",
        activities: ["Petronas Towers (observation deck)", "Batu Caves"],
        optionalExperiences: ["KL Tower"],
      },
      {
        day: 6,
        city: "Genting Highlands",
        title: "Genting Highlands day trip",
        description: "A cable car up to Genting Highlands' hill resort for the day.",
        meals: ["breakfast"],
        hotel: "Kuala Lumpur city hotel",
        transfers: "Private car and cable car, Genting Highlands day trip",
        activities: ["Genting Skyway cable car", "Genting Highlands hill resort"],
        optionalExperiences: ["Genting theme park rides"],
      },
      {
        day: 7,
        city: "Kuala Lumpur",
        title: "Departure",
        description: "A private transfer to Kuala Lumpur airport.",
        meals: ["breakfast"],
        transfers: "Private airport transfer",
        activities: [],
        optionalExperiences: [],
      },
    ],
    variants: [
      {
        key: "standard",
        label: "Standard",
        hotelCategory: 4,
        durationDays: 7,
        durationNights: 6,
        pricePerAdultINR: 68000,
        pricePerChildINR: 46000,
        singleSupplementINR: 20000,
        originalPricePerAdultINR: 80000,
        isDefault: true,
      },
    ],
    departureSeeds: [
      { inDays: 45, departureCity: "Delhi", seatsTotal: 20, seatsBooked: 8, isFixedDeparture: true, isGuaranteed: false },
      { inDays: 75, departureCity: "Mumbai", seatsTotal: 20, seatsBooked: 2, isFixedDeparture: true, isGuaranteed: false },
    ],
    departureCities: ["Delhi", "Mumbai", "Chennai"],
    taxPercent: 5,
    flightsIncluded: false,
    mealsIncluded: true,
    activitiesIncluded: true,
    visaIncluded: true,
    transfersIncluded: true,
    hotelCategory: 4,
    tripStyle: "group",
    instantConfirmation: false,
    recommendedSeason: ["Spring", "Summer"],
    inclusions: [
      "6 nights accommodation across Singapore and Kuala Lumpur",
      "Daily breakfast",
      "Singapore and Malaysia visa processing",
      "Universal Studios Singapore entry",
      "Genting Skyway cable car tickets",
      "Inter-city transfer between Singapore and Kuala Lumpur",
    ],
    exclusions: [
      "International flights to Singapore and from Kuala Lumpur",
      "Lunches and dinners except where specified",
      "S.E.A. Aquarium and KL Tower (optional add-ons)",
      "Personal expenses",
    ],
    importantInfo: [
      "The Singapore–Kuala Lumpur leg is by short flight or coach depending on the departure date; both are shown as options at booking.",
      "Genting Highlands can be cooler and misty — pack a light jacket.",
    ],
    visaDetails:
      "Singapore and Malaysia visas are processed on your behalf for Indian passport holders; final approval rests with each country's immigration authority.",
    cancellationPolicy: [
      { window: "More than 30 days before travel", charge: "20% of package cost" },
      { window: "15–30 days before travel", charge: "50% of package cost" },
      { window: "Less than 15 days before travel", charge: "90% of package cost" },
    ],
    paymentPolicy: ["30% deposit to confirm.", "Balance due 21 days before travel."],
    termsAndConditions: [
      "Group departures require a minimum of 10 travellers to guarantee the date.",
      "Rates are per person on twin-sharing basis.",
    ],
    hotels: [
      { city: "Singapore", name: "Singapore city hotel", category: 4, nights: 3 },
      { city: "Kuala Lumpur", name: "Kuala Lumpur city hotel", category: 4, nights: 3 },
    ],
    transfersNote: "All local transfers included; the Singapore–Kuala Lumpur leg is by flight or coach depending on the departure",
    faqs: [
      {
        question: "Do we need separate visas for Singapore and Malaysia?",
        answer:
          "Yes, they're two separate approvals, but we process both applications together so you only deal with one enquiry.",
      },
      {
        question: "Can we do this trip in reverse, starting from Kuala Lumpur?",
        answer: "Yes — let us know at enquiry and we'll requote the same itinerary starting from Kuala Lumpur instead.",
      },
    ],
    isFeatured: true,
    isTrending: false,
    isBestseller: false,
    status: "published",
    seo: {
      title: "Singapore and Malaysia Tour — 7 Days / 6 Nights | eZyMiles",
      description:
        "A combined 7-day Singapore and Kuala Lumpur tour with Universal Studios, Genting Highlands and visa processing included. Demo pricing for testing purposes.",
    },
  },

  /* ---------------------------- 10. Maldives ---------------------------- */
  {
    title: "Maldives Luxury Escape",
    slug: "maldives-luxury-escape",
    subtitle: "An overwater villa, house-reef snorkelling, and an all-inclusive meal plan.",
    destinationSlug: "maldives",
    citiesCovered: ["Male", "North Male Atoll"],
    scope: "international",
    tripTypes: ["honeymoon", "luxury", "beach"],
    collections: ["luxury-getaways", "honeymoon-escapes", "flight-inclusive", "trending-international"],
    durationDays: 5,
    durationNights: 4,
    heroImage: img("photo-1514282401047-d79a71a590e8", "An overwater villa in the Maldives"),
    gallery: [
      img("photo-1573052905904-34ad8c27f0cc", "A turquoise lagoon around a Maldivian atoll"),
      img("photo-1540202404-a2f29016b523", "A private beach in the Maldives"),
    ],
    overview:
      "Four nights in an overwater villa on a North Male Atoll resort, with almost nothing scheduled beyond a guided snorkelling excursion and a private candlelit dinner over the water — flights and all meals included.",
    highlights: [
      "An overwater villa with direct lagoon access",
      "House-reef snorkelling right off your deck",
      "A private candlelit dinner over the water",
      "Flights and an all-inclusive meal plan included",
    ],
    itinerary: [
      {
        day: 1,
        city: "North Male Atoll",
        title: "Arrival",
        description: "Flight into Male, then a speedboat transfer to your overwater villa resort.",
        meals: ["breakfast", "dinner"],
        hotel: "Overwater villa resort",
        transfers: "Speedboat transfer from Male airport",
        activities: [],
        optionalExperiences: ["Sunset dolphin cruise"],
      },
      {
        day: 2,
        city: "North Male Atoll",
        title: "House reef day",
        description: "A day for the house reef and the villa's private deck.",
        meals: ["breakfast", "lunch", "dinner"],
        hotel: "Overwater villa resort",
        activities: ["House reef snorkelling"],
        optionalExperiences: ["Private sandbank picnic"],
      },
      {
        day: 3,
        city: "North Male Atoll",
        title: "Guided snorkelling excursion",
        description: "A guided snorkelling excursion out on the atoll, with the rest of the day free.",
        meals: ["breakfast", "lunch", "dinner"],
        hotel: "Overwater villa resort",
        activities: ["Guided snorkelling excursion"],
        optionalExperiences: ["Couples spa treatment", "Scuba diving (PADI-certified only)"],
      },
      {
        day: 4,
        city: "North Male Atoll",
        title: "A free day",
        description: "A day with nothing planned, closing with a private candlelit dinner over the water.",
        meals: ["breakfast", "lunch", "dinner"],
        hotel: "Overwater villa resort",
        activities: [],
        optionalExperiences: ["Private candlelit dinner over the water"],
      },
      {
        day: 5,
        city: "North Male Atoll",
        title: "Departure",
        description: "A speedboat transfer back to Male for your flight home.",
        meals: ["breakfast"],
        transfers: "Speedboat transfer to Male airport",
        activities: [],
        optionalExperiences: [],
      },
    ],
    variants: [
      {
        key: "standard",
        label: "Overwater villa",
        hotelCategory: 5,
        durationDays: 5,
        durationNights: 4,
        pricePerAdultINR: 128000,
        pricePerChildINR: 0,
        singleSupplementINR: 45000,
        originalPricePerAdultINR: 155000,
        isDefault: true,
      },
      {
        key: "premium",
        label: "Overwater pool villa",
        hotelCategory: 5,
        durationDays: 5,
        durationNights: 4,
        pricePerAdultINR: 175000,
        pricePerChildINR: 0,
        singleSupplementINR: 58000,
        isDefault: false,
      },
    ],
    departureSeeds: [
      { inDays: 42, departureCity: "Delhi", seatsTotal: 10, seatsBooked: 3, isFixedDeparture: false, isGuaranteed: false },
      { inDays: 72, departureCity: "Mumbai", seatsTotal: 10, seatsBooked: 1, isFixedDeparture: false, isGuaranteed: false },
    ],
    departureCities: ["Delhi", "Mumbai", "Bengaluru", "Chennai"],
    taxPercent: 5,
    flightsIncluded: true,
    mealsIncluded: true,
    activitiesIncluded: true,
    visaIncluded: false,
    transfersIncluded: true,
    hotelCategory: 5,
    tripStyle: "private",
    instantConfirmation: false,
    recommendedSeason: ["Winter", "Spring"],
    inclusions: [
      "Return economy flights to Male",
      "4 nights in an overwater villa",
      "All meals (breakfast, lunch, dinner)",
      "Speedboat resort transfers",
      "House-reef snorkelling equipment",
    ],
    exclusions: [
      "Alcoholic beverages (available on a paid package)",
      "Scuba diving and PADI certification courses",
      "Spa treatments (optional add-on)",
      "Travel insurance",
    ],
    importantInfo: [
      "This resort is adults-only — please check with us before booking if travelling with children.",
      "Speedboat transfer time depends on the specific resort atoll and can range from 30 minutes to just over an hour.",
    ],
    visaDetails: "Free 30-day visa on arrival for all nationalities, including Indian passport holders.",
    cancellationPolicy: [
      { window: "More than 60 days before travel", charge: "25% of package cost" },
      { window: "30–60 days before travel", charge: "50% of package cost" },
      { window: "Less than 30 days before travel", charge: "100% of package cost" },
    ],
    paymentPolicy: ["50% deposit to confirm.", "Balance due 45 days before travel."],
    termsAndConditions: [
      "Rates are per person on twin-sharing basis in an adults-only resort.",
      "Overwater villa allocation is subject to availability at the time of confirmation.",
    ],
    hotels: [
      {
        city: "North Male Atoll",
        name: "Overwater villa resort",
        category: 5,
        nights: 4,
        note: "Adults-only, all-inclusive meal plan",
      },
    ],
    flightNote: "Return economy flights from your chosen Indian departure city to Male",
    transfersNote: "Speedboat transfer between Male airport and the resort",
    faqs: [
      {
        question: "Is this resort suitable for a family with children?",
        answer:
          "No — this specific resort is adults-only. Tell us at enquiry if you need a family-friendly Maldives resort and we'll requote.",
      },
      {
        question: "Is alcohol included?",
        answer:
          "No — the all-inclusive plan covers meals and soft beverages; alcohol is available on a separate paid package at the resort.",
      },
    ],
    isFeatured: true,
    isTrending: true,
    isBestseller: true,
    status: "published",
    seo: {
      title: "Maldives Luxury Escape — 5 Days / 4 Nights, Overwater Villa | eZyMiles",
      description:
        "A flight-inclusive 5-day Maldives honeymoon at an adults-only overwater villa resort, all meals included. Demo pricing for testing purposes.",
    },
  },
];

async function seedPackages(destIds: Map<string, mongoose.Types.ObjectId>) {
  const created: string[] = [];
  const skipped: string[] = [];

  for (const pkg of DEMO_PACKAGES) {
    const destinationId = destIds.get(pkg.destinationSlug);
    if (!destinationId) {
      console.warn(`Skipping "${pkg.title}" — destination "${pkg.destinationSlug}" not found.`);
      continue;
    }

    const additionalDestinations = (pkg.additionalDestinationSlugs ?? [])
      .map((slug) => destIds.get(slug))
      .filter((id): id is mongoose.Types.ObjectId => Boolean(id));

    const startingPriceINR = Math.min(...pkg.variants.map((v) => v.pricePerAdultINR));
    const originalPriceINR = pkg.variants.find((v) => v.isDefault)?.originalPricePerAdultINR;

    const departures = pkg.departureSeeds.map((d) => ({
      date: inDays(d.inDays),
      departureCity: d.departureCity,
      seatsTotal: d.seatsTotal,
      seatsBooked: d.seatsBooked,
      priceAdjustmentINR: 0,
      isFixedDeparture: d.isFixedDeparture,
      isGuaranteed: d.isGuaranteed,
      status: departureStatus(d.seatsBooked, d.seatsTotal),
    }));

    const before = await Package.exists({ slug: pkg.slug });

    await Package.findOneAndUpdate(
      { slug: pkg.slug },
      {
        $setOnInsert: {
          title: pkg.title,
          slug: pkg.slug,
          subtitle: pkg.subtitle,
          destination: destinationId,
          additionalDestinations,
          citiesCovered: pkg.citiesCovered,
          scope: pkg.scope,
          tripTypes: pkg.tripTypes,
          collections: pkg.collections,
          durationDays: pkg.durationDays,
          durationNights: pkg.durationNights,
          heroImage: pkg.heroImage,
          gallery: pkg.gallery,
          overview: pkg.overview,
          highlights: pkg.highlights,
          itinerary: pkg.itinerary,
          variants: pkg.variants,
          departures,
          departureCities: pkg.departureCities,
          startingPriceINR,
          originalPriceINR,
          priceBasis: "per_person",
          taxPercent: pkg.taxPercent,
          flightsIncluded: pkg.flightsIncluded,
          mealsIncluded: pkg.mealsIncluded,
          activitiesIncluded: pkg.activitiesIncluded,
          visaIncluded: pkg.visaIncluded,
          transfersIncluded: pkg.transfersIncluded,
          hotelCategory: pkg.hotelCategory,
          tripStyle: pkg.tripStyle,
          instantConfirmation: pkg.instantConfirmation,
          recommendedSeason: pkg.recommendedSeason,
          inclusions: pkg.inclusions,
          exclusions: pkg.exclusions,
          importantInfo: pkg.importantInfo,
          visaDetails: pkg.visaDetails,
          cancellationPolicy: pkg.cancellationPolicy,
          paymentPolicy: pkg.paymentPolicy,
          termsAndConditions: pkg.termsAndConditions,
          hotels: pkg.hotels,
          flightNote: pkg.flightNote,
          transfersNote: pkg.transfersNote,
          faqs: pkg.faqs,
          ratingAverage: Math.round((4.5 + Math.random() * 0.4) * 10) / 10,
          ratingCount: 10 + Math.floor(Math.random() * 50),
          isFeatured: pkg.isFeatured,
          isTrending: pkg.isTrending,
          isBestseller: pkg.isBestseller,
          status: pkg.status,
          seo: pkg.seo,
          isDemoData: true,
        },
      },
      { upsert: true },
    );

    if (before) skipped.push(pkg.slug);
    else created.push(pkg.slug);
  }

  return { created, skipped };
}

async function main() {
  console.log("Seeding eZyMiles demo packages...\n");

  await connect();

  const destIds = await seedDestinations();
  const { created, skipped } = await seedPackages(destIds);

  console.log(`\nPackages created: ${created.length}`);
  for (const slug of created) console.log(`  + ${slug}`);

  if (skipped.length) {
    console.log(`\nPackages already present (untouched): ${skipped.length}`);
    for (const slug of skipped) console.log(`  = ${slug}`);
  }

  console.log(`\nTotal demo packages defined: ${DEMO_PACKAGES.length}`);
  console.log("Done.");

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("\nSeed failed:", error);
  process.exit(1);
});
