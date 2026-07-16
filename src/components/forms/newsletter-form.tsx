"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Send } from "lucide-react";
import { newsletterSchema, type NewsletterInput } from "@/lib/validation";
import { subscribeNewsletter } from "@/server/actions/enquiry";
import { Button } from "@/components/ui/button";
import { Checkbox, Input } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function NewsletterForm({
  variant = "footer",
  source = "footer",
  className,
}: {
  variant?: "footer" | "card";
  source?: string;
  className?: string;
}) {
  const [done, setDone] = React.useState(false);
  const dark = variant === "footer";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<NewsletterInput>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: "", whatsappOptIn: false, consent: false, source },
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await subscribeNewsletter({ ...values, source });
    if (result.ok) {
      setDone(true);
      reset();
      toast.success("Subscribed", result.message);
    } else {
      toast.error("Could not subscribe", result.message);
    }
  });

  if (done) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl p-5",
          dark ? "bg-midnight-900 text-white" : "bg-lagoon-50 text-lagoon-900",
          className,
        )}
        role="status"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lagoon-500 text-white">
          <Check className="size-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold">You&apos;re on the list.</p>
          <p className={cn("text-xs", dark ? "text-midnight-200" : "text-lagoon-700")}>
            Look out for our next dispatch.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cn("w-full", className)} noValidate>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <Input
            id="newsletter-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "newsletter-email-error" : undefined}
            className={cn(
              "h-13",
              dark &&
                "border-midnight-700 bg-midnight-900 text-white placeholder:text-midnight-300 focus:border-lagoon-400 focus:ring-lagoon-400/20",
            )}
            {...register("email")}
          />
          {errors.email ? (
            <p id="newsletter-email-error" role="alert" className="mt-1.5 text-xs text-red-400">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          size="lg"
          variant={dark ? "accent" : "primary"}
          loading={isSubmitting}
          loadingText="Subscribing"
          className="shrink-0"
        >
          <Send aria-hidden />
          Subscribe
        </Button>
      </div>

      <div className="mt-4 space-y-2.5">
        <Checkbox
          id="newsletter-whatsapp"
          label={
            <span className={dark ? "text-midnight-200" : undefined}>
              Also send me travel updates on WhatsApp
            </span>
          }
          {...register("whatsappOptIn")}
        />
        <Checkbox
          id="newsletter-consent"
          label={
            <span className={dark ? "text-midnight-200" : undefined}>
              I agree to receive emails and accept the{" "}
              <Link href="/legal/privacy-policy" className="underline hover:no-underline">
                privacy policy
              </Link>
              .
            </span>
          }
          aria-invalid={Boolean(errors.consent)}
          {...register("consent")}
        />
        {errors.consent ? (
          <p role="alert" className="text-xs text-red-400">
            {errors.consent.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
