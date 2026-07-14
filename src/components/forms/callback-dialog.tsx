"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PhoneCall } from "lucide-react";
import { callbackSchema, type CallbackInput } from "@/lib/validation";
import { submitCallback } from "@/server/actions/enquiry";
import { Dialog, DialogContent } from "@/components/ui/overlays";
import { Button } from "@/components/ui/button";
import { Checkbox, ErrorSummary, Field, Input, Select, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";

export interface CallbackSubject {
  kind: string;
  refId?: string;
  title?: string;
  slug?: string;
}

const TIME_SLOTS = [
  "As soon as possible",
  "Morning (9 am – 12 pm)",
  "Afternoon (12 pm – 4 pm)",
  "Evening (4 pm – 8 pm)",
];

export function CallbackDialog({
  open,
  onOpenChange,
  subject,
  trigger,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  subject?: CallbackSubject;
  trigger?: React.ReactNode;
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen;

  const pathname = usePathname();
  const [submitted, setSubmitted] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CallbackInput>({
    resolver: zodResolver(callbackSchema),
    defaultValues: { countryCode: "+91", consent: false, preferredTime: TIME_SLOTS[0] },
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await submitCallback({
      ...values,
      subject,
      sourcePage: pathname,
    });

    if (result.ok) {
      setSubmitted(result.reference ?? "");
      reset();
      toast.success("Callback requested", result.message);
    } else {
      toast.error("Could not send request", result.message);
    }
  });

  const errorList = Object.values(errors)
    .map((e) => e?.message)
    .filter(Boolean) as string[];

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setTimeout(() => setSubmitted(null), 250);
      }}
    >
      {trigger}
      <DialogContent
        title={submitted ? "We'll call you shortly" : "Request a callback"}
        description={
          submitted
            ? undefined
            : subject?.title
              ? `About: ${subject.title}`
              : "Leave your number and a travel designer will call you back."
        }
      >
        {submitted ? (
          <div className="text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-lagoon-50 text-lagoon-600">
              <PhoneCall className="size-7" aria-hidden />
            </div>
            <p className="mt-5 text-[0.9375rem] text-muted">
              Your request is in. Reference{" "}
              <span className="font-semibold text-midnight-900">{submitted}</span>.
            </p>
            <Button className="mt-6" block onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {errorList.length > 1 ? <ErrorSummary errors={errorList} /> : null}

            <Field label="Your name" htmlFor="cb-name" required error={errors.name?.message}>
              <Input
                id="cb-name"
                autoComplete="name"
                placeholder="Priya Sharma"
                invalid={Boolean(errors.name)}
                {...register("name")}
              />
            </Field>

            <div className="grid grid-cols-[7rem_1fr] gap-3">
              <Field label="Code" htmlFor="cb-code">
                <Select id="cb-code" {...register("countryCode")}>
                  <option value="+91">+91 IN</option>
                  <option value="+971">+971 AE</option>
                  <option value="+44">+44 UK</option>
                  <option value="+1">+1 US</option>
                  <option value="+65">+65 SG</option>
                </Select>
              </Field>
              <Field label="Phone number" htmlFor="cb-phone" required error={errors.phone?.message}>
                <Input
                  id="cb-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="98765 43210"
                  invalid={Boolean(errors.phone)}
                  {...register("phone")}
                />
              </Field>
            </div>

            <Field
              label="Email (optional)"
              htmlFor="cb-email"
              hint="So we can send you the itinerary afterwards."
              error={errors.email?.message}
            >
              <Input
                id="cb-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                invalid={Boolean(errors.email)}
                {...register("email")}
              />
            </Field>

            <Field label="Best time to call" htmlFor="cb-time">
              <Select id="cb-time" {...register("preferredTime")}>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Anything we should know?" htmlFor="cb-message" error={errors.message?.message}>
              <Textarea
                id="cb-message"
                rows={3}
                placeholder="Dates, group size, budget — whatever helps."
                {...register("message")}
              />
            </Field>

            {/* Honeypot — hidden from humans and assistive tech. */}
            <div className="hidden" aria-hidden>
              <label htmlFor="cb-website">Website</label>
              <input id="cb-website" tabIndex={-1} autoComplete="off" {...register("website")} />
            </div>

            <Checkbox
              id="cb-consent"
              label={
                <>
                  I agree to be contacted and accept the{" "}
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
              variant="accent"
              size="lg"
              block
              loading={isSubmitting}
              loadingText="Sending"
            >
              Request callback
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
