/**
 * Demo data seed script.
 *
 * Run with `npm run seed`. Idempotent-ish: it upserts by slug/email/key so
 * running it twice won't duplicate rows, but it is intended for development
 * and staging — never run it against a production database with real
 * bookings, since it will happily insert alongside them.
 */
import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import bcrypt from "bcryptjs";

// Mirror Next.js's own precedence: .env.local overrides .env when both exist.
for (const file of [".env", ".env.local"]) {
  if (existsSync(file)) loadEnv({ path: file, override: true });
}

import mongoose from "mongoose";
import {
  Activity,
  AdminUser,
  BlogPost,
  Category,
  Coupon,
  Destination,
  FAQ,
  Hotel,
  LegalPage,
  Offer,
  Package,
  Review,
  SiteSettings,
  User,
  VisaCountry,
} from "@/models";
import { LEGAL_PAGES } from "@/config/legal";
import { activityCategorySeeds, blogSeeds, destinationSeeds, faqSeeds } from "./seed-data";

const img = (id: string, alt: string) => ({
  url: `https://images.unsplash.com/${id}?w=1600&q=80`,
  alt,
});

async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Copy .env.example to .env.local first.");

  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || "ezymiles" });
  console.log(`Connected to ${uri.replace(/\/\/.*@/, "//<redacted>@")}`);
}

async function seedAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL || "admin@ezymiles.example").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "eZyMiles@2026";

  const existing = await AdminUser.findOne({ email });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await AdminUser.create({
    name: "Super Admin",
    email,
    passwordHash,
    role: "super_admin",
    isActive: true,
  });

  console.log(`Created super admin: ${email} / ${password}`);
}

async function seedDemoTraveller() {
  const email = "traveller@ezymiles.example";
  const existing = await User.findOne({ email });
  if (existing) return;

  const passwordHash = await bcrypt.hash("eZyMiles@2026", 12);

  await User.create({
    name: "Demo Traveller",
    email,
    passwordHash,
    emailVerified: new Date(),
    phone: "9876543210",
    nationality: "Indian",
    preferredCurrency: "INR",
    marketingOptIn: true,
    whatsappOptIn: true,
  });

  console.log(`Created demo traveller: ${email} / Traveller@2026`);
}

async function seedSiteSettings() {
  const existing = await SiteSettings.findOne({ key: "default" });
  if (existing) {
    console.log("Site settings already exist.");
    return;
  }

  await SiteSettings.create({
    key: "default",
    announcement: {
      enabled: true,
      intervalMs: 5000,
      items: [
        { text: "Summer escapes are open — book by 31 August for early-bird pricing", emphasis: "Early bird" },
        { text: "Free 30-minute consultation with a destination specialist", emphasis: "Free" },
        { text: "Flight-inclusive packages with a 25% deposit to hold your dates", emphasis: "Flexible" },
      ],
    },
    homepage: {
      heroHeadline: "Travel With Confidence",
      heroSubheadline:
        "From your first enquiry to your journey back home, eZyMiles provides honest guidance, transparent recommendations and dependable travel support.",
      heroMediaKind: "slideshow",
      heroSlides: [],
      sections: {},
      trustPoints: [
        {
          icon: "shield-check",
          title: "Honest recommendations",
          description: "We suggest destinations and accommodations that genuinely fit your preferences, and will openly tell you if a popular option isn't worth your investment."
        },
        {
          icon: "receipt",
          title: "Transparent pricing",
          description: "Line-by-line pricing with zero hidden charges, convenience fees, or unexpected markups at checkout. What you see is what you pay."
        },
        {
          icon: "pen-line",
          title: "Personal travel guidance",
          description: "No script or call center template. Your journey is custom-designed around your pace, preferences, and actual travel goals."
        },
        {
          icon: "headset",
          title: "Support before, during and after the trip",
          description: "A dedicated human partner is just a message or call away throughout your journey — ensuring absolute peace of mind."
        },
        {
          icon: "calendar-clock",
          title: "Experienced and responsible service",
          description: "Crafted on a foundation of professional accountability and decades of travel wisdom to deliver a dependable experience."
        },
        {
          icon: "bed-double",
          title: "Long-term customer relationships",
          description: "We measure our success by the trust we earn, aiming to be your lifetime travel partner rather than chasing single transactions."
        }
      ],
      liveActivityEnabled: true,
    },
    about: {
      aboutTitle: "About eZyMiles",
      aboutText: "eZyMiles is an independent travel company focused on making family holidays, international vacations, honeymoons and weekend trips simple, transparent and stress-free.",
      aboutHighlight: "Listen first. Recommend honestly. Serve responsibly.",
      philosophyTitle: "Trust Before Transactions",
      philosophyText: "Customers invest their money, time, emotions and dreams when planning a journey. eZyMiles values honest guidance and customer trust more than higher commissions.",
      founderName: "Charanjit Singh",
      founderRole: "Founder, eZyMiles",
      founderStory: `Travel has never been just a hobby for me. It has been one of the most meaningful experiences of my life.

Over the years, I have travelled extensively across India and several countries around the world. Every journey taught me something new—not just about places, but about people, cultures and the importance of good planning.

Like many travellers, I have experienced situations where promises made during booking disappeared once payment was completed. Excuses replaced accountability, and support became difficult to find when it was needed the most. Those experiences inspired me to build something different.

After completing nearly four decades of public service, I decided to dedicate this phase of my life to something I genuinely enjoy—helping people travel with confidence.

eZyMiles is built on a simple promise: If I recommend something to you, it will be because I genuinely believe it is right for you—not because it pays me more.

My goal is not to build the biggest travel company. My goal is to build a company that people remember because it stood by them when it mattered.

If, after your journey, you feel that eZyMiles made your travel easier, safer and more enjoyable, then I will consider our work successful.`,
      founderQuote: "If I recommend something to you, it will be because I genuinely believe it is right for you—not because it pays me more.",
      founderImageUrl: "",
    },
  });

  console.log("Created default site settings.");
}

async function seedLegalPages() {
  for (const page of LEGAL_PAGES) {
    const existing = await LegalPage.findOne({ slug: page.slug });
    if (existing) continue;

    const body = page.sections
      .map((s) => `## ${s.heading}\n\n${s.body.join("\n\n")}`)
      .join("\n\n");

    await LegalPage.create({
      slug: page.slug,
      title: page.title,
      body,
      isPlaceholder: true,
    });
  }
  console.log(`Seeded ${LEGAL_PAGES.length} legal page placeholders.`);
}

async function seedFAQs() {
  for (const faq of faqSeeds) {
    await FAQ.updateOne(
      { question: faq.question },
      { $setOnInsert: { ...faq, isActive: true } },
      { upsert: true },
    );
  }
  console.log(`Seeded ${faqSeeds.length} FAQs.`);
}

async function seedActivityCategories() {
  for (const cat of activityCategorySeeds) {
    await Category.updateOne(
      { kind: cat.kind, slug: cat.slug },
      { $setOnInsert: cat },
      { upsert: true },
    );
  }
  console.log(`Seeded ${activityCategorySeeds.length} activity categories.`);
}

async function seedDestinations() {
  const idBySlug = new Map<string, mongoose.Types.ObjectId>();

  for (const dest of destinationSeeds) {
    const doc = await Destination.findOneAndUpdate(
      { slug: dest.slug },
      { $setOnInsert: { ...dest, isDemoData: true } },
      { upsert: true, returnDocument: "after" },
    );
    idBySlug.set(dest.slug, doc._id);
  }

  console.log(`Seeded ${destinationSeeds.length} destinations.`);
  return idBySlug;
}

function inDays(n: number) {
  return new Date(Date.now() + n * 86_400_000);
}

async function seedPackages(destIds: Map<string, mongoose.Types.ObjectId>) {
  const packages = [
    {
      title: "Bali Honeymoon — Ubud & Uluwatu",
      slug: "bali-honeymoon-ubud-uluwatu",
      subtitle: "Rice-field villas, a private sunset dinner, and Nusa Penida for a day.",
      destinationSlug: "bali",
      citiesCovered: ["Ubud", "Uluwatu", "Nusa Penida"],
      scope: "international" as const,
      tripTypes: ["honeymoon", "beach"],
      collections: ["honeymoon-escapes", "trending-international"],
      durationDays: 6,
      durationNights: 5,
      heroImage: img("photo-1537996194471-e657df975ab4", "A private villa pool overlooking rice terraces"),
      gallery: [
        img("photo-1552733407-5d5c46c3bb3b", "A Balinese temple at dusk"),
        img("photo-1573790387438-4da905039392", "Rice terraces after rain"),
      ],
      overview:
        "Five nights split between a rice-field villa in Ubud and a clifftop stay in Uluwatu, with a full day on Nusa Penida in between. Built for two people who want privacy more than a packed schedule — most days have one planned activity and a lot of open time.",
      highlights: [
        "Private pool villa with daily breakfast in Ubud",
        "Sunset dinner on the Uluwatu clifftops",
        "A full day exploring Nusa Penida's cliffs and beaches",
        "One spa treatment included at each property",
      ],
      itinerary: [
        {
          day: 1,
          city: "Ubud",
          title: "Arrive and do nothing at all",
          description:
            "Private transfer from Denpasar airport to your rice-field villa. The rest of the day is intentionally unplanned.",
          meals: ["breakfast"] as const,
          hotel: "Ubud rice-field pool villa",
          transfers: "Private airport transfer",
          activities: [],
          optionalExperiences: ["Balinese massage on arrival"],
        },
        {
          day: 2,
          city: "Ubud",
          title: "Temples, markets, and the terraces before the tour buses",
          description:
            "An early start to Tegalalang rice terraces before 8am, then the Ubud morning market, and a visit to a working temple.",
          meals: ["breakfast"] as const,
          hotel: "Ubud rice-field pool villa",
          transfers: "Private car with driver, full day",
          activities: ["Tegalalang rice terraces", "Ubud morning market", "Temple visit"],
          optionalExperiences: ["Balinese cooking class"],
        },
        {
          day: 3,
          city: "Nusa Penida",
          title: "A full day on Nusa Penida",
          description:
            "Fast boat to Nusa Penida for Kelingking Beach, Angel's Billabong and Broken Beach — the island's three most photographed spots, without the group-tour pace.",
          meals: ["breakfast", "lunch"] as const,
          hotel: "Ubud rice-field pool villa",
          transfers: "Fast boat + private van on the island",
          activities: ["Kelingking Beach viewpoint", "Angel's Billabong", "Broken Beach"],
          optionalExperiences: ["Manta ray snorkelling"],
        },
        {
          day: 4,
          city: "Uluwatu",
          title: "Move to the clifftops",
          description: "Transfer to Uluwatu. Afternoon free by the cliffside pool.",
          meals: ["breakfast"] as const,
          hotel: "Uluwatu clifftop resort",
          transfers: "Private transfer, Ubud to Uluwatu",
          activities: [],
          optionalExperiences: ["Surf lesson at Padang Padang"],
        },
        {
          day: 5,
          city: "Uluwatu",
          title: "Sunset dinner on the cliff edge",
          description:
            "A free morning, then Uluwatu Temple at sunset followed by a Kecak fire dance and a private dinner table on the clifftop.",
          meals: ["breakfast", "dinner"] as const,
          hotel: "Uluwatu clifftop resort",
          transfers: "Private car for the temple visit",
          activities: ["Uluwatu Temple", "Kecak fire dance", "Private clifftop dinner"],
          optionalExperiences: [],
        },
        {
          day: 6,
          city: "Uluwatu",
          title: "Departure",
          description: "Late checkout where possible, then private transfer to the airport.",
          meals: ["breakfast"] as const,
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
          pricePerAdultINR: 68000,
          pricePerChildINR: 45000,
          singleSupplementINR: 22000,
          originalPricePerAdultINR: 79000,
          isDefault: true,
        },
        {
          key: "premium",
          label: "Premium — 5★ private pool villas",
          hotelCategory: 5,
          durationDays: 6,
          durationNights: 5,
          pricePerAdultINR: 98000,
          pricePerChildINR: 62000,
          singleSupplementINR: 32000,
          isDefault: false,
        },
      ],
      departures: [],
      departureCities: ["Delhi", "Mumbai", "Bengaluru"],
      flightsIncluded: false,
      mealsIncluded: true,
      activitiesIncluded: true,
      visaIncluded: false,
      transfersIncluded: true,
      hotelCategory: 4,
      tripStyle: "private" as const,
      instantConfirmation: true,
      recommendedSeason: ["Spring", "Summer", "Autumn"],
      inclusions: [
        "5 nights accommodation as per itinerary",
        "Daily breakfast",
        "All airport and inter-city transfers by private car",
        "Nusa Penida fast boat and island transport",
        "One spa treatment per property",
        "English-speaking driver-guide",
      ],
      exclusions: [
        "International and domestic flights",
        "Indonesia visa on arrival fee",
        "Lunches and dinners except where specified",
        "Personal expenses and tips",
        "Travel insurance",
      ],
      importantInfo: [
        "Rice-field villas involve some uneven terrain — mention any mobility concerns when booking.",
        "Nusa Penida's boat crossing can be cancelled in rough weather; we build in a buffer where possible.",
      ],
      visaDetails:
        "Visa on arrival for Indian passport holders, valid 30 days, extendable once for a further 30 days.",
      cancellationPolicy: [
        { window: "More than 45 days before travel", charge: "10% of package cost" },
        { window: "30–45 days before travel", charge: "30% of package cost" },
        { window: "15–29 days before travel", charge: "60% of package cost" },
        { window: "Less than 15 days before travel", charge: "100% of package cost" },
      ],
      paymentPolicy: [
        "25% deposit to confirm your booking.",
        "Balance due 21 days before travel.",
      ],
      termsAndConditions: [
        "Rates are per person on twin-sharing basis unless a single supplement is selected.",
        "Itinerary sequence may vary slightly based on local conditions.",
      ],
      faqs: [
        {
          question: "Can we add extra nights in Bali?",
          answer: "Yes — tell us when you enquire and we'll requote with your preferred length.",
        },
      ],
      isFeatured: true,
      isTrending: true,
      isBestseller: true,
      status: "published" as const,
      isDemoData: true,
    },
    {
      title: "Kyoto in Five Days",
      slug: "kyoto-in-five-days",
      subtitle: "Temples at dawn, a tea ceremony, and a day trip to Nara.",
      destinationSlug: "kyoto",
      citiesCovered: ["Kyoto", "Nara"],
      scope: "international" as const,
      tripTypes: ["luxury", "solo"],
      collections: ["trending-international"],
      durationDays: 5,
      durationNights: 4,
      heroImage: img("photo-1493976040374-85c8e12f0c0e", "Fushimi Inari torii gates"),
      gallery: [img("photo-1478436127897-769e1b3f0f36", "A quiet Kyoto street")],
      overview:
        "Five days built around Kyoto's early mornings — Fushimi Inari before the crowds, a private tea ceremony, and a day trip to Nara's deer park, with time left over for Gion and the Arashiyama bamboo grove.",
      highlights: [
        "Fushimi Inari at sunrise",
        "A private tea ceremony in a machiya house",
        "Full day trip to Nara",
        "Arashiyama bamboo grove before 9am",
      ],
      itinerary: [
        {
          day: 1,
          city: "Kyoto",
          title: "Arrival",
          description: "Private transfer from Kansai Airport. Evening free to explore Gion.",
          meals: ["breakfast"] as const,
          hotel: "Central Kyoto hotel",
          transfers: "Private airport transfer",
          activities: [],
          optionalExperiences: [],
        },
        {
          day: 2,
          city: "Kyoto",
          title: "Fushimi Inari at sunrise",
          description: "An early start to Fushimi Inari before the tour groups, then a free afternoon.",
          meals: ["breakfast"] as const,
          hotel: "Central Kyoto hotel",
          transfers: "Local trains, guided",
          activities: ["Fushimi Inari Shrine"],
          optionalExperiences: ["Private tea ceremony"],
        },
        {
          day: 3,
          city: "Nara",
          title: "Day trip to Nara",
          description: "A full day in Nara's deer park and Todai-ji temple.",
          meals: ["breakfast"] as const,
          hotel: "Central Kyoto hotel",
          transfers: "Train, guided",
          activities: ["Nara deer park", "Todai-ji Temple"],
          optionalExperiences: [],
        },
        {
          day: 4,
          city: "Kyoto",
          title: "Arashiyama and the bamboo grove",
          description: "Bamboo grove at first light, then the Arashiyama district and riverside.",
          meals: ["breakfast"] as const,
          hotel: "Central Kyoto hotel",
          transfers: "Local trains",
          activities: ["Arashiyama Bamboo Grove"],
          optionalExperiences: [],
        },
        {
          day: 5,
          city: "Kyoto",
          title: "Departure",
          description: "Free morning, then private transfer to the airport.",
          meals: ["breakfast"] as const,
          transfers: "Private airport transfer",
          activities: [],
          optionalExperiences: [],
        },
      ],
      variants: [
        {
          key: "standard",
          label: "Standard — 4★ hotel",
          hotelCategory: 4,
          durationDays: 5,
          durationNights: 4,
          pricePerAdultINR: 145000,
          pricePerChildINR: 98000,
          singleSupplementINR: 38000,
          isDefault: true,
        },
      ],
      departures: [],
      departureCities: ["Delhi", "Mumbai"],
      flightsIncluded: false,
      mealsIncluded: true,
      activitiesIncluded: true,
      visaIncluded: false,
      transfersIncluded: true,
      hotelCategory: 4,
      tripStyle: "private" as const,
      instantConfirmation: false,
      recommendedSeason: ["Spring", "Autumn"],
      inclusions: [
        "4 nights accommodation",
        "Daily breakfast",
        "Airport transfers",
        "Guided day trip to Nara",
        "English-speaking guide for key excursions",
      ],
      exclusions: [
        "International flights",
        "Japan visa fee",
        "Lunches and dinners except where specified",
        "JR rail pass (available on request)",
      ],
      importantInfo: ["Cherry blossom season books out 4-6 months ahead."],
      visaDetails: "Visa required in advance for Indian passport holders; typical processing 5-7 working days.",
      cancellationPolicy: [
        { window: "More than 45 days before travel", charge: "15% of package cost" },
        { window: "15–45 days before travel", charge: "50% of package cost" },
        { window: "Less than 15 days before travel", charge: "100% of package cost" },
      ],
      paymentPolicy: ["30% deposit to confirm.", "Balance due 30 days before travel."],
      termsAndConditions: ["Rates are per person on twin-sharing basis."],
      faqs: [],
      isFeatured: true,
      isTrending: false,
      isBestseller: false,
      status: "published" as const,
      isDemoData: true,
    },
    {
      title: "Santorini Escape",
      slug: "santorini-escape",
      subtitle: "Caldera suites, a catamaran day, and dinner in Pyrgos.",
      destinationSlug: "santorini",
      citiesCovered: ["Oia", "Fira", "Pyrgos"],
      scope: "international" as const,
      tripTypes: ["honeymoon", "luxury"],
      collections: ["honeymoon-escapes", "luxury-getaways"],
      durationDays: 5,
      durationNights: 4,
      heroImage: img("photo-1570077188670-e3a8d69ac5ff", "White buildings over the caldera"),
      gallery: [img("photo-1533105079780-92b9be482077", "Blue-domed churches at sunset")],
      overview:
        "Four nights in a caldera-facing suite, a full-day catamaran sail around the volcanic caldera, and a sunset dinner in the quieter village of Pyrgos instead of the Oia crowds.",
      highlights: [
        "Caldera-view suite with a private plunge pool",
        "Full-day catamaran cruise with lunch on board",
        "Sunset dinner in Pyrgos, away from the crowds",
        "A volcanic-soil wine tasting",
      ],
      itinerary: [
        {
          day: 1,
          city: "Oia",
          title: "Arrival",
          description: "Private transfer to your caldera-view suite. Evening at leisure.",
          meals: ["breakfast"] as const,
          hotel: "Caldera-view suite",
          transfers: "Private airport transfer",
          activities: [],
          optionalExperiences: [],
        },
        {
          day: 2,
          city: "Fira",
          title: "Catamaran day",
          description: "A full-day catamaran cruise around the caldera with lunch and swimming stops.",
          meals: ["breakfast", "lunch"] as const,
          hotel: "Caldera-view suite",
          transfers: "Included in the cruise",
          activities: ["Catamaran caldera cruise"],
          optionalExperiences: [],
        },
        {
          day: 3,
          city: "Pyrgos",
          title: "Wine and a quieter sunset",
          description: "A volcanic-soil wine tasting in the afternoon, then dinner in Pyrgos at sunset.",
          meals: ["breakfast", "dinner"] as const,
          hotel: "Caldera-view suite",
          transfers: "Private car",
          activities: ["Wine tasting", "Pyrgos sunset dinner"],
          optionalExperiences: [],
        },
        {
          day: 4,
          city: "Oia",
          title: "Free day",
          description: "A day with nothing planned — the point of this trip.",
          meals: ["breakfast"] as const,
          hotel: "Caldera-view suite",
          activities: [],
          optionalExperiences: ["Couples spa treatment"],
        },
        {
          day: 5,
          city: "Oia",
          title: "Departure",
          description: "Private transfer to the airport.",
          meals: ["breakfast"] as const,
          transfers: "Private airport transfer",
          activities: [],
          optionalExperiences: [],
        },
      ],
      variants: [
        {
          key: "standard",
          label: "Caldera-view suite",
          hotelCategory: 5,
          durationDays: 5,
          durationNights: 4,
          pricePerAdultINR: 165000,
          pricePerChildINR: 0,
          singleSupplementINR: 55000,
          originalPricePerAdultINR: 185000,
          isDefault: true,
        },
      ],
      departures: [],
      departureCities: ["Delhi", "Mumbai"],
      flightsIncluded: false,
      mealsIncluded: true,
      activitiesIncluded: true,
      visaIncluded: false,
      transfersIncluded: true,
      hotelCategory: 5,
      tripStyle: "private" as const,
      instantConfirmation: false,
      recommendedSeason: ["Spring", "Summer", "Autumn"],
      inclusions: [
        "4 nights in a caldera-view suite",
        "Daily breakfast",
        "Full-day catamaran cruise with lunch",
        "Wine tasting experience",
        "Airport transfers",
      ],
      exclusions: ["International flights", "Schengen visa fee", "Lunches/dinners except where specified"],
      importantInfo: ["Suites here typically require a minimum 3-night stay in peak season."],
      visaDetails: "Schengen visa required; apply at least 15 working days before travel.",
      cancellationPolicy: [
        { window: "More than 60 days before travel", charge: "20% of package cost" },
        { window: "30–60 days before travel", charge: "50% of package cost" },
        { window: "Less than 30 days before travel", charge: "100% of package cost" },
      ],
      paymentPolicy: ["30% deposit to confirm.", "Balance due 45 days before travel."],
      termsAndConditions: ["Rates are per person on twin-sharing basis."],
      faqs: [],
      isFeatured: true,
      isTrending: true,
      isBestseller: false,
      status: "published" as const,
      isDemoData: true,
    },
    {
      title: "Kerala Backwaters Weekend",
      slug: "kerala-backwaters-weekend",
      subtitle: "A houseboat night and a hill-station morning.",
      destinationSlug: "kerala-backwaters",
      citiesCovered: ["Alleppey", "Kumarakom"],
      scope: "domestic" as const,
      tripTypes: ["weekend", "family", "honeymoon"],
      collections: ["weekend-breaks", "best-of-india"],
      durationDays: 4,
      durationNights: 3,
      heroImage: img("photo-1602216056096-3b40cc0c9944", "A traditional houseboat on the backwaters"),
      gallery: [img("photo-1602308102967-be24da0a412e", "Palm-lined backwater canal")],
      overview:
        "A short, restorative break: one night on a private houseboat through Alleppey's backwaters, and two nights at a lakeside resort in Kumarakom with birdwatching and Ayurvedic treatments on offer.",
      highlights: [
        "A full night aboard a private houseboat",
        "Fresh Keralan meals cooked on board",
        "Kumarakom bird sanctuary at dawn",
        "An optional Ayurvedic massage",
      ],
      itinerary: [
        {
          day: 1,
          city: "Alleppey",
          title: "Board the houseboat",
          description: "Board your private houseboat by early afternoon and cruise the backwaters until sunset.",
          meals: ["lunch", "dinner"] as const,
          hotel: "Private houseboat",
          transfers: "Private transfer from Kochi",
          activities: ["Backwater cruise"],
          optionalExperiences: [],
        },
        {
          day: 2,
          city: "Kumarakom",
          title: "Disembark and settle into the lake resort",
          description: "Morning cruise continues, disembark by noon, transfer to a lakeside resort in Kumarakom.",
          meals: ["breakfast", "lunch"] as const,
          hotel: "Kumarakom lake resort",
          transfers: "Private car",
          activities: [],
          optionalExperiences: ["Ayurvedic massage"],
        },
        {
          day: 3,
          city: "Kumarakom",
          title: "Bird sanctuary at dawn",
          description: "An early visit to Kumarakom Bird Sanctuary, free afternoon by the lake.",
          meals: ["breakfast"] as const,
          hotel: "Kumarakom lake resort",
          activities: ["Kumarakom Bird Sanctuary"],
          optionalExperiences: [],
        },
        {
          day: 4,
          city: "Kumarakom",
          title: "Departure",
          description: "Transfer back to Kochi for onward travel.",
          meals: ["breakfast"] as const,
          transfers: "Private transfer to Kochi",
          activities: [],
          optionalExperiences: [],
        },
      ],
      variants: [
        {
          key: "standard",
          label: "Standard",
          hotelCategory: 4,
          durationDays: 4,
          durationNights: 3,
          pricePerAdultINR: 24000,
          pricePerChildINR: 16000,
          singleSupplementINR: 8000,
          isDefault: true,
        },
      ],
      departures: [],
      departureCities: ["Kochi", "Bengaluru"],
      flightsIncluded: false,
      mealsIncluded: true,
      activitiesIncluded: true,
      visaIncluded: false,
      transfersIncluded: true,
      hotelCategory: 4,
      tripStyle: "private" as const,
      instantConfirmation: true,
      recommendedSeason: ["Autumn", "Winter"],
      inclusions: [
        "1 night houseboat + 2 nights lake resort",
        "All meals on the houseboat",
        "Daily breakfast at the resort",
        "All transfers",
      ],
      exclusions: ["Flights to Kochi", "Alcohol", "Ayurvedic treatments (optional add-on)"],
      importantInfo: [],
      visaDetails: "",
      cancellationPolicy: [
        { window: "More than 15 days before travel", charge: "10% of package cost" },
        { window: "Less than 15 days before travel", charge: "50% of package cost" },
      ],
      paymentPolicy: ["Full payment or 25% deposit."],
      termsAndConditions: ["Houseboat cabin allocation is per boat, not per person."],
      faqs: [],
      isFeatured: true,
      isTrending: true,
      isBestseller: true,
      status: "published" as const,
      isDemoData: true,
    },
    {
      title: "Ladakh Overland",
      slug: "ladakh-overland",
      subtitle: "Pangong, Nubra, and two full days to acclimatise properly.",
      destinationSlug: "ladakh",
      citiesCovered: ["Leh", "Nubra Valley", "Pangong Lake"],
      scope: "domestic" as const,
      tripTypes: ["adventure", "solo", "group"],
      collections: ["adventure-tours", "group-departures"],
      durationDays: 7,
      durationNights: 6,
      heroImage: img("photo-1626621341517-bbf3d9990a23", "Pangong Lake with mountains"),
      gallery: [img("photo-1589553416260-f586c8f1514f", "A monastery on a Ladakh hillside")],
      overview:
        "A seven-day overland route through Ladakh with two dedicated acclimatisation days in Leh before crossing Khardung La to Nubra Valley and on to Pangong Lake. Built for altitude safety first, sightseeing second.",
      highlights: [
        "Two full acclimatisation days before altitude gain",
        "Khardung La and the Nubra Valley sand dunes",
        "Sunrise at Pangong Lake",
        "A monastery stay at Thiksey",
      ],
      itinerary: [
        {
          day: 1,
          city: "Leh",
          title: "Arrival and complete rest",
          description: "Fly into Leh. No activity today — altitude acclimatisation starts immediately.",
          meals: ["breakfast"] as const,
          hotel: "Leh hotel",
          transfers: "Private airport transfer",
          activities: [],
          optionalExperiences: [],
        },
        {
          day: 2,
          city: "Leh",
          title: "Second acclimatisation day",
          description: "A gentle walk around Leh market. Still no high-altitude activity.",
          meals: ["breakfast"] as const,
          hotel: "Leh hotel",
          activities: ["Leh market walk"],
          optionalExperiences: [],
        },
        {
          day: 3,
          city: "Nubra Valley",
          title: "Over Khardung La to Nubra",
          description: "Cross Khardung La to Nubra Valley, visit the sand dunes at Hunder.",
          meals: ["breakfast", "dinner"] as const,
          hotel: "Nubra Valley camp",
          transfers: "Private 4x4",
          activities: ["Khardung La", "Hunder sand dunes"],
          optionalExperiences: ["Double-humped camel ride"],
        },
        {
          day: 4,
          city: "Pangong Lake",
          title: "On to Pangong",
          description: "Drive to Pangong Lake via Shyok route, arriving in time for sunset.",
          meals: ["breakfast", "dinner"] as const,
          hotel: "Pangong lakeside camp",
          transfers: "Private 4x4",
          activities: ["Pangong Lake"],
          optionalExperiences: [],
        },
        {
          day: 5,
          city: "Pangong Lake",
          title: "Sunrise at Pangong",
          description: "An early sunrise at the lake, then the drive back towards Leh.",
          meals: ["breakfast", "dinner"] as const,
          hotel: "Leh hotel",
          transfers: "Private 4x4",
          activities: [],
          optionalExperiences: [],
        },
        {
          day: 6,
          city: "Leh",
          title: "Thiksey Monastery",
          description: "A relaxed day visiting Thiksey and Shey monasteries.",
          meals: ["breakfast"] as const,
          hotel: "Leh hotel",
          activities: ["Thiksey Monastery", "Shey Palace"],
          optionalExperiences: [],
        },
        {
          day: 7,
          city: "Leh",
          title: "Departure",
          description: "Private transfer to Leh airport.",
          meals: ["breakfast"] as const,
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
          durationDays: 7,
          durationNights: 6,
          pricePerAdultINR: 42000,
          pricePerChildINR: 30000,
          singleSupplementINR: 12000,
          isDefault: true,
        },
      ],
      departures: [
        {
          date: inDays(45),
          departureCity: "Delhi",
          seatsTotal: 16,
          seatsBooked: 6,
          priceAdjustmentINR: 0,
          isFixedDeparture: true,
          isGuaranteed: true,
        },
        {
          date: inDays(75),
          departureCity: "Delhi",
          seatsTotal: 16,
          seatsBooked: 2,
          priceAdjustmentINR: 0,
          isFixedDeparture: true,
          isGuaranteed: false,
        },
      ],
      departureCities: ["Delhi"],
      flightsIncluded: false,
      mealsIncluded: true,
      activitiesIncluded: true,
      visaIncluded: false,
      transfersIncluded: true,
      hotelCategory: 3,
      tripStyle: "group" as const,
      instantConfirmation: false,
      recommendedSeason: ["Summer"],
      inclusions: [
        "6 nights accommodation as per itinerary",
        "Daily breakfast, dinners on overland days",
        "All transfers in a private 4x4",
        "Inner line permits for restricted areas",
      ],
      exclusions: ["Flights to/from Leh", "Lunches", "Oxygen cylinder (available on request)"],
      importantInfo: [
        "Acclimatisation days are not optional — altitude sickness risk is real above 3,500m.",
        "Roads to Pangong and Nubra can close without notice due to weather.",
      ],
      visaDetails: "",
      cancellationPolicy: [
        { window: "More than 30 days before travel", charge: "15% of package cost" },
        { window: "Less than 30 days before travel", charge: "50% of package cost" },
      ],
      paymentPolicy: ["30% deposit to confirm.", "Balance due 21 days before travel."],
      termsAndConditions: ["Group departures require a minimum of 6 travellers to guarantee."],
      faqs: [
        {
          question: "Is this trip physically demanding?",
          answer:
            "Mostly it's a road trip with short walks, not a trek. The demand is altitude, not fitness — which is why we build in two full rest days.",
        },
      ],
      isFeatured: false,
      isTrending: true,
      isBestseller: false,
      status: "published" as const,
      isDemoData: true,
    },
    {
      title: "Dubai Long Weekend",
      slug: "dubai-long-weekend",
      subtitle: "Desert camp, old souks, and the view from the top.",
      destinationSlug: "dubai",
      citiesCovered: ["Dubai"],
      scope: "international" as const,
      tripTypes: ["family", "weekend", "luxury"],
      collections: ["weekend-breaks", "flight-inclusive"],
      durationDays: 4,
      durationNights: 3,
      heroImage: img("photo-1512453979798-5ea266f8880c", "Dubai skyline at dusk"),
      gallery: [img("photo-1518684079-3c830dcef090", "A desert dune at sunset")],
      overview:
        "A flight-inclusive four-day Dubai break: an overnight desert camp (not a two-hour safari), the old creek souks by traditional abra boat, and sunset at the top of the Burj Khalifa.",
      highlights: [
        "Overnight desert camp with dinner under the stars",
        "Old creek souks by abra boat",
        "At the Top, Burj Khalifa, at sunset",
        "Flights included both ways",
      ],
      itinerary: [
        {
          day: 1,
          city: "Dubai",
          title: "Arrival",
          description: "Flight and private transfer to your hotel. Evening free.",
          meals: ["breakfast"] as const,
          hotel: "4★ Dubai hotel",
          transfers: "Private airport transfer",
          activities: [],
          optionalExperiences: [],
        },
        {
          day: 2,
          city: "Dubai",
          title: "Old Dubai by abra",
          description: "A morning in the old creek souks, crossing by traditional abra boat.",
          meals: ["breakfast"] as const,
          hotel: "4★ Dubai hotel",
          activities: ["Gold and spice souks", "Abra boat crossing"],
          optionalExperiences: [],
        },
        {
          day: 3,
          city: "Dubai",
          title: "Desert camp overnight",
          description: "Afternoon dune drive, overnight at a desert camp with dinner and entertainment.",
          meals: ["breakfast", "dinner"] as const,
          hotel: "Desert camp",
          transfers: "4x4 dune transfer",
          activities: ["Dune drive", "Desert camp overnight"],
          optionalExperiences: [],
        },
        {
          day: 4,
          city: "Dubai",
          title: "Burj Khalifa and departure",
          description: "Return to the city, visit At the Top before your evening flight home.",
          meals: ["breakfast"] as const,
          transfers: "Private airport transfer",
          activities: ["Burj Khalifa — At the Top"],
          optionalExperiences: [],
        },
      ],
      variants: [
        {
          key: "standard",
          label: "Standard — flights included",
          hotelCategory: 4,
          durationDays: 4,
          durationNights: 3,
          pricePerAdultINR: 55000,
          pricePerChildINR: 38000,
          singleSupplementINR: 15000,
          originalPricePerAdultINR: 64000,
          isDefault: true,
        },
      ],
      departures: [],
      departureCities: ["Delhi", "Mumbai", "Bengaluru", "Hyderabad"],
      flightsIncluded: true,
      mealsIncluded: true,
      activitiesIncluded: true,
      visaIncluded: true,
      transfersIncluded: true,
      hotelCategory: 4,
      tripStyle: "private" as const,
      instantConfirmation: true,
      recommendedSeason: ["Winter"],
      inclusions: [
        "Return economy flights",
        "3 nights accommodation",
        "Visa processing",
        "Desert camp overnight with dinner",
        "Burj Khalifa At the Top entry",
        "All transfers",
      ],
      exclusions: ["Lunches", "Personal expenses", "Optional activities"],
      importantInfo: [],
      visaDetails: "UAE visa included and processed on your behalf; approval rests with UAE immigration.",
      cancellationPolicy: [
        { window: "More than 21 days before travel", charge: "20% of package cost" },
        { window: "Less than 21 days before travel", charge: "75% of package cost" },
      ],
      paymentPolicy: ["Full payment required due to flight ticketing."],
      termsAndConditions: ["Flight-inclusive packages are non-refundable on the flight portion once ticketed."],
      faqs: [],
      isFeatured: true,
      isTrending: false,
      isBestseller: true,
      status: "published" as const,
      isDemoData: true,
    },
  ];

  let count = 0;

  for (const pkg of packages) {
    const destinationId = destIds.get(pkg.destinationSlug);
    if (!destinationId) continue;

    const { destinationSlug: _destinationSlug, ...rest } = pkg;
    // Not every package literal below declares a discount, so TS infers a
    // narrower per-literal variant shape than the schema actually allows —
    // widen it back here rather than repeating the field on every variant.
    const variants = rest.variants as unknown as {
      pricePerAdultINR: number;
      isDefault: boolean;
      originalPricePerAdultINR?: number;
    }[];
    const startingPriceINR = Math.min(...variants.map((v) => v.pricePerAdultINR));
    const originalPriceINR = variants.find((v) => v.isDefault)?.originalPricePerAdultINR;

    await Package.findOneAndUpdate(
      { slug: rest.slug },
      {
        $setOnInsert: {
          ...rest,
          destination: destinationId,
          startingPriceINR,
          originalPriceINR,
          taxPercent: 5,
          ratingAverage: 4.6 + Math.random() * 0.3,
          ratingCount: 12 + Math.floor(Math.random() * 40),
        },
      },
      { upsert: true, returnDocument: "after" },
    );
    count++;
  }

  console.log(`Seeded ${count} packages.`);
}

async function seedHotels(destIds: Map<string, mongoose.Types.ObjectId>) {
  const hotels = [
    {
      name: "Sawah Terrace Villas",
      slug: "sawah-terrace-villas",
      destinationSlug: "bali",
      city: "Ubud",
      country: "Indonesia",
      address: "Jl. Raya Sayan, Ubud, Bali",
      starCategory: 5 as const,
      propertyType: "villa" as const,
      summary: "Private pool villas overlooking the Sayan rice terraces.",
      description:
        "A boutique villa property set into the terraces above the Ayung river, a ten-minute walk from central Ubud. Each villa has a private plunge pool and an open-air living pavilion.",
      heroImage: img("photo-1537996194471-e657df975ab4", "A villa pool over rice terraces"),
      gallery: [img("photo-1520250497591-112f2f40a3f4", "A private villa bedroom")],
      amenities: ["wifi", "pool", "restaurant", "spa", "airport-transfer"],
      coordinates: { lat: -8.5069, lng: 115.2624 },
      rooms: [
        {
          key: "one-bed-villa",
          name: "One-Bedroom Pool Villa",
          description: "A private villa with its own plunge pool and rice-field view.",
          images: [img("photo-1520250497591-112f2f40a3f4", "A one-bedroom villa")],
          maxAdults: 2,
          maxChildren: 1,
          maxOccupancy: 3,
          bedType: "King",
          sizeSqft: 650,
          amenities: ["Private pool", "Air conditioning", "Minibar"],
          mealPlan: "breakfast" as const,
          pricePerNightINR: 9500,
          taxPercent: 12,
          refundable: true,
          cancellationRule: "Free cancellation up to 72 hours before check-in.",
          roomsAvailable: 6,
        },
        {
          key: "two-bed-villa",
          name: "Two-Bedroom Family Villa",
          description: "Two bedrooms sharing a larger private pool, suited to families.",
          images: [img("photo-1571003123894-1f0594d2b5d9", "A two-bedroom family villa")],
          maxAdults: 4,
          maxChildren: 2,
          maxOccupancy: 6,
          bedType: "King + Twin",
          sizeSqft: 1100,
          amenities: ["Private pool", "Air conditioning", "Kitchenette"],
          mealPlan: "breakfast" as const,
          pricePerNightINR: 15500,
          taxPercent: 12,
          refundable: true,
          cancellationRule: "Free cancellation up to 72 hours before check-in.",
          roomsAvailable: 3,
        },
      ],
      checkInTime: "14:00",
      checkOutTime: "12:00",
      policies: ["No smoking in villas", "Children of all ages welcome", "Pets not allowed"],
      isFeatured: true,
      status: "published" as const,
      isDemoData: true,
    },
    {
      name: "Caldera Edge Suites",
      slug: "caldera-edge-suites",
      destinationSlug: "santorini",
      city: "Oia",
      country: "Greece",
      address: "Oia, Santorini",
      starCategory: 5 as const,
      propertyType: "boutique" as const,
      summary: "Cave-style suites cut into the caldera cliff, all facing the sunset.",
      description:
        "A small property of eight suites carved into the caldera cliffside, each with a private terrace and, in most rooms, a plunge pool.",
      heroImage: img("photo-1570077188670-e3a8d69ac5ff", "White buildings over the caldera"),
      gallery: [img("photo-1533105079780-92b9be482077", "A caldera-view terrace at sunset")],
      amenities: ["wifi", "pool", "restaurant", "spa"],
      coordinates: { lat: 36.4614, lng: 25.3753 },
      rooms: [
        {
          key: "caldera-suite",
          name: "Caldera View Suite",
          description: "A cave-style suite with a private terrace facing the caldera.",
          images: [img("photo-1571896349842-33c89424de2d", "A caldera view suite interior")],
          maxAdults: 2,
          maxChildren: 0,
          maxOccupancy: 2,
          bedType: "King",
          sizeSqft: 450,
          amenities: ["Private terrace", "Jacuzzi", "Air conditioning"],
          mealPlan: "breakfast" as const,
          pricePerNightINR: 28000,
          taxPercent: 13,
          refundable: false,
          cancellationRule: "Non-refundable rate — no changes after booking.",
          roomsAvailable: 4,
        },
      ],
      checkInTime: "15:00",
      checkOutTime: "11:00",
      policies: ["Adults-only property", "No smoking indoors"],
      isFeatured: true,
      status: "published" as const,
      isDemoData: true,
    },
    {
      name: "Kumarakom Lake Retreat",
      slug: "kumarakom-lake-retreat",
      destinationSlug: "kerala-backwaters",
      city: "Kumarakom",
      country: "India",
      address: "Kumarakom, Kottayam, Kerala",
      starCategory: 4 as const,
      propertyType: "resort" as const,
      summary: "Lakeside cottages with a working Ayurvedic centre on site.",
      description:
        "Traditional Kerala-style cottages set around a private lagoon, with an in-house Ayurvedic wellness centre and boat access to Vembanad Lake.",
      heroImage: img("photo-1602216056096-3b40cc0c9944", "A backwater resort at sunset"),
      gallery: [img("photo-1602308102967-be24da0a412e", "Lakeside cottages")],
      amenities: ["wifi", "pool", "spa", "restaurant"],
      coordinates: { lat: 9.6178, lng: 76.4304 },
      rooms: [
        {
          key: "lake-cottage",
          name: "Lake View Cottage",
          description: "A traditional cottage with a private balcony over the lagoon.",
          images: [img("photo-1584132967334-10e028bd69f7", "A lake view cottage")],
          maxAdults: 2,
          maxChildren: 1,
          maxOccupancy: 3,
          bedType: "King",
          sizeSqft: 400,
          amenities: ["Lake view", "Air conditioning"],
          mealPlan: "half_board" as const,
          pricePerNightINR: 6800,
          taxPercent: 12,
          refundable: true,
          cancellationRule: "Free cancellation up to 48 hours before check-in.",
          roomsAvailable: 8,
        },
      ],
      checkInTime: "14:00",
      checkOutTime: "11:00",
      policies: ["Ayurvedic treatments by appointment", "Alcohol served in-room only"],
      isFeatured: true,
      status: "published" as const,
      isDemoData: true,
    },
  ];

  let count = 0;

  for (const hotel of hotels) {
    const destinationId = destIds.get(hotel.destinationSlug);
    if (!destinationId) continue;

    const { destinationSlug: _destinationSlug, ...rest } = hotel;
    const startingPriceINR = Math.min(...rest.rooms.map((r) => r.pricePerNightINR));

    await Hotel.findOneAndUpdate(
      { slug: rest.slug },
      {
        $setOnInsert: {
          ...rest,
          destination: destinationId,
          startingPriceINR,
          ratingAverage: 4.5 + Math.random() * 0.4,
          ratingCount: 8 + Math.floor(Math.random() * 30),
        },
      },
      { upsert: true, returnDocument: "after" },
    );
    count++;
  }

  console.log(`Seeded ${count} hotels.`);
}

async function seedActivities(destIds: Map<string, mongoose.Types.ObjectId>) {
  const activities = [
    {
      title: "Nusa Penida Cliffs & Snorkel Day",
      slug: "nusa-penida-cliffs-snorkel-day",
      destinationSlug: "bali",
      city: "Nusa Penida",
      category: "water-sports",
      summary: "Kelingking, Angel's Billabong and manta ray snorkelling in one day.",
      description:
        "A full-day trip by fast boat to Nusa Penida covering its three most iconic viewpoints, with a snorkelling stop known for manta ray sightings.",
      heroImage: img("photo-1544644181-1484b3fdfc62", "Kelingking Beach viewpoint"),
      gallery: [],
      durationMinutes: 600,
      pricePerAdultINR: 4200,
      pricePerChildINR: 2800,
      minParticipants: 1,
      maxParticipants: 15,
      slots: [
        { time: "06:30", label: "Early departure", capacity: 15, booked: 4 },
      ],
      addOns: [{ key: "underwater-photos", label: "Underwater photo package", priceINR: 1200 }],
      pickupAvailable: true,
      pickupNote: "Hotel pickup available across South Bali.",
      inclusions: ["Fast boat transfers", "Snorkelling gear", "Lunch", "English-speaking guide"],
      exclusions: ["Hotel pickup outside South Bali (chargeable)", "Alcoholic drinks"],
      safetyInfo: ["Basic swimming ability required for the snorkelling stop.", "Life jackets provided and mandatory on the boat."],
      instantConfirmation: true,
      status: "published" as const,
      isDemoData: true,
    },
    {
      title: "Fushimi Inari Sunrise Walk",
      slug: "fushimi-inari-sunrise-walk",
      destinationSlug: "kyoto",
      city: "Kyoto",
      category: "cultural-tours",
      summary: "A guided walk through the torii gates before the crowds arrive.",
      description:
        "A small-group walk starting before dawn, reaching the upper trails of Fushimi Inari as the light comes up and the shrine is nearly empty.",
      heroImage: img("photo-1493976040374-85c8e12f0c0e", "Fushimi Inari torii gates at dawn"),
      gallery: [],
      durationMinutes: 180,
      pricePerAdultINR: 2800,
      pricePerChildINR: 1800,
      minParticipants: 1,
      maxParticipants: 8,
      slots: [{ time: "05:30", label: "Sunrise group", capacity: 8, booked: 3 }],
      addOns: [],
      pickupAvailable: false,
      inclusions: ["English-speaking guide", "Local breakfast after the walk"],
      exclusions: ["Hotel transfers"],
      safetyInfo: ["Involves uphill walking on stone steps — moderate fitness required."],
      instantConfirmation: true,
      status: "published" as const,
      isDemoData: true,
    },
    {
      title: "Backwater Village Cycling Tour",
      slug: "backwater-village-cycling-tour",
      destinationSlug: "kerala-backwaters",
      city: "Alleppey",
      category: "sightseeing",
      summary: "A half-day cycle through paddy fields and canal-side villages.",
      description:
        "An easy-paced cycling route through Alleppey's rural backwater villages, stopping at a toddy shop and a working coir workshop.",
      heroImage: img("photo-1571771019784-3ff35f4f4277", "Cycling along a backwater canal path"),
      gallery: [],
      durationMinutes: 240,
      pricePerAdultINR: 1500,
      pricePerChildINR: 900,
      minParticipants: 2,
      maxParticipants: 12,
      slots: [{ time: "07:00", label: "Morning ride", capacity: 12, booked: 5 }],
      addOns: [],
      pickupAvailable: true,
      inclusions: ["Bicycle rental", "Guide", "Refreshments"],
      exclusions: ["Hotel transfer beyond Alleppey town"],
      safetyInfo: ["Suitable for beginner cyclists — flat terrain throughout."],
      instantConfirmation: true,
      status: "published" as const,
      isDemoData: true,
    },
    {
      title: "Desert Dune Dinner Safari",
      slug: "desert-dune-dinner-safari",
      destinationSlug: "dubai",
      city: "Dubai",
      category: "adventure",
      summary: "Dune driving, camel rides, and a barbecue under the stars.",
      description:
        "An afternoon dune drive followed by a desert camp evening with a barbecue dinner, live entertainment and stargazing.",
      heroImage: img("photo-1518684079-3c830dcef090", "A 4x4 on desert dunes at sunset"),
      gallery: [],
      durationMinutes: 360,
      pricePerAdultINR: 3800,
      pricePerChildINR: 2600,
      minParticipants: 1,
      maxParticipants: 20,
      slots: [{ time: "15:30", label: "Afternoon pickup", capacity: 20, booked: 9 }],
      addOns: [{ key: "quad-bike", label: "15-minute quad bike ride", priceINR: 2200 }],
      pickupAvailable: true,
      pickupNote: "Pickup from most Dubai hotels included.",
      inclusions: ["Dune drive", "BBQ dinner", "Live entertainment", "Hotel pickup and drop"],
      exclusions: ["Alcoholic beverages", "Quad biking (optional add-on)"],
      safetyInfo: ["Not recommended for pregnant travellers or those with back issues due to dune driving."],
      instantConfirmation: true,
      status: "published" as const,
      isDemoData: true,
    },
  ];

  let count = 0;

  for (const activity of activities) {
    const destinationId = destIds.get(activity.destinationSlug);
    if (!destinationId) continue;

    const { destinationSlug: _destinationSlug, ...rest } = activity;

    await Activity.findOneAndUpdate(
      { slug: rest.slug },
      {
        $setOnInsert: {
          ...rest,
          destination: destinationId,
          ratingAverage: 4.4 + Math.random() * 0.5,
          ratingCount: 15 + Math.floor(Math.random() * 60),
        },
      },
      { upsert: true, returnDocument: "after" },
    );
    count++;
  }

  console.log(`Seeded ${count} activities.`);
}

async function seedVisaCountries() {
  const countries = [
    {
      country: "Japan",
      slug: "japan",
      countryCode: "JP",
      flagEmoji: "🇯🇵",
      heroImage: img("photo-1493976040374-85c8e12f0c0e", "Fushimi Inari torii gates"),
      visaTypes: [
        {
          type: "tourist",
          label: "Tourist (Single Entry)",
          processingTimeDays: "5-7 working days",
          stayDurationDays: "15-90 days",
          validityDays: "90 days from issue",
          governmentFeeINR: 2200,
          serviceFeeINR: 1800,
          entryType: "single" as const,
        },
      ],
      summary: "A straightforward visa for most travellers, provided the financial documentation is clean.",
      documentChecklist: [
        { title: "Passport (6+ months validity)", required: true },
        { title: "2 recent passport photographs", required: true },
        { title: "Bank statements, last 6 months", required: true },
        { title: "Confirmed flight itinerary", required: true },
        { title: "Hotel booking confirmation", required: true },
        { title: "Employment/business proof", required: true },
        { title: "Cover letter explaining the trip", required: false },
      ],
      eligibilityNotes: [
        "Applicants with a history of visa refusals should disclose this upfront — it affects document strategy.",
        "Financial documentation should show a stable balance, not a recent lump-sum deposit.",
      ],
      processSteps: [
        { title: "Document review", description: "We check everything before it's submitted." },
        { title: "Application lodgement", description: "Submitted via an authorised visa application centre." },
        { title: "Biometrics if required", description: "Some applicants may need to visit in person." },
        { title: "Decision", description: "Typically 5-7 working days from lodgement." },
      ],
      faqs: [
        {
          question: "Can I apply without a confirmed hotel booking?",
          answer: "A booking confirmation is required, but many hotels allow free cancellation, which works for this purpose.",
        },
      ],
      isPopular: true,
      status: "published" as const,
    },
    {
      country: "Schengen (via Greece)",
      slug: "schengen-greece",
      countryCode: "GR",
      flagEmoji: "🇬🇷",
      heroImage: img("photo-1570077188670-e3a8d69ac5ff", "White buildings over the Santorini caldera"),
      visaTypes: [
        {
          type: "tourist",
          label: "Schengen Tourist (Short Stay)",
          processingTimeDays: "10-15 working days",
          stayDurationDays: "Up to 90 days within 180 days",
          validityDays: "As granted, up to 5 years multiple entry",
          governmentFeeINR: 7200,
          serviceFeeINR: 2500,
          entryType: "multiple" as const,
        },
      ],
      summary: "Apply through the country you'll spend the most time in — Greece, if Santorini is your main stop.",
      documentChecklist: [
        { title: "Passport (3+ months beyond return date)", required: true },
        { title: "Schengen visa application form", required: true },
        { title: "Travel insurance, €30,000 minimum coverage", required: true },
        { title: "Confirmed round-trip flights", required: true },
        { title: "Full accommodation itinerary", required: true },
        { title: "Bank statements, last 3 months", required: true },
      ],
      eligibilityNotes: [
        "Apply to the consulate of the country where you'll spend the most nights, or your first port of entry if time is split evenly.",
      ],
      processSteps: [
        { title: "Document preparation", description: "We build your file to the exact checklist required." },
        { title: "Appointment booking", description: "Booked at the visa centre on your behalf." },
        { title: "Biometrics appointment", description: "In-person, required for first-time applicants." },
        { title: "Decision", description: "10-15 working days is typical; peak season can be longer." },
      ],
      faqs: [],
      isPopular: true,
      status: "published" as const,
    },
    {
      country: "United Arab Emirates",
      slug: "united-arab-emirates",
      countryCode: "AE",
      flagEmoji: "🇦🇪",
      heroImage: img("photo-1512453979798-5ea266f8880c", "Dubai skyline at sunset"),
      visaTypes: [
        {
          type: "tourist",
          label: "30-Day Tourist e-Visa",
          processingTimeDays: "3-4 working days",
          stayDurationDays: "30 days",
          validityDays: "60 days from issue",
          governmentFeeINR: 4500,
          serviceFeeINR: 1200,
          entryType: "single" as const,
        },
      ],
      summary: "One of the fastest visas we process — usually ready inside a week.",
      documentChecklist: [
        { title: "Passport (6+ months validity)", required: true },
        { title: "Passport-size photograph", required: true },
        { title: "Confirmed return flight", required: true },
      ],
      eligibilityNotes: [],
      processSteps: [
        { title: "Document check", description: "Minimal documentation required for this visa." },
        { title: "Online submission", description: "Processed electronically." },
        { title: "e-Visa issued", description: "Delivered by email, no physical stamp required." },
      ],
      faqs: [],
      isPopular: true,
      status: "published" as const,
    },
    {
      country: "Indonesia",
      slug: "indonesia",
      countryCode: "ID",
      flagEmoji: "🇮🇩",
      heroImage: img("photo-1537996194471-e657df975ab4", "Rice terraces in Bali"),
      visaTypes: [
        {
          type: "visa-on-arrival",
          label: "Visa on Arrival",
          processingTimeDays: "On arrival, ~15 minutes",
          stayDurationDays: "30 days, extendable once",
          validityDays: "30 days",
          governmentFeeINR: 3500,
          serviceFeeINR: 0,
          entryType: "single" as const,
        },
      ],
      summary: "No advance application needed — issued at the airport for most Indian passport holders.",
      documentChecklist: [
        { title: "Passport (6+ months validity)", required: true },
        { title: "Return or onward flight ticket", required: true },
      ],
      eligibilityNotes: [],
      processSteps: [
        { title: "Arrive and pay", description: "Visa on arrival counter at Bali/Jakarta airports." },
        { title: "Extension (optional)", description: "Can be extended once for a further 30 days locally." },
      ],
      faqs: [],
      isPopular: false,
      status: "published" as const,
    },
  ];

  for (const country of countries) {
    await VisaCountry.updateOne(
      { slug: country.slug },
      { $setOnInsert: country },
      { upsert: true },
    );
  }

  console.log(`Seeded ${countries.length} visa countries.`);
}

async function seedOffers() {
  const now = new Date();

  const offers = [
    {
      title: "Early-bird Bali: book 60 days out, save real money",
      slug: "early-bird-bali",
      kind: "early_bird" as const,
      headline: "Confirm your Bali trip 60 days before travel and save 12%.",
      description: "Applies to any Bali package. Deposit required to lock the rate.",
      image: img("photo-1537996194471-e657df975ab4", "Rice terraces at sunrise"),
      couponCode: "EARLYBALI12",
      discountLabel: "12% off",
      ctaLabel: "See Bali packages",
      ctaHref: "/destinations/bali",
      startsAt: new Date(now.getTime() - 5 * 86_400_000),
      endsAt: inDays(60),
      isActive: true,
      order: 1,
    },
    {
      title: "Honeymoon season: Santorini & Bali",
      slug: "honeymoon-season",
      kind: "honeymoon" as const,
      headline: "A little extra, on us, for the couples booking their first trip together.",
      description: "A complimentary room upgrade where available, on honeymoon-tagged packages.",
      image: img("photo-1570077188670-e3a8d69ac5ff", "Caldera view suite at sunset"),
      discountLabel: "Free upgrade",
      ctaLabel: "Explore honeymoon trips",
      ctaHref: "/packages?tripType=honeymoon",
      startsAt: new Date(now.getTime() - 10 * 86_400_000),
      endsAt: inDays(90),
      isActive: true,
      order: 2,
    },
    {
      title: "Group departures to Ladakh — save per person",
      slug: "ladakh-group-savings",
      kind: "group" as const,
      headline: "Book with 4 or more travellers on a fixed Ladakh departure.",
      description: "Automatic saving applied to group bookings of 4+ on the same departure date.",
      image: img("photo-1626621341517-bbf3d9990a23", "Pangong Lake"),
      couponCode: "LADAKHGROUP",
      discountLabel: "Save ₹3,000/person",
      ctaLabel: "See group departures",
      ctaHref: "/packages?tripStyle=group",
      startsAt: new Date(now.getTime() - 3 * 86_400_000),
      endsAt: inDays(120),
      isActive: true,
      order: 3,
    },
  ];

  for (const offer of offers) {
    await Offer.updateOne({ slug: offer.slug }, { $setOnInsert: offer }, { upsert: true });
  }

  console.log(`Seeded ${offers.length} offers.`);
}

async function seedCoupons() {
  const coupons = [
    {
      code: "EARLYBALI12",
      description: "Early-bird discount for Bali packages.",
      discountType: "percent" as const,
      value: 12,
      maxDiscountINR: 15000,
      minBookingINR: 40000,
      appliesTo: ["package"],
      validFrom: new Date(Date.now() - 5 * 86_400_000),
      validTo: inDays(60),
      usageLimit: 100,
      perUserLimit: 1,
      isActive: true,
    },
    {
      code: "LADAKHGROUP",
      description: "Group discount for Ladakh departures.",
      discountType: "flat" as const,
      value: 3000,
      minBookingINR: 30000,
      appliesTo: ["package"],
      validFrom: new Date(Date.now() - 3 * 86_400_000),
      validTo: inDays(120),
      usageLimit: 0,
      perUserLimit: 1,
      isActive: true,
    },
    {
      code: "WELCOME500",
      description: "Welcome discount for first-time bookers.",
      discountType: "flat" as const,
      value: 500,
      minBookingINR: 5000,
      appliesTo: [],
      validFrom: new Date(Date.now() - 30 * 86_400_000),
      validTo: inDays(365),
      usageLimit: 0,
      perUserLimit: 1,
      isActive: true,
    },
  ];

  for (const coupon of coupons) {
    await Coupon.updateOne({ code: coupon.code }, { $setOnInsert: coupon }, { upsert: true });
  }

  console.log(`Seeded ${coupons.length} coupons.`);
}

async function seedReviews() {
  const packages = await Package.find({}).select("_id title").limit(6).lean();
  if (packages.length === 0) return;

  const sample = [
    {
      authorName: "Priya Nair",
      authorLocation: "Bengaluru",
      rating: 5,
      title: "Exactly what we asked for",
      body: "We told them we wanted quiet mornings and no group tours, and that's what we got. The villa in Ubud was better than the photos, and our designer answered a WhatsApp message at 11pm when our flight changed.",
      isVerifiedBooking: true,
    },
    {
      authorName: "Rahul Mehta",
      authorLocation: "Mumbai",
      rating: 4,
      title: "Kyoto trip, well planned",
      body: "The Fushimi Inari sunrise walk alone was worth booking through them rather than doing it ourselves — we'd have slept in and missed the empty shrine. Minor hiccup with one transfer timing, sorted quickly.",
      isVerifiedBooking: true,
    },
    {
      authorName: "Anjali Rao",
      authorLocation: "Delhi",
      rating: 5,
      title: "Kerala backwaters, no complaints",
      body: "Houseboat food was genuinely excellent — fresh fish, cooked while we watched. Kumarakom resort afterwards was the right amount of nothing to do.",
      isVerifiedBooking: true,
    },
    {
      authorName: "Vikram Singh",
      authorLocation: "Chandigarh",
      rating: 5,
      title: "Ladakh — the acclimatisation days mattered",
      body: "I was impatient about the two rest days in Leh before we went anywhere, but our guide was right to insist. Nobody in our group got altitude sick, unlike two other groups we met at Pangong who'd rushed straight there.",
      isVerifiedBooking: true,
    },
    {
      authorName: "Meera Krishnan",
      authorLocation: "Chennai",
      rating: 4,
      title: "Santorini honeymoon",
      body: "The Pyrgos dinner recommendation instead of fighting the Oia sunset crowd was the best call of the whole trip. Suite was stunning. Would book again for our anniversary.",
      isVerifiedBooking: true,
    },
  ];

  let count = 0;

  for (let i = 0; i < sample.length && i < packages.length; i++) {
    const pkg = packages[i];
    const review = sample[i];

    const existing = await Review.findOne({ authorName: review.authorName, "subject.refId": pkg._id });
    if (existing) continue;

    await Review.create({
      ...review,
      subject: { kind: "package", refId: pkg._id, title: pkg.title },
      status: "approved",
      isFeatured: i < 3,
      travelledOn: new Date(Date.now() - (30 + i * 20) * 86_400_000),
    });
    count++;
  }

  console.log(`Seeded ${count} reviews.`);

  // Recompute package ratings from the approved reviews we just wrote.
  for (const pkg of packages) {
    const agg = await Review.aggregate([
      { $match: { "subject.refId": pkg._id, status: "approved" } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    if (agg[0]) {
      await Package.updateOne(
        { _id: pkg._id },
        { $set: { ratingAverage: Math.round(agg[0].avg * 10) / 10, ratingCount: agg[0].count } },
      );
    }
  }
}

async function seedBlogPosts() {
  const bySlug = new Map((await Destination.find({}).select("slug _id title").lean()).map((d) => [d.slug, d]));

  const linkMap: Record<string, string[]> = {
    "months-to-avoid-in-bali": ["bali"],
    "japan-visa-timeline-india": ["kyoto"],
    "kerala-houseboat-cost-breakdown": ["kerala-backwaters"],
    "packing-for-ladakh-altitude": ["ladakh"],
  };

  let count = 0;

  for (const post of blogSeeds) {
    const relatedSlugs = linkMap[post.slug] ?? [];
    const relatedDestinations = relatedSlugs
      .map((s) => bySlug.get(s)?._id)
      .filter((id): id is mongoose.Types.ObjectId => Boolean(id));

    await BlogPost.updateOne(
      { slug: post.slug },
      {
        $setOnInsert: {
          ...post,
          author: { name: "Editorial Team", role: "Destination specialists" },
          relatedDestinations,
          publishedAt: new Date(Date.now() - Math.random() * 60 * 86_400_000),
        },
      },
      { upsert: true },
    );
    count++;
  }

  console.log(`Seeded ${count} blog posts.`);
}

async function main() {
  console.log("Seeding eZyMiles demo data...\n");

  await connect();

  await seedSiteSettings();
  await seedLegalPages();
  await seedAdmin();
  await seedDemoTraveller();
  await seedFAQs();
  await seedActivityCategories();

  const destIds = await seedDestinations();
  await seedPackages(destIds);
  await seedHotels(destIds);
  await seedActivities(destIds);
  await seedVisaCountries();
  await seedOffers();
  await seedCoupons();
  await seedReviews();
  await seedBlogPosts();

  console.log("\nDone. Sign in to /admin with the super admin credentials shown above.");
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("\nSeed failed:", error);
  process.exit(1);
});
