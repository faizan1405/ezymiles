/**
 * One-off connectivity probe — runs once and exits.
 * Usage: npx tsx scripts/check-mongo.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set");
  process.exit(1);
}

const dbName = process.env.MONGODB_DB || "ezymiles";

(async () => {
  const startedAt = Date.now();
  try {
    const conn = await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 8000,
    });
    const elapsed = Date.now() - startedAt;
    const adminDb = conn.connection.db?.admin();
    const ping = adminDb ? await adminDb.ping() : { ok: 0 };
    const readyState = mongoose.connection.readyState; // 1 = connected
    console.log(
      JSON.stringify(
        {
          ok: ping.ok === 1,
          readyState,
          dbName: conn.connection.name,
          host: conn.connection.host,
          elapsedMs: elapsed,
        },
        null,
        2,
      ),
    );
    await mongoose.disconnect();
    process.exit(ping.ok === 1 ? 0 : 1);
  } catch (err) {
    console.error("[check-mongo] FAILED:", (err as Error).message);
    process.exit(1);
  }
})();
