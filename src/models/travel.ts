import { Schema, model, models, type Model, type Types } from "mongoose";
import { MediaSchema, SeoSchema } from "./catalog";
import { PUBLISH_STATUSES, type MediaAsset, type PublishStatus } from "./types";

/* ---------------------------------- Room ----------------------------------- */

export interface IRoom {
  key: string;
  name: string;
  description: string;
  images: MediaAsset[];
  maxAdults: number;
  maxChildren: number;
  maxOccupancy: number;
  bedType: string;
  sizeSqft?: number;
  amenities: string[];
  mealPlan: "room_only" | "breakfast" | "half_board" | "full_board" | "all_inclusive";
  pricePerNightINR: number;
  originalPricePerNightINR?: number;
  taxPercent: number;
  refundable: boolean;
  cancellationRule: string;
  roomsAvailable: number;
}

const RoomSchema = new Schema<IRoom>(
  {
    key: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    images: [MediaSchema],
    maxAdults: { type: Number, default: 2 },
    maxChildren: { type: Number, default: 1 },
    maxOccupancy: { type: Number, default: 3 },
    bedType: { type: String, default: "King" },
    sizeSqft: Number,
    amenities: [String],
    mealPlan: {
      type: String,
      enum: ["room_only", "breakfast", "half_board", "full_board", "all_inclusive"],
      default: "breakfast",
    },
    pricePerNightINR: { type: Number, required: true, min: 0 },
    originalPricePerNightINR: { type: Number, min: 0 },
    taxPercent: { type: Number, default: 12 },
    refundable: { type: Boolean, default: true },
    cancellationRule: { type: String, default: "Free cancellation up to 72 hours before check-in." },
    roomsAvailable: { type: Number, default: 5 },
  },
  { _id: false },
);

/* ---------------------------------- Hotel ---------------------------------- */

export interface IHotel {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  destination: Types.ObjectId;
  city: string;
  country: string;
  address: string;
  starCategory: 3 | 4 | 5;
  propertyType: "hotel" | "resort" | "villa" | "boutique" | "homestay";
  summary: string;
  description: string;
  heroImage: MediaAsset;
  gallery: MediaAsset[];
  amenities: string[];
  rooms: IRoom[];
  coordinates: { lat: number; lng: number };
  checkInTime: string;
  checkOutTime: string;
  policies: string[];
  ratingAverage: number;
  ratingCount: number;
  startingPriceINR: number;
  isFeatured: boolean;
  status: PublishStatus;
  seo?: { title?: string; description?: string; noIndex?: boolean };
  isDemoData: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const HotelSchema = new Schema<IHotel>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, lowercase: true },
    destination: { type: Schema.Types.ObjectId, ref: "Destination", required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    address: { type: String, default: "" },
    starCategory: { type: Number, enum: [3, 4, 5], default: 4 },
    propertyType: {
      type: String,
      enum: ["hotel", "resort", "villa", "boutique", "homestay"],
      default: "hotel",
    },
    summary: { type: String, default: "" },
    description: { type: String, default: "" },
    heroImage: { type: MediaSchema, required: true },
    gallery: [MediaSchema],
    amenities: [String],
    rooms: [RoomSchema],
    coordinates: { lat: { type: Number, default: 0 }, lng: { type: Number, default: 0 } },
    checkInTime: { type: String, default: "14:00" },
    checkOutTime: { type: String, default: "11:00" },
    policies: [String],
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    startingPriceINR: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    status: { type: String, enum: PUBLISH_STATUSES, default: "published" },
    seo: SeoSchema,
    isDemoData: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

HotelSchema.index({ slug: 1 }, { unique: true });
HotelSchema.index({ city: 1, status: 1, deletedAt: 1 });
HotelSchema.index({ destination: 1, starCategory: 1 });
HotelSchema.index({ startingPriceINR: 1 });
HotelSchema.index({ name: "text", city: "text", summary: "text" });

/* -------------------------------- Activity --------------------------------- */

export interface IActivitySlot {
  time: string;
  label: string;
  capacity: number;
  booked: number;
}

export interface IActivity {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  destination: Types.ObjectId;
  city: string;
  category: string;
  summary: string;
  description: string;
  heroImage: MediaAsset;
  gallery: MediaAsset[];
  durationMinutes: number;
  pricePerAdultINR: number;
  pricePerChildINR: number;
  originalPriceINR?: number;
  taxPercent: number;
  minParticipants: number;
  maxParticipants: number;
  minAge?: number;
  slots: IActivitySlot[];
  addOns: { key: string; label: string; priceINR: number }[];
  pickupAvailable: boolean;
  pickupNote?: string;
  inclusions: string[];
  exclusions: string[];
  safetyInfo: string[];
  cancellationPolicy: string;
  instantConfirmation: boolean;
  ratingAverage: number;
  ratingCount: number;
  isFeatured: boolean;
  status: PublishStatus;
  isDemoData: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, lowercase: true },
    destination: { type: Schema.Types.ObjectId, ref: "Destination", required: true },
    city: { type: String, required: true },
    category: { type: String, required: true },
    summary: { type: String, default: "" },
    description: { type: String, default: "" },
    heroImage: { type: MediaSchema, required: true },
    gallery: [MediaSchema],
    durationMinutes: { type: Number, default: 120 },
    pricePerAdultINR: { type: Number, required: true, min: 0 },
    pricePerChildINR: { type: Number, default: 0, min: 0 },
    originalPriceINR: { type: Number, min: 0 },
    taxPercent: { type: Number, default: 5 },
    minParticipants: { type: Number, default: 1 },
    maxParticipants: { type: Number, default: 20 },
    minAge: Number,
    slots: [
      {
        _id: false,
        time: { type: String, required: true },
        label: { type: String, default: "" },
        capacity: { type: Number, default: 20 },
        booked: { type: Number, default: 0 },
      },
    ],
    addOns: [{ _id: false, key: String, label: String, priceINR: Number }],
    pickupAvailable: { type: Boolean, default: false },
    pickupNote: String,
    inclusions: [String],
    exclusions: [String],
    safetyInfo: [String],
    cancellationPolicy: {
      type: String,
      default: "Free cancellation up to 24 hours before the experience starts.",
    },
    instantConfirmation: { type: Boolean, default: true },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    status: { type: String, enum: PUBLISH_STATUSES, default: "published" },
    isDemoData: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

ActivitySchema.index({ slug: 1 }, { unique: true });
ActivitySchema.index({ category: 1, status: 1, deletedAt: 1 });
ActivitySchema.index({ destination: 1, status: 1 });
ActivitySchema.index({ pricePerAdultINR: 1 });
ActivitySchema.index({ title: "text", city: "text", summary: "text" });

/* ------------------------------- VisaCountry ------------------------------- */

export interface IVisaCountry {
  _id: Types.ObjectId;
  country: string;
  slug: string;
  countryCode: string;
  flagEmoji: string;
  heroImage: MediaAsset;
  visaTypes: {
    type: string;
    label: string;
    processingTimeDays: string;
    stayDurationDays: string;
    validityDays: string;
    governmentFeeINR: number;
    serviceFeeINR: number;
    entryType: "single" | "multiple";
  }[];
  /** Nationality this guidance is written for. Defaults to Indian passport holders. */
  forNationality: string;
  summary: string;
  documentChecklist: { title: string; note?: string; required: boolean }[];
  eligibilityNotes: string[];
  processSteps: { title: string; description: string }[];
  faqs: { question: string; answer: string }[];
  isPopular: boolean;
  status: PublishStatus;
  seo?: { title?: string; description?: string; noIndex?: boolean };
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const VisaCountrySchema = new Schema<IVisaCountry>(
  {
    country: { type: String, required: true },
    slug: { type: String, required: true, lowercase: true },
    countryCode: { type: String, required: true },
    flagEmoji: { type: String, default: "" },
    heroImage: { type: MediaSchema, required: true },
    visaTypes: [
      {
        _id: false,
        type: { type: String, required: true },
        label: String,
        processingTimeDays: String,
        stayDurationDays: String,
        validityDays: String,
        governmentFeeINR: { type: Number, default: 0 },
        serviceFeeINR: { type: Number, default: 0 },
        entryType: { type: String, enum: ["single", "multiple"], default: "single" },
      },
    ],
    forNationality: { type: String, default: "Indian" },
    summary: { type: String, default: "" },
    documentChecklist: [
      { _id: false, title: String, note: String, required: { type: Boolean, default: true } },
    ],
    eligibilityNotes: [String],
    processSteps: [{ _id: false, title: String, description: String }],
    faqs: [{ _id: false, question: String, answer: String }],
    isPopular: { type: Boolean, default: false },
    status: { type: String, enum: PUBLISH_STATUSES, default: "published" },
    seo: SeoSchema,
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

VisaCountrySchema.index({ slug: 1 }, { unique: true });
VisaCountrySchema.index({ isPopular: -1, country: 1 });

export const Hotel: Model<IHotel> = models.Hotel || model<IHotel>("Hotel", HotelSchema);
export const Activity: Model<IActivity> = models.Activity || model<IActivity>("Activity", ActivitySchema);
export const VisaCountry: Model<IVisaCountry> =
  models.VisaCountry || model<IVisaCountry>("VisaCountry", VisaCountrySchema);
