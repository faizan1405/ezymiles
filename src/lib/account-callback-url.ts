/**
 * Where a traveller sign-in should land, given the raw `callbackUrl` search
 * param.
 *
 * Mirrors `getSafeAdminCallbackUrl` for the traveller side. Only `/account` and
 * `/account/*` pass; anything else (external URLs, protocol-relative
 * `//evil.com`, unparsable percent-encoding, or a bare origin) falls back to
 * `/account`. This closes the open-redirect vector where a malicious link to
 * `/login?callbackUrl=//evil.com` would, after a successful sign-in, take the
 * traveller off-site.
 */
export function getSafeAccountCallbackUrl(value: string | null | undefined): string {
  const FALLBACK = "/account";
  if (!value) return FALLBACK;

  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return FALLBACK;
  }

  if (!decoded.startsWith("/") || decoded.startsWith("//")) return FALLBACK;
  if (decoded !== "/account" && !decoded.startsWith("/account/")) return FALLBACK;

  // Landing back on the sign-in page itself would loop (or, once signed in,
  // just bounce straight past it) — treat it the same as "no callback".
  if (decoded === "/login" || decoded.startsWith("/login?")) return FALLBACK;

  return decoded;
}
