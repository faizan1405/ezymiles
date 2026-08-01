"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { enquirySchema, type EnquiryInput } from "@/lib/validation";
import { submitEnquiry, type ActionResult } from "@/server/actions/enquiry";
import { Button } from "@/components/ui/button";
import { Checkbox, ErrorSummary, Field, Input, Select, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import type { EnquiryType } from "@/models/types";
import { cn } from "@/lib/utils";

export function EnquiryForm({
  type = "general",
  subject,
  title = "Send an enquiry",
  submitLabel = "Send enquiry",
  compact = false,
  className,
  onSuccess,
}: {
  type?: EnquiryType;
  subject?: { kind: string; refId?: string; title?: string; slug?: string };
  title?: string;
  submitLabel?: string;
  compact?: boolean;
  className?: string;
  onSuccess?: (result: ActionResult) => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [reference, setReference] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EnquiryInput>({
    resolver: zodResolver(enquirySchema),
    defaultValues: { type, countryCode: "+91", consent: false, sourcePage: pathname },
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await submitEnquiry({
      ...values,
      type,
      subject,
      sourcePage: pathname,
      campaign: {
        utmSource: searchParams.get("utm_source") ?? undefined,
        utmMedium: searchParams.get("utm_medium") ?? undefined,
        utmCampaign: searchParams.get("utm_campaign") ?? undefined,
        utmTerm: searchParams.get("utm_term") ?? undefined,
        utmContent: searchParams.get("utm_content") ?? undefined,
      },
    });

    if (result.ok) {
      setReference(result.reference ?? "");
      reset();
      toast.success("Enquiry sent", result.message);
      onSuccess?.(result);
    } else {
      toast.error("Could not send enquiry", result.message);
    }
  });

  if (reference) {
    return (
      <div
        className={cn(
          "flex flex-col items-center rounded-2xl border border-lagoon-100 bg-lagoon-50 p-8 text-center",
          className,
        )}
        role="status"
      >
        <CheckCircle2 className="size-10 text-lagoon-600" aria-hidden />
        <h3 className="mt-4 text-xl text-midnight-900">Enquiry received</h3>
        <p className="mt-2 text-sm text-muted">
          Reference <span className="font-semibold text-midnight-900">{reference}</span>. A travel
          designer will be in touch within one business day.
        </p>
        <Button variant="outline" className="mt-5" onClick={() => setReference(null)}>
          Send another enquiry
        </Button>
      </div>
    );
  }

  const errorList = Object.values(errors)
    .map((e) => e?.message)
    .filter(Boolean) as string[];

  return (
    <form onSubmit={onSubmit} className={cn("space-y-4", className)} noValidate aria-label={title}>
      {errorList.length > 1 ? <ErrorSummary errors={errorList} /> : null}

      <Field label="Full name" htmlFor="eq-name" required error={errors.name?.message}>
        <Input
          id="eq-name"
          autoComplete="name"
          placeholder="Priya Sharma"
          invalid={Boolean(errors.name)}
          {...register("name")}
        />
      </Field>

      <div className={cn("grid gap-4", compact ? "grid-cols-1" : "sm:grid-cols-2")}>
        <Field label="Email" htmlFor="eq-email" required error={errors.email?.message}>
          <Input
            id="eq-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            invalid={Boolean(errors.email)}
            {...register("email")}
          />
        </Field>

        <div className="grid grid-cols-1 gap-2 xs:grid-cols-[6.5rem_1fr]">
          <Field label="Code" htmlFor="eq-code">
            <Select id="eq-code" {...register("countryCode")}>
              <option value="+91">+91</option>
              <option value="+971">+971</option>
              <option value="+44">+44</option>
              <option value="+1">+1</option>
              <option value="+65">+65</option>
            </Select>
          </Field>
          <Field label="Phone" htmlFor="eq-phone" required error={errors.phone?.message}>
            <Input
              id="eq-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="98765 43210"
              invalid={Boolean(errors.phone)}
              {...register("phone")}
            />
          </Field>
        </div>
      </div>

      <Field
        label="Tell us about your trip"
        htmlFor="eq-message"
        hint="Dates, travellers, budget, must-dos — anything helps."
        error={errors.message?.message}
      >
        <Textarea
          id="eq-message"
          rows={compact ? 3 : 4}
          placeholder="We're two adults looking at late October, flexible by a week…"
          {...register("message")}
        />
      </Field>

      <div className="hidden" aria-hidden>
        <label htmlFor="eq-website">Website</label>
        <input id="eq-website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <Checkbox
        id="eq-consent"
        label={
          <>
            I agree to be contacted about this enquiry and accept the{" "}
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

      <Button type="submit" variant="accent" size="lg" block loading={isSubmitting} loadingText="Sending">
        {submitLabel}
      </Button>

      <p className="text-center text-xs text-muted">
        No spam, no sales pressure. We reply within one business day.
      </p>
    </form>
  );
}
