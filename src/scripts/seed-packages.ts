/**
 * Seeds only the Package collection from seed-packages-data.ts.
 *
 * Usage:
 *   npx tsx scripts/seed-packages.ts
 *
 * Or via npm script:
 *   npm run seed:packages
 */

import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";

for (const file of [".env", ".env.local"]) {
  if (existsSync(file)) loadEnv({ path: file, override: true });
}

import mongoose from "mongoose";
import { Package } from "@/models";
import { packageSeeds } from "./seed-packages-data";

const img = (id: string, alt: string) => ({
  url: `https://images.unsplash.com/${id}?w=1600&q=80`,
  alt,
});

async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set.");
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || "ezymiles" });
  console.log(`Connected to ${uri.replace(/\/\/.*@/, "//<redacted>@")}`);
}

export async function seedPackagesFromData(destIds: Map<string, mongoose.Types.ObjectId>) {
  const packages = packageSeeds;
  const { destinationSlug: _destinationSlug, ...rest } = packages[0];
  const allowedKeys = new Set(Object.keys(rest));
  let count = 0;
  let skipped = 0;

  for (const raw of packages) {
    const destinationId = destIds.get(raw.destinationSlug);
    if (!destinationId) {
      console.log(`  Skipped "${raw.title}" — destination "${raw.destinationSlug}" not found.`);
      skipped++;
      continue;
    }

    const { destinationSlug, ...rest } = raw;
    const record: Record<string, unknown> = {};
    for (const key of Object.keys(rest)) {
      if (allowedKeys.has(key)) record[key] = (rest as Record<string, unknown>)[key];
    }

    const variants = record.variants as unknown as { pricePerAdultINR: number; originalPricePerAdultINR?: number }[];
    const startingPriceINR = Math.min(...variants.map((v) => v.pricePerAdultINR));
    const originalPriceINR = variants.reduce((min: number, v: { originalPricePerAdultINR?: number }) =>
      v.originalPricePerAdultINR && (!min || v.originalPricePerAdultINR < min)
        ? v.originalPricePerAdultINR
        : min,
      0,
    );

    await Package.findOneAndUpdate(
      { slug: record.slug as string },
      {
        $setOnInsert: {
          ...record,
          destination: destinationId,
          startingPriceINR,
          originalPriceINR: originalPriceINR || undefined,
          taxPercent: 5,
          ratingAverage: 4.6 + Math.random() * 0.3,
          ratingCount: 12 + Math.floor(Math.random() * 40),
        },
      },
      { upsert: true, returnDocument: "after" },
    );
    count++;
  }

  return { count, skipped };
}

async function main() {
  console.log("Seeding packages...\n");
  await connect();

  const destIds = new Map<string, mongoose.Types.ObjectId>();
  const destinations = await mongoose.connection.db
    .collection("destinations")
    .find({})
    .project<{ _id: mongoose.Types.ObjectId; slug: string }>({ slug: 1 })
    .toArray();
  for (const d of destinations) destIds.set(d.slug, d._id);

  if (destIds.size === 0) {
    console.log("Warning: no destinations found. Run `npm run seed` first.");
  }

  const { count, skipped } = await seedPackagesFromData(destIds);

  console.log(`\nSeeded ${count} packages${skipped > 0 ? ` (${skipped} skipped — no matching destination)` : ""}.`);
  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((error) => {
  console.error("\nSeed failed:", error);
  process.exit(1);
});
