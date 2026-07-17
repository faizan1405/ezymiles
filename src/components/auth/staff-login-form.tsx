"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { Lock } from "lucide-react";

import { loginSchema, type LoginInput } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

/**
 * Staff sign-in. Separate from the traveller Google button above it — this is
 * the only UI in the app that can reach the Credentials provider, which is
 * itself the only thing that can ever set `isAdmin: true` on a session. Shown
 * when `callbackUrl` points into `/admin`, so a customer never sees a
 * password field and staff never see the Google button.
 */

const CODE_MESSAGES: Record<string, string> = {
  "rate-limited": "Too many attempts. Please wait a few minutes and try again.",
  credentials: "Incorrect email or password.",
};

const FALLBACK = "We couldn't sign you in. Please try again.";

export function StaffLoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
      redirectTo: callbackUrl,
    });

    if (!result || result.error) {
      setServerError((result?.code && CODE_MESSAGES[result.code]) ?? FALLBACK);
      return;
    }

    window.location.href = result.url ?? callbackUrl;
  });

  return (
    <div>
      <h1 className="text-3xl text-midnight-900 sm:text-4xl">Staff sign-in</h1>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
        Sign in with your EzyMiles staff email and password to reach the admin panel.
      </p>

      {serverError ? (
        <p role="alert" className="mt-7 rounded-xl bg-red-50 p-3.5 text-sm leading-relaxed text-red-700">
          {serverError}
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
        <Field label="Email" htmlFor="staff-email" required error={errors.email?.message}>
          <Input
            id="staff-email"
            type="email"
            autoComplete="username"
            invalid={Boolean(errors.email)}
            {...register("email")}
          />
        </Field>

        <Field label="Password" htmlFor="staff-password" required error={errors.password?.message}>
          <Input
            id="staff-password"
            type="password"
            autoComplete="current-password"
            invalid={Boolean(errors.password)}
            {...register("password")}
          />
        </Field>

        <Button
          type="submit"
          variant="outline"
          size="lg"
          block
          className="shadow-tile hover:shadow-lift"
          loading={isSubmitting}
          loadingText="Signing in"
        >
          <Lock className="size-4" aria-hidden />
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Not staff?{" "}
        <Link href="/login" className="font-semibold text-lagoon-700 underline-offset-4 hover:underline">
          Sign in as a traveller
        </Link>
      </p>
    </div>
  );
}
