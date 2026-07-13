import { Schema, model, models, type Model, type Types } from "mongoose";
import { MediaSchema, SeoSchema } from "./catalog";
import { PUBLISH_STATUSES, type MediaAsset, type PublishStatus } from "./types";

/* ---------------------------------- Review --------------------------------- */

export interface IReview {
  _id: Types.ObjectId;
  user?: Types.ObjectId;
  booking?: Types.ObjectId;
  authorName: string;
  authorPhoto?: string;
  authorLocation?: string;
  subject: { kind: "package" | "hotel" | "activity" | "company"; refId?: Types.ObjectId; title?: string };
  destination?: string;
  rating: number;
  title: string;
  body: string;
  photos: MediaAsset[];
  videoUrl?: string;
  travelledOn?: Date;
  /** True only when the review is linked to a completed booking in our system. */
  isVerifiedBooking: boolean;
  isFeatured: boolean;
  status: "pending" | "approved" | "rejected";
  helpfulCount: number;
  adminReply?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    booking: { type: Schema.Types.ObjectId, ref: "Booking" },
    authorName: { type: String, required: true },
    authorPhoto: String,
    authorLocation: String,
    subject: {
      kind: { type: String, enum: ["package", "hotel", "activity", "company"], default: "package" },
      refId: Schema.Types.ObjectId,
      title: String,
    },
    destination: String,
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: "" },
    body: { type: String, required: true },
    photos: [MediaSchema],
    videoUrl: String,
    travelledOn: Date,
    isVerifiedBooking: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    helpfulCount: { type: Number, default: 0 },
    adminReply: String,
  },
  { timestamps: true },
);

ReviewSchema.index({ "subject.refId": 1, status: 1 });
ReviewSchema.index({ status: 1, isFeatured: -1, createdAt: -1 });
ReviewSchema.index({ rating: -1 });

/* --------------------------------- BlogPost -------------------------------- */

export interface IBlogPost {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImage: MediaAsset;
  category: string;
  tags: string[];
  author: { name: string; role?: string; avatar?: string };
  readingMinutes: number;
  relatedDestinations: Types.ObjectId[];
  relatedPackages: Types.ObjectId[];
  status: PublishStatus;
  publishedAt?: Date;
  seo?: { title?: string; description?: string; keywords?: string[]; ogImage?: string; noIndex?: boolean };
  viewCount: number;
  isFeatured: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const BlogPostSchema = new Schema<IBlogPost>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, lowercase: true },
    excerpt: { type: String, default: "" },
    body: { type: String, default: "" },
    coverImage: { type: MediaSchema, required: true },
    category: { type: String, required: true },
    tags: [String],
    author: {
      name: { type: String, default: "Editorial Team" },
      role: String,
      avatar: String,
    },
    readingMinutes: { type: Number, default: 5 },
    relatedDestinations: [{ type: Schema.Types.ObjectId, ref: "Destination" }],
    relatedPackages: [{ type: Schema.Types.ObjectId, ref: "Package" }],
    status: { type: String, enum: PUBLISH_STATUSES, default: "published" },
    publishedAt: { type: Date, default: Date.now },
    seo: SeoSchema,
    viewCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

BlogPostSchema.index({ slug: 1 }, { unique: true });
BlogPostSchema.index({ status: 1, publishedAt: -1 });
BlogPostSchema.index({ category: 1, status: 1 });
BlogPostSchema.index({ title: "text", excerpt: "text", tags: "text" });

/* ----------------------------------- FAQ ----------------------------------- */

export interface IFAQ {
  _id: Types.ObjectId;
  question: string;
  answer: string;
  /** Where the FAQ appears: general | booking | payment | visa | flights | hotels | activities */
  group: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FAQSchema = new Schema<IFAQ>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    group: { type: String, default: "general" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

FAQSchema.index({ group: 1, order: 1 });

export const Review: Model<IReview> = models.Review || model<IReview>("Review", ReviewSchema);
export const BlogPost: Model<IBlogPost> = models.BlogPost || model<IBlogPost>("BlogPost", BlogPostSchema);
export const FAQ: Model<IFAQ> = models.FAQ || model<IFAQ>("FAQ", FAQSchema);
