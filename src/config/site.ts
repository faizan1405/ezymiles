/**
 * Brand + site configuration.
 *
 * Everything here is a build-time default. At runtime the values are overlaid
 * by the SiteSettings document (editable from the admin panel), so the client
 * can swap the brand name, phone, WhatsApp, email and address without a deploy.
 * See `src/lib/settings.ts`.
 */

export const BRAND = {
  /** Marketing brand shown in the logo lockup, header and page titles. */
  name: "eZyMiles",
  /** Short mark used in the logo lockup while no logo asset is uploaded. */
  shortName: "eZyMiles",
  /** Full registered legal entity — used in the footer copyright and contact page. */
  legalName: "Ezymiles Travel Services LLP",
  tagline: "More than a travel company. A travel partner.",
  description:
    "eZyMiles makes travel planning simple, transparent and stress-free through honest recommendations and responsible support.",
  phone: "+91 79000 03279",
  whatsapp: "+91 79000 03279",
  email: "hello@ezymiles.com",
  address: "Plot No. 337, Industrial and Business Park, Phase 2, Chandigarh – 160002",
  primaryMarket: "India",
  /**
   * Official profiles. An empty string hides that icon everywhere — never use
   * "#" as a stand-in, which renders a dead link. Editable at runtime from
   * Admin → Site Settings → Social links.
   */
  social: {
    instagram: "https://www.instagram.com/ezymiles.travel",
    instagramHandle: "@ezymiles.travel",
    facebook: "https://www.facebook.com/share/1DUABCoPvd/",
    youtube: "",
    linkedin: "",
    x: "",
  },
} as const;

/** The canonical production origin for EzyMiles. */
export const PRODUCTION_URL = "https://www.ezymiles.in";

/**
 * Absolute origin used for metadata, canonicals, Open Graph, the sitemap,
 * robots and email links.
 *
 * NEXT_PUBLIC_SITE_URL wins when set (that's what Vercel provides per
 * environment, and what preview deployments need). When it is missing we fall
 * back per environment rather than unconditionally to localhost — otherwise a
 * production build with an unset variable would silently emit localhost
 * canonical tags, sitemap entries and email links. Local dev keeps localhost.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  (process.env.NODE_ENV === "production" ? PRODUCTION_URL : "http://localhost:3000");

/* -------------------------------------------------------------------------- */
/*                                  Currency                                   */
/* -------------------------------------------------------------------------- */

export const CURRENCIES = ["INR", "USD", "AED", "EUR", "GBP"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = "INR";

export interface CurrencyMeta {
  code: CurrencyCode;
  symbol: string;
  label: string;
  locale: string;
  /** Units of this currency per 1 INR. Editable in Admin → Site Settings. */
  rateFromINR: number;
}

export const CURRENCY_META: Record<CurrencyCode, CurrencyMeta> = {
  INR: { code: "INR", symbol: "₹", label: "Indian Rupee", locale: "en-IN", rateFromINR: 1 },
  USD: { code: "USD", symbol: "$", label: "US Dollar", locale: "en-US", rateFromINR: 0.012 },
  AED: { code: "AED", symbol: "AED ", label: "UAE Dirham", locale: "en-AE", rateFromINR: 0.044 },
  EUR: { code: "EUR", symbol: "€", label: "Euro", locale: "de-DE", rateFromINR: 0.011 },
  GBP: { code: "GBP", symbol: "£", label: "Pound Sterling", locale: "en-GB", rateFromINR: 0.0094 },
};

/* -------------------------------------------------------------------------- */
/*                                 Taxonomies                                  */
/* -------------------------------------------------------------------------- */

export const TRIP_TYPES = [
  { slug: "honeymoon", label: "Honeymoon" },
  { slug: "family", label: "Family" },
  { slug: "group", label: "Group" },
  { slug: "luxury", label: "Luxury" },
  { slug: "adventure", label: "Adventure" },
  { slug: "beach", label: "Beach" },
  { slug: "wildlife", label: "Wildlife" },
  { slug: "pilgrimage", label: "Pilgrimage" },
  { slug: "weekend", label: "Weekend Break" },
  { slug: "solo", label: "Solo" },
  { slug: "cruise", label: "Cruise" },
  { slug: "workation", label: "Workation" },
] as const;

export const ACTIVITY_CATEGORIES = [
  { slug: "adventure", label: "Adventure", icon: "mountain" },
  { slug: "water-sports", label: "Water Sports", icon: "waves" },
  { slug: "theme-parks", label: "Theme Parks", icon: "ferris-wheel" },
  { slug: "wildlife", label: "Wildlife", icon: "bird" },
  { slug: "cultural-tours", label: "Cultural Tours", icon: "landmark" },
  { slug: "cruises", label: "Cruises", icon: "ship" },
  { slug: "nightlife", label: "Nightlife", icon: "martini" },
  { slug: "wellness", label: "Wellness", icon: "flower-2" },
  { slug: "food-experiences", label: "Food Experiences", icon: "utensils" },
  { slug: "sightseeing", label: "Sightseeing", icon: "camera" },
] as const;

export const HOTEL_CATEGORIES = [
  { value: 3, label: "3★ Comfort" },
  { value: 4, label: "4★ Premium" },
  { value: 5, label: "5★ Luxury" },
] as const;

export const TRAVEL_CLASSES = [
  { value: "economy", label: "Economy" },
  { value: "premium_economy", label: "Premium Economy" },
  { value: "business", label: "Business" },
  { value: "first", label: "First" },
] as const;

export const VISA_TYPES = [
  { value: "tourist", label: "Tourist" },
  { value: "business", label: "Business" },
  { value: "transit", label: "Transit" },
  { value: "e-visa", label: "e-Visa" },
  { value: "visa-on-arrival", label: "Visa on Arrival" },
] as const;

export const PACKAGE_COLLECTIONS = [
  { slug: "trending-international", label: "Trending International Trips" },
  { slug: "best-of-india", label: "Best of India" },
  { slug: "honeymoon-escapes", label: "Honeymoon Escapes" },
  { slug: "family-holidays", label: "Family Holidays" },
  { slug: "luxury-getaways", label: "Luxury Getaways" },
  { slug: "adventure-tours", label: "Adventure Tours" },
  { slug: "weekend-breaks", label: "Weekend Breaks" },
  { slug: "group-departures", label: "Group Departures" },
  { slug: "flight-inclusive", label: "Flight-Inclusive Deals" },
  { slug: "cruises", label: "Cruises" },
] as const;

export type PackageCollectionSlug = (typeof PACKAGE_COLLECTIONS)[number]["slug"];

/* -------------------------------------------------------------------------- */
/*                                Data provenance                              */
/* -------------------------------------------------------------------------- */

/**
 * Every price surfaced to a traveller carries one of these labels so we always
 * show the source of the fare.
 */
export const DATA_SOURCES = {
  live: { label: "Live fare", tone: "success" },
  cached: { label: "Cached fare", tone: "info" },
  estimated: { label: "Estimated fare", tone: "warning" },
} as const;

export type DataSource = keyof typeof DATA_SOURCES;
