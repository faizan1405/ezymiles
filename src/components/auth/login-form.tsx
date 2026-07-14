"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

import { loginSchema, type LoginInput } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { GoogleIcon } from "./google-icon";

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/account";

  const [showPassword, setShowPassword] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      // Deliberately generic: never reveal whether the email exists.
      setFormError("That email and password combination isn't right.");
      return;
    }

    toast.success("Welcome back");
    router.push(callbackUrl);
    router.refresh();
  });

  return (
    <div>
      <h1 className="text-3xl text-midnight-900">Welcome back</h1>
      <p className="mt-2 text-sm text-muted">Sign in to manage your trips and saved packages.</p>

      {params.get("error") ? (
        <p role="alert" className="mt-6 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          We couldn&apos;t sign you in. Please try again.
        </p>
      ) : null}

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
              void signIn("google", { callbackUrl });
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
        {formError ? (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {formError}
          </p>
        ) : null}

        <Field label="Email" htmlFor="login-email" required error={errors.email?.message}>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            leadingIcon={<Mail />}
            invalid={Boolean(errors.email)}
            {...register("email")}
          />
        </Field>

        <Field label="Password" htmlFor="login-password" required error={errors.password?.message}>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              leadingIcon={<Lock />}
              invalid={Boolean(errors.password)}
              className="pr-11"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-midnight-400 hover:text-midnight-800"
            >
              {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            </button>
          </div>
        </Field>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-[0.8125rem] font-semibold text-lagoon-700 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" block size="lg" variant="accent" loading={isSubmitting} loadingText="Signing in">
          Sign in
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-muted">
        New here?{" "}
        <Link href="/register" className="font-semibold text-lagoon-700 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
