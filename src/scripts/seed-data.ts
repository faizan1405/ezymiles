/**
 * Demo data definitions.
 *
 * Everything here is original placeholder content — no copied descriptions,
 * pricing, photography or branding from any reference site. Images are
 * royalty-free Unsplash source URLs. Every package/hotel/activity carries
 * isDemoData: true so it is labelled everywhere it surfaces on the site.
 */

const img = (id: string, alt: string) => ({
  url: `https://images.unsplash.com/${id}?w=1600&q=80`,
  alt,
});

/* -------------------------------------------------------------------------- */
/*                                 Destinations                                */
/* -------------------------------------------------------------------------- */

export const destinationSeeds = [
  {
    name: "Bali",
    slug: "bali",
    country: "Indonesia",
    countryCode: "ID",
    region: "Southeast Asia",
    scope: "international" as const,
    themes: ["honeymoon", "beach", "adventure"],
    summary: "Rice terraces, reef breaks and temples that don't feel staged for a camera.",
    description:
      "Bali rewards travellers who get out of the Kuta strip. Ubud's terraces are genuinely quiet before 8am, the north coast has some of the best diving in Southeast Asia, and a private villa in the rice fields costs less than a mid-range hotel back home. The trade-off is traffic — Seminyak to Ubud can take two hours on a bad afternoon, so we plan routes around that rather than pretending it isn't there.",
    heroImage: img("photo-1537996194471-e657df975ab4", "Rice terraces in Bali at sunrise"),
    gallery: [
      img("photo-1552733407-5d5c46c3bb3b", "A Balinese temple gate at dusk"),
      img("photo-1573790387438-4da905039392", "Aerial view of a rice terrace"),
    ],
    startingPriceINR: 68000,
    recommendedDurationDays: 6,
    bestMonths: ["Apr", "May", "Jun", "Sep"],
    currencyUsed: "Indonesian Rupiah (IDR)",
    languages: ["Indonesian", "Balinese", "English (tourist areas)"],
    timezone: "GMT+8",
    visaNote: "Visa on arrival for Indian passport holders, valid 30 days, extendable once.",
    coordinates: { lat: -8.4095, lng: 115.1889 },
    highlights: [
      "Sunrise trek up Mount Batur",
      "Private villa with a rice-field view",
      "A full day at Nusa Penida's cliffs",
      "Ubud's morning market before the tour buses arrive",
    ],
    faqs: [
      {
        question: "Is Bali good for a first international trip?",
        answer:
          "Yes — English is widely spoken in tourist areas, the visa is straightforward, and the infrastructure for travellers is mature. It's one of the easiest first international trips from India.",
      },
      {
        question: "How many days do I actually need?",
        answer:
          "Five nights covers the south coast and Ubud comfortably. Add two nights if you want to include Nusa Penida or the north coast reefs without rushing.",
      },
    ],
    isFeatured: true,
    isTrending: true,
    status: "published" as const,
  },
  {
    name: "Kyoto",
    slug: "kyoto",
    country: "Japan",
    countryCode: "JP",
    region: "East Asia",
    scope: "international" as const,
    themes: ["luxury", "solo"],
    summary: "A thousand years of temples, and a rail system that makes day trips effortless.",
    description:
      "Kyoto is the counterweight to Tokyo's pace. Bamboo groves, machiya-lined streets and a food scene that runs from ¥400 ramen to multi-course kaiseki. We build most Kyoto itineraries around early starts — Fushimi Inari at 6am is a completely different place than at noon.",
    heroImage: img("photo-1493976040374-85c8e12f0c0e", "Fushimi Inari torii gates at dawn"),
    gallery: [img("photo-1478436127897-769e1b3f0f36", "A traditional Kyoto street at dusk")],
    startingPriceINR: 145000,
    recommendedDurationDays: 5,
    bestMonths: ["Mar", "Apr", "Oct", "Nov"],
    currencyUsed: "Japanese Yen (JPY)",
    languages: ["Japanese"],
    timezone: "GMT+9",
    visaNote: "Indian passport holders need a visa in advance; processing typically takes 5-7 working days.",
    coordinates: { lat: 35.0116, lng: 135.7681 },
    highlights: [
      "Fushimi Inari before the crowds",
      "A tea ceremony in a working machiya",
      "Arashiyama bamboo grove at first light",
      "Day trip to Nara's deer park",
    ],
    faqs: [
      {
        question: "Is cherry blossom season worth the crowds?",
        answer:
          "It's spectacular but genuinely crowded — book accommodation 4-6 months ahead if travelling late March to early April. Early November for autumn colour is nearly as beautiful and far less packed.",
      },
    ],
    isFeatured: true,
    isTrending: false,
    status: "published" as const,
  },
  {
    name: "Santorini",
    slug: "santorini",
    country: "Greece",
    countryCode: "GR",
    region: "Southern Europe",
    scope: "international" as const,
    themes: ["honeymoon", "luxury"],
    summary: "The caldera views are real. So are the crowds at sunset — we plan around both.",
    description:
      "Santorini's caldera-facing suites are worth the premium once, for the view alone. What we actually spend time planning is everything the postcards skip: which villages still feel lived-in (Pyrgos, Emporio), where to eat that isn't a tour-bus stop, and how to see Oia's sunset without fighting for a rail spot.",
    heroImage: img("photo-1570077188670-e3a8d69ac5ff", "White buildings over the Santorini caldera"),
    gallery: [img("photo-1533105079780-92b9be482077", "Blue-domed churches at sunset")],
    startingPriceINR: 165000,
    recommendedDurationDays: 5,
    bestMonths: ["May", "Jun", "Sep", "Oct"],
    currencyUsed: "Euro (EUR)",
    languages: ["Greek", "English"],
    timezone: "GMT+3",
    visaNote: "Schengen visa required; apply at least 15 working days before travel.",
    coordinates: { lat: 36.3932, lng: 25.4615 },
    highlights: [
      "Caldera-view suite with a private plunge pool",
      "Sunset in Pyrgos instead of the Oia crowds",
      "A boat day around the volcanic caldera",
      "Wine tasting on volcanic soil vineyards",
    ],
    faqs: [],
    isFeatured: true,
    isTrending: true,
    status: "published" as const,
  },
  {
    name: "Kerala Backwaters",
    slug: "kerala-backwaters",
    country: "India",
    countryCode: "IN",
    region: "South India",
    scope: "domestic" as const,
    themes: ["honeymoon", "family", "weekend"],
    summary: "A houseboat, a slow river, and absolutely nowhere to be.",
    description:
      "Alleppey and Kumarakom's backwaters are the closest thing India has to compulsory stillness. A day on a houseboat means fresh Keralan food cooked on board, palm-lined canals, and a pace that resets you within a few hours. We pair it with a short stay in the Periyar hills for anyone who wants a bit of altitude and tea gardens alongside the water.",
    heroImage: img("photo-1602216056096-3b40cc0c9944", "A traditional houseboat on the Kerala backwaters"),
    gallery: [img("photo-1602308102967-be24da0a412e", "Palm trees along a backwater canal")],
    startingPriceINR: 24000,
    recommendedDurationDays: 4,
    bestMonths: ["Oct", "Nov", "Dec", "Jan", "Feb"],
    coordinates: { lat: 9.4981, lng: 76.3388 },
    highlights: [
      "Overnight on a traditional houseboat",
      "Sunrise on the water",
      "A spice plantation walk near Thekkady",
      "Authentic Keralan sadya thali",
    ],
    faqs: [],
    isFeatured: true,
    isTrending: true,
    status: "published" as const,
  },
  {
    name: "Ladakh",
    slug: "ladakh",
    country: "India",
    countryCode: "IN",
    region: "North India",
    scope: "domestic" as const,
    themes: ["adventure", "solo"],
    summary: "High passes, blue lakes, and a landscape that looks edited even before you edit it.",
    description:
      "Ladakh runs on altitude and weather, not on schedules — we build in acclimatisation days rather than pretending you can land in Leh and drive to Pangong the same afternoon. Best done June to September when the passes are open; outside that window it's a genuinely different, harder trip.",
    heroImage: img("photo-1626621341517-bbf3d9990a23", "Pangong Lake with mountains behind"),
    gallery: [img("photo-1589553416260-f586c8f1514f", "A monastery perched on a Ladakh hillside")],
    startingPriceINR: 42000,
    recommendedDurationDays: 7,
    bestMonths: ["Jun", "Jul", "Aug", "Sep"],
    coordinates: { lat: 34.1526, lng: 77.5771 },
    highlights: [
      "Two full acclimatisation days in Leh before altitude gain",
      "Pangong Lake at sunrise, before the day-trip crowds",
      "Nubra Valley's sand dunes and double-humped camels",
      "A monastery stay, not just a drive-by visit",
    ],
    faqs: [],
    isFeatured: false,
    isTrending: true,
    status: "published" as const,
  },
  {
    name: "Dubai",
    slug: "dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    region: "Middle East",
    scope: "international" as const,
    themes: ["family", "luxury", "weekend"],
    summary: "A genuinely easy long weekend, with a lot more to it than the malls.",
    description:
      "Dubai is often booked purely for the skyline and the shopping, which misses most of what's actually good about it — the old creek-side souks, desert stays that don't feel like a theme park, and a food scene shaped by every part of the world that's moved there. Short flight time from most Indian cities makes it a genuinely easy long weekend.",
    heroImage: img("photo-1512453979798-5ea266f8880c", "Dubai skyline at sunset"),
    gallery: [img("photo-1518684079-3c830dcef090", "A desert dune with a 4x4 at sunset")],
    startingPriceINR: 55000,
    recommendedDurationDays: 4,
    bestMonths: ["Nov", "Dec", "Jan", "Feb", "Mar"],
    currencyUsed: "UAE Dirham (AED)",
    languages: ["Arabic", "English"],
    timezone: "GMT+4",
    visaNote: "Visa on arrival / e-visa for most Indian passport holders with a valid US/UK/EU visa or via sponsored visa.",
    coordinates: { lat: 25.2048, lng: 55.2708 },
    highlights: [
      "An overnight desert camp, not a two-hour safari",
      "The old creek souks by abra boat",
      "At the Top, Burj Khalifa, at sunset",
      "A proper Friday brunch",
    ],
    faqs: [],
    isFeatured: false,
    isTrending: false,
    status: "published" as const,
  },
] as const;

/* -------------------------------------------------------------------------- */
/*                              Activity categories                            */
/* -------------------------------------------------------------------------- */

export const activityCategorySeeds = [
  { name: "Adventure", slug: "adventure", kind: "activity" as const, order: 1 },
  { name: "Water Sports", slug: "water-sports", kind: "activity" as const, order: 2 },
  { name: "Theme Parks", slug: "theme-parks", kind: "activity" as const, order: 3 },
  { name: "Wildlife", slug: "wildlife", kind: "activity" as const, order: 4 },
  { name: "Cultural Tours", slug: "cultural-tours", kind: "activity" as const, order: 5 },
  { name: "Cruises", slug: "cruises", kind: "activity" as const, order: 6 },
  { name: "Nightlife", slug: "nightlife", kind: "activity" as const, order: 7 },
  { name: "Wellness", slug: "wellness", kind: "activity" as const, order: 8 },
  { name: "Food Experiences", slug: "food-experiences", kind: "activity" as const, order: 9 },
  { name: "Sightseeing", slug: "sightseeing", kind: "activity" as const, order: 10 },
];

/* -------------------------------------------------------------------------- */
/*                                     FAQs                                    */
/* -------------------------------------------------------------------------- */

export const faqSeeds = [
  {
    question: "How does payment work?",
    answer:
      "You can pay in full, or hold your booking with a deposit and pay the balance closer to departure. Every payment is verified on our server before your booking is confirmed — we never trust a total sent from a browser.",
    group: "payment",
    order: 1,
  },
  {
    question: "What happens if I need to cancel?",
    answer:
      "Cancellation charges depend on how close to departure you cancel and are shown on the package page before you book. Request a cancellation from your account and we'll confirm the exact refund within 48 hours.",
    group: "booking",
    order: 1,
  },
  {
    question: "Do you handle visas for every destination?",
    answer:
      "We handle the most commonly requested destinations directly, shown on our Visa Assistance page. For others, we can still guide you, but lodgement may be through a partner. We prepare and lodge; embassies decide.",
    group: "visa",
    order: 1,
  },
  {
    question: "Is the pricing I see final?",
    answer:
      "The price shown includes everything stated in the inclusions list. Taxes are calculated and shown before you pay. Nothing is added at checkout that wasn't already visible.",
    group: "general",
    order: 1,
  },
  {
    question: "Can I change my travel dates after booking?",
    answer:
      "Usually yes, subject to availability and any fare or rate difference. Free date changes are available up to 30 days before travel on most packages — check the specific package's terms.",
    group: "booking",
    order: 2,
  },
  {
    question: "Are your flight fares live?",
    answer:
      "This depends on whether a live flight supplier is connected in your environment. Every fare is labelled — live, cached, estimated or demo — so you always know what you're looking at.",
    group: "flights",
    order: 1,
  },
];

/* -------------------------------------------------------------------------- */
/*                                 Blog articles                               */
/* -------------------------------------------------------------------------- */

export const blogSeeds = [
  {
    title: "The months we'd quietly avoid in Bali",
    slug: "months-to-avoid-in-bali",
    excerpt:
      "December and January look fine on a climate chart. They are not fine in a rice field during a downpour.",
    category: "Best time to visit",
    coverImage: img("photo-1573790387438-4da905039392", "Rain over Bali's rice terraces"),
    tags: ["bali", "weather", "planning"],
    readingMinutes: 5,
    body: `Bali's wet season runs roughly November through March, and the marketing material tends to undersell it. Rain doesn't fall lightly — it arrives as a wall for an hour, floods the smaller roads around Ubud, and can ground the fast boats to Nusa Penida for a day or two at a time.

## What actually happens in the wet months

The rain is usually concentrated into a couple of hours rather than lasting all day, so it's not a write-off — but if your itinerary depends on a specific boat crossing or a sunrise trek, build in a buffer day.

## When we'd actually book

April through June, and again in September, give you the green landscape without the daily downpours. July and August are drier still but busier and pricier.

- April–June: green, warm, fewer crowds
- July–August: driest, but the most expensive and busiest
- September: a good compromise
- November–March: genuinely wet — budget-friendly if you don't mind it`,
    isFeatured: true,
    status: "published" as const,
  },
  {
    title: "A realistic Japan visa timeline for Indian passport holders",
    slug: "japan-visa-timeline-india",
    excerpt: "Five to seven working days, if your paperwork is complete the first time.",
    category: "Visa guides",
    coverImage: img("photo-1493976040374-85c8e12f0c0e", "Torii gates at Fushimi Inari"),
    tags: ["japan", "visa"],
    readingMinutes: 4,
    body: `Japan's tourist visa for Indian passport holders is processed through an authorised visa application centre, not a walk-in embassy appointment. The stated processing time is five to seven working days, and in our experience that holds — as long as the financial documentation is complete on the first submission.

## The document that trips people up

Bank statements need to show a consistent balance over the last six months, not a lump sum deposited the week before you apply. If your statement looks engineered, expect a query and a delay.

## Our actual timeline recommendation

Apply 4-6 weeks before travel. That gives room for a document query without threatening your flights.`,
    isFeatured: false,
    status: "published" as const,
  },
  {
    title: "What a Kerala houseboat day actually costs, broken down",
    slug: "kerala-houseboat-cost-breakdown",
    excerpt: "The headline price and the actual price are usually two different numbers. Here's why.",
    category: "Budget guides",
    coverImage: img("photo-1602216056096-3b40cc0c9944", "A houseboat on Kerala's backwaters"),
    tags: ["kerala", "budget"],
    readingMinutes: 6,
    body: `A one-night houseboat booking in Alleppey typically quotes a per-boat rate, not per-person — which matters if you're travelling as a couple versus a group of six.

## What's usually included

Meals, a private cabin, and the crew are standard. What's often not included: alcohol, AC surcharge in peak summer, and transfers to and from the boat jetty.

## Where the real cost differences come from

The gap between a basic and a premium houseboat is mostly about cabin count and deck space — the route and the food are nearly identical.`,
    isFeatured: false,
    status: "published" as const,
  },
  {
    title: "Packing for Ladakh: what the altitude actually demands",
    slug: "packing-for-ladakh-altitude",
    excerpt: "Layers matter more than any single expensive jacket.",
    category: "Packing guides",
    coverImage: img("photo-1626621341517-bbf3d9990a23", "Pangong Lake in Ladakh"),
    tags: ["ladakh", "packing"],
    readingMinutes: 5,
    body: `Leh sits at roughly 3,500 metres, and the passes you'll cross go well beyond that. Temperature swings of 20°C between midday sun and post-sunset cold are normal, which is why layering beats any single heavy jacket.

## The non-negotiables

Diamox (with a doctor's approval), sunscreen rated for altitude UV, and a headlamp for the passes where daylight runs out faster than expected.

## What people over-pack

A full trekking wardrobe for what is, for most itineraries, a road trip with short walks. Save the pack weight.`,
    isFeatured: false,
    status: "published" as const,
  },
];

export type DestinationSeed = (typeof destinationSeeds)[number];
