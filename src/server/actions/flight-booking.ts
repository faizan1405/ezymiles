"use server";

import { z } from "zod";
import crypto from "node:crypto";
import type { HydratedDocument } from "mongoose";
import { connectDB } from "@/lib/db";
import { Booking, FlightBooking, Payment, Traveller, type IBooking } from "@/models";
import { getCurrentUser } from "@/lib/session";
import { guard } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";
import { getFlightProvider } from "@/server/flights";
import { getGateway } from "@/server/payments/gateway";
import { generateReference } from "@/lib/utils";
import { travellerSchema, emailField, phoneField } from "@/lib/validation";
import type { StartBookingResult } from "./booking";
import type { FlightSearchQuery } from "@/server/flights/types";

const flightBookingSchema = z.object({
  offerId: z.string().min(4),
  query: z.object({
    tripType: z.enum(["one_way", "round_trip", "multi_city"]),
    from: z.string().length(3),
    to: z.string().length(3),
    departDate: z.string().min(8),
    returnDate: z.string().optional(),
    adults: z.coerce.number().int().min(1).max(9),
    children: z.coerce.number().int().min(0).max(8),
    infants: z.coerce.number().int().min(0).max(4),
    cabinClass: z.string(),
  }),
  travellers: z.array(travellerSchema).min(1),
  contactEmail: emailField,
  contactPhone: phoneField,
  acceptTerms: z.boolean().refine((v) => v === true, "Please accept the fare rules to continue"),
});

/** Same intent submitted twice (double-click, resubmitted form) must not create two bookings. */
function buildFlightIdempotencyKey(offerId: string, query: z.infer<typeof flightBookingSchema>["query"], email: string) {
  const payload = JSON.stringify({
    o: offerId,
    from: query.from,
    to: query.to,
    dep: query.departDate,
    ret: query.returnDate,
    a: query.adults,
    c: query.children,
    inf: query.infants,
    cabin: query.cabinClass,
    email: email.toLowerCase(),
  });
  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 40);
}

/**
 * Flight bookings do not go through server/pricing.ts — flight fares belong to
 * the supplier, not our catalogue. Instead we re-fetch the offer from the
 * provider using only the offer id and the search inputs, and derive the total
 * from *that*. The browser never supplies a price.
 */
export async function startFlightBooking(raw: unknown): Promise<StartBookingResult> {
  const limit = await guard("flight-booking", { limit: 6, windowSeconds: 120 });
  if (!limit.success) {
    return { ok: false, message: "Too many attempts. Please wait a minute." };
  }

  const parsed = flightBookingSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const { offerId, query, travellers, contactEmail, contactPhone } = parsed.data;

  try {
    const provider = getFlightProvider();

    const searchQuery: FlightSearchQuery = {
      tripType: query.tripType,
      from: query.from.toUpperCase(),
      to: query.to.toUpperCase(),
      departDate: query.departDate,
      returnDate: query.returnDate,
      adults: query.adults,
      children: query.children,
      infants: query.infants,
      cabinClass: query.cabinClass,
    };

    // Re-price against the provider. If the fare has moved or vanished, we say so
    // rather than charging a stale amount.
    const offer = await provider.getOffer(offerId, searchQuery);

    if (!offer) {
      return {
        ok: false,
        message:
          "That fare is no longer available. Please search again — nothing has been charged.",
      };
    }

    const user = await getCurrentUser();
    await connectDB();

    // Same offer + search + traveller contact submitted twice (double-click,
    // resubmitted form, browser retry) must reuse the held booking rather than
    // creating a duplicate hold and a duplicate gateway order intent.
    const idempotencyKey = buildFlightIdempotencyKey(offerId, query, contactEmail);
    const existing = await Booking.findOne({ idempotencyKey, deletedAt: null });

    if (existing && (existing.status === "confirmed" || existing.status === "completed")) {
      return {
        ok: true,
        bookingId: existing._id.toString(),
        reference: existing.reference,
        message: "This flight booking is already confirmed.",
      };
    }

    let booking: HydratedDocument<IBooking>;

    if (existing) {
      booking = existing;
    } else {
      const total = offer.fare.totalForPartyINR;
      const lead = travellers[0];

      booking = await Booking.create({
        reference: generateReference("VYR"),
        idempotencyKey,
        type: "flight",
        user: user?.id,
        guestName: `${lead.firstName} ${lead.lastName}`.trim(),
        guestEmail: contactEmail,
        guestPhone: contactPhone,
        item: {
          kind: "flight",
          title: `${offer.outbound[0].from} → ${offer.outbound[offer.outbound.length - 1].to}${
            offer.inbound ? " (return)" : ""
          }`,
          meta: {
            offerId: offer.id,
            provider: offer.provider,
            dataSource: offer.dataSource,
            airline: offer.airlineName,
            stops: offer.stops,
            cabinClass: query.cabinClass,
            isDemoData: offer.dataSource === "demo",
          },
        },
        travelDate: new Date(offer.outbound[0].departAt),
        endDate: offer.inbound ? new Date(offer.inbound[0].departAt) : undefined,
        travellerCounts: {
          adults: query.adults,
          children: query.children,
          infants: query.infants,
        },
        pricing: {
          lines: [
            {
              label: `Base fare × ${query.adults + query.children}`,
              amountINR: total - Math.round(offer.fare.taxesINR * (query.adults + query.children)),
              kind: "base",
            },
            {
              label: "Taxes and airline surcharges",
              amountINR: Math.round(offer.fare.taxesINR * (query.adults + query.children)),
              kind: "tax",
            },
          ],
          subtotalINR: total,
          discountINR: 0,
          taxINR: 0,
          feesINR: 0,
          totalINR: total,
          currency: "INR",
          displayRate: 1,
        },
        payment: {
          // Airline tickets are issued on payment — no deposit option.
          mode: "full",
          depositPercent: 100,
          amountDueINR: total,
          amountPaidINR: 0,
          balanceINR: 0,
          status: "created",
        },
        status: "pending_payment",
        source: "website",
        isDemoData: offer.dataSource === "demo",
      });

      const travellerDocs = await Traveller.insertMany(
        travellers.map((t, i) => ({
          ...t,
          dateOfBirth: t.dateOfBirth ? new Date(t.dateOfBirth) : undefined,
          passportExpiry: t.passportExpiry ? new Date(t.passportExpiry) : undefined,
          booking: booking._id,
          user: user?.id,
          isLeadTraveller: i === 0,
        })),
      );

      booking.travellers = travellerDocs.map((t) => t._id);
      await booking.save();

      await FlightBooking.create({
        booking: booking._id,
        offerId: offer.id,
        provider: offer.provider,
        dataSource: offer.dataSource,
        tripType: query.tripType,
        segments: [...offer.outbound, ...(offer.inbound ?? [])].map((s) => ({
          ...s,
          departAt: new Date(s.departAt),
          arriveAt: new Date(s.arriveAt),
        })),
        fare: {
          baseINR: offer.fare.baseINR,
          taxesINR: offer.fare.taxesINR,
          totalINR: offer.fare.totalForPartyINR,
          refundable: offer.fare.refundable,
          baggage: offer.fare.baggage,
          cabinBaggage: offer.fare.cabinBaggage,
          fareRules: offer.fare.fareRules,
        },
      });
    }

    // The booking document (new or reused) is the source of truth for the
    // amount due — never the freshly re-fetched offer, so a resubmit can never
    // charge a different amount than the one the traveller was originally held for.
    const amountDue = booking.payment.amountDueINR;

    const settings = await getSettings();
    const gateway = getGateway(settings.payments.stripeEnabled ? "stripe" : "razorpay");

    if (!gateway.configured) {
      booking.payment.status = "created";
      await booking.save();

      return {
        ok: true,
        offline: true,
        bookingId: booking._id.toString(),
        reference: booking.reference,
        message:
          "Your flight is held. Online payment isn't enabled on this environment — our team will contact you to collect payment and issue the ticket.",
      };
    }

    const order = await gateway.createOrder({
      amountINR: amountDue,
      receipt: booking.reference,
      notes: { bookingId: booking._id.toString(), reference: booking.reference, type: "flight" },
    });

    const payment = await Payment.create({
      booking: booking._id,
      user: user?.id,
      gateway: order.gateway,
      gatewayOrderId: order.orderId,
      amountINR: amountDue,
      status: "created",
      instalment: 1,
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
    console.error("[startFlightBooking]", error);
    return {
      ok: false,
      message: "We couldn't hold that fare. Nothing has been charged — please try again.",
    };
  }
}
