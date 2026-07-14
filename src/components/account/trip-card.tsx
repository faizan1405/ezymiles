"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarRange, Users, Download, CreditCard, XCircle, Loader2, Star } from "lucide-react";

import type { IBooking } from "@/models";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { Dialog, DialogContent } from "@/components/ui/overlays";
import { Field, Input, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { requestBookingCancellation, retryPayment } from "@/server/actions/booking";
import { submitReview } from "@/server/actions/review";
import { formatDate, cn } from "@/lib/utils";
import type { BookingStatus } from "@/models/types";

const STATUS_META: Record<BookingStatus, { label: string; tone: "success" | "warning" | "danger" | "neutral" | "info" }> = {
  draft: { label: "Draft", tone: "neutral" },
  pending_payment: { label: "Awaiting payment", tone: "warning" },
  confirmed: { label: "Confirmed", tone: "success" },
  completed: { label: "Completed", tone: "info" },
  cancellation_requested: { label: "Cancellation requested", tone: "warning" },
  cancelled: { label: "Cancelled", tone: "danger" },
  failed: { label: "Payment failed", tone: "danger" },
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export function TripCard({ booking, hasReview = false }: { booking: IBooking; hasReview?: boolean }) {
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [cancelling, setCancelling] = React.useState(false);
  const [retrying, setRetrying] = React.useState(false);

  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [reviewed, setReviewed] = React.useState(hasReview);
  const [rating, setRating] = React.useState(5);
  const [reviewTitle, setReviewTitle] = React.useState("");
  const [reviewBody, setReviewBody] = React.useState("");
  const [submittingReview, setSubmittingReview] = React.useState(false);

  const status = STATUS_META[booking.status] ?? STATUS_META.draft;
  const canCancel = booking.status === "confirmed" || booking.status === "pending_payment";
  const needsPayment = booking.status === "pending_payment" || booking.status === "failed";
  const isConfirmed = booking.status === "confirmed" || booking.status === "completed";
  const canReview = isConfirmed && !reviewed;

  const onSubmitReview = async () => {
    setSubmittingReview(true);
    const result = await submitReview({
      bookingId: String(booking._id),
      rating,
      title: reviewTitle,
      body: reviewBody,
    });

    if (result.ok) {
      toast.success("Review submitted", result.message);
      setReviewOpen(false);
      setReviewed(true);
    } else {
      toast.error("Could not submit review", result.message);
    }

    setSubmittingReview(false);
  };

  const onCancel = async () => {
    setCancelling(true);
    const result = await requestBookingCancellation(String(booking._id), reason);

    if (result.ok) {
      toast.success("Cancellation requested", result.message);
      setCancelOpen(false);
    } else {
      toast.error("Could not request cancellation", result.message);
    }

    setCancelling(false);
  };

  const onRetryPayment = async () => {
    setRetrying(true);

    const result = await retryPayment(String(booking._id));

    if (!result.ok || !result.order) {
      toast.error("Could not start payment", result.message ?? "Please try again.");
      setRetrying(false);
      return;
    }

    const loaded = await new Promise<boolean>((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

    if (!loaded) {
      toast.error("Payment could not load", "Nothing has been charged.");
      setRetrying(false);
      return;
    }

    const rzp = new window.Razorpay!({
      key: result.order.publicKey,
      amount: Math.round(result.order.amountINR * 100),
      currency: "INR",
      order_id: result.order.orderId,
      name: booking.item.title,
      theme: { color: "#0f8484" },
      modal: { ondismiss: () => setRetrying(false) },
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

        const data = (await verify.json()) as { ok: boolean; error?: string };

        if (data.ok) {
          toast.success("Payment received", "Your booking is confirmed.");
          window.location.reload();
        } else {
          toast.error("Payment could not be verified", data.error ?? "Contact us with your reference.");
          setRetrying(false);
        }
      },
    });

    rzp.open();
  };

  return (
    <>
      <article className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-tile">
        <div className="flex flex-col gap-5 p-5 sm:flex-row">
          {booking.item.image ? (
            <div className="relative aspect-16/10 w-full shrink-0 overflow-hidden rounded-xl sm:size-32 sm:aspect-auto">
              <SmartImage
                src={booking.item.image}
                alt={booking.item.title}
                fill
                sizes="128px"
                className="object-cover"
              />
            </div>
          ) : null}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.625rem] font-bold uppercase tracking-widest text-lagoon-700">
                  {booking.type} · {booking.reference}
                </p>
                <h3 className="mt-1 font-display text-lg leading-snug text-midnight-900">
                  {booking.item.title}
                </h3>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <Badge tone={status.tone}>{status.label}</Badge>
                {booking.isDemoData ? <Badge tone="warning">Demo</Badge> : null}
              </div>
            </div>

            <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted">
              {booking.travelDate ? (
                <div className="flex items-center gap-1.5">
                  <CalendarRange className="size-3.5" aria-hidden />
                  <dt className="sr-only">Travel date</dt>
                  <dd>
                    {formatDate(booking.travelDate)}
                    {booking.endDate ? ` → ${formatDate(booking.endDate)}` : ""}
                  </dd>
                </div>
              ) : null}
              <div className="flex items-center gap-1.5">
                <Users className="size-3.5" aria-hidden />
                <dt className="sr-only">Travellers</dt>
                <dd>
                  {booking.travellerCounts.adults} adults
                  {booking.travellerCounts.children > 0
                    ? `, ${booking.travellerCounts.children} children`
                    : ""}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <div>
                <Price amountINR={booking.pricing.totalINR} className="text-lg" />
                {booking.payment.balanceINR > 0 ? (
                  <p className="mt-0.5 text-xs font-semibold text-sunset-700">
                    <Price
                      amountINR={booking.payment.balanceINR}
                      className="text-xs font-semibold text-sunset-700"
                    />{" "}
                    still due
                    {booking.payment.dueDate ? ` by ${formatDate(booking.payment.dueDate)}` : ""}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-muted">Paid in full</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {needsPayment ? (
                  <Button size="sm" variant="accent" onClick={onRetryPayment} loading={retrying}>
                    <CreditCard aria-hidden />
                    Pay now
                  </Button>
                ) : null}

                {isConfirmed ? (
                  <>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/account/trips/${booking.reference}/voucher`}>
                        <Download aria-hidden />
                        Voucher
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/account/trips/${booking.reference}/invoice`}>Invoice</Link>
                    </Button>
                  </>
                ) : null}

                {canReview ? (
                  <Button size="sm" variant="outline" onClick={() => setReviewOpen(true)}>
                    <Star aria-hidden />
                    Write a review
                  </Button>
                ) : null}

                {canCancel ? (
                  <Button size="sm" variant="ghost" onClick={() => setCancelOpen(true)}>
                    <XCircle aria-hidden />
                    Cancel
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* -------------------------------- Cancel -------------------------------- */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent
          title="Request cancellation"
          description={`Booking ${booking.reference} — ${booking.item.title}`}
        >
          <p className="rounded-xl bg-amber-50 p-4 text-[0.8125rem] leading-relaxed text-amber-900">
            Cancellation charges apply per the policy you accepted at booking. We&apos;ll confirm the
            exact figure and the refund amount within 48 hours — nothing is deducted automatically.
          </p>

          <div className="mt-5">
            <label htmlFor="cancel-reason" className="text-[0.8125rem] font-semibold text-midnight-800">
              Why are you cancelling?
            </label>
            <Textarea
              id="cancel-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Change of plans, dates no longer work, found something else…"
              className="mt-1.5"
            />
          </div>

          <div className="mt-6 flex gap-2">
            <Button variant="outline" block onClick={() => setCancelOpen(false)}>
              Keep my booking
            </Button>
            <Button
              variant="danger"
              block
              onClick={onCancel}
              loading={cancelling}
              loadingText="Submitting"
              disabled={reason.trim().length < 5}
            >
              {cancelling ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Request cancellation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* -------------------------------- Review --------------------------------- */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent
          title="Write a review"
          description={`${booking.item.title} — ${booking.reference}`}
        >
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-[0.8125rem] font-semibold text-midnight-800">Your rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    className="p-0.5"
                  >
                    <Star
                      className={cn(
                        "size-6",
                        n <= rating ? "fill-gild-400 text-gild-400" : "text-sand-300",
                      )}
                      aria-hidden
                    />
                  </button>
                ))}
              </div>
            </div>

            <Field label="Title" htmlFor="review-title" required>
              <Input
                id="review-title"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="Sum up your trip in a few words"
                maxLength={120}
              />
            </Field>

            <Field label="Your review" htmlFor="review-body" required>
              <Textarea
                id="review-body"
                rows={4}
                value={reviewBody}
                onChange={(e) => setReviewBody(e.target.value)}
                placeholder="What stood out, what could be better — the details help other travellers."
                maxLength={2000}
              />
            </Field>

            <p className="text-xs text-muted">
              Your review is moderated before it appears publicly, usually within a couple of days.
            </p>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" block onClick={() => setReviewOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="accent"
                block
                onClick={onSubmitReview}
                loading={submittingReview}
                loadingText="Submitting"
                disabled={reviewTitle.trim().length < 3 || reviewBody.trim().length < 20}
              >
                Submit review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
