import "server-only";
import mongoose, { type Mongoose } from "mongoose";

/**
 * Cached Mongoose connection.
 *
 * Next.js hot-reloads modules in dev and reuses warm lambdas in production, so
 * the connection promise is memoised on globalThis to avoid opening a new pool
 * on every request / HMR cycle.
 */

declare global {
  var __ezymilesMongoose: {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
  } | undefined;
}

const cache = globalThis.__ezymilesMongoose ?? { conn: null, promise: null };
globalThis.__ezymilesMongoose = cache;

mongoose.set("strictQuery", true);

export async function connectDB(): Promise<Mongoose> {
  if (cache.conn) return cache.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Copy .env.example to .env.local and point it at your MongoDB instance.",
    );
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(uri, {
        dbName: process.env.MONGODB_DB || "ezymiles",
        bufferCommands: false,
        // The homepage alone fans out ~20 independent queries in one
        // Promise.all; a pool of 10 forces half of them to queue. 25 lets a
        // cold render run its whole fan-out concurrently.
        maxPoolSize: 25,
        serverSelectionTimeoutMS: 8000,
      })
      .then((m) => m);
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}

/**
 * Read paths call this instead of connectDB() so that a database outage renders
 * an empty state rather than a 500. Write paths must use connectDB() and let
 * the error surface.
 */
export async function tryConnectDB(): Promise<boolean> {
  try {
    await connectDB();
    return true;
  } catch (error) {
    console.error("[db] connection unavailable:", (error as Error).message);
    return false;
  }
}

export { mongoose };
