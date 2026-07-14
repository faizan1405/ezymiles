import "server-only";
import { cache } from "react";
import { tryConnectDB } from "@/lib/db";
import { SiteSettings, type ISiteSettings } from "@/models";
import { BRAND, CURRENCIES, CURRENCY_META } from "@/config/site";
import { serialise } from "@/lib/utils";

export type Settings = {
  brand: ISiteSettings["brand"];
  contact: ISiteSettings["contact"];
  social: ISiteSettings["social"];
  announcement: ISiteSettings["announcement"];
  currency: ISiteSettings["currency"];
  payments: ISiteSettings["payments"];
  homepage: ISiteSettings["homepage"];
  seo: ISiteSettings["seo"];
  features: ISiteSettings["features"];
};

/** Build-time defaults, used whenever the database has no settings document yet. */
export const DEFAULT_SETTINGS: Settings = {
  brand: {
    name: BRAND.name,
    tagline: BRAND.tagline,
  },
  contact: {
    phone: BRAND.phone,
    whatsapp: BRAND.whatsapp,
    email: BRAND.email,
    address: BRAND.address,
    officeHours: "Mon – Sat, 9:30 am – 7:00 pm IST",
  },
  social: BRAND.social,
  announcement: {
    enabled: true,
    intervalMs: 5000,
    items: [
      { text: "Summer escapes are open — book by 31 August for early-bird pricing", emphasis: "Early bird" },
      { text: "Free 30-minute consultation with a destination specialist", emphasis: "Free" },
      { text: "Flight-inclusive packages with a 25% deposit to hold your dates", emphasis: "Flexible" },
    ],
  },
  currency: {
    base: "INR",
    supported: [...CURRENCIES],
    rates: Object.fromEntries(Object.entries(CURRENCY_META).map(([k, v]) => [k, v.rateFromINR])),
  },
  payments: {
    razorpayEnabled: true,
    stripeEnabled: false,
    partialPaymentEnabled: true,
    depositPercent: 25,
    balanceDueDaysBeforeTravel: 21,
    taxPercentDefault: 5,
    serviceFeeINR: 0,
  },
  homepage: {
    heroHeadline: "The world, arranged around your idea of a good day.",
    heroSubheadline:
      "Handcrafted holidays, honest pricing, and a travel designer who actually picks up the phone.",
    heroMediaKind: "slideshow",
    heroSlides: [],
    sections: {},
    trustPoints: [],
    liveActivityEnabled: true,
  },
  seo: {
    defaultTitle: "Luxury holidays, flights, stays & experiences",
    titleTemplate: `%s — ${BRAND.name}`,
    defaultDescription: BRAND.description,
    keywords: [
      "holiday packages",
      "international tour packages",
      "India tour packages",
      "honeymoon packages",
      "visa assistance",
    ],
  },
  features: {
    wishlistEnabled: true,
    reviewsEnabled: true,
    blogEnabled: true,
    flightsEnabled: true,
    hotelsEnabled: true,
    activitiesEnabled: true,
    visaEnabled: true,
    cabsEnabled: true,
  },
};

/**
 * Per-request memoised settings. Falls back to defaults if the database is
 * unreachable so the marketing site still renders during an outage.
 */
export const getSettings = cache(async (): Promise<Settings> => {
  const connected = await tryConnectDB();
  if (!connected) return DEFAULT_SETTINGS;

  try {
    const doc = await SiteSettings.findOne({ key: "default" }).lean();
    if (!doc) return DEFAULT_SETTINGS;

    const s = serialise(doc) as unknown as ISiteSettings;

    return {
      brand: { ...DEFAULT_SETTINGS.brand, ...s.brand },
      contact: { ...DEFAULT_SETTINGS.contact, ...s.contact },
      social: { ...DEFAULT_SETTINGS.social, ...s.social },
      announcement: { ...DEFAULT_SETTINGS.announcement, ...s.announcement },
      currency: { ...DEFAULT_SETTINGS.currency, ...s.currency },
      payments: { ...DEFAULT_SETTINGS.payments, ...s.payments },
      homepage: { ...DEFAULT_SETTINGS.homepage, ...s.homepage },
      seo: { ...DEFAULT_SETTINGS.seo, ...s.seo },
      features: { ...DEFAULT_SETTINGS.features, ...s.features },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
});
