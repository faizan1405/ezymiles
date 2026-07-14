import "server-only";
import crypto from "node:crypto";
import { connectDB } from "@/lib/db";
import {
  Activity,
  ActivityBooking,
  Booking,
  Coupon,
  Hotel,
  HotelBooking,
  Notification,
  Package,
  Payment,
  Traveller,
  User,
  VisaApplication,
  VisaCountry,
  type IBooking,
} from "@/models";
import { getSettings } from "@/lib/settings";
import { generateReference, serialise, formatPrice, formatDate } from "@/lib/utils";
import { quote, PricingError, type Quote } from "@/server/pricing";
import { sendMail } from "@/lib/mail";
import { renderTemplate } from "@/lib/email-templates";
import type { BookingIntentInput, TravellerInput } from "@/lib/validation";

/**
 * Booking lifecycle.
 *
 *   draft → pending_payment → confirmed → completed
 *                           ↘ failed / cancelled
 *
 * Two invariants hold everywhere in this file:
 *   1. Prices are always re-derived from the database (see server/pricing.ts).
 *   2. Creating a booking is idempotent — the same intent submitted twice
 *      returns the same booking rather than creating a duplicate.
 */

export interface CreateBookingArgs {
  intent: BookingIntentInput;
  contact: { name: string; email: string; phone: string };
  travellers: TravellerInput[];
  userId?: string;
  /** Stable hash of the intent; guards against double-submits and retries. */
  idempotencyKey?: string;
  source?: string;
}

export function buildIdempotencyKey(intent: BookingIntentInput, email: string) {
  const payload = JSON.stringify({
    t: intent.type,
    i: intent.itemId ?? intent.itemSlug,
    d: intent.travelDate,
    ci: intent.checkIn,
    co: intent.checkOut,
    v: intent.variantKey,
    dep: intent.departureId,
    r: intent.roomKey,
    s: intent.slotTime,
    a: intent.adults,
    c: intent.children,
    inf: intent.infants,
    rooms: intent.rooms,
    addOns: intent.addOns,
    email,
  });
  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 40);
}

export async function createBooking(args: CreateBookingArgs) {
  await connectDB();

  const { intent, contact, travellers, userId, source = "website" } = args;
  const idempotencyKey = args.idempotencyKey ?? buildIdempotencyKey(intent, contact.email);

  // Same intent already in flight or paid? Hand back the existing booking.
  const existing = await Booking.findOne({ idempotencyKey, deletedAt: null });
  if (existing) {
    if (existing.status === "confirmed" || existing.status === "completed") {
      return { booking: existing, reused: true as const };
    }
    if (existing.status === "pending_payment" || existing.status === "draft") {
      return { booking: existing, reused: true as const };
    }
  }

  // Server-authoritative pricing. Anything the browser said about money is ignored.
  const q: Quote = await quote(intent);

  const settings = await getSettings();
  const partial = intent.paymentMode === "partial" && q.deposit.allowed;
  const amountDue = partial ? q.deposit.amountINR : q.totalINR;

  const booking = await Booking.create({
    reference: generateReference("VYR"),
    type: intent.type,
    user: userId,
    guestName: contact.name,
    guestEmail: contact.email,
    guestPhone: contact.phone,
    item: q.item,
    travelDate: q.travelDate,
    endDate: q.endDate,
    travellerCounts: {
      adults: Number(intent.adults ?? 1),
      children: Number(intent.children ?? 0),
      infants: Number(intent.infants ?? 0),
    },
    pricing: {
      lines: q.lines,
      subtotalINR: q.subtotalINR,
      discountINR: q.discountINR,
      taxINR: q.taxINR,
      feesINR: q.feesINR,
      totalINR: q.totalINR,
      currency: "INR",
      displayRate: 1,
    },
    coupon: q.coupon,
    payment: {
      mode: partial ? "partial" : "full",
      depositPercent: partial ? q.deposit.percent : 100,
      amountDueINR: amountDue,
      amountPaidINR: 0,
      balanceINR: q.totalINR - amountDue,
      status: "created",
      dueDate: q.travelDate
        ? new Date(
            q.travelDate.getTime() -
              settings.payments.balanceDueDaysBeforeTravel * 86_400_000,
          )
        : undefined,
    },
    status: "pending_payment",
    source,
    isDemoData: Boolean((q.item.meta as { isDemoData?: boolean }).isDemoData),
    idempotencyKey,
  });

  // Travellers
  const travellerDocs = await Traveller.insertMany(
    travellers.map((t, i) => ({
      ...t,
      dateOfBirth: t.dateOfBirth ? new Date(t.dateOfBirth) : undefined,
      passportExpiry: t.passportExpiry ? new Date(t.passportExpiry) : undefined,
      booking: booking._id,
      user: userId,
      isLeadTraveller: i === 0,
    })),
  );

  booking.travellers = travellerDocs.map((t) => t._id);
  await booking.save();

  await createTypeSpecificRecord(booking, intent, q);

  return { booking, reused: false as const };
}

async function createTypeSpecificRecord(
  booking: IBooking & { _id: unknown },
  intent: BookingIntentInput,
  q: Quote,
) {
  const meta = q.item.meta as Record<string, never>;

  if (booking.type === "hotel" && q.item.refId) {
    await HotelBooking.create({
      booking: booking._id,
      hotel: q.item.refId,
      roomKey: meta.roomKey,
      roomName: meta.roomName,
      mealPlan: meta.mealPlan,
      checkIn: q.travelDate,
      checkOut: q.endDate,
      nights: meta.nights,
      rooms: meta.rooms,
      guestsPerRoom: {
        adults: Number(intent.adults ?? 2),
        children: Number(intent.children ?? 0),
      },
      pricePerNightINR: meta.pricePerNightINR,
      refundable: meta.refundable,
      cancellationRule: meta.cancellationRule,
    });
  }

  if (booking.type === "activity" && q.item.refId) {
    await ActivityBooking.create({
      booking: booking._id,
      activity: q.item.refId,
      date: q.travelDate,
      slotTime: meta.slotTime,
      adults: Number(intent.adults ?? 1),
      children: Number(intent.children ?? 0),
      addOns: meta.addOns ?? [],
      pickupRequired: Boolean(intent.pickupRequired),
      pickupLocation: intent.pickupLocation,
    });
  }

  if (booking.type === "visa" && q.item.refId) {
    const country = await VisaCountry.findById(q.item.refId).select("country").lean();
    await VisaApplication.create({
      reference: generateReference("VISA"),
      user: booking.user,
      visaCountry: q.item.refId,
      countryName: country?.country ?? meta.countryName,
      visaType: meta.visaType,
      nationality: "Indian",
      applicantName: booking.guestName ?? "",
      email: booking.guestEmail ?? "",
      phone: booking.guestPhone ?? "",
      travelDate: q.travelDate,
      travellerCount: Number(meta.applicants ?? 1),
      quotedFeeINR: booking.pricing.totalINR,
      booking: booking._id,
      status: "submitted",
      statusHistory: [{ status: "submitted", at: new Date(), by: "system" }],
    });
  }
}

/* -------------------------------------------------------------------------- */
/*                         Confirmation (post-payment)                         */
/* -------------------------------------------------------------------------- */

/**
 * Called only after a payment signature has been verified server-side.
 * Decrements inventory, marks the booking confirmed, and sends the receipt.
 */
export async function confirmBookingAfterPayment(bookingId: string, paymentId: string) {
  await connectDB();

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new PricingError("Booking not found.");

  const payment = await Payment.findById(paymentId);
  if (!payment) throw new PricingError("Payment not found.");

  // Idempotent: a webhook and a browser callback will both land here.
  if (booking.status === "confirmed" || booking.status === "completed") {
    return booking;
  }

  const paid = booking.payment.amountPaidINR + payment.amountINR;
  booking.payment.amountPaidINR = paid;
  booking.payment.balanceINR = Math.max(0, booking.pricing.totalINR - paid);
  booking.payment.status = booking.payment.balanceINR > 0 ? "partially_paid" : "paid";
  booking.status = "confirmed";
  await booking.save();

  await decrementInventory(booking);

  if (booking.coupon?.code) {
    await Coupon.updateOne({ code: booking.coupon.code }, { $inc: { usageCount: 1 } });
  }

  if (booking.item.kind === "package" && booking.item.refId) {
    await Package.updateOne({ _id: booking.item.refId }, { $inc: { bookingCount: 1 } });
  }

  await Notification.create({
    audience: "admin",
    kind: "booking",
    title: `Booking confirmed — ${booking.reference}`,
    body: `${booking.guestName} · ${booking.item.title}`,
    href: `/admin/bookings/${booking._id.toString()}`,
  });

  await Notification.create({
    audience: "admin",
    kind: "payment",
    title: `Payment received — ${booking.reference}`,
    body: `${formatPrice(payment.amountINR)} from ${booking.guestName ?? "guest"}`,
    href: `/admin/payments`,
  });

  if (booking.user) {
    await Notification.create({
      audience: "customer",
      user: booking.user,
      kind: "booking",
      title: "Your booking is confirmed",
      body: `${booking.item.title} — ${booking.reference}`,
      href: "/account/trips",
    });
  }

  const settings = await getSettings();

  if (booking.guestEmail) {
    const tpl = await renderTemplate("bookingConfirmation", {
      brandName: settings.brand.name,
      name: booking.guestName ?? "there",
      reference: booking.reference,
      title: booking.item.title,
      travelDate: booking.travelDate,
      totalINR: booking.pricing.totalINR,
      paidINR: booking.payment.amountPaidINR,
      balanceINR: booking.payment.balanceINR,
    });
    await sendMail({ to: booking.guestEmail, subject: tpl.subject, html: tpl.html });
  }

  return booking;
}

/** Seats, rooms and slots are only ever taken once money has actually cleared. */
async function decrementInventory(booking: IBooking) {
  const meta = booking.item.meta as Record<string, never>;
  const heads = booking.travellerCounts.adults + booking.travellerCounts.children;

  if (booking.type === "package" && meta.departureId) {
    await Package.updateOne(
      { _id: booking.item.refId, "departures._id": meta.departureId },
      { $inc: { "departures.$.seatsBooked": heads } },
    );

    const pkg = await Package.findById(booking.item.refId).select("title departures");
    const dep = pkg?.departures.find((d) => String(d._id) === String(meta.departureId));

    // `dep.status` here still reflects the state *before* this booking's
    // increment above — comparing against it tells us whether availability
    // just crossed a threshold, so the notification fires once, not per booking.
    if (dep && dep.seatsBooked >= dep.seatsTotal) {
      if (dep.status !== "sold_out") {
        await Notification.create({
          audience: "admin",
          kind: "system",
          title: `Package sold out — ${pkg?.title ?? "Package"}`,
          body: `All seats are booked for the ${formatDate(dep.date)} departure.`,
          href: `/admin/packages/${booking.item.refId}`,
        });
      }
      await Package.updateOne(
        { _id: booking.item.refId, "departures._id": meta.departureId },
        { $set: { "departures.$.status": "sold_out" } },
      );
    } else if (dep && dep.seatsTotal - dep.seatsBooked <= 4) {
      if (dep.status !== "filling_fast" && dep.status !== "sold_out") {
        await Notification.create({
          audience: "admin",
          kind: "system",
          title: `Low availability — ${pkg?.title ?? "Package"}`,
          body: `Only ${dep.seatsTotal - dep.seatsBooked} seat(s) left for the ${formatDate(dep.date)} departure.`,
          href: `/admin/packages/${booking.item.refId}`,
        });
      }
      await Package.updateOne(
        { _id: booking.item.refId, "departures._id": meta.departureId },
        { $set: { "departures.$.status": "filling_fast" } },
      );
    }
  }

  if (booking.type === "hotel" && meta.roomKey) {
    await Hotel.updateOne(
      { _id: booking.item.refId, "rooms.key": meta.roomKey },
      { $inc: { "rooms.$.roomsAvailable": -Number(meta.rooms ?? 1) } },
    );
  }

  if (booking.type === "activity" && meta.slotTime) {
    await Activity.updateOne(
      { _id: booking.item.refId, "slots.time": meta.slotTime },
      { $inc: { "slots.$.booked": heads } },
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Retrieval                                  */
/* -------------------------------------------------------------------------- */

export async function getBookingByReference(reference: string, opts: { userId?: string } = {}) {
  await connectDB();

  const query: Record<string, unknown> = { reference, deletedAt: null };
  if (opts.userId) query.user = opts.userId;

  const booking = await Booking.findOne(query).populate("travellers").lean();
  return booking ? serialise(booking) : null;
}

export async function getUserBookings(userId: string) {
  await connectDB();
  const rows = await Booking.find({ user: userId, deletedAt: null })
    .sort({ createdAt: -1 })
    .lean();
  return serialise(rows);
}

/* -------------------------------------------------------------------------- */
/*                                Cancellation                                 */
/* -------------------------------------------------------------------------- */

export async function requestCancellation(bookingId: string, userId: string, reason: string) {
  await connectDB();

  const booking = await Booking.findOne({ _id: bookingId, user: userId, deletedAt: null });
  if (!booking) throw new PricingError("Booking not found.");

  if (!["confirmed", "pending_payment"].includes(booking.status)) {
    throw new PricingError("This booking can't be cancelled from here — please contact support.");
  }

  booking.status = "cancellation_requested";
  booking.cancellation = { requestedAt: new Date(), reason };
  await booking.save();

  await Notification.create({
    audience: "admin",
    kind: "booking",
    title: `Cancellation requested — ${booking.reference}`,
    body: reason.slice(0, 140),
    href: `/admin/bookings/${booking._id.toString()}`,
  });

  return booking;
}

/* -------------------------------------------------------------------------- */

export async function attachBookingToUser(bookingId: string, userId: string) {
  await connectDB();
  await Booking.updateOne({ _id: bookingId, user: { $exists: false } }, { $set: { user: userId } });
  await User.updateOne({ _id: userId }, { $set: { lastLoginAt: new Date() } });
}
