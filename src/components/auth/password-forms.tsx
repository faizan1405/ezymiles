"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, MailCheck, CheckCircle2, XCircle } from "lucide-react";

import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/validation";
import { requestPasswordReset, resetPassword, verifyEmail } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";

/* ------------------------------ Forgot password ---------------------------- */

type ForgotInput = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [sent, setSent] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = handleSubmit(async (values) => {
    const result = await requestPasswordReset(values);
    if (result.ok) setSent(true);
    else toast.error("Could not send reset link", result.message);
  });

  if (sent) {
    return (
      <div className="text-center" role="status">
        <MailCheck className="mx-auto size-12 text-lagoon-600" aria-hidden />
        <h1 className="mt-5 text-2xl text-midnight-900">Check your inbox</h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          If an account exists for that email, a reset link is on its way. It expires in one hour.
        </p>
        <Button asChild variant="outline" block className="mt-7">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl text-midnight-900">Reset your password</h1>
      <p className="mt-2 text-sm text-muted">
        Enter your email and we&apos;ll send you a link to choose a new one.
      </p>

      <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
        <Field label="Email" htmlFor="fp-email" required error={errors.email?.message}>
          <Input
            id="fp-email"
            type="email"
            autoComplete="email"
            leadingIcon={<Mail />}
            invalid={Boolean(errors.email)}
            {...register("email")}
          />
        </Field>

        <Button type="submit" block size="lg" variant="accent" loading={isSubmitting} loadingText="Sending">
          Send reset link
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-lagoon-700 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

/* ------------------------------ Reset password ----------------------------- */

type ResetInput = z.input<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();

  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await resetPassword({ ...values, token }, email);

    if (result.ok) {
      toast.success("Password updated", result.message);
      router.push("/login");
      return;
    }

    if (result.fieldErrors) {
      for (const [field, message] of Object.entries(result.fieldErrors)) {
        setError(field as keyof ResetInput, { message });
      }
    }
    toast.error("Could not reset password", result.message);
  });

  if (!token || !email) {
    return (
      <div className="text-center">
        <XCircle className="mx-auto size-12 text-red-500" aria-hidden />
        <h1 className="mt-5 text-2xl text-midnight-900">That link is incomplete</h1>
        <p className="mt-3 text-[0.9375rem] text-muted">
          Request a fresh reset link and try again.
        </p>
        <Button asChild variant="accent" block className="mt-7">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl text-midnight-900">Choose a new password</h1>
      <p className="mt-2 text-sm text-muted">For {email}</p>

      <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
        <input type="hidden" {...register("token")} value={token} />

        <Field label="New password" htmlFor="rp-password" required error={errors.password?.message}>
          <Input
            id="rp-password"
            type="password"
            autoComplete="new-password"
            leadingIcon={<Lock />}
            invalid={Boolean(errors.password)}
            {...register("password")}
          />
        </Field>

        <Field
          label="Confirm new password"
          htmlFor="rp-confirm"
          required
          error={errors.confirmPassword?.message}
        >
          <Input
            id="rp-confirm"
            type="password"
            autoComplete="new-password"
            leadingIcon={<Lock />}
            invalid={Boolean(errors.confirmPassword)}
            {...register("confirmPassword")}
          />
        </Field>

        <Button type="submit" block size="lg" variant="accent" loading={isSubmitting} loadingText="Updating">
          Update password
        </Button>
      </form>
    </div>
  );
}

/* ------------------------------ Verify email ------------------------------- */

export function VerifyEmailPanel() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [state, setState] = React.useState<"pending" | "ok" | "error">("pending");
  const [message, setMessage] = React.useState("Verifying your email…");

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await verifyEmail(token, email);
      if (cancelled) return;

      setState(result.ok ? "ok" : "error");
      setMessage(result.message);
    })();

    return () => {
      cancelled = true;
    };
  }, [token, email]);

  return (
    <div className="text-center" role="status" aria-live="polite">
      {state === "pending" ? (
        <div className="mx-auto size-12 animate-spin rounded-full border-4 border-sand-200 border-t-lagoon-600" />
      ) : state === "ok" ? (
        <CheckCircle2 className="mx-auto size-12 text-lagoon-600" aria-hidden />
      ) : (
        <XCircle className="mx-auto size-12 text-red-500" aria-hidden />
      )}

      <h1 className="mt-5 text-2xl text-midnight-900">
        {state === "ok" ? "Email verified" : state === "error" ? "Verification failed" : "One moment"}
      </h1>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">{message}</p>

      {state !== "pending" ? (
        <Button asChild variant="accent" block className="mt-7">
          <Link href="/login">Go to sign in</Link>
        </Button>
      ) : null}
    </div>
  );
}
