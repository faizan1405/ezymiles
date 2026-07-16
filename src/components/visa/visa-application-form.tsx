"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ShieldAlert } from "lucide-react";

import { visaApplicationSchema, type VisaApplicationInput } from "@/lib/validation";
import { submitVisaApplication } from "@/server/actions/visa";
import { Button } from "@/components/ui/button";
import { Checkbox, ErrorSummary, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Price } from "@/components/ui/price";
import { toast } from "@/components/ui/toast";
import { toDateInput } from "@/lib/utils";

export interface VisaTypeOption {
  type: string;
  label: string;
  governmentFeeINR: number;
  serviceFeeINR: number;
  processingTimeDays: string;
}

export function VisaApplicationForm({
  countrySlug,
  countryName,
  visaTypes,
  defaultType,
}: {
  countrySlug: string;
  countryName: string;
  visaTypes: VisaTypeOption[];
  defaultType?: string;
}) {
  const [reference, setReference] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<VisaApplicationInput>({
    resolver: zodResolver(visaApplicationSchema),
    defaultValues: {
      visaCountrySlug: countrySlug,
      visaType: defaultType ?? visaTypes[0]?.type ?? "tourist",
      nationality: "Indian",
      travellerCount: 1,
      consent: false,
    },
  });

  const selectedType = watch("visaType");
  const travellerCount = Number(watch("travellerCount")) || 1;

  const active = visaTypes.find((v) => v.type === selectedType) ?? visaTypes[0];
  const estimate = active ? (active.governmentFeeINR + active.serviceFeeINR) * travellerCount : 0;

  const onSubmit = handleSubmit(async (values) => {
    const result = await submitVisaApplication({ ...values, visaCountrySlug: countrySlug });

    if (result.ok) {
      setReference(result.reference ?? "");
      reset();
      toast.success("Visa request sent", result.message);
    } else {
      toast.error("Could not send request", result.message);
    }
  });

  if (reference) {
    return (
      <div className="rounded-2xl border border-lagoon-100 bg-lagoon-50 p-8 text-center" role="status">
        <CheckCircle2 className="mx-auto size-10 text-lagoon-600" aria-hidden />
        <h3 className="mt-4 text-xl text-midnight-900">Request received</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Your reference is <span className="font-semibold text-midnight-900">{reference}</span>. Keep
          it — you can track your application status with it at any time.
        </p>
        <Button variant="outline" className="mt-5" onClick={() => setReference(null)}>
          Submit another application
        </Button>
      </div>
    );
  }

  const errorList = Object.values(errors)
    .map((e) => (e as { message?: string })?.message)
    .filter(Boolean) as string[];

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {errorList.length > 1 ? <ErrorSummary errors={errorList} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Visa type" htmlFor="v-type" required error={errors.visaType?.message}>
          <Select id="v-type" {...register("visaType")}>
            {visaTypes.map((v) => (
              <option key={v.type} value={v.type}>
                {v.label || v.type} — {v.processingTimeDays}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Nationality" htmlFor="v-nat" required error={errors.nationality?.message}>
          <Select id="v-nat" {...register("nationality")}>
            <option value="Indian">Indian</option>
            <option value="NRI / OCI">NRI / OCI</option>
            <option value="Other">Other</option>
          </Select>
        </Field>
      </div>

      <Field label="Full name (as on passport)" htmlFor="v-name" required error={errors.applicantName?.message}>
        <Input
          id="v-name"
          autoComplete="name"
          invalid={Boolean(errors.applicantName)}
          {...register("applicantName")}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" htmlFor="v-email" required error={errors.email?.message}>
          <Input
            id="v-email"
            type="email"
            autoComplete="email"
            invalid={Boolean(errors.email)}
            {...register("email")}
          />
        </Field>

        <Field label="Phone" htmlFor="v-phone" required error={errors.phone?.message}>
          <Input
            id="v-phone"
            type="tel"
            autoComplete="tel"
            invalid={Boolean(errors.phone)}
            {...register("phone")}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Passport number" htmlFor="v-pp" error={errors.passportNumber?.message}>
          <Input id="v-pp" {...register("passportNumber")} />
        </Field>

        <Field label="Intended travel date" htmlFor="v-date">
          <Input id="v-date" type="date" min={toDateInput(new Date())} {...register("travelDate")} />
        </Field>

        <Field label="Applicants" htmlFor="v-count" required error={errors.travellerCount?.message}>
          <Select id="v-count" {...register("travellerCount")}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Anything we should know?" htmlFor="v-msg" error={errors.message?.message}>
        <Textarea
          id="v-msg"
          rows={3}
          placeholder="Previous refusals, tight timelines, existing appointments…"
          {...register("message")}
        />
      </Field>

      <div className="hidden" aria-hidden>
        <input tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      {/* Estimate, derived from the same fee table the server uses. */}
      {active ? (
        <div className="rounded-2xl bg-sand-50 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted">Estimated total</span>
            <Price amountINR={estimate} className="text-xl" />
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            {travellerCount} applicant{travellerCount === 1 ? "" : "s"} · government fee{" "}
            <Price amountINR={active.governmentFeeINR} className="text-xs font-semibold text-muted" /> +
            our service fee{" "}
            <Price amountINR={active.serviceFeeINR} className="text-xs font-semibold text-muted" /> each.
            Confirmed on our server before you pay.
          </p>
        </div>
      ) : null}

      <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden />
        <p className="text-xs leading-relaxed text-amber-900">
          Submitting this does not guarantee a visa. We prepare and lodge the application; the
          embassy or immigration authority for {countryName} makes the decision, and government fees
          are usually non-refundable regardless of the outcome.
        </p>
      </div>

      <Checkbox
        id="v-consent"
        label={
          <>
            I understand the above and accept the{" "}
            <Link href="/legal/visa-disclaimer" className="underline hover:no-underline">
              visa disclaimer
            </Link>{" "}
            and{" "}
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

      <Button
        type="submit"
        block
        size="lg"
        variant="accent"
        loading={isSubmitting}
        loadingText="Submitting"
      >
        Start my application
      </Button>
    </form>
  );
}
