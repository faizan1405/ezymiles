"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GoogleIcon } from "./google-icon";

/**
 * Traveller sign-in. Google is the only way in — there is no password to type,
 * forget, or leak. Staff sign in through the admin panel instead.
 */

/**
 * Every way this can fail, in the traveller's words. Keys are the codes set by
 * the signIn callback in `@/lib/auth`, plus the ones Auth.js raises itself.
 */
const ERRORS: Record<string, string> = {
  // Ours.
  NoEmail: "Google didn't share an email address with us, so we couldn't sign you in. Check your Google account has an email, then try again.",
  EmailUnverified:
    "That Google email address hasn't been verified with Google yet. Verify it with Google first, then sign in here.",
  StaffAccount: "That email belongs to an EzyMiles staff account. Please sign in through the staff sign-in page instead.",
  AccountDisabled: "This account has been closed. Contact us if you think that's a mistake.",
  DatabaseUnavailable: "We couldn't reach our systems just then. Please try again in a moment.",

  // Auth.js.
  OAuthAccountNotLinked:
    "That email is already signed up a different way. Use the method you signed up with, or contact us and we'll help.",
  OAuthCallbackError: "Google sign-in was cancelled or didn't complete. You can try again below.",
  OAuthSignInError: "We couldn't start Google sign-in. Please try again.",
  AccessDenied: "You didn't finish giving Google permission, so we couldn't sign you in.",
  Configuration:
    "Google sign-in isn't set up correctly on our side — often a redirect URI that doesn't match. We've been notified; please try again later.",
  Verification: "That sign-in link has expired. Please start again.",
};

const FALLBACK = "We couldn't sign you in. Please try again.";

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const params = useSearchParams();

  // Preserved across the whole round trip to Google, so a traveller who was
  // sent here from checkout, a wishlist, an enquiry or a booking lands back
  // exactly where they left off rather than on a generic dashboard.
  const callbackUrl = params.get("callbackUrl") ?? "/account";

  const [loading, setLoading] = React.useState(false);
  const [failed, setFailed] = React.useState<string | null>(null);

  const errorCode = params.get("error");
  const error = failed ?? (errorCode ? (ERRORS[errorCode] ?? FALLBACK) : null);

  async function onSignIn() {
    setLoading(true);
    setFailed(null);

    try {
      // Redirects away on success, so `loading` stays true until the page goes.
      await signIn("google", { redirectTo: callbackUrl });
    } catch {
      // Only reached if the redirect itself never happens — an offline browser
      // or a route that isn't there. Never leave the button spinning forever.
      setFailed("We couldn't reach Google just then. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl text-midnight-900 sm:text-4xl">Welcome to EzyMiles</h1>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
        Sign in securely with Google to manage your trips, wishlist and enquiries.
      </p>

      {error ? (
        <p role="alert" className="mt-7 rounded-xl bg-red-50 p-3.5 text-sm leading-relaxed text-red-700">
          {error}
        </p>
      ) : null}

      {googleEnabled ? (
        <Button
          variant="outline"
          size="lg"
          block
          className="mt-7 shadow-tile hover:shadow-lift"
          loading={loading}
          loadingText="Taking you to Google"
          onClick={onSignIn}
          aria-label="Continue with Google to sign in to EzyMiles"
        >
          <GoogleIcon className="size-5" aria-hidden />
          Continue with Google
        </Button>
      ) : (
        <>
          <Button
            variant="outline"
            size="lg"
            block
            className="mt-7 shadow-tile"
            disabled
            aria-label="Google sign-in is unavailable"
            aria-describedby="google-unavailable"
          >
            <GoogleIcon className="size-5" aria-hidden />
            Continue with Google
          </Button>

          <p id="google-unavailable" role="status" className="mt-3 text-center text-sm text-muted">
            Google sign-in is temporarily unavailable. Please try again later.
          </p>

          {process.env.NODE_ENV === "development" ? (
            <p className="mt-3 rounded-xl bg-amber-50 p-3.5 text-sm leading-relaxed text-amber-900">
              <strong className="font-semibold">Development note:</strong> set{" "}
              <code className="font-mono text-[0.8125rem]">AUTH_GOOGLE_ID</code> and{" "}
              <code className="font-mono text-[0.8125rem]">AUTH_GOOGLE_SECRET</code> in{" "}
              <code className="font-mono text-[0.8125rem]">.env.local</code>, then restart the dev
              server. See <code className="font-mono text-[0.8125rem]">.env.example</code>.
            </p>
          ) : null}
        </>
      )}

      <p className="mt-6 flex items-start justify-center gap-2 text-center text-xs leading-relaxed text-muted">
        <ShieldCheck className="mt-px size-4 shrink-0 text-lagoon-600" aria-hidden />
        <span>Secure sign-in powered by Google. EzyMiles never receives your Google password.</span>
      </p>
    </div>
  );
}
