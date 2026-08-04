/**
 * Fix package images across the website.
 * Run with: npx tsx scripts/fix-package-images.ts
 */

import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
for (const file of [".env", ".env.local"]) {
  if (existsSync(file)) loadEnv({ path: file, override: true });
}

import mongoose from "mongoose";

interface Fix {
  slug: string;
  heroImage: { url: string; alt: string };
  gallery: { url: string; alt: string }[];
}

const fixes: Fix[] = [
  {
    slug: "kashmir-paradise",
    heroImage: { url: "https://images.unsplash.com/photo-1596615243669-2fdbae2417ca?w=1200&q=80", alt: "Kashmir Dal Lake with houseboats" },
    gallery: [
      { url: "https://images.unsplash.com/photo-1596615243669-2fdbae2417ca?w=800&q=80", alt: "Kashmir Dal Lake" },
      { url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df2?w=800&q=80", alt: "Kashmir mountains" },
      { url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80", alt: "Kashmir landscape" },
      { url: "https://images.unsplash.com/photo-1566837945700-30057527ade0?w=800&q=80", alt: "Kashmir temple" },
    ],
  },
  {
    slug: "ladakh-bike-expedition",
    heroImage: { url: "https://images.unsplash.com/photo-1585137277230-b0a1b9c8a9e4?w=1200&q=80", alt: "Ladakh motorcycle on mountain road" },
    gallery: [
      { url: "https://images.unsplash.com/photo-1585136462614-ef1a5ac9cf87?w=800&q=80", alt: "Ladakh mountains" },
      { url: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80", alt: "Pangong Lake Ladakh" },
      { url: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80", alt: "Himalayan landscape" },
    ],
  },
  {
    slug: "dubai-dreams",
    heroImage: { url: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80", alt: "Burj Khalifa Dubai" },
    gallery: [
      { url: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=800&q=80", alt: "Dubai skyline" },
      { url: "https://images.unsplash.com/photo-1451337516015-6b6e9a44a4e4?w=800&q=80", alt: "Dubai desert" },
    ],
  },
  {
    slug: "dubai-abu-dhabi-grand-tour",
    heroImage: { url: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=1200&q=80", alt: "Dubai skyline at sunset" },
    gallery: [
      { url: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80", alt: "Burj Khalifa" },
      { url: "https://images.unsplash.com/photo-1451337516015-6b6e9a44a4e4?w=800&q=80", alt: "Dubai desert" },
    ],
  },
  {
    slug: "dubai-adventure-shopping",
    heroImage: { url: "https://images.unsplash.com/photo-1451337516015-6b6e9a44a4e4?w=1200&q=80", alt: "Dubai desert safari" },
    gallery: [
      { url: "https://images.unsplash.com/photo-1518684069d3-4e9a8e8e8e8e?w=800&q=80", alt: "Dubai Marina" },
      { url: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=800&q=80", alt: "Dubai skyline" },
    ],
  },
  {
    slug: "dubai-marina-abu-dhabi",
    heroImage: { url: "https://images.unsplash.com/photo-1518684069d3-4e9a8e8e8e8e?w=1200&q=80", alt: "Dubai Marina" },
    gallery: [
      { url: "https://images.unsplash.com/photo-1451337516015-6b6e9a44a4e4?w=800&q=80", alt: "Dubai desert" },
      { url: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80", alt: "Burj Khalifa" },
    ],
  },
  {
    slug: "himachal-pradesh-adventure",
    heroImage: { url: "https://images.unsplash.com/photo-1626618010321-ff192286ef8e?w=1200&q=80", alt: "Himachal Pradesh mountains" },
    gallery: [
      { url: "https://images.unsplash.com/photo-1593693397690-362cb9666c2f?w=800&q=80", alt: "Manali mountains" },
      { url: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800&q=80", alt: "Solang Valley" },
    ],
  },
  {
    slug: "himachal-pradesh-hill-tour",
    heroImage: { url: "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=1200&q=80", alt: "Manali Hadimba temple" },
    gallery: [
      { url: "https://images.unsplash.com/photo-1595665593673-bf1ad72905c0?w=800&q=80", alt: "Himachal landscape" },
      { url: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800&q=80", alt: "Solang Valley" },
    ],
  },
  {
    slug: "thailand-beach-culture",
    heroImage: { url: "https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=1200&q=80", alt: "Thailand white sand beach" },
    gallery: [
      { url: "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=800&q=80", alt: "Phuket beach" },
      { url: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80", alt: "Thailand temple" },
    ],
  },
  {
    slug: "bali-cultural-immersion",
    heroImage: { url: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1200&q=80", alt: "Balinese temple" },
    gallery: [
      { url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80", alt: "Bali rice terrace" },
      { url: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80", alt: "Bali rice terraces" },
    ],
  },
  {
    slug: "nepal-himalayan-trek",
    heroImage: { url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&q=80", alt: "Nepal Himalayan mountains" },
    gallery: [
      { url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df2?w=800&q=80", alt: "Himalayan peaks Nepal" },
      { url: "https://images.unsplash.com/photo-1604391652849-3e77942344c9?w=800&q=80", alt: "Mount Everest region" },
    ],
  },
  {
    slug: "mauritius-romance",
    heroImage: { url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=1200&q=80", alt: "Mauritius turquoise beach" },
    gallery: [
      { url: "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=800&q=80", alt: "Mauritius white sand beach" },
      { url: "https://images.unsplash.com/photo-1544986581-efac024faf62?w=800&q=80", alt: "Mauritius landscape" },
    ],
  },
  {
    slug: "sikkim-darjeeling-delight",
    heroImage: { url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df2?w=1200&q=80", alt: "Sikkim mountains" },
    gallery: [
      { url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80", alt: "Sikkim landscape" },
      { url: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80", alt: "Kanchenjunga view" },
    ],
  },
  {
    slug: "bali-luxury-escape",
    heroImage: { url: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=80", alt: "Bali luxury villa" },
    gallery: [
      { url: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80", alt: "Bali temple" },
      { url: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&q=80", alt: "Bali beach" },
    ],
  },
  {
    slug: "kerala-backwaters-hill-stations",
    heroImage: { url: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&q=80", alt: "Kerala backwaters" },
    gallery: [
      { url: "https://images.unsplash.com/photo-1572896382533-96b766d09fd7?w=800&q=80", alt: "Kerala houseboat" },
      { url: "https://images.unsplash.com/photo-1593693411515-c20261bcad6e?w=800&q=80", alt: "Munnar tea garden" },
    ],
  },
  {
    slug: "singapore-family-fun",
    heroImage: { url: "https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=1200&q=80", alt: "Singapore skyline at night" },
    gallery: [
      { url: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80", alt: "Marina Bay Sands Singapore" },
      { url: "https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=800&q=80", alt: "Gardens by the Bay" },
    ],
  },
  {
    slug: "singapore-sentosa-island",
    heroImage: { url: "https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=1200&q=80", alt: "Gardens by the Bay Singapore" },
    gallery: [
      { url: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80", alt: "Marina Bay Sands" },
      { url: "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800&q=80", alt: "Sentosa Island" },
    ],
  },
  {
    slug: "maldives-overwater-villa",
    heroImage: { url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80", alt: "Maldives resort aerial view" },
    gallery: [
      { url: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80", alt: "Maldives overwater villa" },
      { url: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80", alt: "Maldives underwater restaurant" },
    ],
  },
  {
    slug: "leh-ladakh-motorcycle-expedition",
    heroImage: { url: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=1200&q=80", alt: "Leh Ladakh mountain landscape" },
    gallery: [
      { url: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80", alt: "Ladakh mountain valley" },
      { url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80", alt: "Pangong Lake Ladakh" },
    ],
  },
];

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error("ERROR: MONGODB_URI not set"); process.exit(1); }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || "ezymiles" });
  console.log("Connected.\n");

  const db = mongoose.connection.db;
  if (!db) { console.error("No DB connection"); process.exit(1); }
  const pkgCol = db.collection("packages");
  let updated = 0, skipped = 0;

  for (const fix of fixes) {
    const doc = await pkgCol.findOne({ slug: fix.slug });
    if (!doc) { console.log(`  SKIP "${fix.slug}" — not found`); skipped++; continue; }

    await pkgCol.updateOne({ _id: doc._id }, {
      $set: { heroImage: fix.heroImage, gallery: fix.gallery, images: fix.gallery.map(g => g.url) }
    });
    console.log(`  FIXED "${fix.slug}" (${doc.title}) — hero + ${fix.gallery.length} images`);
    updated++;
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped`);
  console.log("\nVerifying all hero images:\n");

  const allPkgs = await pkgCol.find({}).toArray();
  for (const p of allPkgs) {
    const hero = p.heroImage?.url || "(no hero)";
    console.log(`  ${p.slug.padEnd(35)} -> ${hero.length > 60 ? hero.substring(0, 60) + "..." : hero}`);
  }

  await mongoose.disconnect();
  console.log("\nDisconnected.");
}

run().catch(err => { console.error("Failed:", err); process.exit(1); });