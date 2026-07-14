import "server-only";
import { headers } from "next/headers";

/**
 * Fixed-window rate limiter.
 *
 * Backed by an in-process Map, which is correct for a single instance and good
 * enough to stop form spam and brute-force attempts in a small deployment. If
 * you scale to multiple instances, swap `hits` for Redis / Upstash — the call
 * sites do not change.
 */

interface Window {
  count: number;
  resetAt: number;
}

declare global {
  var __ezymilesRateLimit: Map<string, Window> | undefined;
}

const hits = globalThis.__ezymilesRateLimit ?? new Map<string, Window>();
globalThis.__ezymilesRateLimit = hits;

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  { limit, windowSeconds }: { limit: number; windowSeconds: number },
): RateLimitResult {
  const now = Date.now();
  const existing = hits.get(key);

  if (!existing || existing.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { success: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;

  if (existing.count > limit) {
    return {
      success: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  return { success: true, remaining: limit - existing.count, retryAfterSeconds: 0 };
}

/** Best-effort client IP behind a proxy / CDN. */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

/** Convenience wrapper used by public write endpoints and server actions. */
export async function guard(
  scope: string,
  opts: { limit: number; windowSeconds: number } = { limit: 6, windowSeconds: 60 },
): Promise<RateLimitResult> {
  const ip = await getClientIp();
  return rateLimit(`${scope}:${ip}`, opts);
}

/** Periodically drop expired windows so the Map cannot grow unbounded. */
if (!globalThis.__ezymilesRateLimitSweeper) {
  globalThis.__ezymilesRateLimitSweeper = setInterval(
    () => {
      const now = Date.now();
      for (const [key, window] of hits) {
        if (window.resetAt <= now) hits.delete(key);
      }
    },
    10 * 60 * 1000,
  );
  // Don't hold the process open in scripts / tests.
  globalThis.__ezymilesRateLimitSweeper.unref?.();
}

declare global {
  var __ezymilesRateLimitSweeper: ReturnType<typeof setInterval> | undefined;
}
