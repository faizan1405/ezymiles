import { Schema, model, models, type Model, type Types } from "mongoose";
import { MediaSchema } from "./catalog";
import {
  ENQUIRY_TYPES,
  LEAD_STATUSES,
  TICKET_STATUSES,
  type EnquiryType,
  type LeadStatus,
  type MediaAsset,
  type TicketStatus,
} from "./types";

/* --------------------------------- Enquiry --------------------------------- */
/**
 * Raw inbound submission. Every enquiry spawns (or attaches to) a Lead, which is
 * the working record the sales team acts on.
 */
export interface IEnquiry {
  _id: Types.ObjectId;
  type: EnquiryType;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  message?: string;
  /** Package / hotel / activity / visa country the enquiry was raised from. */
  subject?: { kind: string; refId?: Types.ObjectId; title?: string; slug?: string };
  preferences?: {
    destination?: string;
    departureCity?: string;
    startDate?: Date;
    endDate?: Date;
    flexibleDates?: boolean;
    durationDays?: number;
    adults?: number;
    children?: number;
    budgetPerPersonINR?: number;
    travelStyle?: string;
    hotelCategory?: number;
    flightsRequired?: boolean;
    visaRequired?: boolean;
    activities?: string[];
    specialRequests?: string;
  };
  sourcePage: string;
  campaign?: { utmSource?: string; utmMedium?: string; utmCampaign?: string; utmTerm?: string; utmContent?: string };
  consent: boolean;
  lead?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EnquirySchema = new Schema<IEnquiry>(
  {
    type: { type: String, enum: ENQUIRY_TYPES, required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    countryCode: { type: String, default: "+91" },
    message: String,
    subject: {
      kind: String,
      refId: Schema.Types.ObjectId,
      title: String,
      slug: String,
    },
    preferences: {
      destination: String,
      departureCity: String,
      startDate: Date,
      endDate: Date,
      flexibleDates: Boolean,
      durationDays: Number,
      adults: Number,
      children: Number,
      budgetPerPersonINR: Number,
      travelStyle: String,
      hotelCategory: Number,
      flightsRequired: Boolean,
      visaRequired: Boolean,
      activities: [String],
      specialRequests: String,
    },
    sourcePage: { type: String, default: "/" },
    campaign: {
      utmSource: String,
      utmMedium: String,
      utmCampaign: String,
      utmTerm: String,
      utmContent: String,
    },
    consent: { type: Boolean, default: true },
    lead: { type: Schema.Types.ObjectId, ref: "Lead" },
  },
  { timestamps: true },
);

EnquirySchema.index({ createdAt: -1 });
EnquirySchema.index({ type: 1, createdAt: -1 });
EnquirySchema.index({ email: 1 });

/* ----------------------------------- Lead ---------------------------------- */

export interface ILead {
  _id: Types.ObjectId;
  reference: string;
  name: string;
  email: string;
  phone: string;
  type: EnquiryType;
  status: LeadStatus;
  score: number;
  destination?: string;
  estimatedValueINR: number;
  assignedTo?: Types.ObjectId;
  followUpDate?: Date;
  lastContactedAt?: Date;
  enquiries: Types.ObjectId[];
  sourcePage: string;
  campaign?: Record<string, string | undefined>;
  convertedBooking?: Types.ObjectId;
  lostReason?: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    reference: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    type: { type: String, enum: ENQUIRY_TYPES, default: "general" },
    status: { type: String, enum: LEAD_STATUSES, default: "new" },
    score: { type: Number, default: 0 },
    destination: String,
    estimatedValueINR: { type: Number, default: 0 },
    assignedTo: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    followUpDate: Date,
    lastContactedAt: Date,
    enquiries: [{ type: Schema.Types.ObjectId, ref: "Enquiry" }],
    sourcePage: { type: String, default: "/" },
    campaign: { type: Schema.Types.Mixed },
    convertedBooking: { type: Schema.Types.ObjectId, ref: "Booking" },
    lostReason: String,
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

LeadSchema.index({ reference: 1 }, { unique: true });
LeadSchema.index({ email: 1, phone: 1 });
LeadSchema.index({ status: 1, followUpDate: 1 });
LeadSchema.index({ assignedTo: 1, status: 1 });
LeadSchema.index({ createdAt: -1 });

/* --------------------------------- LeadNote -------------------------------- */

export interface ILeadNote {
  _id: Types.ObjectId;
  lead: Types.ObjectId;
  author: Types.ObjectId;
  authorName: string;
  body: string;
  kind: "note" | "call" | "email" | "whatsapp" | "meeting" | "status_change";
  createdAt: Date;
}

const LeadNoteSchema = new Schema<ILeadNote>(
  {
    lead: { type: Schema.Types.ObjectId, ref: "Lead", required: true },
    author: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    authorName: { type: String, default: "System" },
    body: { type: String, required: true },
    kind: {
      type: String,
      enum: ["note", "call", "email", "whatsapp", "meeting", "status_change"],
      default: "note",
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

LeadNoteSchema.index({ lead: 1, createdAt: -1 });

/* ---------------------------------- Coupon --------------------------------- */

export interface ICoupon {
  _id: Types.ObjectId;
  code: string;
  description: string;
  discountType: "percent" | "flat";
  value: number;
  maxDiscountINR?: number;
  minBookingINR: number;
  appliesTo: string[];
  validFrom: Date;
  validTo: Date;
  usageLimit: number;
  usageCount: number;
  perUserLimit: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String, default: "" },
    discountType: { type: String, enum: ["percent", "flat"], default: "percent" },
    value: { type: Number, required: true, min: 0 },
    maxDiscountINR: { type: Number, min: 0 },
    minBookingINR: { type: Number, default: 0 },
    appliesTo: [{ type: String }],
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },
    usageLimit: { type: Number, default: 0 },
    usageCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

CouponSchema.index({ code: 1 }, { unique: true });
CouponSchema.index({ isActive: 1, validFrom: 1, validTo: 1 });

/* ---------------------------------- Offer ---------------------------------- */

export interface IOffer {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  kind:
    | "early_bird"
    | "honeymoon"
    | "group"
    | "flight_inclusive"
    | "festival"
    | "seasonal";
  headline: string;
  description: string;
  image: MediaAsset;
  couponCode?: string;
  discountLabel: string;
  ctaLabel: string;
  ctaHref: string;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const OfferSchema = new Schema<IOffer>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, lowercase: true },
    kind: {
      type: String,
      enum: ["early_bird", "honeymoon", "group", "flight_inclusive", "festival", "seasonal"],
      default: "seasonal",
    },
    headline: { type: String, default: "" },
    description: { type: String, default: "" },
    image: { type: MediaSchema, required: true },
    couponCode: String,
    discountLabel: { type: String, default: "" },
    ctaLabel: { type: String, default: "View offer" },
    ctaHref: { type: String, default: "/packages" },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

OfferSchema.index({ slug: 1 }, { unique: true });
OfferSchema.index({ isActive: 1, startsAt: 1, endsAt: 1 });

/* --------------------------- NewsletterSubscriber -------------------------- */

export interface INewsletterSubscriber {
  _id: Types.ObjectId;
  email: string;
  name?: string;
  phone?: string;
  whatsappOptIn: boolean;
  interests: string[];
  source: string;
  isActive: boolean;
  unsubscribeToken: string;
  createdAt: Date;
  updatedAt: Date;
}

const NewsletterSubscriberSchema = new Schema<INewsletterSubscriber>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    name: String,
    phone: String,
    whatsappOptIn: { type: Boolean, default: false },
    interests: [String],
    source: { type: String, default: "footer" },
    isActive: { type: Boolean, default: true },
    unsubscribeToken: { type: String, required: true },
  },
  { timestamps: true },
);

NewsletterSubscriberSchema.index({ email: 1 }, { unique: true });

/* ------------------------------ SupportTicket ------------------------------ */

export interface ISupportTicket {
  _id: Types.ObjectId;
  reference: string;
  user?: Types.ObjectId;
  booking?: Types.ObjectId;
  name: string;
  email: string;
  subject: string;
  category: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: TicketStatus;
  messages: { author: "customer" | "agent"; authorName: string; body: string; at: Date }[];
  assignedTo?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    reference: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    booking: { type: Schema.Types.ObjectId, ref: "Booking" },
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    category: { type: String, default: "general" },
    priority: { type: String, enum: ["low", "normal", "high", "urgent"], default: "normal" },
    status: { type: String, enum: TICKET_STATUSES, default: "open" },
    messages: [
      {
        _id: false,
        author: { type: String, enum: ["customer", "agent"], default: "customer" },
        authorName: String,
        body: String,
        at: { type: Date, default: Date.now },
      },
    ],
    assignedTo: { type: Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: true },
);

SupportTicketSchema.index({ reference: 1 }, { unique: true });
SupportTicketSchema.index({ user: 1, createdAt: -1 });
SupportTicketSchema.index({ status: 1, priority: 1 });

/* ------------------------------- Notification ------------------------------ */

export interface INotification {
  _id: Types.ObjectId;
  audience: "customer" | "admin";
  user?: Types.ObjectId;
  adminUser?: Types.ObjectId;
  title: string;
  body: string;
  href?: string;
  kind: "booking" | "payment" | "lead" | "visa" | "ticket" | "system";
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    audience: { type: String, enum: ["customer", "admin"], default: "customer" },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    adminUser: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    href: String,
    kind: {
      type: String,
      enum: ["booking", "payment", "lead", "visa", "ticket", "system"],
      default: "system",
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ audience: 1, createdAt: -1 });

export const Enquiry: Model<IEnquiry> = models.Enquiry || model<IEnquiry>("Enquiry", EnquirySchema);
export const Lead: Model<ILead> = models.Lead || model<ILead>("Lead", LeadSchema);
export const LeadNote: Model<ILeadNote> = models.LeadNote || model<ILeadNote>("LeadNote", LeadNoteSchema);
export const Coupon: Model<ICoupon> = models.Coupon || model<ICoupon>("Coupon", CouponSchema);
export const Offer: Model<IOffer> = models.Offer || model<IOffer>("Offer", OfferSchema);
export const NewsletterSubscriber: Model<INewsletterSubscriber> =
  models.NewsletterSubscriber ||
  model<INewsletterSubscriber>("NewsletterSubscriber", NewsletterSubscriberSchema);
export const SupportTicket: Model<ISupportTicket> =
  models.SupportTicket || model<ISupportTicket>("SupportTicket", SupportTicketSchema);
export const Notification: Model<INotification> =
  models.Notification || model<INotification>("Notification", NotificationSchema);
