/**
 * Idempotent destination-taxonomy seed script.
 *
 * Run with `npm run seed:destinations`.
 *
 * - Creates any destination in NEW_DESTINATIONS that doesn't exist yet
 *   (matched by normalised slug).
 * - For a destination that already exists — whether created by this
 *   script's own previous run, `npm run seed`, `npm run seed:packages`, or
 *   an admin — only backfills fields that are still unset on that document
 *   (type, parentDestination, hotelFeatured, packageFeatured, displayOrder,
 *   aliases). Content fields (name, description, images, pricing, ...) are
 *   never touched on an existing document, so a genuine admin edit is never
 *   overwritten. `isDemoData` is only ever set at creation time, or on the
 *   known-demo slugs in EXISTING_DESTINATION_BACKFILL — never inferred onto
 *   a document this script didn't create.
 * - parentDestination is resolved from `parentSlug` in a second pass, once
 *   every destination touched in this run has an _id, and is itself only
 *   backfilled if currently unset (null or absent).
 * - Never deletes or hard-overwrites anything. Safe to run any number of
 *   times, in any order relative to `npm run seed` / `npm run seed:packages`.
 *
 * Logs created / updated / skipped / failed totals.
 */
import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";

for (const file of [".env", ".env.local"]) {
  if (existsSync(file)) loadEnv({ path: file, override: true });
}

import mongoose from "mongoose";
import { Destination } from "@/models";
import { NEW_DESTINATIONS, EXISTING_DESTINATION_BACKFILL } from "./seed-destinations-data";

async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Copy .env.example to .env.local first.");

  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || "ezymiles" });
  console.log(`Connected to ${uri.replace(/\/\/.*@/, "//<redacted>@")}`);
}

interface Totals {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
}

/** Only includes keys whose current value on `doc` is unset — never overwrites a value already present, even false/0/[]. */
function safeBackfillSet(
  doc: Record<string, unknown>,
  candidate: Record<string, unknown>,
): Record<string, unknown> {
  const set: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(candidate)) {
    if (value === undefined) continue;
    if (doc[key] === undefined) set[key] = value;
  }
  return set;
}

async function seedNewDestinations(totals: Totals) {
  const idBySlug = new Map<string, mongoose.Types.ObjectId>();

  for (const dest of NEW_DESTINATIONS) {
    try {
      const existing = await Destination.findOne({ slug: dest.slug }).lean();
      const { parentSlug: _parentSlug, ...rest } = dest;

      if (!existing) {
        const created = await Destination.create({ ...rest, isDemoData: true });
        idBySlug.set(dest.slug, created._id);
        totals.created++;
        console.log(`  created  ${dest.slug}`);
        continue;
      }

      idBySlug.set(dest.slug, existing._id as mongoose.Types.ObjectId);

      // A destination with this slug already exists for reasons this script
      // doesn't control (another seed script, or an admin). Only fill in the
      // new taxonomy fields where they're genuinely unset — never touch
      // content, and never guess at isDemoData for a document we didn't create.
      const set = safeBackfillSet(existing as unknown as Record<string, unknown>, {
        type: rest.type,
        aliases: rest.aliases,
        hotelFeatured: rest.hotelFeatured,
        packageFeatured: rest.packageFeatured,
        displayOrder: rest.displayOrder,
      });

      if (Object.keys(set).length > 0) {
        await Destination.updateOne({ _id: existing._id }, { $set: set });
        totals.updated++;
        console.log(`  updated  ${dest.slug} (${Object.keys(set).join(", ")})`);
      } else {
        totals.skipped++;
        console.log(`  skipped  ${dest.slug} (already up to date)`);
      }
    } catch (error) {
      console.error(`  FAILED   ${dest.slug}:`, error);
      totals.failed++;
    }
  }

  return idBySlug;
}

async function backfillExisting(totals: Totals, idBySlug: Map<string, mongoose.Types.ObjectId>) {
  for (const entry of EXISTING_DESTINATION_BACKFILL) {
    try {
      const existing = await Destination.findOne({ slug: entry.slug }).lean();
      if (!existing) {
        console.log(
          `  skipped  ${entry.slug} — not found yet (run \`npm run seed\` or \`npm run seed:packages\` first)`,
        );
        totals.skipped++;
        continue;
      }

      idBySlug.set(entry.slug, existing._id as mongoose.Types.ObjectId);

      const { parentSlug, ...fields } = entry.fields;
      const set = safeBackfillSet(existing as unknown as Record<string, unknown>, fields);

      const existingParent = (existing as unknown as Record<string, unknown>).parentDestination;
      if (parentSlug && existingParent === undefined) {
        const parentDoc = await Destination.findOne({ slug: parentSlug }).select("_id").lean();
        const parentId = idBySlug.get(parentSlug) ?? (parentDoc?._id as mongoose.Types.ObjectId | undefined);
        if (parentId) set.parentDestination = parentId;
      }

      if (Object.keys(set).length > 0) {
        await Destination.updateOne({ _id: existing._id }, { $set: set });
        totals.updated++;
        console.log(`  updated  ${entry.slug} (${Object.keys(set).join(", ")})`);
      } else {
        totals.skipped++;
        console.log(`  skipped  ${entry.slug} (already up to date)`);
      }
    } catch (error) {
      console.error(`  FAILED   ${entry.slug}:`, error);
      totals.failed++;
    }
  }
}

async function resolveParents(totals: Totals, idBySlug: Map<string, mongoose.Types.ObjectId>) {
  for (const dest of NEW_DESTINATIONS) {
    if (!dest.parentSlug) continue;

    try {
      const existing = await Destination.findOne({ slug: dest.slug }).select("parentDestination").lean();
      if (!existing) continue;

      // null (the schema default) or undefined both mean "no parent set yet".
      // An admin choosing "None" also stores null — we accept the (small,
      // one-time) risk of re-filling that on a genuinely brand-new field.
      const current = (existing as unknown as Record<string, unknown>).parentDestination;
      if (current != null) continue;

      const parentDoc = await Destination.findOne({ slug: dest.parentSlug }).select("_id").lean();
      const parentId = idBySlug.get(dest.parentSlug) ?? (parentDoc?._id as mongoose.Types.ObjectId | undefined);

      if (!parentId) {
        console.warn(`  WARN     parent "${dest.parentSlug}" not found for "${dest.slug}"`);
        continue;
      }

      await Destination.updateOne({ slug: dest.slug }, { $set: { parentDestination: parentId } });
    } catch (error) {
      console.error(`  FAILED   resolving parent for "${dest.slug}":`, error);
      totals.failed++;
    }
  }
}

async function main() {
  await connect();

  const totals: Totals = { created: 0, updated: 0, skipped: 0, failed: 0 };

  console.log("\nSeeding new destinations…");
  const idBySlug = await seedNewDestinations(totals);

  console.log("\nBackfilling existing destinations…");
  await backfillExisting(totals, idBySlug);

  console.log("\nResolving parent destinations…");
  await resolveParents(totals, idBySlug);

  console.log("\nDestination seed complete:");
  console.log(`  created: ${totals.created}`);
  console.log(`  updated: ${totals.updated}`);
  console.log(`  skipped: ${totals.skipped}`);
  console.log(`  failed:  ${totals.failed}`);

  await mongoose.disconnect();

  if (totals.failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error("[seed:destinations] Fatal error:", error);
  process.exit(1);
});
