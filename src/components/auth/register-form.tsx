"use client";

import * as React from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, User as UserIcon, Phone, CheckCircle2, Check } from "lucide-react";

import { registerSchema, type RegisterInput } from "@/lib/validation";
import { registerUser } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { GoogleIcon } from "./google-icon";
import { cn } from "@/lib/utils";

const RULES = [
  { test: (v: string) => v.length >= 8, label: "At least 8 characters" },
  { test: (v: string) => /[a-z]/.test(v) && /[A-Z]/.test(v), label: "Upper and lowercase letters" },
  { test: (v: string) => /[0-9]/.test(v), label: "At least one number" },
];

export function RegisterForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [done, setDone] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { marketingOptIn: false, consent: false },
  });

  const password = watch("password") ?? "";

  const onSubmit = handleSubmit(async (values) => {
    const result = await registerUser(values);

    if (result.ok) {
      setDone(true);
      toast.success("Account created", result.message);
      return;
    }

    if (result.fieldErrors) {
      for (const [field, message] of Object.entries(result.fieldErrors)) {
        setError(field as keyof RegisterInput, { message });
      }
    }
    toast.error("Could not create account", result.message);
  });

  if (done) {
    return (
      <div className="text-center" role="status">
        <CheckCircle2 className="mx-auto size-12 text-lagoon-600" aria-hidden />
        <h1 className="mt-5 text-2xl text-midnight-900">Check your inbox</h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          We&apos;ve sent a verification link to the email you signed up with. Click it, then sign in.
        </p>
        <p className="mt-3 text-xs text-muted">
          No email? Check spam — or if this environment has no SMTP configured, the link is printed to
          the server console.
        </p>
        <Button asChild variant="accent" size="lg" block className="mt-7">
          <Link href="/login">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl text-midnight-900">Create your account</h1>
      <p className="mt-2 text-sm text-muted">
        Save packages, track bookings, and keep every trip in one place.
      </p>

      {googleEnabled ? (
        <>
          <Button
            variant="outline"
            size="lg"
            block
            className="mt-7"
            loading={googleLoading}
            loadingText="Redirecting"
            onClick={() => {
              setGoogleLoading(true);
              void signIn("google", { callbackUrl: "/account" });
            }}
          >
            <GoogleIcon className="size-[1.125rem]" aria-hidden />
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-hairline" aria-hidden />
            <span className="text-xs font-medium text-muted">or with email</span>
            <span className="h-px flex-1 bg-hairline" aria-hidden />
          </div>
        </>
      ) : (
        <div className="mt-7" />
      )}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Full name" htmlFor="reg-name" required error={errors.name?.message}>
          <Input
            id="reg-name"
            autoComplete="name"
            leadingIcon={<UserIcon />}
            invalid={Boolean(errors.name)}
            {...register("name")}
          />
        </Field>

        <Field label="Email" htmlFor="reg-email" required error={errors.email?.message}>
          <Input
            id="reg-email"
            type="email"
            autoComplete="email"
            leadingIcon={<Mail />}
            invalid={Boolean(errors.email)}
            {...register("email")}
          />
        </Field>

        <Field label="Phone" htmlFor="reg-phone" required error={errors.phone?.message}>
          <Input
            id="reg-phone"
            type="tel"
            autoComplete="tel"
            leadingIcon={<Phone />}
            invalid={Boolean(errors.phone)}
            {...register("phone")}
          />
        </Field>

        <Field label="Password" htmlFor="reg-password" required error={errors.password?.message}>
          <Input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            leadingIcon={<Lock />}
            invalid={Boolean(errors.password)}
            {...register("password")}
          />
        </Field>

        {password ? (
          <ul className="space-y-1" aria-live="polite">
            {RULES.map((rule) => {
              const passed = rule.test(password);
              return (
                <li
                  key={rule.label}
                  className={cn(
                    "flex items-center gap-1.5 text-xs",
                    passed ? "text-emerald-700" : "text-muted",
                  )}
                >
                  <Check className="size-3.5" aria-hidden />
                  {rule.label}
                </li>
              );
            })}
          </ul>
        ) : null}

        <Field
          label="Confirm password"
          htmlFor="reg-confirm"
          required
          error={errors.confirmPassword?.message}
        >
          <Input
            id="reg-confirm"
            type="password"
            autoComplete="new-password"
            leadingIcon={<Lock />}
            invalid={Boolean(errors.confirmPassword)}
            {...register("confirmPassword")}
          />
        </Field>

        <div className="space-y-2.5 pt-1">
          <Checkbox
            id="reg-marketing"
            label="Send me travel ideas and seasonal fares (no more than twice a month)"
            {...register("marketingOptIn")}
          />
          <Checkbox
            id="reg-consent"
            label={
              <>
                I accept the{" "}
                <Link href="/legal/terms-and-conditions" className="underline hover:no-underline">
                  terms
                </Link>{" "}
                and the{" "}
                <Link href="/legal/privacy-policy" className="underline hover:no-underline">
                  privacy policy
                </Link>
                .
              </>
            }
            {...register("consent")}
          />
          {errors.consent ? (
            <p role="alert" className="text-xs text-red-600">
              {errors.consent.message}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          block
          size="lg"
          variant="accent"
          loading={isSubmitting}
          loadingText="Creating account"
        >
          Create account
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-lagoon-700 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
