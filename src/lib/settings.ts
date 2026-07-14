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
  about: ISiteSettings["about"];
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
  about: {
    aboutTitle: "About EzyMiles",
    aboutText: "EzyMiles is an independent travel company focused on making family holidays, international vacations, honeymoons and weekend trips simple, transparent and stress-free.",
    aboutHighlight: "Listen first. Recommend honestly. Serve responsibly.",
    philosophyTitle: "Trust Before Transactions",
    philosophyText: "Customers invest their money, time, emotions and dreams when planning a journey. EzyMiles values honest guidance and customer trust more than higher commissions.",
    founderName: "Charanjit Singh",
    founderRole: "Founder, EzyMiles",
    founderStory: `Travel has never been just a hobby for me. It has been one of the most meaningful experiences of my life.

Over the years, I have travelled extensively across India and several countries around the world. Every journey taught me something new—not just about places, but about people, cultures and the importance of good planning.

Like many travellers, I have experienced situations where promises made during booking disappeared once payment was completed. Excuses replaced accountability, and support became difficult to find when it was needed the most. Those experiences inspired me to build something different.

After completing nearly four decades of public service, I decided to dedicate this phase of my life to something I genuinely enjoy—helping people travel with confidence.

EzyMiles is built on a simple promise: If I recommend something to you, it will be because I genuinely believe it is right for you—not because it pays me more.

My goal is not to build the biggest travel company. My goal is to build a company that people remember because it stood by them when it mattered.

If, after your journey, you feel that EzyMiles made your travel easier, safer and more enjoyable, then I will consider our work successful.`,
    founderQuote: "If I recommend something to you, it will be because I genuinely believe it is right for you—not because it pays me more.",
    founderImageUrl: "",
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
      about: { ...DEFAULT_SETTINGS.about, ...s.about },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
});
