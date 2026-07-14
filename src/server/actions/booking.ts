"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { Booking, Payment } from "@/models";
import { getCurrentUser } from "@/lib/session";
import { guard } from "@/lib/rate-limit";
import { bookingIntentSchema, checkoutSchema } from "@/lib/validation";
import { quote, validateCoupon, PricingError } from "@/server/pricing";
import { createBooking, buildIdempotencyKey, requestCancellation } from "@/server/bookings";
import { getGateway } from "@/server/payments/gateway";
import { getSettings } from "@/lib/settings";
import { serialise } from "@/lib/utils";
import type { IPriceLine } from "@/models";

export interface QuoteResult {
  ok: boolean;
  message?: string;
  quote?: {
    lines: IPriceLine[];
    subtotalINR: number;
    discountINR: number;
    taxINR: number;
    feesINR: number;
    totalINR: number;
    deposit: { allowed: boolean; percent: number; amountINR: number };
    warnings: string[];
    coupon?: { code: string; discountINR: number };
  };
}

/**
 * Live quote for the booking widget. Purely informational — the same function
 * runs again inside createBooking, so a stale or tampered quote can never
 * become the amount actually charged.
 */
export async function getQuote(raw: unknown): Promise<QuoteResult> {
  const parsed = bookingIntentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid selection." };
  }

  try {
    const q = await quote(parsed.data);
    return {
      ok: true,
      quote: serialise({
        lines: q.lines,
        subtotalINR: q.subtotalINR,
        discountINR: q.discountINR,
        taxINR: q.taxINR,
        feesINR: q.feesINR,
        totalINR: q.totalINR,
        deposit: q.deposit,
        warnings: q.warnings,
        coupon: q.coupon,
      }),
    };
  } catch (error) {
    if (error instanceof PricingError) return { ok: false, message: error.message };
    console.error("[getQuote]", error);
    return { ok: false, message: "We couldn't price that just now. Please try again." };
  }
}

export async function checkCoupon(
  code: string,
  subtotalINR: number,
  bookingType: "package" | "hotel" | "activity" | "visa" | "flight" | "cab",
): Promise<{ ok: boolean; message: string; discountINR?: number }> {
  const limit = await guard("coupon", { limit: 12, windowSeconds: 60 });
  if (!limit.success) return { ok: false, message: "Too many attempts. Please wait a moment." };

  if (!code?.trim()) return { ok: false, message: "Enter a coupon code." };

  try {
    const result = await validateCoupon(code, { subtotalINR, bookingType });
    if (!result.ok) return { ok: false, message: result.reason };
    return {
      ok: true,
      message: `Coupon ${result.code} applied.`,
      discountINR: result.discountINR,
    };
  } catch (error) {
    console.error("[checkCoupon]", error);
    return { ok: false, message: "We couldn't check that coupon. Please try again." };
  }
}

/* -------------------------------------------------------------------------- */
/*                              Create a booking                               */
/* -------------------------------------------------------------------------- */

export interface StartBookingResult {
  ok: boolean;
  message?: string;
  bookingId?: string;
  reference?: string;
  /** Present only when a real gateway is configured. */
  order?: {
    gateway: string;
    orderId: string;
    amountINR: number;
    publicKey: string;
    paymentId: string;
  };
  /** True when no gateway is configured — the booking is held for manual follow-up. */
  offline?: boolean;
}

export async function startBooking(raw: unknown): Promise<StartBookingResult> {
  const limit = await guard("booking", { limit: 8, windowSeconds: 120 });
  if (!limit.success) {
    return { ok: false, message: "Too many booking attempts. Please wait a minute." };
  }

  const parsedIntent = bookingIntentSchema.safeParse((raw as { intent?: unknown })?.intent);
  const parsedCheckout = checkoutSchema
    .omit({ bookingId: true })
    .safeParse((raw as { checkout?: unknown })?.checkout);

  if (!parsedIntent.success) {
    return { ok: false, message: parsedIntent.error.issues[0]?.message ?? "Invalid selection." };
  }
  if (!parsedCheckout.success) {
    return { ok: false, message: parsedCheckout.error.issues[0]?.message ?? "Check the form." };
  }

  const intent = parsedIntent.data;
  const checkout = parsedCheckout.data;
  const user = await getCurrentUser();

  const lead = checkout.travellers[0];
  const contact = {
    name: `${lead.firstName} ${lead.lastName}`.trim(),
    email: checkout.contactEmail,
    phone: checkout.contactPhone,
  };

  try {
    const { booking, reused } = await createBooking({
      intent,
      contact,
      travellers: checkout.travellers,
      userId: user?.id,
      idempotencyKey: buildIdempotencyKey(intent, contact.email),
      source: "website",
    });

    if (reused && (booking.status === "confirmed" || booking.status === "completed")) {
      return {
        ok: true,
        bookingId: booking._id.toString(),
        reference: booking.reference,
        message: "This booking is already confirmed.",
      };
    }

    if (checkout.specialRequests) {
      booking.notes = checkout.specialRequests;
      await booking.save();
    }

    const settings = await getSettings();
    const gateway = getGateway(settings.payments.stripeEnabled ? "stripe" : "razorpay");

    // No live gateway? Hold the booking and let the team collect payment manually,
    // rather than pretending a payment happened.
    if (!gateway.configured) {
      booking.payment.status = "created";
      await booking.save();

      return {
        ok: true,
        offline: true,
        bookingId: booking._id.toString(),
        reference: booking.reference,
        message:
          "Your booking is held. Online payment isn't enabled on this environment — our team will contact you to collect payment.",
      };
    }

    const amount = booking.payment.amountDueINR;

    const order = await gateway.createOrder({
      amountINR: amount,
      receipt: booking.reference,
      notes: { bookingId: booking._id.toString(), reference: booking.reference },
    });

    const payment = await Payment.create({
      booking: booking._id,
      user: user?.id,
      gateway: order.gateway,
      gatewayOrderId: order.orderId,
      amountINR: amount,
      currency: "INR",
      status: "created",
      instalment: booking.payment.amountPaidINR > 0 ? 2 : 1,
    });

    return {
      ok: true,
      bookingId: booking._id.toString(),
      reference: booking.reference,
      order: {
        gateway: order.gateway,
        orderId: order.orderId,
        amountINR: order.amountINR,
        publicKey: order.publicKey,
        paymentId: payment._id.toString(),
      },
    };
  } catch (error) {
    if (error instanceof PricingError) return { ok: false, message: error.message };
    console.error("[startBooking]", error);
    return {
      ok: false,
      message: "We couldn't start that booking. Nothing has been charged — please try again.",
    };
  }
}

/* -------------------------------------------------------------------------- */
/*                                Cancellation                                 */
/* -------------------------------------------------------------------------- */

export async function requestBookingCancellation(
  bookingId: string,
  reason: string,
): Promise<{ ok: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in to manage this booking." };

  if (!reason?.trim() || reason.trim().length < 5) {
    return { ok: false, message: "Please tell us briefly why you're cancelling." };
  }

  try {
    await requestCancellation(bookingId, user.id, reason.trim());
    revalidatePath("/account/trips");
    return {
      ok: true,
      message: "Cancellation requested. Our team will confirm the charges and refund within 48 hours.",
    };
  } catch (error) {
    if (error instanceof PricingError) return { ok: false, message: error.message };
    console.error("[requestBookingCancellation]", error);
    return { ok: false, message: "We couldn't submit that request. Please contact support." };
  }
}

/** Retry a failed payment: creates a fresh gateway order against the same booking. */
export async function retryPayment(bookingId: string): Promise<StartBookingResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in to retry this payment." };

  try {
    await connectDB();
    const booking = await Booking.findOne({ _id: bookingId, user: user.id, deletedAt: null });
    if (!booking) return { ok: false, message: "Booking not found." };

    if (booking.status === "confirmed" || booking.status === "completed") {
      return { ok: false, message: "This booking is already paid." };
    }

    const settings = await getSettings();
    const gateway = getGateway(settings.payments.stripeEnabled ? "stripe" : "razorpay");
    if (!gateway.configured) {
      return { ok: false, message: "Online payment isn't enabled. Please contact our team." };
    }

    const amount = booking.payment.amountDueINR - booking.payment.amountPaidINR;
    if (amount <= 0) return { ok: false, message: "Nothing is due on this booking." };

    const order = await gateway.createOrder({
      amountINR: amount,
      receipt: `${booking.reference}-R`,
      notes: { bookingId: booking._id.toString(), reference: booking.reference },
    });

    const payment = await Payment.create({
      booking: booking._id,
      user: user.id,
      gateway: order.gateway,
      gatewayOrderId: order.orderId,
      amountINR: amount,
      status: "created",
      instalment: 2,
    });

    return {
      ok: true,
      bookingId: booking._id.toString(),
      reference: booking.reference,
      order: {
        gateway: order.gateway,
        orderId: order.orderId,
        amountINR: order.amountINR,
        publicKey: order.publicKey,
        paymentId: payment._id.toString(),
      },
    };
  } catch (error) {
    console.error("[retryPayment]", error);
    return { ok: false, message: "We couldn't start that payment. Please try again." };
  }
}
