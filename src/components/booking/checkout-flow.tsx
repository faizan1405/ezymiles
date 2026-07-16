"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Check,
  ShieldCheck,
  Tag,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Info,
  Lock,
  CalendarRange,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox, ErrorSummary, Field, Input, Select } from "@/components/ui/field";
import { Badge } from "@/components/ui/primitives";
import { Price } from "@/components/ui/price";
import { SmartImage } from "@/components/ui/smart-image";
import { toast } from "@/components/ui/toast";
import { getQuote, startBooking, checkCoupon } from "@/server/actions/booking";
import { travellerSchema, emailField, phoneField } from "@/lib/validation";
import { cn, formatDate } from "@/lib/utils";
import type { IPriceLine } from "@/models";
import type { BookingIntentInput } from "@/lib/validation";

/* -------------------------------------------------------------------------- */

const checkoutFormSchema = z.object({
  travellers: z.array(travellerSchema).min(1),
  contactEmail: emailField,
  contactPhone: phoneField,
  specialRequests: z.string().max(1000).optional(),
  acceptTerms: z.boolean().refine((v) => v === true, "Please accept the booking terms to continue"),
});

type CheckoutForm = z.input<typeof checkoutFormSchema>;

interface QuoteShape {
  lines: IPriceLine[];
  subtotalINR: number;
  discountINR: number;
  taxINR: number;
  feesINR: number;
  totalINR: number;
  deposit: { allowed: boolean; percent: number; amountINR: number };
  warnings: string[];
  coupon?: { code: string; discountINR: number };
}

export interface CheckoutItem {
  title: string;
  image?: string;
  subtitle: string;
  travelDate?: string;
  endDate?: string;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const STEPS = ["Travellers", "Review", "Payment"] as const;

export function CheckoutFlow({
  intent,
  item,
  brandName,
  defaults,
}: {
  intent: BookingIntentInput;
  item: CheckoutItem;
  brandName: string;
  defaults: { name?: string; email?: string; phone?: string };
}) {
  const router = useRouter();

  const [step, setStep] = React.useState(0);
  const [quote, setQuote] = React.useState<QuoteShape | null>(null);
  const [quoteError, setQuoteError] = React.useState<string | null>(null);
  const [couponCode, setCouponCode] = React.useState("");
  const [couponApplied, setCouponApplied] = React.useState<string | null>(null);
  const [couponChecking, setCouponChecking] = React.useState(false);
  const [paymentMode, setPaymentMode] = React.useState<"full" | "partial">("full");
  const [paying, setPaying] = React.useState(false);

  const adults = Number(intent.adults ?? 1);
  const children = Number(intent.children ?? 0);

  const [firstName = "", ...restName] = (defaults.name ?? "").split(" ");

  const {
    register,
    control,
    handleSubmit,
    trigger,
    formState: { errors },
    getValues,
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutFormSchema),
    mode: "onTouched",
    defaultValues: {
      contactEmail: defaults.email ?? "",
      contactPhone: defaults.phone ?? "",
      acceptTerms: false,
      travellers: [
        ...Array.from({ length: adults }, (_, i) => ({
          type: "adult" as const,
          title: "Mr" as const,
          firstName: i === 0 ? firstName : "",
          lastName: i === 0 ? restName.join(" ") : "",
          nationality: "Indian",
        })),
        ...Array.from({ length: children }, () => ({
          type: "child" as const,
          title: "Mstr" as const,
          firstName: "",
          lastName: "",
          nationality: "Indian",
        })),
      ],
    },
  });

  const { fields } = useFieldArray({ control, name: "travellers" });

  /* ------------------------------ Live quoting ------------------------------ */

  const refreshQuote = React.useCallback(
    async (opts: { coupon?: string; mode?: "full" | "partial" } = {}) => {
      const result = await getQuote({
        ...intent,
        couponCode: opts.coupon ?? couponApplied ?? undefined,
        paymentMode: opts.mode ?? paymentMode,
      });

      if (result.ok && result.quote) {
        setQuote(result.quote as QuoteShape);
        setQuoteError(null);
      } else {
        setQuoteError(result.message ?? "We couldn't price this booking.");
      }
    },
    [intent, couponApplied, paymentMode],
  );

  React.useEffect(() => {
    // Initial quote fetch on mount — refreshQuote itself calls setState
    // asynchronously after the request resolves, not synchronously here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshQuote();
    // Deliberately mount-only: refreshQuote is recreated every render, and
    // depending on it here would re-fire the quote fetch on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyCoupon = async () => {
    if (!quote || !couponCode.trim()) return;
    setCouponChecking(true);

    const result = await checkCoupon(couponCode.trim(), quote.subtotalINR, intent.type);

    if (result.ok) {
      setCouponApplied(couponCode.trim().toUpperCase());
      await refreshQuote({ coupon: couponCode.trim().toUpperCase() });
      toast.success("Coupon applied", result.message);
    } else {
      toast.error("Coupon not applied", result.message);
    }

    setCouponChecking(false);
  };

  const removeCoupon = async () => {
    setCouponApplied(null);
    setCouponCode("");
    await refreshQuote({ coupon: undefined });
  };

  const setMode = async (mode: "full" | "partial") => {
    setPaymentMode(mode);
    await refreshQuote({ mode });
  };

  /* -------------------------------- Payment -------------------------------- */

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

    const result = await startBooking({
      intent: { ...intent, couponCode: couponApplied ?? undefined, paymentMode },
      checkout: {
        travellers: values.travellers,
        contactEmail: values.contactEmail,
        contactPhone: values.contactPhone,
        specialRequests: values.specialRequests,
        acceptTerms: values.acceptTerms,
      },
    });

    if (!result.ok) {
      toast.error("Booking could not start", result.message ?? "Please try again.");
      setPaying(false);
      return;
    }

    // No gateway configured on this environment: the booking is held for manual follow-up.
    if (result.offline) {
      toast.info("Booking held", result.message ?? "");
      router.push(`/booking/confirmation/${result.reference}?held=1`);
      return;
    }

    if (!result.order) {
      router.push(`/booking/confirmation/${result.reference}`);
      return;
    }

    const loaded = await loadRazorpay();
    if (!loaded) {
      toast.error("Payment could not load", "Check your connection and try again. Nothing has been charged.");
      setPaying(false);
      return;
    }

    const rzp = new window.Razorpay!({
      key: result.order.publicKey,
      amount: Math.round(result.order.amountINR * 100),
      currency: "INR",
      name: brandName,
      description: item.title,
      order_id: result.order.orderId,
      image: undefined,
      prefill: {
        name: `${values.travellers[0].firstName} ${values.travellers[0].lastName}`.trim(),
        email: values.contactEmail,
        contact: values.contactPhone,
      },
      theme: { color: "#0f8484" },
      modal: {
        ondismiss: () => {
          setPaying(false);
          toast.info("Payment cancelled", "Your booking is held — you can retry from your account.");
        },
      },
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        // The browser saying "paid" proves nothing — the server verifies.
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
          toast.error("Payment could not be verified", data.error ?? "Please contact us with your reference.");
          router.push(`/booking/confirmation/${result.reference}?failed=1`);
        }
      },
    });

    rzp.open();
  });

  const next = async () => {
    const valid = await trigger(step === 0 ? ["travellers", "contactEmail", "contactPhone"] : []);
    if (valid) setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const errorList = Object.values(errors)
    .flatMap((e) => {
      if (Array.isArray(e)) {
        return e.flatMap((item) =>
          Object.values(item ?? {}).map((v) => (v as { message?: string })?.message),
        );
      }
      return [(e as { message?: string })?.message];
    })
    .filter(Boolean) as string[];

  const dueNow = quote
    ? paymentMode === "partial" && quote.deposit.allowed
      ? quote.deposit.amountINR
      : quote.totalINR
    : 0;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:gap-12">
      <div className="min-w-0">
        {/* ------------------------------- Progress ------------------------------- */}
        <ol className="mb-8 flex items-center gap-3">
          {STEPS.map((label, i) => (
            <li key={label} className="flex flex-1 items-center gap-3">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  i < step && "bg-lagoon-600 text-white",
                  i === step && "bg-midnight-900 text-white",
                  i > step && "bg-sand-100 text-midnight-400",
                )}
                aria-current={i === step ? "step" : undefined}
              >
                {i < step ? <Check className="size-4" aria-hidden /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-semibold sm:block",
                  i === step ? "text-midnight-900" : "text-midnight-400",
                )}
              >
                {label}
              </span>
              {i < STEPS.length - 1 ? (
                <span
                  className={cn("h-px flex-1", i < step ? "bg-lagoon-400" : "bg-hairline")}
                  aria-hidden
                />
              ) : null}
            </li>
          ))}
        </ol>

        {errorList.length > 1 ? (
          <div className="mb-6">
            <ErrorSummary errors={[...new Set(errorList)]} />
          </div>
        ) : null}

        {/* ---------------------------- Step 1: travellers ---------------------------- */}
        <div className={cn(step !== 0 && "hidden")}>
          <h2 className="text-2xl text-midnight-900">Who&apos;s travelling?</h2>
          <p className="mt-2 text-sm text-muted">
            Names must match the passport or government ID you&apos;ll travel with.
          </p>

          <div className="mt-6 space-y-5">
            {fields.map((field, i) => (
              <fieldset key={field.id} className="rounded-2xl border border-hairline bg-white p-5">
                <legend className="px-2 text-[0.6875rem] font-bold uppercase tracking-wider text-lagoon-700">
                  {getValues(`travellers.${i}.type`) === "child" ? "Child" : "Adult"} {i + 1}
                  {i === 0 ? " · Lead traveller" : ""}
                </legend>

                <div className="grid gap-4 sm:grid-cols-[6.5rem_1fr_1fr]">
                  <Field label="Title" htmlFor={`t-${i}-title`}>
                    <Select id={`t-${i}-title`} {...register(`travellers.${i}.title`)}>
                      {["Mr", "Ms", "Mrs", "Mstr", "Dr"].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field
                    label="First name"
                    htmlFor={`t-${i}-first`}
                    required
                    error={errors.travellers?.[i]?.firstName?.message}
                  >
                    <Input
                      id={`t-${i}-first`}
                      autoComplete={i === 0 ? "given-name" : "off"}
                      invalid={Boolean(errors.travellers?.[i]?.firstName)}
                      {...register(`travellers.${i}.firstName`)}
                    />
                  </Field>

                  <Field
                    label="Last name"
                    htmlFor={`t-${i}-last`}
                    required
                    error={errors.travellers?.[i]?.lastName?.message}
                  >
                    <Input
                      id={`t-${i}-last`}
                      autoComplete={i === 0 ? "family-name" : "off"}
                      invalid={Boolean(errors.travellers?.[i]?.lastName)}
                      {...register(`travellers.${i}.lastName`)}
                    />
                  </Field>

                  <Field label="Date of birth" htmlFor={`t-${i}-dob`}>
                    <Input id={`t-${i}-dob`} type="date" {...register(`travellers.${i}.dateOfBirth`)} />
                  </Field>

                  <Field label="Nationality" htmlFor={`t-${i}-nat`}>
                    <Input id={`t-${i}-nat`} {...register(`travellers.${i}.nationality`)} />
                  </Field>

                  <Field
                    label="Passport number"
                    htmlFor={`t-${i}-passport`}
                    hint={i === 0 ? "Needed for international trips" : undefined}
                  >
                    <Input id={`t-${i}-passport`} {...register(`travellers.${i}.passportNumber`)} />
                  </Field>
                </div>
              </fieldset>
            ))}

            <fieldset className="rounded-2xl border border-hairline bg-white p-5">
              <legend className="px-2 text-[0.6875rem] font-bold uppercase tracking-wider text-lagoon-700">
                Contact details
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email" htmlFor="c-email" required error={errors.contactEmail?.message}>
                  <Input
                    id="c-email"
                    type="email"
                    autoComplete="email"
                    invalid={Boolean(errors.contactEmail)}
                    {...register("contactEmail")}
                  />
                </Field>
                <Field label="Phone" htmlFor="c-phone" required error={errors.contactPhone?.message}>
                  <Input
                    id="c-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    invalid={Boolean(errors.contactPhone)}
                    {...register("contactPhone")}
                  />
                </Field>
              </div>
            </fieldset>
          </div>

          <div className="mt-8 flex justify-end">
            <Button type="button" size="lg" onClick={next}>
              Continue to review
              <ArrowRight aria-hidden />
            </Button>
          </div>
        </div>

        {/* ------------------------------ Step 2: review ------------------------------ */}
        <div className={cn(step !== 1 && "hidden")}>
          <h2 className="text-2xl text-midnight-900">Review your booking</h2>

          <div className="mt-6 space-y-5">
            <div className="rounded-2xl border border-hairline bg-white p-5">
              <h3 className="text-sm font-bold text-midnight-900">Add-ons and extras</h3>

              <div className="mt-4">
                <label htmlFor="coupon" className="text-[0.8125rem] font-semibold text-midnight-800">
                  Coupon code
                </label>
                {couponApplied ? (
                  <div className="mt-1.5 flex items-center justify-between rounded-xl border border-lagoon-200 bg-lagoon-50 px-4 py-3">
                    <span className="flex items-center gap-2 text-sm font-semibold text-lagoon-900">
                      <Tag className="size-4" aria-hidden />
                      {couponApplied} applied
                    </span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-xs font-semibold text-lagoon-800 underline hover:no-underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="mt-1.5 flex gap-2">
                    <Input
                      id="coupon"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="uppercase"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={applyCoupon}
                      loading={couponChecking}
                      loadingText="Checking"
                      className="shrink-0"
                    >
                      Apply
                    </Button>
                  </div>
                )}
              </div>

              <Field
                label="Special requests"
                htmlFor="requests"
                hint="Dietary needs, accessibility, an anniversary — tell us and we'll pass it on."
                className="mt-5"
              >
                <Input id="requests" placeholder="Optional" {...register("specialRequests")} />
              </Field>
            </div>

            {/* Payment mode */}
            {quote?.deposit.allowed ? (
              <fieldset className="rounded-2xl border border-hairline bg-white p-5">
                <legend className="px-2 text-sm font-bold text-midnight-900">Payment option</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <ModeCard
                    active={paymentMode === "full"}
                    onClick={() => setMode("full")}
                    title="Pay in full"
                    amount={quote.totalINR}
                    note="Done and dusted — nothing left to pay."
                  />
                  <ModeCard
                    active={paymentMode === "partial"}
                    onClick={() => setMode("partial")}
                    title={`Pay ${quote.deposit.percent}% deposit`}
                    amount={quote.deposit.amountINR}
                    note={`Balance of ${""}`}
                    balance={quote.totalINR - quote.deposit.amountINR}
                  />
                </div>
              </fieldset>
            ) : null}
          </div>

          <div className="mt-8 flex justify-between gap-3">
            <Button type="button" variant="ghost" onClick={() => setStep(0)}>
              <ArrowLeft aria-hidden />
              Back
            </Button>
            <Button type="button" size="lg" onClick={() => setStep(2)}>
              Continue to payment
              <ArrowRight aria-hidden />
            </Button>
          </div>
        </div>

        {/* ----------------------------- Step 3: payment ----------------------------- */}
        <div className={cn(step !== 2 && "hidden")}>
          <h2 className="text-2xl text-midnight-900">Confirm and pay</h2>

          <div className="mt-6 rounded-2xl border border-hairline bg-white p-5">
            <div className="flex items-start gap-3 rounded-xl bg-sand-50 p-4">
              <Lock className="mt-0.5 size-4 shrink-0 text-lagoon-700" aria-hidden />
              <p className="text-[0.8125rem] leading-relaxed text-muted">
                You&apos;ll pay on the gateway&apos;s secure checkout. We never see or store your card
                details, and every payment is verified on our server before your booking is confirmed.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <Checkbox
                id="terms"
                aria-invalid={Boolean(errors.acceptTerms)}
                label={
                  <>
                    I have read and accept the{" "}
                    <Link href="/legal/booking-terms" className="underline hover:no-underline" target="_blank">
                      booking terms
                    </Link>
                    , the{" "}
                    <Link href="/legal/cancellation-policy" className="underline hover:no-underline" target="_blank">
                      cancellation policy
                    </Link>{" "}
                    and the{" "}
                    <Link href="/legal/privacy-policy" className="underline hover:no-underline" target="_blank">
                      privacy policy
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
              size="xl"
              variant="accent"
              className="mt-6"
              loading={paying}
              loadingText="Opening secure checkout"
              disabled={!quote || Boolean(quoteError)}
            >
              Pay <Price amountINR={dueNow} className="text-white" /> securely
            </Button>

            <p className="mt-3 text-center text-xs text-muted">
              You will not be charged until you confirm on the payment page.
            </p>
          </div>

          <div className="mt-6 flex justify-start">
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft aria-hidden />
              Back to review
            </Button>
          </div>
        </div>
      </div>

      {/* --------------------------------- Summary -------------------------------- */}
      <aside className="lg:sticky lg:top-28 lg:h-fit">
        <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-tile">
          <div className="flex gap-3 border-b border-hairline p-4">
            {item.image ? (
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl">
                <SmartImage src={item.image} alt={item.title} fill sizes="64px" className="object-cover" />
              </div>
            ) : null}
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-semibold text-midnight-900">{item.title}</p>
              <p className="mt-0.5 text-xs text-muted">{item.subtitle}</p>
            </div>
          </div>

          {item.travelDate ? (
            <div className="flex items-center gap-2 border-b border-hairline px-4 py-3 text-xs text-muted">
              <CalendarRange className="size-3.5 text-lagoon-600" aria-hidden />
              {formatDate(item.travelDate)}
              {item.endDate ? ` → ${formatDate(item.endDate)}` : ""}
            </div>
          ) : null}

          <div className="p-4">
            {quoteError ? (
              <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                {quoteError}
              </p>
            ) : !quote ? (
              <p className="flex items-center gap-2 text-xs text-muted">
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Calculating…
              </p>
            ) : (
              <>
                <dl className="space-y-2">
                  {quote.lines.map((line, i) => (
                    <div key={`${line.label}-${i}`} className="flex items-baseline justify-between gap-3 text-xs">
                      <dt className={cn("text-muted", line.kind === "discount" && "text-emerald-700")}>
                        {line.label}
                      </dt>
                      <dd className={cn("shrink-0 tabular-nums", line.kind === "discount" && "text-emerald-700")}>
                        <Price amountINR={line.amountINR} className="text-xs font-medium" />
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-4 flex items-baseline justify-between border-t border-hairline pt-4">
                  <span className="text-sm font-bold text-midnight-900">Total</span>
                  <Price amountINR={quote.totalINR} className="text-xl" />
                </div>

                {paymentMode === "partial" && quote.deposit.allowed ? (
                  <div className="mt-3 rounded-xl bg-lagoon-50 p-3">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-semibold text-lagoon-900">Due now</span>
                      <Price amountINR={quote.deposit.amountINR} className="text-base text-lagoon-900" />
                    </div>
                    <div className="mt-1 flex items-baseline justify-between text-xs text-lagoon-700">
                      <span>Balance later</span>
                      <Price
                        amountINR={quote.totalINR - quote.deposit.amountINR}
                        className="text-xs font-medium text-lagoon-700"
                      />
                    </div>
                  </div>
                ) : null}

                {quote.warnings.length ? (
                  <ul className="mt-4 space-y-1.5 border-t border-hairline pt-4">
                    {quote.warnings.map((w) => (
                      <li key={w} className="flex items-start gap-1.5 text-[0.6875rem] leading-relaxed text-muted">
                        <Info className="mt-0.5 size-3 shrink-0" aria-hidden />
                        {w}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            )}

            <p className="mt-4 flex items-center justify-center gap-1.5 text-[0.6875rem] text-muted">
              <ShieldCheck className="size-3.5 text-lagoon-600" aria-hidden />
              Prices recalculated on our server
            </p>
          </div>
        </div>

        {quote?.coupon ? (
          <Badge tone="success" className="mt-3">
            Coupon {quote.coupon.code} — you save{" "}
            <Price amountINR={quote.coupon.discountINR} className="text-[0.6875rem] font-bold text-emerald-800" />
          </Badge>
        ) : null}
      </aside>
    </form>
  );
}

function ModeCard({
  active,
  onClick,
  title,
  amount,
  note,
  balance,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  amount: number;
  note: string;
  balance?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-xl border p-4 text-left transition-colors",
        active ? "border-lagoon-500 bg-lagoon-50" : "border-hairline hover:bg-sand-50",
      )}
    >
      <p className="text-sm font-semibold text-midnight-900">{title}</p>
      <Price amountINR={amount} className="mt-1 text-lg" />
      <p className="mt-1 text-xs text-muted">
        {balance !== undefined ? (
          <>
            Balance of <Price amountINR={balance} className="text-xs font-semibold text-muted" /> due before
            travel.
          </>
        ) : (
          note
        )}
      </p>
    </button>
  );
}
