"use client";

import * as React from "react";
import Link from "next/link";
import { useForm, Controller, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/components/ui/reduced-motion-context";
import {
  MapPin,
  Users,
  Sparkles,
  UserRound,
  Check,
  ArrowLeft,
  ArrowRight,
  PartyPopper,
} from "lucide-react";
import { customTripSchema, type CustomTripInput } from "@/lib/validation";
import { submitCustomTrip } from "@/server/actions/enquiry";
import { Button } from "@/components/ui/button";
import { Checkbox, ErrorSummary, Field, Input, Select, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { ACTIVITY_CATEGORIES, HOTEL_CATEGORIES, TRIP_TYPES } from "@/config/site";
import { cn, futureDateInput, toDateInput } from "@/lib/utils";

const STEPS = [
  { key: "where", label: "Where & when", Icon: MapPin },
  { key: "who", label: "Who & budget", Icon: Users },
  { key: "style", label: "Style & extras", Icon: Sparkles },
  { key: "you", label: "Your details", Icon: UserRound },
] as const;

/** Fields validated before each step is allowed to advance. */
const STEP_FIELDS: FieldPath<CustomTripInput>[][] = [
  ["destination", "departureCity", "startDate", "durationDays"],
  ["adults", "children", "budgetPerPersonINR"],
  ["travelStyle", "hotelCategory"],
  ["name", "email", "phone", "consent"],
];

export function TripBuilder({
  destinations = [],
  defaultDestination,
  defaultTravelStyle,
  className,
}: {
  destinations?: { name: string; slug: string }[];
  defaultDestination?: string;
  defaultTravelStyle?: string;
  className?: string;
}) {
  const [step, setStep] = React.useState(0);
  const [reference, setReference] = React.useState<string | null>(null);
  const reduced = useReducedMotion();

  const {
    register,
    handleSubmit,
    trigger,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CustomTripInput>({
    resolver: zodResolver(customTripSchema),
    mode: "onTouched",
    defaultValues: {
      destination: defaultDestination ?? "",
      departureCity: "",
      startDate: futureDateInput(30),
      flexibleDates: true,
      durationDays: 7,
      adults: 2,
      children: 0,
      budgetPerPersonINR: 80_000,
      travelStyle: TRIP_TYPES.some((t) => t.slug === defaultTravelStyle) ? defaultTravelStyle! : "",
      hotelCategory: 4,
      flightsRequired: true,
      visaRequired: false,
      activities: [],
      consent: false,
    },
  });

  const next = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const onSubmit = handleSubmit(async (values) => {
    const result = await submitCustomTrip(values);
    if (result.ok) {
      setReference(result.reference ?? "");
      reset();
      toast.success("Trip brief sent", result.message);
    } else {
      toast.error("Could not send your brief", result.message);
    }
  });

  if (reference) {
    return (
      <div
        className={cn(
          "flex flex-col items-center rounded-3xl border border-lagoon-100 bg-lagoon-50 p-10 text-center",
          className,
        )}
        role="status"
      >
        <span className="flex size-16 items-center justify-center rounded-2xl bg-lagoon-600 text-white">
          <PartyPopper className="size-7" aria-hidden />
        </span>
        <h3 className="mt-6 font-display text-2xl text-midnight-900">Your brief is with us</h3>
        <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-muted">
          Reference <span className="font-semibold text-midnight-900">{reference}</span>. A travel
          designer will build a first draft itinerary and send it over within 24 hours — no payment,
          no obligation.
        </p>
        <Button
          variant="outline"
          className="mt-7"
          onClick={() => {
            setReference(null);
            setStep(0);
          }}
        >
          Plan another trip
        </Button>
      </div>
    );
  }

  const errorList = Object.values(errors)
    .map((e) => (e as { message?: string })?.message)
    .filter(Boolean) as string[];

  return (
    <div className={cn("rounded-3xl border border-hairline bg-surface shadow-lift", className)}>
      {/* ------------------------------- Progress ------------------------------- */}
      <div className="border-b border-hairline px-6 py-5 sm:px-8">
        <ol className="flex items-center gap-2 sm:gap-3">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={s.key} className="flex flex-1 items-center gap-2 sm:gap-3">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full text-[0.8125rem] font-bold transition-colors duration-300",
                    done && "bg-lagoon-600 text-white",
                    active && "bg-midnight-900 text-white",
                    !done && !active && "bg-sand-100 text-midnight-400",
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  {done ? <Check className="size-4" aria-hidden /> : i + 1}
                </span>
                <span
                  className={cn(
                    "hidden text-sm font-semibold transition-colors sm:block",
                    active ? "text-midnight-900" : "text-midnight-400",
                  )}
                >
                  {s.label}
                </span>
                {i < STEPS.length - 1 ? (
                  <span
                    className={cn(
                      "h-px flex-1 transition-colors duration-500",
                      done ? "bg-lagoon-400" : "bg-hairline",
                    )}
                    aria-hidden
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
        <p className="sr-only" aria-live="polite">
          Step {step + 1} of {STEPS.length}: {STEPS[step].label}
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="px-6 py-7 sm:px-8">
        {errorList.length > 1 && step === STEPS.length - 1 ? (
          <div className="mb-5">
            <ErrorSummary errors={errorList} />
          </div>
        ) : null}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: -24 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* ---------------------------- Step 1: where ---------------------------- */}
            {step === 0 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Where would you like to go?" htmlFor="tb-dest" required error={errors.destination?.message}>
                  <Input
                    id="tb-dest"
                    list="tb-destinations"
                    placeholder="Bali, Kerala, Switzerland…"
                    invalid={Boolean(errors.destination)}
                    {...register("destination")}
                  />
                  <datalist id="tb-destinations">
                    {destinations.map((d) => (
                      <option key={d.slug} value={d.name} />
                    ))}
                  </datalist>
                </Field>

                <Field label="Departure city" htmlFor="tb-from" required error={errors.departureCity?.message}>
                  <Input
                    id="tb-from"
                    placeholder="Delhi"
                    invalid={Boolean(errors.departureCity)}
                    {...register("departureCity")}
                  />
                </Field>

                <Field label="Approximate start date" htmlFor="tb-start" required error={errors.startDate?.message}>
                  <Input
                    id="tb-start"
                    type="date"
                    min={toDateInput(new Date())}
                    invalid={Boolean(errors.startDate)}
                    {...register("startDate")}
                  />
                </Field>

                <Field
                  label="How many days?"
                  htmlFor="tb-days"
                  required
                  error={errors.durationDays?.message}
                >
                  <Input
                    id="tb-days"
                    type="number"
                    min={1}
                    max={60}
                    inputMode="numeric"
                    invalid={Boolean(errors.durationDays)}
                    {...register("durationDays")}
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Checkbox
                    id="tb-flex"
                    label="My dates are flexible by a few days — show me cheaper windows"
                    {...register("flexibleDates")}
                  />
                </div>
              </div>
            ) : null}

            {/* ----------------------------- Step 2: who ----------------------------- */}
            {step === 1 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Adults" htmlFor="tb-adults" required error={errors.adults?.message}>
                  <Input
                    id="tb-adults"
                    type="number"
                    min={1}
                    max={30}
                    inputMode="numeric"
                    invalid={Boolean(errors.adults)}
                    {...register("adults")}
                  />
                </Field>

                <Field label="Children" htmlFor="tb-children" error={errors.children?.message}>
                  <Input
                    id="tb-children"
                    type="number"
                    min={0}
                    max={20}
                    inputMode="numeric"
                    {...register("children")}
                  />
                </Field>

                <Field
                  label="Budget per person"
                  htmlFor="tb-budget"
                  required
                  hint="Indicative only — it just helps us pitch at the right level."
                  error={errors.budgetPerPersonINR?.message}
                  className="sm:col-span-2"
                >
                  <Controller
                    control={control}
                    name="budgetPerPersonINR"
                    render={({ field }) => (
                      <div>
                        <input
                          id="tb-budget"
                          type="range"
                          min={20_000}
                          max={600_000}
                          step={10_000}
                          value={Number(field.value) || 20_000}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className="w-full accent-lagoon-600"
                          aria-valuetext={`₹${Number(field.value).toLocaleString("en-IN")} per person`}
                        />
                        <div className="mt-2 flex items-center justify-between text-xs text-muted">
                          <span>₹20,000</span>
                          <span className="text-base font-bold text-midnight-900">
                            ₹{Number(field.value || 0).toLocaleString("en-IN")}
                          </span>
                          <span>₹6,00,000+</span>
                        </div>
                      </div>
                    )}
                  />
                </Field>
              </div>
            ) : null}

            {/* ---------------------------- Step 3: style ---------------------------- */}
            {step === 2 ? (
              <div className="space-y-6">
                <Field label="Travel style" htmlFor="tb-style" required error={errors.travelStyle?.message}>
                  <Controller
                    control={control}
                    name="travelStyle"
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Travel style">
                        {TRIP_TYPES.map((t) => (
                          <button
                            key={t.slug}
                            type="button"
                            role="radio"
                            aria-checked={field.value === t.slug}
                            onClick={() => field.onChange(t.slug)}
                            className={cn(
                              "rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors",
                              field.value === t.slug
                                ? "border-midnight-900 bg-midnight-900 text-white"
                                : "border-hairline text-midnight-700 hover:border-midnight-300 hover:bg-sand-50",
                            )}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    )}
                  />
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Hotel category" htmlFor="tb-hotel" required error={errors.hotelCategory?.message}>
                    <Select id="tb-hotel" {...register("hotelCategory")}>
                      {HOTEL_CATEGORIES.map((h) => (
                        <option key={h.value} value={h.value}>
                          {h.label}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <div className="flex flex-col justify-end gap-3 pb-1">
                    <Checkbox id="tb-flights" label="I need flights included" {...register("flightsRequired")} />
                    <Checkbox id="tb-visa" label="I need visa assistance" {...register("visaRequired")} />
                  </div>
                </div>

                <Field label="Experiences you'd like" htmlFor="tb-activities">
                  <Controller
                    control={control}
                    name="activities"
                    render={({ field }) => {
                      const selected: string[] = field.value ?? [];
                      return (
                        <div className="flex flex-wrap gap-2">
                          {ACTIVITY_CATEGORIES.map((c) => {
                            const on = selected.includes(c.slug);
                            return (
                              <button
                                key={c.slug}
                                type="button"
                                aria-pressed={on}
                                onClick={() =>
                                  field.onChange(
                                    on
                                      ? selected.filter((s) => s !== c.slug)
                                      : [...selected, c.slug],
                                  )
                                }
                                className={cn(
                                  "rounded-full border px-3.5 py-2 text-[0.8125rem] font-medium transition-colors",
                                  on
                                    ? "border-lagoon-500 bg-lagoon-50 text-lagoon-800"
                                    : "border-hairline text-midnight-600 hover:bg-sand-50",
                                )}
                              >
                                {c.label}
                              </button>
                            );
                          })}
                        </div>
                      );
                    }}
                  />
                </Field>

                <Field label="Anything else we should build around?" htmlFor="tb-requests">
                  <Textarea
                    id="tb-requests"
                    rows={3}
                    placeholder="Anniversary trip, vegetarian meals, one parent with limited mobility, no early mornings…"
                    {...register("specialRequests")}
                  />
                </Field>
              </div>
            ) : null}

            {/* ----------------------------- Step 4: you ----------------------------- */}
            {step === 3 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Your name" htmlFor="tb-name" required error={errors.name?.message} className="sm:col-span-2">
                  <Input id="tb-name" autoComplete="name" invalid={Boolean(errors.name)} {...register("name")} />
                </Field>

                <Field label="Email" htmlFor="tb-email" required error={errors.email?.message}>
                  <Input
                    id="tb-email"
                    type="email"
                    autoComplete="email"
                    invalid={Boolean(errors.email)}
                    {...register("email")}
                  />
                </Field>

                <Field label="Phone" htmlFor="tb-phone" required error={errors.phone?.message}>
                  <Input
                    id="tb-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    invalid={Boolean(errors.phone)}
                    {...register("phone")}
                  />
                </Field>

                <div className="hidden" aria-hidden>
                  <input tabIndex={-1} autoComplete="off" {...register("website")} />
                </div>

                <div className="sm:col-span-2">
                  <Checkbox
                    id="tb-consent"
                    label={
                      <>
                        I agree to be contacted about this trip and accept the{" "}
                        <Link href="/legal/privacy-policy" className="underline hover:no-underline">
                          privacy policy
                        </Link>
                        .
                      </>
                    }
                    {...register("consent")}
                  />
                  {errors.consent ? (
                    <p role="alert" className="mt-1.5 text-xs text-red-600">
                      {errors.consent.message}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>

        {/* -------------------------------- Actions -------------------------------- */}
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-hairline pt-6">
          <Button type="button" variant="ghost" onClick={back} disabled={step === 0}>
            <ArrowLeft aria-hidden />
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button type="button" variant="primary" size="lg" onClick={next}>
              Continue
              <ArrowRight aria-hidden />
            </Button>
          ) : (
            <Button
              type="submit"
              variant="accent"
              size="lg"
              loading={isSubmitting}
              loadingText="Sending brief"
            >
              Request My Travel Plan
              <ArrowRight aria-hidden />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
