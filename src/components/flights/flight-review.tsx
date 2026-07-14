"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plane, Luggage, Briefcase, Lock, ShieldCheck, Clock } from "lucide-react";

import type { FlightOffer } from "@/server/flights/types";
import { Button } from "@/components/ui/button";
import { Checkbox, ErrorSummary, Field, Input, Select } from "@/components/ui/field";
import { Price } from "@/components/ui/price";
import { Badge } from "@/components/ui/primitives";
import { toast } from "@/components/ui/toast";
import { DataSourceBadge } from "./data-source-badge";
import { startFlightBooking } from "@/server/actions/flight-booking";
import { travellerSchema, emailField, phoneField } from "@/lib/validation";
import { formatMinutes } from "@/lib/utils";

const schema = z.object({
  travellers: z.array(travellerSchema).min(1),
  contactEmail: emailField,
  contactPhone: phoneField,
  acceptTerms: z.boolean().refine((v) => v === true, "Please accept the fare rules to continue"),
});

type FormValues = z.input<typeof schema>;

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export function FlightReview({
  offer,
  query,
  brandName,
  defaults,
}: {
  offer: FlightOffer;
  query: {
    tripType: "one_way" | "round_trip" | "multi_city";
    from: string;
    to: string;
    departDate: string;
    returnDate?: string;
    adults: number;
    children: number;
    infants: number;
    cabinClass: string;
  };
  brandName: string;
  defaults: { name?: string; email?: string };
}) {
  const router = useRouter();
  const [paying, setPaying] = React.useState(false);

  const [firstName = "", ...restName] = (defaults.name ?? "").split(" ");

  const {
    register,
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      contactEmail: defaults.email ?? "",
      contactPhone: "",
      acceptTerms: false,
      travellers: [
        ...Array.from({ length: query.adults }, (_, i) => ({
          type: "adult" as const,
          title: "Mr" as const,
          firstName: i === 0 ? firstName : "",
          lastName: i === 0 ? restName.join(" ") : "",
          nationality: "Indian",
        })),
        ...Array.from({ length: query.children }, () => ({
          type: "child" as const,
          title: "Mstr" as const,
          firstName: "",
          lastName: "",
          nationality: "Indian",
        })),
        ...Array.from({ length: query.infants }, () => ({
          type: "infant" as const,
          title: "Mstr" as const,
          firstName: "",
          lastName: "",
          nationality: "Indian",
        })),
      ],
    },
  });

  const { fields } = useFieldArray({ control, name: "travellers" });

  const loadRazorpay = () =>
    new Promise<boolean>((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const onSubmit = handleSubmit(async (values) => {
    setPaying(true);

    const result = await startFlightBooking({
      offerId: offer.id,
      query,
      travellers: values.travellers,
      contactEmail: values.contactEmail,
      contactPhone: values.contactPhone,
      acceptTerms: values.acceptTerms,
    });

    if (!result.ok) {
      toast.error("Could not hold that fare", result.message ?? "Please try again.");
      setPaying(false);
      return;
    }

    if (result.offline || !result.order) {
      toast.info("Flight held", result.message ?? "");
      router.push(`/booking/confirmation/${result.reference}?held=1`);
      return;
    }

    const loaded = await loadRazorpay();
    if (!loaded) {
      toast.error("Payment could not load", "Nothing has been charged. Please try again.");
      setPaying(false);
      return;
    }

    const rzp = new window.Razorpay!({
      key: result.order.publicKey,
      amount: Math.round(result.order.amountINR * 100),
      currency: "INR",
      name: brandName,
      description: `${query.from} → ${query.to}`,
      order_id: result.order.orderId,
      prefill: {
        name: `${values.travellers[0].firstName} ${values.travellers[0].lastName}`.trim(),
        email: values.contactEmail,
        contact: values.contactPhone,
      },
      theme: { color: "#0f8484" },
      modal: {
        ondismiss: () => {
          setPaying(false);
          toast.info("Payment cancelled", "Your booking is held — retry from your account.");
        },
      },
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        const verify = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: result.bookingId,
            paymentId: result.order!.paymentId,
            gatewayOrderId: response.razorpay_order_id,
            gatewayPaymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          }),
        });

        const data = (await verify.json()) as { ok: boolean; reference?: string; error?: string };

        if (data.ok && data.reference) {
          router.push(`/booking/confirmation/${data.reference}`);
        } else {
          setPaying(false);
          toast.error("Payment could not be verified", data.error ?? "Contact us with your reference.");
          router.push(`/booking/confirmation/${result.reference}?failed=1`);
        }
      },
    });

    rzp.open();
  });

  const errorList = Object.values(errors)
    .flatMap((e) =>
      Array.isArray(e)
        ? e.flatMap((item) => Object.values(item ?? {}).map((v) => (v as { message?: string })?.message))
        : [(e as { message?: string })?.message],
    )
    .filter(Boolean) as string[];

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-8 lg:grid-cols-[1fr_21rem] lg:gap-12">
      <div className="min-w-0 space-y-8">
        {errorList.length > 1 ? <ErrorSummary errors={[...new Set(errorList)]} /> : null}

        {/* --------------------------------- Fare --------------------------------- */}
        <section className="rounded-2xl border border-hairline bg-white p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl text-midnight-900">Your itinerary</h2>
            <DataSourceBadge source={offer.dataSource} />
          </div>

          <div className="space-y-5">
            <Leg title="Outbound" segments={offer.outbound} />
            {offer.inbound ? <Leg title="Return" segments={offer.inbound} /> : null}
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-hairline pt-5">
            <span className="flex items-center gap-1.5 rounded-lg bg-sand-100 px-3 py-2 text-xs font-medium text-midnight-700">
              <Luggage className="size-3.5" aria-hidden />
              {offer.fare.baggage}
            </span>
            <span className="flex items-center gap-1.5 rounded-lg bg-sand-100 px-3 py-2 text-xs font-medium text-midnight-700">
              <Briefcase className="size-3.5" aria-hidden />
              {offer.fare.cabinBaggage}
            </span>
            <Badge tone={offer.fare.refundable ? "success" : "neutral"} size="lg">
              {offer.fare.refundable ? "Refundable" : "Non-refundable"}
            </Badge>
          </div>
        </section>

        {/* ------------------------------ Fare rules ------------------------------ */}
        <section className="rounded-2xl border border-hairline bg-white p-6">
          <h2 className="text-lg text-midnight-900">Fare rules</h2>
          <ul className="mt-3 space-y-2">
            {offer.fare.fareRules.map((rule) => (
              <li key={rule} className="text-[0.875rem] leading-relaxed text-muted">
                • {rule}
              </li>
            ))}
          </ul>
        </section>

        {/* ------------------------------- Passengers ------------------------------ */}
        <section>
          <h2 className="text-xl text-midnight-900">Passenger details</h2>
          <p className="mt-2 text-sm text-muted">
            Names must exactly match the passport or ID you&apos;ll travel with — airlines don&apos;t
            allow name changes after ticketing.
          </p>

          <div className="mt-5 space-y-4">
            {fields.map((field, i) => (
              <fieldset key={field.id} className="rounded-2xl border border-hairline bg-white p-5">
                <legend className="px-2 text-[0.6875rem] font-bold uppercase tracking-wider text-lagoon-700">
                  {getValues(`travellers.${i}.type`)} {i + 1}
                </legend>

                <div className="grid gap-4 sm:grid-cols-[6.5rem_1fr_1fr]">
                  <Field label="Title" htmlFor={`f-${i}-title`}>
                    <Select id={`f-${i}-title`} {...register(`travellers.${i}.title`)}>
                      {["Mr", "Ms", "Mrs", "Mstr", "Dr"].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field
                    label="First name"
                    htmlFor={`f-${i}-first`}
                    required
                    error={errors.travellers?.[i]?.firstName?.message}
                  >
                    <Input
                      id={`f-${i}-first`}
                      invalid={Boolean(errors.travellers?.[i]?.firstName)}
                      {...register(`travellers.${i}.firstName`)}
                    />
                  </Field>

                  <Field
                    label="Last name"
                    htmlFor={`f-${i}-last`}
                    required
                    error={errors.travellers?.[i]?.lastName?.message}
                  >
                    <Input
                      id={`f-${i}-last`}
                      invalid={Boolean(errors.travellers?.[i]?.lastName)}
                      {...register(`travellers.${i}.lastName`)}
                    />
                  </Field>

                  <Field label="Date of birth" htmlFor={`f-${i}-dob`}>
                    <Input id={`f-${i}-dob`} type="date" {...register(`travellers.${i}.dateOfBirth`)} />
                  </Field>

                  <Field label="Passport number" htmlFor={`f-${i}-pp`}>
                    <Input id={`f-${i}-pp`} {...register(`travellers.${i}.passportNumber`)} />
                  </Field>

                  <Field label="Passport expiry" htmlFor={`f-${i}-ppx`}>
                    <Input id={`f-${i}-ppx`} type="date" {...register(`travellers.${i}.passportExpiry`)} />
                  </Field>
                </div>
              </fieldset>
            ))}

            <fieldset className="rounded-2xl border border-hairline bg-white p-5">
              <legend className="px-2 text-[0.6875rem] font-bold uppercase tracking-wider text-lagoon-700">
                Contact for the booking
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email" htmlFor="f-email" required error={errors.contactEmail?.message}>
                  <Input
                    id="f-email"
                    type="email"
                    autoComplete="email"
                    invalid={Boolean(errors.contactEmail)}
                    {...register("contactEmail")}
                  />
                </Field>
                <Field label="Phone" htmlFor="f-phone" required error={errors.contactPhone?.message}>
                  <Input
                    id="f-phone"
                    type="tel"
                    autoComplete="tel"
                    invalid={Boolean(errors.contactPhone)}
                    {...register("contactPhone")}
                  />
                </Field>
              </div>
            </fieldset>
          </div>
        </section>

        {/* -------------------------- Seats & baggage (later) ------------------------ */}
        <section className="rounded-2xl border border-dashed border-hairline bg-sand-50 p-6">
          <h2 className="text-lg text-midnight-900">Seats and extra baggage</h2>
          <p className="mt-2 text-[0.875rem] leading-relaxed text-muted">
            Seat maps and paid baggage are issued by the airline once a supplier is connected. Until
            then, tell us what you need after booking and we&apos;ll add it directly with the airline —
            you won&apos;t be charged here for something we can&apos;t actually deliver.
          </p>
        </section>
      </div>

      {/* -------------------------------- Summary -------------------------------- */}
      <aside className="lg:sticky lg:top-28 lg:h-fit">
        <div className="rounded-2xl border border-hairline bg-white p-5 shadow-tile">
          <h2 className="text-sm font-bold text-midnight-900">Fare summary</h2>

          <dl className="mt-4 space-y-2">
            <div className="flex justify-between text-xs">
              <dt className="text-muted">
                Base fare × {query.adults + query.children}
              </dt>
              <dd className="tabular-nums">
                <Price
                  amountINR={offer.fare.baseINR * (query.adults + query.children)}
                  className="text-xs font-medium"
                />
              </dd>
            </div>
            <div className="flex justify-between text-xs">
              <dt className="text-muted">Taxes & surcharges</dt>
              <dd className="tabular-nums">
                <Price
                  amountINR={offer.fare.taxesINR * (query.adults + query.children)}
                  className="text-xs font-medium"
                />
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex items-baseline justify-between border-t border-hairline pt-4">
            <span className="text-sm font-bold text-midnight-900">Total</span>
            <Price amountINR={offer.fare.totalForPartyINR} className="text-xl" />
          </div>

          <div className="mt-5 space-y-3 border-t border-hairline pt-5">
            <Checkbox
              id="fare-terms"
              aria-invalid={Boolean(errors.acceptTerms)}
              label={
                <>
                  I accept the fare rules and the{" "}
                  <Link href="/legal/booking-terms" target="_blank" className="underline hover:no-underline">
                    booking terms
                  </Link>
                  .
                </>
              }
              {...register("acceptTerms")}
            />
            {errors.acceptTerms ? (
              <p role="alert" className="text-xs text-red-600">
                {errors.acceptTerms.message}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            block
            size="lg"
            variant="accent"
            className="mt-5"
            loading={paying}
            loadingText="Opening checkout"
          >
            <Lock aria-hidden />
            Pay and hold
          </Button>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-[0.6875rem] text-muted">
            <ShieldCheck className="size-3.5 text-lagoon-600" aria-hidden />
            Fare re-checked on our server before charging
          </p>
        </div>
      </aside>
    </form>
  );
}

function Leg({ title, segments }: { title: string; segments: FlightOffer["outbound"] }) {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  return (
    <div>
      <p className="mb-2.5 flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-wider text-lagoon-700">
        <Plane className="size-3.5" aria-hidden />
        {title}
      </p>

      <ol className="space-y-2">
        {segments.map((s, i) => (
          <li key={`${s.flightNumber}-${i}`} className="rounded-xl bg-sand-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-midnight-900">
                {s.airlineName} · {s.flightNumber}
              </p>
              <p className="flex items-center gap-1 text-xs text-muted">
                <Clock className="size-3" aria-hidden />
                {formatMinutes(s.durationMinutes)}
              </p>
            </div>
            <div className="mt-2 grid gap-1 text-[0.8125rem] sm:grid-cols-2">
              <p className="text-muted">
                <span className="font-semibold text-midnight-800">{s.from}</span> · {fmt(s.departAt)}
              </p>
              <p className="text-muted sm:text-right">
                <span className="font-semibold text-midnight-800">{s.to}</span> · {fmt(s.arriveAt)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
