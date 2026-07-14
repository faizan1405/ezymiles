import { Schema, model, models, type Model, type Types } from "mongoose";
import { PUBLISH_STATUSES, type MediaAsset, type PublishStatus } from "./types";

const MediaSchema = new Schema<MediaAsset>(
  {
    url: { type: String, required: true },
    alt: { type: String, default: "" },
    publicId: String,
    width: Number,
    height: Number,
    type: { type: String, enum: ["image", "video"], default: "image" },
  },
  { _id: false },
);

const SeoSchema = new Schema(
  {
    title: String,
    description: String,
    keywords: [String],
    ogImage: String,
    noIndex: { type: Boolean, default: false },
  },
  { _id: false },
);

/* ------------------------------- Destination ------------------------------- */

export interface IDestination {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  country: string;
  countryCode: string;
  region: string;
  scope: "domestic" | "international";
  themes: string[];
  summary: string;
  description: string;
  heroImage: MediaAsset;
  gallery: MediaAsset[];
  startingPriceINR: number;
  recommendedDurationDays: number;
  bestMonths: string[];
  currencyUsed?: string;
  languages?: string[];
  timezone?: string;
  visaNote?: string;
  coordinates: { lat: number; lng: number };
  highlights: string[];
  faqs: { question: string; answer: string }[];
  isFeatured: boolean;
  isTrending: boolean;
  status: PublishStatus;
  seo?: { title?: string; description?: string; keywords?: string[]; ogImage?: string; noIndex?: boolean };
  viewCount: number;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const DestinationSchema = new Schema<IDestination>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    country: { type: String, required: true },
    countryCode: { type: String, default: "IN" },
    region: { type: String, default: "" },
    scope: { type: String, enum: ["domestic", "international"], required: true },
    themes: [{ type: String, index: true }],
    summary: { type: String, default: "" },
    description: { type: String, default: "" },
    heroImage: { type: MediaSchema, required: true },
    gallery: [MediaSchema],
    startingPriceINR: { type: Number, default: 0, min: 0 },
    recommendedDurationDays: { type: Number, default: 5 },
    bestMonths: [String],
    currencyUsed: String,
    languages: [String],
    timezone: String,
    visaNote: String,
    coordinates: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    highlights: [String],
    faqs: [{ _id: false, question: String, answer: String }],
    isFeatured: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    status: { type: String, enum: PUBLISH_STATUSES, default: "published" },
    seo: SeoSchema,
    viewCount: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

DestinationSchema.index({ slug: 1 }, { unique: true });
DestinationSchema.index({ scope: 1, status: 1, deletedAt: 1 });
DestinationSchema.index({ isFeatured: 1, isTrending: 1 });
DestinationSchema.index({ name: "text", country: "text", summary: "text" });

/* --------------------------------- Package --------------------------------- */

export interface IItineraryDay {
  day: number;
  city: string;
  title: string;
  description: string;
  images: MediaAsset[];
  meals: ("breakfast" | "lunch" | "dinner")[];
  hotel?: string;
  transfers?: string;
  activities: string[];
  optionalExperiences: string[];
  coordinates?: { lat: number; lng: number };
}

export interface IPackageVariant {
  key: string;
  label: string;
  hotelCategory: 3 | 4 | 5;
  durationDays: number;
  durationNights: number;
  /** Base price per adult, INR. Server-authoritative. */
  pricePerAdultINR: number;
  pricePerChildINR: number;
  singleSupplementINR: number;
  originalPricePerAdultINR?: number;
  inclusionsExtra: string[];
  isDefault: boolean;
}

export interface IDeparture {
  /** Subdocument id — departures are addressed individually when booking. */
  _id: Types.ObjectId;
  date: Date;
  returnDate?: Date;
  departureCity: string;
  seatsTotal: number;
  seatsBooked: number;
  priceAdjustmentINR: number;
  isFixedDeparture: boolean;
  isGuaranteed: boolean;
  status: "open" | "filling_fast" | "sold_out" | "closed";
}

export interface IPackage {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  subtitle: string;
  destination: Types.ObjectId;
  additionalDestinations: Types.ObjectId[];
  citiesCovered: string[];
  scope: "domestic" | "international";
  tripTypes: string[];
  collections: string[];
  durationDays: number;
  durationNights: number;
  heroImage: MediaAsset;
  gallery: MediaAsset[];
  videoUrl?: string;
  overview: string;
  highlights: string[];
  itinerary: IItineraryDay[];
  variants: IPackageVariant[];
  departures: IDeparture[];
  departureCities: string[];
  /** Denormalised from the default variant for fast list queries & sorting. */
  startingPriceINR: number;
  originalPriceINR?: number;
  priceBasis: "per_person" | "per_couple";
  taxPercent: number;
  flightsIncluded: boolean;
  mealsIncluded: boolean;
  activitiesIncluded: boolean;
  visaIncluded: boolean;
  transfersIncluded: boolean;
  hotelCategory: 3 | 4 | 5;
  tripStyle: "group" | "private";
  instantConfirmation: boolean;
  recommendedSeason: string[];
  inclusions: string[];
  exclusions: string[];
  importantInfo: string[];
  visaDetails: string;
  cancellationPolicy: { window: string; charge: string }[];
  paymentPolicy: string[];
  termsAndConditions: string[];
  hotels: { city: string; name: string; category: number; nights: number; note?: string }[];
  flightNote?: string;
  transfersNote?: string;
  faqs: { question: string; answer: string }[];
  ratingAverage: number;
  ratingCount: number;
  isFeatured: boolean;
  isTrending: boolean;
  isBestseller: boolean;
  status: PublishStatus;
  publishAt?: Date;
  seo?: { title?: string; description?: string; keywords?: string[]; ogImage?: string; noIndex?: boolean };
  viewCount: number;
  enquiryCount: number;
  bookingCount: number;
  /** Demo inventory is clearly labelled everywhere it is displayed. */
  isDemoData: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ItineraryDaySchema = new Schema<IItineraryDay>(
  {
    day: { type: Number, required: true },
    city: { type: String, default: "" },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    images: [MediaSchema],
    meals: [{ type: String, enum: ["breakfast", "lunch", "dinner"] }],
    hotel: String,
    transfers: String,
    activities: [String],
    optionalExperiences: [String],
    coordinates: { lat: Number, lng: Number },
  },
  { _id: false },
);

const PackageVariantSchema = new Schema<IPackageVariant>(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    hotelCategory: { type: Number, enum: [3, 4, 5], default: 4 },
    durationDays: { type: Number, required: true },
    durationNights: { type: Number, required: true },
    pricePerAdultINR: { type: Number, required: true, min: 0 },
    pricePerChildINR: { type: Number, default: 0, min: 0 },
    singleSupplementINR: { type: Number, default: 0, min: 0 },
    originalPricePerAdultINR: { type: Number, min: 0 },
    inclusionsExtra: [String],
    isDefault: { type: Boolean, default: false },
  },
  { _id: false },
);

const DepartureSchema = new Schema<IDeparture>(
  {
    date: { type: Date, required: true },
    returnDate: Date,
    departureCity: { type: String, default: "Delhi" },
    seatsTotal: { type: Number, default: 20 },
    seatsBooked: { type: Number, default: 0 },
    priceAdjustmentINR: { type: Number, default: 0 },
    isFixedDeparture: { type: Boolean, default: false },
    isGuaranteed: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["open", "filling_fast", "sold_out", "closed"],
      default: "open",
    },
  },
  { _id: true },
);

const PackageSchema = new Schema<IPackage>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    subtitle: { type: String, default: "" },
    destination: { type: Schema.Types.ObjectId, ref: "Destination", required: true },
    additionalDestinations: [{ type: Schema.Types.ObjectId, ref: "Destination" }],
    citiesCovered: [String],
    scope: { type: String, enum: ["domestic", "international"], required: true },
    tripTypes: [String],
    collections: [String],
    durationDays: { type: Number, required: true, min: 1 },
    durationNights: { type: Number, required: true, min: 0 },
    heroImage: { type: MediaSchema, required: true },
    gallery: [MediaSchema],
    videoUrl: String,
    overview: { type: String, default: "" },
    highlights: [String],
    itinerary: [ItineraryDaySchema],
    variants: [PackageVariantSchema],
    departures: [DepartureSchema],
    departureCities: [String],
    startingPriceINR: { type: Number, required: true, min: 0 },
    originalPriceINR: { type: Number, min: 0 },
    priceBasis: { type: String, enum: ["per_person", "per_couple"], default: "per_person" },
    taxPercent: { type: Number, default: 5 },
    flightsIncluded: { type: Boolean, default: false },
    mealsIncluded: { type: Boolean, default: true },
    activitiesIncluded: { type: Boolean, default: true },
    visaIncluded: { type: Boolean, default: false },
    transfersIncluded: { type: Boolean, default: true },
    hotelCategory: { type: Number, enum: [3, 4, 5], default: 4 },
    tripStyle: { type: String, enum: ["group", "private"], default: "private" },
    instantConfirmation: { type: Boolean, default: false },
    recommendedSeason: [String],
    inclusions: [String],
    exclusions: [String],
    importantInfo: [String],
    visaDetails: { type: String, default: "" },
    cancellationPolicy: [{ _id: false, window: String, charge: String }],
    paymentPolicy: [String],
    termsAndConditions: [String],
    hotels: [{ _id: false, city: String, name: String, category: Number, nights: Number, note: String }],
    flightNote: String,
    transfersNote: String,
    faqs: [{ _id: false, question: String, answer: String }],
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    isBestseller: { type: Boolean, default: false },
    status: { type: String, enum: PUBLISH_STATUSES, default: "published" },
    publishAt: Date,
    seo: SeoSchema,
    viewCount: { type: Number, default: 0 },
    enquiryCount: { type: Number, default: 0 },
    bookingCount: { type: Number, default: 0 },
    isDemoData: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

PackageSchema.index({ slug: 1 }, { unique: true });
PackageSchema.index({ status: 1, deletedAt: 1, startingPriceINR: 1 });
PackageSchema.index({ destination: 1, status: 1 });
PackageSchema.index({ collections: 1, status: 1 });
PackageSchema.index({ tripTypes: 1, status: 1 });
PackageSchema.index({ scope: 1, durationDays: 1 });
PackageSchema.index({ isFeatured: -1, ratingAverage: -1 });
PackageSchema.index({ title: "text", subtitle: "text", citiesCovered: "text", overview: "text" });

/* ------------------------------- Categories -------------------------------- */

export interface ICategory {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  kind: "blog" | "activity" | "trip_type";
  description?: string;
  image?: MediaAsset;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, lowercase: true },
    kind: { type: String, enum: ["blog", "activity", "trip_type"], required: true },
    description: String,
    image: MediaSchema,
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

CategorySchema.index({ kind: 1, slug: 1 }, { unique: true });

export const Destination: Model<IDestination> =
  models.Destination || model<IDestination>("Destination", DestinationSchema);
export const Package: Model<IPackage> = models.Package || model<IPackage>("Package", PackageSchema);
export const Category: Model<ICategory> = models.Category || model<ICategory>("Category", CategorySchema);
export { MediaSchema, SeoSchema };
