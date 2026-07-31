import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getSafeAdminCallbackUrl } from "@/lib/admin-callback-url";
import { getSafeAccountCallbackUrl } from "@/lib/account-callback-url";

/**
 * Fast edge-side gate for /account and /admin.
 *
 * This only checks that a session token exists and carries the right audience —
 * it keeps unauthenticated users off protected routes cheaply. The real
 * authorisation (per-permission) happens again on the server in every page and
 * action via `requireAdmin` / `assertAdmin`.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Must match whatever protocol the request actually arrived on — NOT
  // NODE_ENV. Auth.js names its cookie __Secure-authjs.session-token only when
  // the sign-in response itself was served over HTTPS; guessing from NODE_ENV
  // instead (e.g. "production" while still on plain HTTP, as under `next
  // start` before a reverse proxy terminates TLS) looks for the wrong cookie
  // name and silently logs everyone out of /admin and /account.
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const isHttps = forwardedProto ? forwardedProto === "https" : request.nextUrl.protocol === "https:";

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: isHttps,
  });

  if (pathname.startsWith("/admin")) {
    if (!token) {
      const raw = request.nextUrl.searchParams.get("callbackUrl");
      const safe = getSafeAdminCallbackUrl(raw);
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", safe);
      return NextResponse.redirect(url);
    }
    if (!token.isAdmin) {
      return NextResponse.redirect(new URL("/account", request.url));
    }
  }

  if (pathname.startsWith("/account")) {
    if (!token) {
      const raw = request.nextUrl.searchParams.get("callbackUrl");
      const safe = getSafeAccountCallbackUrl(raw);
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", safe);
      return NextResponse.redirect(url);
    }
    // A staff session has no traveller data behind it — send them to the panel
    // they actually have, rather than showing them an empty public dashboard.
    if (token.isAdmin) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
