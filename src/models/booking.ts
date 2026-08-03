import { Schema, model, models, type Model, type Types } from "mongoose";
import {
  BOOKING_STATUSES,
  BOOKING_TYPES,
  PAYMENT_GATEWAYS,
  PAYMENT_STATUSES,
  REFUND_STATUSES,
  VISA_APPLICATION_STATUSES,
  type BookingStatus,
  type BookingType,
  type PaymentGateway,
  type PaymentStatus,
  type RefundStatus,
  type VisaApplicationStatus,
} from "./types";

/* -------------------------------- Traveller -------------------------------- */

export interface ITraveller {
  _id: Types.ObjectId;
  user?: Types.ObjectId;
  booking?: Types.ObjectId;
  type: "adult" | "child" | "infant";
  title: "Mr" | "Ms" | "Mrs" | "Mstr" | "Dr";
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other";
  nationality?: string;
  passportNumber?: string;
  passportExpiry?: Date;
  email?: string;
  phone?: string;
  isLeadTraveller: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TravellerSchema = new Schema<ITraveller>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    booking: { type: Schema.Types.ObjectId, ref: "Booking" },
    type: { type: String, enum: ["adult", "child", "infant"], default: "adult" },
    title: { type: String, enum: ["Mr", "Ms", "Mrs", "Mstr", "Dr"], default: "Mr" },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    dateOfBirth: Date,
    gender: { type: String, enum: ["male", "female", "other"] },
    nationality: { type: String, default: "Indian" },
    passportNumber: String,
    passportExpiry: Date,
    email: String,
    phone: String,
    isLeadTraveller: { type: Boolean, default: false },
  },
  { timestamps: true },
);

TravellerSchema.index({ booking: 1 });
TravellerSchema.index({ user: 1 });

/* --------------------------------- Booking --------------------------------- */

export interface IPriceLine {
  label: string;
  amountINR: number;
  kind: "base" | "addon" | "discount" | "tax" | "fee";
}

export interface IBooking {
  _id: Types.ObjectId;
  reference: string;
  type: BookingType;
  user?: Types.ObjectId;
  guestEmail?: string;
  guestPhone?: string;
  guestName?: string;

  /** Polymorphic pointer to the booked item. */
  item: {
    kind: BookingType;
    refId?: Types.ObjectId;
    slug?: string;
    title: string;
    image?: string;
    /** Free-form, item-specific snapshot (variant, dates, rooms, slot…). */
    meta: Record<string, unknown>;
  };

  travelDate?: Date;
  endDate?: Date;
  travellerCounts: { adults: number; children: number; infants: number };
  travellers: Types.ObjectId[];

  /** Server-computed. Never trusted from the browser. */
  pricing: {
    lines: IPriceLine[];
    subtotalINR: number;
    discountINR: number;
    taxINR: number;
    feesINR: number;
    totalINR: number;
    currency: string;
    /** Snapshot of the display FX rate at time of booking. */
    displayRate: number;
  };

  coupon?: { code: string; discountINR: number };

  payment: {
    mode: "full" | "partial";
    /** Percentage of total collected up-front when mode = partial. */
    depositPercent: number;
    amountDueINR: number;
    amountPaidINR: number;
    balanceINR: number;
    status: PaymentStatus;
    dueDate?: Date;
  };

  status: BookingStatus;
  source: string;
  notes?: string;
  cancellation?: {
    requestedAt?: Date;
    reason?: string;
    approvedAt?: Date;
    chargeINR?: number;
  };
  /** Guards against double-submitting the same booking intent. */
  idempotencyKey?: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const PriceLineSchema = new Schema<IPriceLine>(
  {
    label: { type: String, required: true },
    amountINR: { type: Number, required: true },
    kind: { type: String, enum: ["base", "addon", "discount", "tax", "fee"], default: "base" },
  },
  { _id: false },
);

const BookingSchema = new Schema<IBooking>(
  {
    reference: { type: String, required: true },
    type: { type: String, enum: BOOKING_TYPES, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    guestEmail: String,
    guestPhone: String,
    guestName: String,
    item: {
      kind: { type: String, enum: BOOKING_TYPES, required: true },
      refId: Schema.Types.ObjectId,
      slug: String,
      title: { type: String, required: true },
      image: String,
      meta: { type: Schema.Types.Mixed, default: {} },
    },
    travelDate: Date,
    endDate: Date,
    travellerCounts: {
      adults: { type: Number, default: 1, min: 1 },
      children: { type: Number, default: 0, min: 0 },
      infants: { type: Number, default: 0, min: 0 },
    },
    travellers: [{ type: Schema.Types.ObjectId, ref: "Traveller" }],
    pricing: {
      lines: [PriceLineSchema],
      subtotalINR: { type: Number, required: true },
      discountINR: { type: Number, default: 0 },
      taxINR: { type: Number, default: 0 },
      feesINR: { type: Number, default: 0 },
      totalINR: { type: Number, required: true },
      currency: { type: String, default: "INR" },
      displayRate: { type: Number, default: 1 },
    },
    coupon: { code: String, discountINR: Number },
    payment: {
      mode: { type: String, enum: ["full", "partial"], default: "full" },
      depositPercent: { type: Number, default: 100 },
      amountDueINR: { type: Number, default: 0 },
      amountPaidINR: { type: Number, default: 0 },
      balanceINR: { type: Number, default: 0 },
      status: { type: String, enum: PAYMENT_STATUSES, default: "created" },
      dueDate: Date,
    },
    status: { type: String, enum: BOOKING_STATUSES, default: "draft" },
    source: { type: String, default: "website" },
    notes: String,
    cancellation: {
      requestedAt: Date,
      reason: String,
      approvedAt: Date,
      chargeINR: Number,
    },
    idempotencyKey: String,
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

BookingSchema.index({ reference: 1 }, { unique: true });
BookingSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
BookingSchema.index({ user: 1, createdAt: -1 });
BookingSchema.index({ status: 1, createdAt: -1 });
BookingSchema.index({ type: 1, status: 1 });
BookingSchema.index({ travelDate: 1 });
BookingSchema.index({ "item.refId": 1 });

/* --------------------------------- Payment --------------------------------- */

export interface IPayment {
  _id: Types.ObjectId;
  booking: Types.ObjectId;
  user?: Types.ObjectId;
  gateway: PaymentGateway;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  amountINR: number;
  currency: string;
  status: PaymentStatus;
  method?: string;
  /** Instalment index for partial payments (1 = deposit, 2 = balance…). */
  instalment: number;
  failureReason?: string;
  invoiceNumber?: string;
  rawResponse?: Record<string, unknown>;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    gateway: { type: String, enum: PAYMENT_GATEWAYS, default: "razorpay" },
    gatewayOrderId: String,
    gatewayPaymentId: String,
    gatewaySignature: String,
    amountINR: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: PAYMENT_STATUSES, default: "created" },
    method: String,
    instalment: { type: Number, default: 1 },
    failureReason: String,
    invoiceNumber: String,
    rawResponse: { type: Schema.Types.Mixed },
    paidAt: Date,
  },
  { timestamps: true },
);

PaymentSchema.index({ booking: 1, createdAt: -1 });
PaymentSchema.index({ gatewayOrderId: 1 });
/** A gateway payment id may only ever be captured once. */
PaymentSchema.index({ gatewayPaymentId: 1 }, { unique: true, sparse: true });
PaymentSchema.index({ status: 1, createdAt: -1 });

/* ---------------------------------- Refund --------------------------------- */

export interface IRefund {
  _id: Types.ObjectId;
  booking: Types.ObjectId;
  payment?: Types.ObjectId;
  amountINR: number;
  reason: string;
  status: RefundStatus;
  gatewayRefundId?: string;
  requestedBy?: Types.ObjectId;
  processedBy?: Types.ObjectId;
  processedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RefundSchema = new Schema<IRefund>(
  {
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    payment: { type: Schema.Types.ObjectId, ref: "Payment" },
    amountINR: { type: Number, required: true },
    reason: { type: String, default: "" },
    status: { type: String, enum: REFUND_STATUSES, default: "requested" },
    gatewayRefundId: String,
    requestedBy: { type: Schema.Types.ObjectId, ref: "User" },
    processedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    processedAt: Date,
    notes: String,
  },
  { timestamps: true },
);

RefundSchema.index({ booking: 1 });
RefundSchema.index({ status: 1, createdAt: -1 });

/* ------------------------------- FlightSearch ------------------------------ */
/** Audit + cache of outbound searches; also powers "popular routes" analytics. */
export interface IFlightSearch {
  _id: Types.ObjectId;
  user?: Types.ObjectId;
  tripType: "one_way" | "round_trip" | "multi_city";
  legs: { from: string; to: string; date: Date }[];
  adults: number;
  children: number;
  infants: number;
  cabinClass: string;
  nonStopOnly: boolean;
  provider: string;
  dataSource: "live" | "cached" | "estimated" | "demo";
  resultCount: number;
  createdAt: Date;
}

const FlightSearchSchema = new Schema<IFlightSearch>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    tripType: { type: String, enum: ["one_way", "round_trip", "multi_city"], default: "one_way" },
    legs: [{ _id: false, from: String, to: String, date: Date }],
    adults: { type: Number, default: 1 },
    children: { type: Number, default: 0 },
    infants: { type: Number, default: 0 },
    cabinClass: { type: String, default: "economy" },
    nonStopOnly: { type: Boolean, default: false },
    provider: { type: String, default: "unknown" },
    dataSource: { type: String, enum: ["live", "cached", "estimated", "demo"], default: "estimated" },
    resultCount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

FlightSearchSchema.index({ createdAt: -1 });
FlightSearchSchema.index({ "legs.from": 1, "legs.to": 1 });

/* ------------------------------ FlightBooking ------------------------------ */

export interface IFlightBooking {
  _id: Types.ObjectId;
  booking: Types.ObjectId;
  offerId: string;
  provider: string;
  dataSource: "live" | "cached" | "estimated" | "demo";
  pnr?: string;
  tripType: string;
  segments: {
    airlineCode: string;
    airlineName: string;
    flightNumber: string;
    from: string;
    fromAirport: string;
    to: string;
    toAirport: string;
    departAt: Date;
    arriveAt: Date;
    durationMinutes: number;
    cabinClass: string;
    aircraft?: string;
  }[];
  fare: {
    baseINR: number;
    taxesINR: number;
    totalINR: number;
    refundable: boolean;
    baggage: string;
    cabinBaggage: string;
    fareRules: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const FlightBookingSchema = new Schema<IFlightBooking>(
  {
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    offerId: { type: String, required: true },
    provider: { type: String, default: "unknown" },
    dataSource: { type: String, enum: ["live", "cached", "estimated", "demo"], default: "estimated" },
    pnr: String,
    tripType: { type: String, default: "one_way" },
    segments: [
      {
        _id: false,
        airlineCode: String,
        airlineName: String,
        flightNumber: String,
        from: String,
        fromAirport: String,
        to: String,
        toAirport: String,
        departAt: Date,
        arriveAt: Date,
        durationMinutes: Number,
        cabinClass: String,
        aircraft: String,
      },
    ],
    fare: {
      baseINR: Number,
      taxesINR: Number,
      totalINR: Number,
      refundable: Boolean,
      baggage: String,
      cabinBaggage: String,
      fareRules: [String],
    },
  },
  { timestamps: true },
);

FlightBookingSchema.index({ booking: 1 });
FlightBookingSchema.index({ pnr: 1 });

/* ------------------------------- HotelBooking ------------------------------ */

export interface IHotelBooking {
  _id: Types.ObjectId;
  booking: Types.ObjectId;
  hotel: Types.ObjectId;
  roomKey: string;
  roomName: string;
  mealPlan: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  rooms: number;
  guestsPerRoom: { adults: number; children: number };
  pricePerNightINR: number;
  refundable: boolean;
  cancellationRule: string;
  createdAt: Date;
  updatedAt: Date;
}

const HotelBookingSchema = new Schema<IHotelBooking>(
  {
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    hotel: { type: Schema.Types.ObjectId, ref: "Hotel", required: true },
    roomKey: String,
    roomName: String,
    mealPlan: String,
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    nights: { type: Number, required: true },
    rooms: { type: Number, default: 1 },
    guestsPerRoom: { adults: { type: Number, default: 2 }, children: { type: Number, default: 0 } },
    pricePerNightINR: Number,
    refundable: { type: Boolean, default: true },
    cancellationRule: String,
  },
  { timestamps: true },
);

HotelBookingSchema.index({ booking: 1 });
HotelBookingSchema.index({ hotel: 1, checkIn: 1 });

/* ----------------------------- ActivityBooking ----------------------------- */

export interface IActivityBooking {
  _id: Types.ObjectId;
  booking: Types.ObjectId;
  activity: Types.ObjectId;
  date: Date;
  slotTime: string;
  adults: number;
  children: number;
  addOns: { key: string; label: string; priceINR: number; quantity: number }[];
  pickupRequired: boolean;
  pickupLocation?: string;
  voucherCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ActivityBookingSchema = new Schema<IActivityBooking>(
  {
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    activity: { type: Schema.Types.ObjectId, ref: "Activity", required: true },
    date: { type: Date, required: true },
    slotTime: String,
    adults: { type: Number, default: 1 },
    children: { type: Number, default: 0 },
    addOns: [{ _id: false, key: String, label: String, priceINR: Number, quantity: Number }],
    pickupRequired: { type: Boolean, default: false },
    pickupLocation: String,
    voucherCode: String,
  },
  { timestamps: true },
);

ActivityBookingSchema.index({ booking: 1 });
ActivityBookingSchema.index({ activity: 1, date: 1 });

/* ------------------------------ VisaApplication ---------------------------- */

export interface IVisaApplication {
  _id: Types.ObjectId;
  reference: string;
  user?: Types.ObjectId;
  visaCountry: Types.ObjectId;
  countryName: string;
  visaType: string;
  nationality: string;
  applicantName: string;
  email: string;
  phone: string;
  passportNumber?: string;
  travelDate?: Date;
  travellerCount: number;
  documents: { title: string; url?: string; publicId?: string; status: "pending" | "received" | "rejected" }[];
  status: VisaApplicationStatus;
  statusHistory: { status: string; note?: string; at: Date; by?: string }[];
  quotedFeeINR: number;
  booking?: Types.ObjectId;
  adminNotes?: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const VisaApplicationSchema = new Schema<IVisaApplication>(
  {
    reference: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    visaCountry: { type: Schema.Types.ObjectId, ref: "VisaCountry", required: true },
    countryName: String,
    visaType: String,
    nationality: { type: String, default: "Indian" },
    applicantName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    passportNumber: String,
    travelDate: Date,
    travellerCount: { type: Number, default: 1 },
    documents: [
      {
        _id: false,
        title: String,
        url: String,
        publicId: String,
        status: { type: String, enum: ["pending", "received", "rejected"], default: "pending" },
      },
    ],
    status: { type: String, enum: VISA_APPLICATION_STATUSES, default: "submitted" },
    statusHistory: [{ _id: false, status: String, note: String, at: Date, by: String }],
    quotedFeeINR: { type: Number, default: 0 },
    booking: { type: Schema.Types.ObjectId, ref: "Booking" },
    adminNotes: String,
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

VisaApplicationSchema.index({ reference: 1 }, { unique: true });
VisaApplicationSchema.index({ user: 1, createdAt: -1 });
VisaApplicationSchema.index({ status: 1, createdAt: -1 });

export const Traveller: Model<ITraveller> =
  models.Traveller || model<ITraveller>("Traveller", TravellerSchema);
export const Booking: Model<IBooking> = models.Booking || model<IBooking>("Booking", BookingSchema);
export const Payment: Model<IPayment> = models.Payment || model<IPayment>("Payment", PaymentSchema);
export const Refund: Model<IRefund> = models.Refund || model<IRefund>("Refund", RefundSchema);
export const FlightSearch: Model<IFlightSearch> =
  models.FlightSearch || model<IFlightSearch>("FlightSearch", FlightSearchSchema);
export const FlightBooking: Model<IFlightBooking> =
  models.FlightBooking || model<IFlightBooking>("FlightBooking", FlightBookingSchema);
export const HotelBooking: Model<IHotelBooking> =
  models.HotelBooking || model<IHotelBooking>("HotelBooking", HotelBookingSchema);
export const ActivityBooking: Model<IActivityBooking> =
  models.ActivityBooking || model<IActivityBooking>("ActivityBooking", ActivityBookingSchema);
export const VisaApplication: Model<IVisaApplication> =
  models.VisaApplication || model<IVisaApplication>("VisaApplication", VisaApplicationSchema);
