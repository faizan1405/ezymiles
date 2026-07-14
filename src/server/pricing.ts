import "server-only";
import { connectDB } from "@/lib/db";
import { Activity, Coupon, Hotel, Package, VisaCountry, type IPriceLine } from "@/models";
import { getSettings } from "@/lib/settings";
import { daysBetween } from "@/lib/utils";
import type { BookingIntentInput } from "@/lib/validation";
import type { BookingType } from "@/models/types";

/**
 * The single source of truth for money.
 *
 * Nothing the browser sends about price is ever trusted: the client says *what*
 * it wants (which package, which variant, which dates, how many travellers) and
 * this module derives *what it costs* from the database, every time — at quote
 * time, at booking time, and again before a payment order is created.
 */

export interface Quote {
  lines: IPriceLine[];
  subtotalINR: number;
  discountINR: number;
  taxINR: number;
  feesINR: number;
  totalINR: number;
  /** Snapshot of what was actually booked — stored on the Booking. */
  item: {
    kind: BookingType;
    refId?: string;
    slug?: string;
    title: string;
    image?: string;
    meta: Record<string, unknown>;
  };
  travelDate?: Date;
  endDate?: Date;
  coupon?: { code: string; discountINR: number };
  deposit: {
    allowed: boolean;
    percent: number;
    amountINR: number;
  };
  warnings: string[];
}

export class PricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingError";
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Coupons                                   */
/* -------------------------------------------------------------------------- */

export async function validateCoupon(
  code: string,
  { subtotalINR, bookingType }: { subtotalINR: number; bookingType: BookingType },
): Promise<{ ok: true; discountINR: number; code: string } | { ok: false; reason: string }> {
  await connectDB();

  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase(), isActive: true });
  if (!coupon) return { ok: false, reason: "That coupon code isn't valid." };

  const now = new Date();
  if (coupon.validFrom > now) return { ok: false, reason: "This coupon isn't active yet." };
  if (coupon.validTo < now) return { ok: false, reason: "This coupon has expired." };

  if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
    return { ok: false, reason: "This coupon has been fully redeemed." };
  }

  if (coupon.appliesTo?.length && !coupon.appliesTo.includes(bookingType)) {
    return { ok: false, reason: `This coupon doesn't apply to ${bookingType} bookings.` };
  }

  if (subtotalINR < coupon.minBookingINR) {
    return {
      ok: false,
      reason: `This coupon needs a minimum booking value of ₹${coupon.minBookingINR.toLocaleString("en-IN")}.`,
    };
  }

  let discount =
    coupon.discountType === "percent"
      ? Math.round((subtotalINR * coupon.value) / 100)
      : Math.round(coupon.value);

  if (coupon.maxDiscountINR) discount = Math.min(discount, coupon.maxDiscountINR);
  discount = Math.min(discount, subtotalINR);

  return { ok: true, discountINR: discount, code: coupon.code };
}

/* -------------------------------------------------------------------------- */
/*                                   Quoting                                   */
/* -------------------------------------------------------------------------- */

export async function quote(intent: BookingIntentInput): Promise<Quote> {
  await connectDB();

  switch (intent.type) {
    case "package":
      return quotePackage(intent);
    case "hotel":
      return quoteHotel(intent);
    case "activity":
      return quoteActivity(intent);
    case "visa":
      return quoteVisa(intent);
    case "flight":
      return quoteFlight(intent);
    case "cab":
      throw new PricingError(
        "Cab transfers are quoted by our team — submit an enquiry and we'll price it for you.",
      );
    default:
      throw new PricingError("Unsupported booking type.");
  }
}

/* --------------------------------- Package -------------------------------- */

async function quotePackage(intent: BookingIntentInput): Promise<Quote> {
  const settings = await getSettings();
  const warnings: string[] = [];

  const pkg = intent.itemId
    ? await Package.findOne({ _id: intent.itemId, status: "published", deletedAt: null })
    : await Package.findOne({ slug: intent.itemSlug, status: "published", deletedAt: null });

  if (!pkg) throw new PricingError("That package is no longer available.");

  const variant =
    pkg.variants.find((v) => v.key === intent.variantKey) ??
    pkg.variants.find((v) => v.isDefault) ??
    pkg.variants[0];

  if (!variant) throw new PricingError("This package has no bookable options right now.");

  const adults = Number(intent.adults ?? 1);
  const children = Number(intent.children ?? 0);
  const infants = Number(intent.infants ?? 0);

  if (adults < 1) throw new PricingError("At least one adult is required.");

  // Departure: validates availability and applies a seasonal adjustment.
  let departureAdjustment = 0;
  let travelDate: Date | undefined;
  let endDate: Date | undefined;

  if (intent.departureId) {
    const departure = pkg.departures.find((d) => String(d._id) === intent.departureId);
    if (!departure) throw new PricingError("That departure date is no longer listed.");
    if (departure.status === "sold_out" || departure.status === "closed") {
      throw new PricingError("That departure is sold out. Please pick another date.");
    }

    const seatsLeft = departure.seatsTotal - departure.seatsBooked;
    if (seatsLeft < adults + children) {
      throw new PricingError(
        `Only ${seatsLeft} ${seatsLeft === 1 ? "seat is" : "seats are"} left on that departure.`,
      );
    }

    departureAdjustment = departure.priceAdjustmentINR;
    travelDate = departure.date;
    endDate = departure.returnDate;
  } else if (intent.travelDate) {
    travelDate = new Date(intent.travelDate);
    if (Number.isNaN(travelDate.getTime())) throw new PricingError("That travel date isn't valid.");
    if (travelDate < new Date(new Date().toDateString())) {
      throw new PricingError("Travel dates must be in the future.");
    }
    endDate = new Date(travelDate.getTime() + (variant.durationDays - 1) * 86_400_000);
  }

  const adultUnit = variant.pricePerAdultINR + departureAdjustment;
  const childUnit = (variant.pricePerChildINR || Math.round(variant.pricePerAdultINR * 0.7)) +
    departureAdjustment;

  const lines: IPriceLine[] = [
    {
      label: `${variant.label} — ${adults} ${adults === 1 ? "adult" : "adults"}`,
      amountINR: adultUnit * adults,
      kind: "base",
    },
  ];

  if (children > 0) {
    lines.push({
      label: `${children} ${children === 1 ? "child" : "children"}`,
      amountINR: childUnit * children,
      kind: "base",
    });
  }

  if (infants > 0) {
    lines.push({ label: `${infants} infant${infants === 1 ? "" : "s"}`, amountINR: 0, kind: "base" });
  }

  // Solo travellers pay the single supplement — twin-share pricing assumes two.
  if (adults === 1 && children === 0 && variant.singleSupplementINR > 0) {
    lines.push({
      label: "Single occupancy supplement",
      amountINR: variant.singleSupplementINR,
      kind: "fee",
    });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.amountINR, 0);

  const { discount, coupon } = await applyCoupon(intent.couponCode, subtotal, "package", lines);

  const taxPercent = pkg.taxPercent ?? settings.payments.taxPercentDefault;
  const taxable = subtotal - discount;
  const tax = Math.round((taxable * taxPercent) / 100);
  lines.push({ label: `GST (${taxPercent}%)`, amountINR: tax, kind: "tax" });

  const fees = settings.payments.serviceFeeINR;
  if (fees > 0) lines.push({ label: "Service fee", amountINR: fees, kind: "fee" });

  const total = taxable + tax + fees;

  if (pkg.isDemoData) warnings.push("This package uses demo pricing and demo inventory.");

  return {
    lines,
    subtotalINR: subtotal,
    discountINR: discount,
    taxINR: tax,
    feesINR: fees,
    totalINR: total,
    item: {
      kind: "package",
      refId: String(pkg._id),
      slug: pkg.slug,
      title: pkg.title,
      image: pkg.heroImage?.url,
      meta: {
        variantKey: variant.key,
        variantLabel: variant.label,
        hotelCategory: variant.hotelCategory,
        durationDays: variant.durationDays,
        durationNights: variant.durationNights,
        departureId: intent.departureId,
        citiesCovered: pkg.citiesCovered,
        isDemoData: pkg.isDemoData,
      },
    },
    travelDate,
    endDate,
    coupon,
    deposit: depositFor(total, settings),
    warnings,
  };
}

/* ---------------------------------- Hotel --------------------------------- */

async function quoteHotel(intent: BookingIntentInput): Promise<Quote> {
  const settings = await getSettings();
  const warnings: string[] = [];

  const hotel = intent.itemId
    ? await Hotel.findOne({ _id: intent.itemId, status: "published", deletedAt: null })
    : await Hotel.findOne({ slug: intent.itemSlug, status: "published", deletedAt: null });

  if (!hotel) throw new PricingError("That property is no longer available.");

  const room = hotel.rooms.find((r) => r.key === intent.roomKey) ?? hotel.rooms[0];
  if (!room) throw new PricingError("This property has no bookable rooms right now.");

  if (!intent.checkIn || !intent.checkOut) {
    throw new PricingError("Please choose your check-in and check-out dates.");
  }

  const checkIn = new Date(intent.checkIn);
  const checkOut = new Date(intent.checkOut);
  const nights = daysBetween(checkIn, checkOut);

  if (nights < 1) throw new PricingError("Check-out must be at least one night after check-in.");
  if (checkIn < new Date(new Date().toDateString())) {
    throw new PricingError("Check-in cannot be in the past.");
  }

  const rooms = Number(intent.rooms ?? 1);
  const adults = Number(intent.adults ?? 2);
  const children = Number(intent.children ?? 0);

  if (rooms > room.roomsAvailable) {
    throw new PricingError(
      `Only ${room.roomsAvailable} ${room.roomsAvailable === 1 ? "room is" : "rooms are"} left in this category.`,
    );
  }

  const perRoomOccupancy = Math.ceil((adults + children) / rooms);
  if (perRoomOccupancy > room.maxOccupancy) {
    throw new PricingError(
      `${room.name} sleeps ${room.maxOccupancy}. Please add another room or pick a larger category.`,
    );
  }

  const lines: IPriceLine[] = [
    {
      label: `${room.name} · ${nights} ${nights === 1 ? "night" : "nights"} × ${rooms} ${rooms === 1 ? "room" : "rooms"}`,
      amountINR: room.pricePerNightINR * nights * rooms,
      kind: "base",
    },
  ];

  const subtotal = lines.reduce((s, l) => s + l.amountINR, 0);
  const { discount, coupon } = await applyCoupon(intent.couponCode, subtotal, "hotel", lines);

  const taxPercent = room.taxPercent ?? 12;
  const tax = Math.round(((subtotal - discount) * taxPercent) / 100);
  lines.push({ label: `Taxes & fees (${taxPercent}%)`, amountINR: tax, kind: "tax" });

  const total = subtotal - discount + tax;

  if (hotel.isDemoData) warnings.push("This property uses demo rates and demo availability.");

  return {
    lines,
    subtotalINR: subtotal,
    discountINR: discount,
    taxINR: tax,
    feesINR: 0,
    totalINR: total,
    item: {
      kind: "hotel",
      refId: String(hotel._id),
      slug: hotel.slug,
      title: hotel.name,
      image: hotel.heroImage?.url,
      meta: {
        roomKey: room.key,
        roomName: room.name,
        mealPlan: room.mealPlan,
        nights,
        rooms,
        city: hotel.city,
        refundable: room.refundable,
        cancellationRule: room.cancellationRule,
        pricePerNightINR: room.pricePerNightINR,
        isDemoData: hotel.isDemoData,
      },
    },
    travelDate: checkIn,
    endDate: checkOut,
    coupon,
    deposit: depositFor(total, settings),
    warnings,
  };
}

/* -------------------------------- Activity -------------------------------- */

async function quoteActivity(intent: BookingIntentInput): Promise<Quote> {
  const warnings: string[] = [];

  const activity = intent.itemId
    ? await Activity.findOne({ _id: intent.itemId, status: "published", deletedAt: null })
    : await Activity.findOne({ slug: intent.itemSlug, status: "published", deletedAt: null });

  if (!activity) throw new PricingError("That experience is no longer available.");

  const adults = Number(intent.adults ?? 1);
  const children = Number(intent.children ?? 0);
  const participants = adults + children;

  if (participants < activity.minParticipants) {
    throw new PricingError(`This experience needs at least ${activity.minParticipants} participants.`);
  }
  if (participants > activity.maxParticipants) {
    throw new PricingError(`This experience takes a maximum of ${activity.maxParticipants} participants.`);
  }

  if (!intent.travelDate) throw new PricingError("Please choose a date.");
  const date = new Date(intent.travelDate);
  if (date < new Date(new Date().toDateString())) {
    throw new PricingError("Please choose a date in the future.");
  }

  const slot = activity.slots.find((s) => s.time === intent.slotTime) ?? activity.slots[0];
  if (slot && slot.capacity - slot.booked < participants) {
    throw new PricingError(`Only ${slot.capacity - slot.booked} places are left in that time slot.`);
  }

  const lines: IPriceLine[] = [
    {
      label: `${adults} ${adults === 1 ? "adult" : "adults"}`,
      amountINR: activity.pricePerAdultINR * adults,
      kind: "base",
    },
  ];

  if (children > 0) {
    const childPrice = activity.pricePerChildINR || Math.round(activity.pricePerAdultINR * 0.6);
    lines.push({
      label: `${children} ${children === 1 ? "child" : "children"}`,
      amountINR: childPrice * children,
      kind: "base",
    });
  }

  // Add-ons are re-priced from the database — the browser only sends keys.
  const addOns: { key: string; label: string; priceINR: number; quantity: number }[] = [];
  for (const requested of intent.addOns ?? []) {
    const addOn = activity.addOns.find((a) => a.key === requested.key);
    if (!addOn) continue;
    const quantity = Math.max(1, Math.min(Number(requested.quantity), participants));
    addOns.push({ key: addOn.key, label: addOn.label, priceINR: addOn.priceINR, quantity });
    lines.push({
      label: `${addOn.label} × ${quantity}`,
      amountINR: addOn.priceINR * quantity,
      kind: "addon",
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.amountINR, 0);
  const { discount, coupon } = await applyCoupon(intent.couponCode, subtotal, "activity", lines);

  const taxPercent = activity.taxPercent ?? 5;
  const tax = Math.round(((subtotal - discount) * taxPercent) / 100);
  lines.push({ label: `GST (${taxPercent}%)`, amountINR: tax, kind: "tax" });

  const total = subtotal - discount + tax;

  if (activity.isDemoData) warnings.push("This experience uses demo pricing and demo availability.");

  return {
    lines,
    subtotalINR: subtotal,
    discountINR: discount,
    taxINR: tax,
    feesINR: 0,
    totalINR: total,
    item: {
      kind: "activity",
      refId: String(activity._id),
      slug: activity.slug,
      title: activity.title,
      image: activity.heroImage?.url,
      meta: {
        slotTime: slot?.time,
        addOns,
        pickupRequired: Boolean(intent.pickupRequired),
        pickupLocation: intent.pickupLocation,
        city: activity.city,
        durationMinutes: activity.durationMinutes,
        isDemoData: activity.isDemoData,
      },
    },
    travelDate: date,
    coupon,
    deposit: { allowed: false, percent: 100, amountINR: total },
    warnings,
  };
}

/* ---------------------------------- Visa ---------------------------------- */

async function quoteVisa(intent: BookingIntentInput): Promise<Quote> {
  const country = intent.itemId
    ? await VisaCountry.findOne({ _id: intent.itemId, status: "published" })
    : await VisaCountry.findOne({ slug: intent.itemSlug, status: "published" });

  if (!country) throw new PricingError("We don't currently handle visas for that country.");

  const visaType =
    country.visaTypes.find((v) => v.type === intent.visaType) ?? country.visaTypes[0];

  if (!visaType) throw new PricingError("No visa options are listed for that country yet.");

  const applicants = Math.max(1, Number(intent.adults ?? 1) + Number(intent.children ?? 0));

  const lines: IPriceLine[] = [
    {
      label: `Government fee × ${applicants}`,
      amountINR: visaType.governmentFeeINR * applicants,
      kind: "base",
    },
    {
      label: `Our service fee × ${applicants}`,
      amountINR: visaType.serviceFeeINR * applicants,
      kind: "fee",
    },
  ];

  const subtotal = lines.reduce((s, l) => s + l.amountINR, 0);
  const { discount, coupon } = await applyCoupon(intent.couponCode, subtotal, "visa", lines);

  const tax = Math.round(((subtotal - discount) * 18) / 100);
  lines.push({ label: "GST (18% on service fee)", amountINR: tax, kind: "tax" });

  const total = subtotal - discount + tax;

  return {
    lines,
    subtotalINR: subtotal,
    discountINR: discount,
    taxINR: tax,
    feesINR: 0,
    totalINR: total,
    item: {
      kind: "visa",
      refId: String(country._id),
      slug: country.slug,
      title: `${country.country} — ${visaType.label || visaType.type} visa`,
      image: country.heroImage?.url,
      meta: {
        visaType: visaType.type,
        processingTimeDays: visaType.processingTimeDays,
        applicants,
        countryName: country.country,
      },
    },
    travelDate: intent.travelDate ? new Date(intent.travelDate) : undefined,
    coupon,
    deposit: { allowed: false, percent: 100, amountINR: total },
    warnings: [
      "Government fees are indicative and set by the embassy — they can change without notice.",
      "We prepare and lodge your application. The decision rests entirely with the embassy or immigration authority.",
    ],
  };
}

/* --------------------------------- Flight --------------------------------- */

async function quoteFlight(_intent: BookingIntentInput): Promise<Quote> {
  // Flight fares are held by the provider adapter, not our catalogue. The flight
  // booking route re-prices against the adapter before creating a payment order.
  throw new PricingError(
    "Flight fares are priced by the supplier at booking time. Start from the flight search results.",
  );
}

/* --------------------------------- Helpers -------------------------------- */

async function applyCoupon(
  code: string | undefined,
  subtotal: number,
  type: BookingType,
  lines: IPriceLine[],
): Promise<{ discount: number; coupon?: { code: string; discountINR: number } }> {
  if (!code) return { discount: 0 };

  const result = await validateCoupon(code, { subtotalINR: subtotal, bookingType: type });
  if (!result.ok) throw new PricingError(result.reason);

  lines.push({
    label: `Coupon ${result.code}`,
    amountINR: -result.discountINR,
    kind: "discount",
  });

  return { discount: result.discountINR, coupon: { code: result.code, discountINR: result.discountINR } };
}

function depositFor(total: number, settings: Awaited<ReturnType<typeof getSettings>>) {
  if (!settings.payments.partialPaymentEnabled) {
    return { allowed: false, percent: 100, amountINR: total };
  }
  const percent = settings.payments.depositPercent;
  return {
    allowed: true,
    percent,
    amountINR: Math.max(1, Math.round((total * percent) / 100)),
  };
}
