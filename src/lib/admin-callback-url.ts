/**
 * Where a staff sign-in should land, given the raw `callbackUrl` search param.
 *
 * Deliberately narrower than the default Auth.js `redirect` callback (which
 * allows any same-origin path): staff sign-in must never resolve to a public
 * or traveller route, and never back to the sign-in page itself. Only `/admin`
 * and `/admin/*` pass; everything else — external URLs, protocol-relative
 * (`//evil.com`), unparsable percent-encoding, or a bare origin — falls back
 * to `/admin`.
 */
export function getSafeAdminCallbackUrl(value: string | null | undefined): string {
  const FALLBACK = "/admin";
  if (!value) return FALLBACK;

  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return FALLBACK;
  }

  if (!decoded.startsWith("/") || decoded.startsWith("//")) return FALLBACK;
  if (decoded !== "/admin" && !decoded.startsWith("/admin/")) return FALLBACK;

  // Landing back on the sign-in route itself would loop (or, once signed in,
  // just bounce straight past it) — treat it the same as "no callback".
  if (decoded === "/admin/login" || decoded.startsWith("/admin/login?")) return FALLBACK;

  return decoded;
}
