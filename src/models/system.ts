import { Schema, model, models, type Model, type Types } from "mongoose";
import { CURRENCIES } from "@/config/site";

/* ------------------------------- SiteSettings ------------------------------ */
/**
 * A single document (key: "default"). Every value here is editable from
 * Admin → Site Settings and overrides the build-time defaults in config/site.ts.
 */
export interface ISiteSettings {
  _id: Types.ObjectId;
  key: string;

  brand: {
    name: string;
    tagline: string;
    logoUrl?: string;
    faviconUrl?: string;
  };

  contact: {
    phone: string;
    whatsapp: string;
    email: string;
    salesEmail?: string;
    address: string;
    mapUrl?: string;
    officeHours?: string;
  };

  social: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    linkedin?: string;
    x?: string;
  };

  announcement: {
    enabled: boolean;
    items: { text: string; href?: string; emphasis?: string }[];
    /** Cycle interval in ms. */
    intervalMs: number;
  };

  currency: {
    base: string;
    supported: string[];
    /** Units of currency per 1 INR. */
    rates: Record<string, number>;
  };

  payments: {
    razorpayEnabled: boolean;
    stripeEnabled: boolean;
    partialPaymentEnabled: boolean;
    depositPercent: number;
    /** Balance due this many days before departure. */
    balanceDueDaysBeforeTravel: number;
    taxPercentDefault: number;
    serviceFeeINR: number;
  };

  homepage: {
    heroHeadline: string;
    heroSubheadline: string;
    heroMediaKind: "video" | "slideshow";
    heroVideoUrl?: string;
    heroSlides: { url: string; alt: string; caption?: string; location?: string }[];
    /** Toggle any homepage section on or off. */
    sections: Record<string, boolean>;
    trustPoints: { icon: string; title: string; description: string }[];
    /** Live-activity strip is opt-in and only ever renders real database counts. */
    liveActivityEnabled: boolean;
  };

  seo: {
    defaultTitle: string;
    titleTemplate: string;
    defaultDescription: string;
    defaultOgImage?: string;
    keywords: string[];
    googleSiteVerification?: string;
  };

  features: {
    wishlistEnabled: boolean;
    reviewsEnabled: boolean;
    blogEnabled: boolean;
    flightsEnabled: boolean;
    hotelsEnabled: boolean;
    activitiesEnabled: boolean;
    visaEnabled: boolean;
    cabsEnabled: boolean;
  };

  maintenance: {
    enabled: boolean;
    message: string;
  };

  about: {
    aboutTitle: string;
    aboutText: string;
    aboutHighlight: string;
    philosophyTitle: string;
    philosophyText: string;
    founderHeading: string;
    founderName: string;
    founderRole: string;
    founderStory: string;
    founderQuote: string;
    founderQuoteSecondary: string;
    founderImageUrl: string;
    founderSignatureUrl: string;
  };

  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    key: { type: String, default: "default" },
    brand: {
      name: { type: String, default: "[TRAVEL BRAND NAME]" },
      tagline: { type: String, default: "Journeys designed around you." },
      logoUrl: String,
      faviconUrl: String,
    },
    contact: {
      phone: { type: String, default: "+91 79000 03279" },
      whatsapp: { type: String, default: "+91 79000 03279" },
      email: { type: String, default: "hello@ezymiles.com" },
      salesEmail: String,
      address: {
        type: String,
        default: "Plot No. 337, Industrial and Business Park, Phase 2, Chandigarh – 160002",
      },
      mapUrl: String,
      officeHours: { type: String, default: "10:00 AM – 5:00 PM" },
    },
    social: {
      instagram: String,
      facebook: String,
      youtube: String,
      linkedin: String,
      x: String,
    },
    announcement: {
      enabled: { type: Boolean, default: true },
      items: [{ _id: false, text: String, href: String, emphasis: String }],
      intervalMs: { type: Number, default: 5000 },
    },
    currency: {
      base: { type: String, default: "INR" },
      supported: { type: [String], default: [...CURRENCIES] },
      rates: { type: Schema.Types.Mixed, default: {} },
    },
    payments: {
      razorpayEnabled: { type: Boolean, default: true },
      stripeEnabled: { type: Boolean, default: false },
      partialPaymentEnabled: { type: Boolean, default: true },
      depositPercent: { type: Number, default: 25 },
      balanceDueDaysBeforeTravel: { type: Number, default: 21 },
      taxPercentDefault: { type: Number, default: 5 },
      serviceFeeINR: { type: Number, default: 0 },
    },
    homepage: {
      heroHeadline: { type: String, default: "The world, arranged around your idea of a good day." },
      heroSubheadline: {
        type: String,
        default:
          "Handcrafted holidays, honest pricing and a travel designer who actually picks up the phone.",
      },
      heroMediaKind: { type: String, enum: ["video", "slideshow"], default: "slideshow" },
      heroVideoUrl: String,
      heroSlides: [{ _id: false, url: String, alt: String, caption: String, location: String }],
      sections: { type: Schema.Types.Mixed, default: {} },
      trustPoints: [{ _id: false, icon: String, title: String, description: String }],
      liveActivityEnabled: { type: Boolean, default: true },
    },
    seo: {
      defaultTitle: { type: String, default: "Luxury holidays, flights, stays & experiences" },
      titleTemplate: { type: String, default: "%s — [TRAVEL BRAND NAME]" },
      defaultDescription: {
        type: String,
        default:
          "Handcrafted holiday packages, flights, hotels, activities and visa assistance, designed around the way you actually like to travel.",
      },
      defaultOgImage: String,
      keywords: { type: [String], default: [] },
      googleSiteVerification: String,
    },
    features: {
      wishlistEnabled: { type: Boolean, default: true },
      reviewsEnabled: { type: Boolean, default: true },
      blogEnabled: { type: Boolean, default: true },
      flightsEnabled: { type: Boolean, default: true },
      hotelsEnabled: { type: Boolean, default: true },
      activitiesEnabled: { type: Boolean, default: true },
      visaEnabled: { type: Boolean, default: true },
      cabsEnabled: { type: Boolean, default: true },
    },
    maintenance: {
      enabled: { type: Boolean, default: false },
      message: {
        type: String,
        default: "We're making a few improvements and will be back shortly. Thanks for your patience.",
      },
    },
    about: {
      aboutTitle: { type: String, default: "About eZyMiles" },
      aboutText: {
        type: String,
        default:
          "eZyMiles is an independent travel company focused on making family holidays, international vacations, honeymoons and weekend trips simple, transparent and stress-free.",
      },
      aboutHighlight: { type: String, default: "Listen first. Recommend honestly. Serve responsibly." },
      philosophyTitle: { type: String, default: "Trust Before Transactions" },
      philosophyText: {
        type: String,
        default:
          "Customers invest their money, time, emotions and dreams when planning a journey. eZyMiles values honest guidance and customer trust more than higher commissions.",
      },
      founderHeading: { type: String, default: "A Note from the Founder" },
      founderName: { type: String, default: "Charanjit Singh" },
      founderRole: { type: String, default: "Founder, eZyMiles" },
      founderStory: { type: String, default: "" },
      founderQuote: {
        type: String,
        default: "Travel should create memories, not complications.",
      },
      founderQuoteSecondary: { type: String, default: "Miles that make sense." },
      founderImageUrl: { type: String, default: "" },
      founderSignatureUrl: { type: String, default: "" },
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: true },
);

SiteSettingsSchema.index({ key: 1 }, { unique: true });

/* --------------------------------- AuditLog -------------------------------- */

export interface IAuditLog {
  _id: Types.ObjectId;
  actor: { id?: Types.ObjectId; name: string; email: string; role: string };
  action: string;
  module: string;
  targetId?: string;
  targetLabel?: string;
  changes?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actor: {
      id: Schema.Types.ObjectId,
      name: String,
      email: String,
      role: String,
    },
    action: { type: String, required: true },
    module: { type: String, required: true },
    targetId: String,
    targetLabel: String,
    changes: { type: Schema.Types.Mixed },
    ip: String,
    userAgent: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ module: 1, createdAt: -1 });
AuditLogSchema.index({ "actor.id": 1 });

/* ------------------------------- MediaLibrary ------------------------------ */

export interface IMediaItem {
  _id: Types.ObjectId;
  url: string;
  publicId?: string;
  alt: string;
  folder: string;
  type: "image" | "video";
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
  uploadedBy?: Types.ObjectId;
  createdAt: Date;
}

const MediaItemSchema = new Schema<IMediaItem>(
  {
    url: { type: String, required: true },
    publicId: String,
    alt: { type: String, default: "" },
    folder: { type: String, default: "general" },
    type: { type: String, enum: ["image", "video"], default: "image" },
    width: Number,
    height: Number,
    bytes: Number,
    format: String,
    uploadedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

MediaItemSchema.index({ folder: 1, createdAt: -1 });

/* ------------------------------- EmailTemplate ----------------------------- */

export interface IEmailTemplate {
  _id: Types.ObjectId;
  key: string;
  name: string;
  subject: string;
  /** Handlebars-lite: {{name}}, {{reference}}, … */
  body: string;
  isActive: boolean;
  channels: ("email" | "whatsapp" | "sms")[];
  createdAt: Date;
  updatedAt: Date;
}

const EmailTemplateSchema = new Schema<IEmailTemplate>(
  {
    key: { type: String, required: true },
    name: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    channels: [{ type: String, enum: ["email", "whatsapp", "sms"] }],
  },
  { timestamps: true },
);

EmailTemplateSchema.index({ key: 1 }, { unique: true });

/* ------------------------------ RolePermission ----------------------------- */
/**
 * Super-Admin-editable override of the built-in permission matrix
 * (`ROLE_PERMISSIONS` in `src/models/types.ts`). Absence of a document for a
 * role means "use the built-in default" — this collection only ever holds
 * roles a Super Admin has deliberately customised.
 */
export interface IRolePermission {
  _id: Types.ObjectId;
  role: string;
  permissions: string[];
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RolePermissionSchema = new Schema<IRolePermission>(
  {
    role: { type: String, required: true },
    permissions: { type: [String], default: [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: true },
);

RolePermissionSchema.index({ role: 1 }, { unique: true });

/* --------------------------------- LegalPage ------------------------------- */

export interface ILegalPage {
  _id: Types.ObjectId;
  slug: string;
  title: string;
  body: string;
  /** Placeholder text must be reviewed by a lawyer before launch. */
  isPlaceholder: boolean;
  lastReviewedAt?: Date;
  updatedAt: Date;
  createdAt: Date;
}

const LegalPageSchema = new Schema<ILegalPage>(
  {
    slug: { type: String, required: true, lowercase: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    isPlaceholder: { type: Boolean, default: true },
    lastReviewedAt: Date,
  },
  { timestamps: true },
);

LegalPageSchema.index({ slug: 1 }, { unique: true });

export const SiteSettings: Model<ISiteSettings> =
  models.SiteSettings || model<ISiteSettings>("SiteSettings", SiteSettingsSchema);
export const RolePermission: Model<IRolePermission> =
  models.RolePermission || model<IRolePermission>("RolePermission", RolePermissionSchema);
export const AuditLog: Model<IAuditLog> = models.AuditLog || model<IAuditLog>("AuditLog", AuditLogSchema);
export const MediaItem: Model<IMediaItem> =
  models.MediaItem || model<IMediaItem>("MediaItem", MediaItemSchema);
export const EmailTemplate: Model<IEmailTemplate> =
  models.EmailTemplate || model<IEmailTemplate>("EmailTemplate", EmailTemplateSchema);
export const LegalPage: Model<ILegalPage> =
  models.LegalPage || model<ILegalPage>("LegalPage", LegalPageSchema);
