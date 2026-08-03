/**
 * Fixes package image URLs that were double-prefixed due to a bug in seed-packages-data.ts.
 *
 * The old `img()` helper always prepended `https://images.unsplash.com/`, but the seed
 * data already contained full URLs. This script strips the double prefix from affected
 * records so images load correctly without requiring a full re-seed.
 *
 * Usage:
 *   npx tsx scripts/fix-package-images.ts
 */

import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";

for (const file of [".env", ".env.local"]) {
  if (existsSync(file)) loadEnv({ path: file, override: true });
}

import mongoose from "mongoose";

const DOUBLE_PREFIX = "https://images.unsplash.com/https://images.unsplash.com";

function fixUrl(url: string): string {
  if (url.startsWith(DOUBLE_PREFIX)) {
    const rest = url.slice(DOUBLE_PREFIX.length);
    return `https://images.unsplash.com${rest}`;
  }
  return url;
}

async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set.");
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || "ezymiles" });
  console.log(`Connected to ${uri.replace(/\/\/.*@/, "//<redacted>@")}`);
}

async function main() {
  console.log("Scanning for broken package image URLs...\n");
  await connect();

  const Package = (await import("@/models")).Package;

  // Find packages with double-prefixed hero images
  const brokenHero = await Package.find({
    "heroImage.url": { $regex: "^" + DOUBLE_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") },
  }).lean();

  // Find packages with double-prefixed gallery images
  const brokenGallery = await Package.find({
    "gallery.url": { $regex: "^" + DOUBLE_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") },
  }).lean();

  const allBroken = new Map<string, { hero?: string; gallery: string[] }>();

  for (const pkg of brokenHero) {
    const key = String(pkg._id);
    if (!allBroken.has(key)) allBroken.set(key, { gallery: [] });
    allBroken.get(key)!.hero = (pkg.heroImage as { url: string }).url;
  }

  for (const pkg of brokenGallery) {
    const key = String(pkg._id);
    if (!allBroken.has(key)) allBroken.set(key, { gallery: [] });
    const galleryUrls = (pkg.gallery as { url: string }[]).map((g) => g.url);
    allBroken.get(key)!.gallery.push(...galleryUrls.filter((u) => u.startsWith(DOUBLE_PREFIX)));
  }

  if (allBroken.size === 0) {
    console.log("No broken image URLs found. All clear!");
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${allBroken.size} package(s) with broken image URLs.\n`);

  let fixed = 0;
  for (const [id, data] of allBroken) {
    const update: Record<string, unknown> = {};

    if (data.hero) {
      update["heroImage.url"] = fixUrl(data.hero);
    }

    if (data.gallery.length > 0) {
      const gallery = (await Package.findById(id).select("gallery").lean())?.gallery as { url: string }[];
      if (gallery) {
        const fixedGallery = gallery.map((g) => ({
          ...g,
          url: fixUrl(g.url),
        }));
        update.gallery = fixedGallery;
      }
    }

    await Package.findByIdAndUpdate(id, { $set: update });
    console.log(`  Fixed package ${id}`);
    fixed++;
  }

  console.log(`\nFixed ${fixed} package(s).`);
  console.log("\nRun `npm run seed:packages` next time to overwrite with fresh correct data.");
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("\nFix failed:", error);
  process.exit(1);
});
