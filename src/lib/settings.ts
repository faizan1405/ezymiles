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
  maintenance: ISiteSettings["maintenance"];
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
    officeHours: "10:00 AM – 5:00 PM",
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
  maintenance: {
    enabled: false,
    message: "We're making a few improvements and will be back shortly. Thanks for your patience.",
  },
  about: {
    aboutTitle: "About Us",
    aboutText: `At eZyMiles, we believe every journey begins with trust.

Anyone can book a hotel or an airline ticket. What truly matters is knowing that someone is there to guide you before your journey, support you during your trip, and stand by you if something doesn't go as planned.

eZyMiles was created with this belief. We are an independent travel company committed to making travel planning simple, transparent and stress-free. Whether you're planning a family holiday, an international vacation, a honeymoon or a weekend escape, we help you make informed decisions instead of pushing you towards the most expensive package.

Our approach is simple—listen first, recommend honestly and serve with responsibility.

For us, every customer is not just another booking. Every traveller places their trust in us, and we believe that trust is our greatest responsibility.

We don't measure success only by the number of holidays we sell. We measure it by the number of travellers who return to us because they know they can rely on us. That's what eZyMiles stands for.`,
    aboutHighlight: "More than a travel company. A travel partner.",
    philosophyTitle: "Trust Before Transactions",
    philosophyText: `The travel industry often focuses on numbers—bookings, targets and commissions. We choose to focus on people.

When someone plans a journey, they are not just spending money. They are investing their time, emotions and dreams. That deserves honesty, transparency and genuine guidance.

At eZyMiles, we believe trust is the most valuable thing a traveller carries. We never want to attract customers with exaggerated promises or misleading itineraries. We would rather tell you the truth than tell you what you want to hear.

We believe earning a customer's trust is more valuable than earning a higher commission. Trust grows slowly, but once earned, it lasts. Like compound interest, every honest interaction strengthens the relationship and creates long-term value for both the traveller and our business.`,
    founderHeading: "A Note from the Founder",
    founderName: "Charanjit Singh",
    founderRole: "Founder, eZyMiles",
    founderStory: `Travel has never been just a hobby for me. It has been one of the most meaningful experiences of my life.

Over the years, I have travelled extensively across India and several countries around the world. Every journey taught me something new—not just about places, but about people, cultures and the importance of good planning.

Like many travellers, I have experienced situations where promises made during booking disappeared once payment was completed. Excuses replaced accountability, and support became difficult to find when it was needed the most. Those experiences inspired me to build something different.

After completing nearly four decades of public service, I decided to dedicate this phase of my life to something I genuinely enjoy—helping people travel with confidence.

eZyMiles is built on a simple promise: **If I recommend something to you, it will be because I genuinely believe it is right for you—not because it pays me more.**

My goal is not to build the biggest travel company. My goal is to build a company that people remember because it stood by them when it mattered.

If, after your journey, you feel that eZyMiles made your travel easier, safer and more enjoyable, then I will consider our work successful.`,
    founderQuote: "Travel should create memories, not complications.",
    founderQuoteSecondary: "Miles that make sense.",
    founderImageUrl: "",
    founderSignatureUrl: "",
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
      maintenance: { ...DEFAULT_SETTINGS.maintenance, ...s.maintenance },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
});
