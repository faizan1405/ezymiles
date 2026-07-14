"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/db";
import { assertAdmin } from "@/lib/session";
import { getGateway } from "@/server/payments/gateway";
import { sendMail } from "@/lib/mail";
import { emailTemplates } from "@/lib/email-templates";
import { getSettings } from "@/lib/settings";
import { generateReference, slugify } from "@/lib/utils";
import {
  Activity,
  AdminUser,
  AuditLog,
  BlogPost,
  Booking,
  Coupon,
  Destination,
  FAQ,
  Hotel,
  LegalPage,
  Lead,
  LeadNote,
  MediaItem,
  Notification,
  Offer,
  Package,
  Payment,
  Refund,
  Review,
  SiteSettings,
  SupportTicket,
  VisaApplication,
  VisaCountry,
} from "@/models";
import {
  ADMIN_ROLES,
  LEAD_STATUSES,
  PERMISSIONS,
  PUBLISH_STATUSES,
  TICKET_STATUSES,
  VISA_APPLICATION_STATUSES,
  type Permission,
} from "@/models/types";

export interface AdminResult {
  ok: boolean;
  message: string;
  id?: string;
}

const DENIED = (message: string): AdminResult => ({ ok: false, message });

/* -------------------------------------------------------------------------- */
/*                                 Audit trail                                 */
/* -------------------------------------------------------------------------- */

/**
 * Every mutation in this file writes an audit row. It is intentionally
 * best-effort: a failure to log must never roll back a legitimate business
 * action, but it is logged loudly so the gap is visible.
 */
async function audit(
  actor: { id?: string; name?: string | null; email?: string | null; role?: string },
  action: string,
  module: string,
  target?: { id?: string; label?: string },
  changes?: Record<string, unknown>,
) {
  try {
    const h = await headers();
    await AuditLog.create({
      actor: {
        id: actor.id,
        name: actor.name ?? "Unknown",
        email: actor.email ?? "",
        role: actor.role ?? "",
      },
      action,
      module,
      targetId: target?.id,
      targetLabel: target?.label,
      changes,
      ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? undefined,
      userAgent: h.get("user-agent") ?? undefined,
    });
  } catch (error) {
    console.error("[audit] failed to record:", error);
  }
}

/** Guard + connect in one step — used at the top of every action below. */
async function guardAction(permission: Permission) {
  const check = await assertAdmin(permission);
  if (!check.ok) return { ok: false as const, message: check.message };
  await connectDB();
  return {
    ok: true as const,
    actor: {
      id: check.user.id,
      name: check.user.name,
      email: check.user.email,
      role: check.user.adminRole,
    },
  };
}

/* -------------------------------------------------------------------------- */
/*                                    Leads                                    */
/* -------------------------------------------------------------------------- */

const leadUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(LEAD_STATUSES).optional(),
  assignedTo: z.string().optional(),
  followUpDate: z.string().optional(),
  estimatedValueINR: z.coerce.number().min(0).optional(),
  lostReason: z.string().max(300).optional(),
});

export async function updateLead(raw: unknown): Promise<AdminResult> {
  const g = await guardAction("leads:manage");
  if (!g.ok) return DENIED(g.message);

  const parsed = leadUpdateSchema.safeParse(raw);
  if (!parsed.success) return DENIED("Invalid lead update.");

  const { id, ...changes } = parsed.data;

  try {
    const lead = await Lead.findById(id);
    if (!lead) return DENIED("Lead not found.");

    const before = lead.status;

    if (changes.status) lead.status = changes.status;
    if (changes.assignedTo !== undefined) {
      lead.assignedTo = changes.assignedTo ? (changes.assignedTo as never) : undefined;
    }
    if (changes.followUpDate !== undefined) {
      lead.followUpDate = changes.followUpDate ? new Date(changes.followUpDate) : undefined;
    }
    if (changes.estimatedValueINR !== undefined) {
      lead.estimatedValueINR = changes.estimatedValueINR;
    }
    if (changes.lostReason !== undefined) lead.lostReason = changes.lostReason;

    if (changes.status && changes.status !== before) {
      lead.lastContactedAt = new Date();
      await LeadNote.create({
        lead: lead._id,
        author: g.actor.id as never,
        authorName: g.actor.name ?? "Staff",
        kind: "status_change",
        body: `Status changed from "${before}" to "${changes.status}".`,
      });
    }

    await lead.save();
    await audit(g.actor, "lead.update", "leads", { id, label: lead.reference }, changes);

    revalidatePath("/admin/leads");
    revalidatePath(`/admin/leads/${id}`);

    return { ok: true, message: "Lead updated." };
  } catch (error) {
    console.error("[updateLead]", error);
    return DENIED("Could not update that lead.");
  }
}

export async function addLeadNote(
  leadId: string,
  body: string,
  kind: "note" | "call" | "email" | "whatsapp" | "meeting" = "note",
): Promise<AdminResult> {
  const g = await guardAction("leads:manage");
  if (!g.ok) return DENIED(g.message);

  if (!body?.trim()) return DENIED("Write something first.");

  try {
    await LeadNote.create({
      lead: leadId,
      author: g.actor.id as never,
      authorName: g.actor.name ?? "Staff",
      kind,
      body: body.trim(),
    });

    await Lead.updateOne({ _id: leadId }, { $set: { lastContactedAt: new Date() } });
    await audit(g.actor, "lead.note", "leads", { id: leadId }, { kind });

    revalidatePath(`/admin/leads/${leadId}`);
    return { ok: true, message: "Note added." };
  } catch (error) {
    console.error("[addLeadNote]", error);
    return DENIED("Could not add that note.");
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Bookings                                   */
/* -------------------------------------------------------------------------- */

export async function updateBookingStatus(
  bookingId: string,
  status: string,
  note?: string,
): Promise<AdminResult> {
  const g = await guardAction("bookings:manage");
  if (!g.ok) return DENIED(g.message);

  const allowed = ["confirmed", "completed", "cancelled", "pending_payment"];
  if (!allowed.includes(status)) return DENIED("That status change isn't allowed from here.");

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) return DENIED("Booking not found.");

    const before = booking.status;
    booking.status = status as typeof booking.status;

    if (status === "cancelled") {
      booking.cancellation = {
        ...(booking.cancellation ?? {}),
        approvedAt: new Date(),
        reason: booking.cancellation?.reason ?? note,
      };
    }

    if (note) booking.notes = [booking.notes, note].filter(Boolean).join("\n");
    await booking.save();

    await audit(
      g.actor,
      "booking.status",
      "bookings",
      { id: bookingId, label: booking.reference },
      { from: before, to: status },
    );

    if (booking.user) {
      await Notification.create({
        audience: "customer",
        user: booking.user,
        kind: "booking",
        title: `Booking ${status.replace("_", " ")}`,
        body: `${booking.item.title} — ${booking.reference}`,
        href: "/account/trips",
      });
    }

    if (status === "cancelled" && booking.guestEmail) {
      const settings = await getSettings();
      const tpl = emailTemplates.cancellationUpdate({
        brandName: settings.brand.name,
        name: booking.guestName ?? "there",
        reference: booking.reference,
        status: "confirmed",
        chargeINR: booking.cancellation?.chargeINR,
      });
      await sendMail({ to: booking.guestEmail, subject: tpl.subject, html: tpl.html });
    }

    revalidatePath("/admin/bookings");
    return { ok: true, message: `Booking marked ${status.replace("_", " ")}.` };
  } catch (error) {
    console.error("[updateBookingStatus]", error);
    return DENIED("Could not update that booking.");
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Refunds                                   */
/* -------------------------------------------------------------------------- */

const refundSchema = z.object({
  bookingId: z.string().min(1),
  amountINR: z.coerce.number().min(1, "Enter an amount"),
  reason: z.string().min(3, "Give a reason"),
});

export async function createRefund(raw: unknown): Promise<AdminResult> {
  const g = await guardAction("refunds:manage");
  if (!g.ok) return DENIED(g.message);

  const parsed = refundSchema.safeParse(raw);
  if (!parsed.success) return DENIED(parsed.error.issues[0]?.message ?? "Invalid refund.");

  const { bookingId, amountINR, reason } = parsed.data;

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) return DENIED("Booking not found.");

    // A refund can never exceed what was actually collected.
    if (amountINR > booking.payment.amountPaidINR) {
      return DENIED(
        `You can't refund more than the ₹${booking.payment.amountPaidINR.toLocaleString("en-IN")} collected.`,
      );
    }

    const payment = await Payment.findOne({ booking: booking._id, status: "paid" }).sort({
      createdAt: -1,
    });

    const refund = await Refund.create({
      booking: booking._id,
      payment: payment?._id,
      amountINR,
      reason,
      status: "requested",
      processedBy: g.actor.id as never,
    });

    await audit(
      g.actor,
      "refund.create",
      "refunds",
      { id: String(refund._id), label: booking.reference },
      { amountINR, reason },
    );

    revalidatePath("/admin/refunds");
    return { ok: true, id: String(refund._id), message: "Refund raised — approve it to process." };
  } catch (error) {
    console.error("[createRefund]", error);
    return DENIED("Could not raise that refund.");
  }
}

export async function processRefund(refundId: string, approve: boolean): Promise<AdminResult> {
  const g = await guardAction("refunds:manage");
  if (!g.ok) return DENIED(g.message);

  try {
    const refund = await Refund.findById(refundId);
    if (!refund) return DENIED("Refund not found.");
    if (refund.status === "completed") return DENIED("That refund has already been processed.");

    if (!approve) {
      refund.status = "rejected";
      refund.processedBy = g.actor.id as never;
      refund.processedAt = new Date();
      await refund.save();

      await audit(g.actor, "refund.reject", "refunds", { id: refundId });
      revalidatePath("/admin/refunds");
      return { ok: true, message: "Refund rejected." };
    }

    const booking = await Booking.findById(refund.booking);
    const payment = refund.payment ? await Payment.findById(refund.payment) : null;

    // Push to the gateway when we have a real captured payment to reverse.
    if (payment?.gatewayPaymentId) {
      const gateway = getGateway(payment.gateway);

      if (gateway.configured) {
        try {
          const result = await gateway.refund({
            paymentId: payment.gatewayPaymentId,
            amountINR: refund.amountINR,
            notes: { refundId: String(refund._id), reason: refund.reason },
          });
          refund.gatewayRefundId = result.refundId;
          refund.status = "completed";
        } catch (error) {
          console.error("[processRefund] gateway error:", error);
          refund.status = "processing";
          refund.notes = "Gateway refund failed — process manually and mark complete.";
        }
      } else {
        // No gateway on this environment: record it, don't fake it.
        refund.status = "processing";
        refund.notes = "No payment gateway configured — refund must be issued manually.";
      }
    } else {
      refund.status = "processing";
      refund.notes = "No captured gateway payment found — refund must be issued manually.";
    }

    refund.processedBy = g.actor.id as never;
    refund.processedAt = new Date();
    await refund.save();

    if (booking) {
      const paid = Math.max(0, booking.payment.amountPaidINR - refund.amountINR);
      booking.payment.amountPaidINR = paid;
      booking.payment.status = paid === 0 ? "refunded" : "partially_refunded";
      await booking.save();

      if (booking.guestEmail) {
        const settings = await getSettings();
        const tpl = emailTemplates.refundUpdate({
          brandName: settings.brand.name,
          name: booking.guestName ?? "there",
          reference: booking.reference,
          amountINR: refund.amountINR,
          status: refund.status,
        });
        await sendMail({ to: booking.guestEmail, subject: tpl.subject, html: tpl.html });
      }
    }

    await audit(g.actor, "refund.process", "refunds", { id: refundId }, { status: refund.status });

    revalidatePath("/admin/refunds");
    revalidatePath("/admin/bookings");

    return {
      ok: true,
      message:
        refund.status === "completed"
          ? "Refund processed through the gateway."
          : "Refund approved — it needs to be issued manually.",
    };
  } catch (error) {
    console.error("[processRefund]", error);
    return DENIED("Could not process that refund.");
  }
}

/* -------------------------------------------------------------------------- */
/*                          Publish / archive / delete                         */
/* -------------------------------------------------------------------------- */

const MODELS = {
  package: { model: Package, permission: "packages:manage", path: "/admin/packages" },
  destination: { model: Destination, permission: "destinations:manage", path: "/admin/destinations" },
  hotel: { model: Hotel, permission: "hotels:manage", path: "/admin/hotels" },
  activity: { model: Activity, permission: "activities:manage", path: "/admin/activities" },
  blog: { model: BlogPost, permission: "blogs:manage", path: "/admin/blogs" },
  visa: { model: VisaCountry, permission: "visa:manage", path: "/admin/visa" },
} as const;

type EntityKind = keyof typeof MODELS;

export async function setPublishStatus(
  kind: EntityKind,
  id: string,
  status: string,
): Promise<AdminResult> {
  const config = MODELS[kind];
  if (!config) return DENIED("Unknown entity.");

  const g = await guardAction(config.permission as Permission);
  if (!g.ok) return DENIED(g.message);

  if (!PUBLISH_STATUSES.includes(status as never)) return DENIED("Invalid status.");

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (config.model as any).updateOne({ _id: id }, { $set: { status } });

    await audit(g.actor, `${kind}.status`, kind, { id }, { status });

    revalidatePath(config.path);
    revalidatePath("/");
    return { ok: true, message: `Marked ${status}.` };
  } catch (error) {
    console.error("[setPublishStatus]", error);
    return DENIED("Could not change that status.");
  }
}

/**
 * Soft delete only. Historical bookings must keep resolving to the thing that
 * was booked, so nothing in the catalogue is ever hard-deleted.
 */
export async function softDeleteEntity(kind: EntityKind, id: string): Promise<AdminResult> {
  const config = MODELS[kind];
  if (!config) return DENIED("Unknown entity.");

  const g = await guardAction(config.permission as Permission);
  if (!g.ok) return DENIED(g.message);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (config.model as any).updateOne(
      { _id: id },
      { $set: { deletedAt: new Date(), status: "archived" } },
    );

    await audit(g.actor, `${kind}.delete`, kind, { id });

    revalidatePath(config.path);
    return { ok: true, message: "Archived. Historical bookings are unaffected." };
  } catch (error) {
    console.error("[softDeleteEntity]", error);
    return DENIED("Could not archive that.");
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Packages                                   */
/* -------------------------------------------------------------------------- */

const packageSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(4, "Title is too short"),
  slug: z.string().trim().optional(),
  subtitle: z.string().trim().max(300).optional(),
  destination: z.string().min(1, "Pick a destination"),
  citiesCovered: z.array(z.string()).default([]),
  scope: z.enum(["domestic", "international"]),
  tripTypes: z.array(z.string()).default([]),
  collections: z.array(z.string()).default([]),
  durationDays: z.coerce.number().int().min(1),
  durationNights: z.coerce.number().int().min(0),
  heroImage: z.object({ url: z.string().min(1, "Add a hero image"), alt: z.string().default("") }),
  gallery: z.array(z.object({ url: z.string(), alt: z.string().default("") })).default([]),
  videoUrl: z.string().optional(),
  overview: z.string().trim().min(20, "Write an overview"),
  highlights: z.array(z.string()).default([]),
  itinerary: z
    .array(
      z.object({
        day: z.coerce.number().int().min(1),
        city: z.string().default(""),
        title: z.string().min(1),
        description: z.string().default(""),
        meals: z.array(z.enum(["breakfast", "lunch", "dinner"])).default([]),
        hotel: z.string().optional(),
        transfers: z.string().optional(),
        activities: z.array(z.string()).default([]),
        optionalExperiences: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  variants: z
    .array(
      z.object({
        key: z.string().min(1),
        label: z.string().min(1),
        hotelCategory: z.coerce.number().int().min(3).max(5),
        durationDays: z.coerce.number().int().min(1),
        durationNights: z.coerce.number().int().min(0),
        pricePerAdultINR: z.coerce.number().min(0),
        pricePerChildINR: z.coerce.number().min(0).default(0),
        singleSupplementINR: z.coerce.number().min(0).default(0),
        originalPricePerAdultINR: z.coerce.number().min(0).optional(),
        isDefault: z.boolean().default(false),
      }),
    )
    .min(1, "Add at least one pricing option"),
  departures: z
    .array(
      z.object({
        date: z.string().min(1),
        departureCity: z.string().default("Delhi"),
        seatsTotal: z.coerce.number().int().min(1).default(20),
        seatsBooked: z.coerce.number().int().min(0).default(0),
        priceAdjustmentINR: z.coerce.number().default(0),
        isFixedDeparture: z.boolean().default(true),
        isGuaranteed: z.boolean().default(false),
      }),
    )
    .default([]),
  departureCities: z.array(z.string()).default([]),
  taxPercent: z.coerce.number().min(0).max(30).default(5),
  flightsIncluded: z.boolean().default(false),
  mealsIncluded: z.boolean().default(true),
  activitiesIncluded: z.boolean().default(true),
  visaIncluded: z.boolean().default(false),
  transfersIncluded: z.boolean().default(true),
  hotelCategory: z.coerce.number().int().min(3).max(5).default(4),
  tripStyle: z.enum(["group", "private"]).default("private"),
  instantConfirmation: z.boolean().default(false),
  recommendedSeason: z.array(z.string()).default([]),
  inclusions: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  importantInfo: z.array(z.string()).default([]),
  visaDetails: z.string().default(""),
  cancellationPolicy: z.array(z.object({ window: z.string(), charge: z.string() })).default([]),
  paymentPolicy: z.array(z.string()).default([]),
  termsAndConditions: z.array(z.string()).default([]),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
  isFeatured: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  status: z.enum(PUBLISH_STATUSES).default("draft"),
  publishAt: z.string().optional(),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      keywords: z.array(z.string()).default([]),
      noIndex: z.boolean().default(false),
    })
    .optional(),
  isDemoData: z.boolean().default(false),
});

export async function savePackage(raw: unknown): Promise<AdminResult> {
  const g = await guardAction("packages:manage");
  if (!g.ok) return DENIED(g.message);

  const parsed = packageSchema.safeParse(raw);
  if (!parsed.success) {
    return DENIED(parsed.error.issues[0]?.message ?? "Please check the package fields.");
  }

  const d = parsed.data;

  try {
    const defaultVariant = d.variants.find((v) => v.isDefault) ?? d.variants[0];

    // Denormalised for list queries and sorting — always derived, never entered.
    const startingPriceINR = Math.min(...d.variants.map((v) => v.pricePerAdultINR));
    const originalPriceINR = defaultVariant.originalPricePerAdultINR;

    const slug = d.slug?.trim() ? slugify(d.slug) : slugify(d.title);

    const doc = {
      title: d.title,
      slug,
      subtitle: d.subtitle ?? "",
      destination: d.destination,
      citiesCovered: d.citiesCovered,
      scope: d.scope,
      tripTypes: d.tripTypes,
      collections: d.collections,
      durationDays: d.durationDays,
      durationNights: d.durationNights,
      heroImage: d.heroImage,
      gallery: d.gallery,
      videoUrl: d.videoUrl,
      overview: d.overview,
      highlights: d.highlights,
      itinerary: d.itinerary,
      variants: d.variants,
      departures: d.departures.map((dep) => ({
        ...dep,
        date: new Date(dep.date),
        status: dep.seatsBooked >= dep.seatsTotal ? "sold_out" : "open",
      })),
      departureCities: d.departureCities,
      startingPriceINR,
      originalPriceINR,
      taxPercent: d.taxPercent,
      flightsIncluded: d.flightsIncluded,
      mealsIncluded: d.mealsIncluded,
      activitiesIncluded: d.activitiesIncluded,
      visaIncluded: d.visaIncluded,
      transfersIncluded: d.transfersIncluded,
      hotelCategory: d.hotelCategory,
      tripStyle: d.tripStyle,
      instantConfirmation: d.instantConfirmation,
      recommendedSeason: d.recommendedSeason,
      inclusions: d.inclusions,
      exclusions: d.exclusions,
      importantInfo: d.importantInfo,
      visaDetails: d.visaDetails,
      cancellationPolicy: d.cancellationPolicy,
      paymentPolicy: d.paymentPolicy,
      termsAndConditions: d.termsAndConditions,
      faqs: d.faqs,
      isFeatured: d.isFeatured,
      isTrending: d.isTrending,
      isBestseller: d.isBestseller,
      status: d.status,
      publishAt: d.publishAt ? new Date(d.publishAt) : undefined,
      seo: d.seo,
      isDemoData: d.isDemoData,
    };

    // Slug must be unique across everything except this document.
    const clash = await Package.findOne({ slug, _id: { $ne: d.id } }).select("_id").lean();
    if (clash) return DENIED("Another package already uses that URL slug.");

    let id = d.id;

    // Zod widens the literal unions (hotelCategory 3|4|5, meal names) to number
    // and string. Mongoose re-validates them against the schema enums on write,
    // so this cast is safe and the DB stays the real boundary.
    const payload = doc as unknown as Parameters<typeof Package.create>[0];

    if (d.id) {
      await Package.updateOne({ _id: d.id }, { $set: payload });
    } else {
      const created = await Package.create(payload);
      id = String(created._id);
    }

    await audit(g.actor, d.id ? "package.update" : "package.create", "packages", {
      id,
      label: d.title,
    });

    revalidatePath("/admin/packages");
    revalidatePath(`/packages/${slug}`);
    revalidatePath("/packages");
    revalidatePath("/");

    return { ok: true, id, message: d.id ? "Package saved." : "Package created." };
  } catch (error) {
    console.error("[savePackage]", error);
    return DENIED("Could not save that package.");
  }
}

export async function duplicatePackage(id: string): Promise<AdminResult> {
  const g = await guardAction("packages:manage");
  if (!g.ok) return DENIED(g.message);

  try {
    const original = await Package.findById(id).lean();
    if (!original) return DENIED("Package not found.");

    const {
      _id: _ignored,
      createdAt: _c,
      updatedAt: _u,
      ...rest
    } = original as unknown as Record<string, unknown>;

    const copy = await Package.create({
      ...rest,
      title: `${original.title} (copy)`,
      slug: `${original.slug}-copy-${Date.now().toString(36).slice(-4)}`,
      status: "draft",
      isFeatured: false,
      isTrending: false,
      isBestseller: false,
      viewCount: 0,
      enquiryCount: 0,
      bookingCount: 0,
    } as unknown as Parameters<typeof Package.create>[0]);

    await audit(g.actor, "package.duplicate", "packages", {
      id: String(copy._id),
      label: copy.title,
    });

    revalidatePath("/admin/packages");
    return { ok: true, id: String(copy._id), message: "Duplicated as a draft." };
  } catch (error) {
    console.error("[duplicatePackage]", error);
    return DENIED("Could not duplicate that package.");
  }
}

/* -------------------------------------------------------------------------- */
/*                                Destinations                                 */
/* -------------------------------------------------------------------------- */

const destinationSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2),
  slug: z.string().trim().optional(),
  country: z.string().trim().min(2),
  countryCode: z.string().trim().default("IN"),
  region: z.string().optional(),
  scope: z.enum(["domestic", "international"]),
  themes: z.array(z.string()).default([]),
  summary: z.string().trim().max(400).default(""),
  description: z.string().default(""),
  heroImage: z.object({ url: z.string().min(1, "Add a hero image"), alt: z.string().default("") }),
  gallery: z.array(z.object({ url: z.string(), alt: z.string().default("") })).default([]),
  startingPriceINR: z.coerce.number().min(0).default(0),
  recommendedDurationDays: z.coerce.number().int().min(1).default(5),
  bestMonths: z.array(z.string()).default([]),
  currencyUsed: z.string().optional(),
  languages: z.array(z.string()).default([]),
  timezone: z.string().optional(),
  visaNote: z.string().optional(),
  coordinates: z.object({ lat: z.coerce.number(), lng: z.coerce.number() }),
  highlights: z.array(z.string()).default([]),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
  isFeatured: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  status: z.enum(PUBLISH_STATUSES).default("draft"),
});

export async function saveDestination(raw: unknown): Promise<AdminResult> {
  const g = await guardAction("destinations:manage");
  if (!g.ok) return DENIED(g.message);

  const parsed = destinationSchema.safeParse(raw);
  if (!parsed.success) {
    return DENIED(parsed.error.issues[0]?.message ?? "Please check the destination fields.");
  }

  const d = parsed.data;
  const slug = d.slug?.trim() ? slugify(d.slug) : slugify(d.name);

  try {
    const clash = await Destination.findOne({ slug, _id: { $ne: d.id } }).select("_id");
    if (clash) return DENIED("Another destination already uses that URL slug.");

    const { id, ...doc } = d;
    let savedId = id;

    if (id) {
      await Destination.updateOne({ _id: id }, { $set: { ...doc, slug } });
    } else {
      const created = await Destination.create({ ...doc, slug });
      savedId = String(created._id);
    }

    await audit(g.actor, id ? "destination.update" : "destination.create", "destinations", {
      id: savedId,
      label: d.name,
    });

    revalidatePath("/admin/destinations");
    revalidatePath(`/destinations/${slug}`);
    revalidatePath("/destinations");
    revalidatePath("/");

    return { ok: true, id: savedId, message: id ? "Destination saved." : "Destination created." };
  } catch (error) {
    console.error("[saveDestination]", error);
    return DENIED("Could not save that destination.");
  }
}

/* -------------------------------------------------------------------------- */
/*                              Coupons and offers                             */
/* -------------------------------------------------------------------------- */

const couponSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(3).max(20),
  description: z.string().max(200).default(""),
  discountType: z.enum(["percent", "flat"]),
  value: z.coerce.number().min(0),
  maxDiscountINR: z.coerce.number().min(0).optional(),
  minBookingINR: z.coerce.number().min(0).default(0),
  appliesTo: z.array(z.string()).default([]),
  validFrom: z.string().min(1),
  validTo: z.string().min(1),
  usageLimit: z.coerce.number().int().min(0).default(0),
  perUserLimit: z.coerce.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
});

export async function saveCoupon(raw: unknown): Promise<AdminResult> {
  const g = await guardAction("coupons:manage");
  if (!g.ok) return DENIED(g.message);

  const parsed = couponSchema.safeParse(raw);
  if (!parsed.success) return DENIED(parsed.error.issues[0]?.message ?? "Check the coupon fields.");

  const d = parsed.data;

  if (d.discountType === "percent" && d.value > 100) {
    return DENIED("A percentage discount can't exceed 100%.");
  }
  if (new Date(d.validTo) <= new Date(d.validFrom)) {
    return DENIED("The end date must be after the start date.");
  }

  try {
    const code = d.code.trim().toUpperCase();
    const clash = await Coupon.findOne({ code, _id: { $ne: d.id } }).select("_id");
    if (clash) return DENIED("That coupon code already exists.");

    const doc = {
      ...d,
      code,
      validFrom: new Date(d.validFrom),
      validTo: new Date(d.validTo),
    };
    delete (doc as { id?: string }).id;

    let id = d.id;
    if (d.id) {
      await Coupon.updateOne({ _id: d.id }, { $set: doc });
    } else {
      const created = await Coupon.create(doc);
      id = String(created._id);
    }

    await audit(g.actor, d.id ? "coupon.update" : "coupon.create", "coupons", { id, label: code });

    revalidatePath("/admin/coupons");
    return { ok: true, id, message: d.id ? "Coupon saved." : "Coupon created." };
  } catch (error) {
    console.error("[saveCoupon]", error);
    return DENIED("Could not save that coupon.");
  }
}

export async function deleteCoupon(id: string): Promise<AdminResult> {
  const g = await guardAction("coupons:manage");
  if (!g.ok) return DENIED(g.message);

  try {
    const coupon = await Coupon.findById(id);
    if (!coupon) return DENIED("Coupon not found.");

    // Coupons that have been redeemed are deactivated, never deleted — the
    // bookings that used them must keep resolving.
    if (coupon.usageCount > 0) {
      coupon.isActive = false;
      await coupon.save();
      await audit(g.actor, "coupon.deactivate", "coupons", { id, label: coupon.code });
      revalidatePath("/admin/coupons");
      return { ok: true, message: "Coupon has been used, so it was deactivated rather than deleted." };
    }

    await Coupon.deleteOne({ _id: id });
    await audit(g.actor, "coupon.delete", "coupons", { id, label: coupon.code });

    revalidatePath("/admin/coupons");
    return { ok: true, message: "Coupon deleted." };
  } catch (error) {
    console.error("[deleteCoupon]", error);
    return DENIED("Could not delete that coupon.");
  }
}

const offerSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3),
  slug: z.string().optional(),
  kind: z.enum(["early_bird", "honeymoon", "group", "flight_inclusive", "festival", "seasonal"]),
  headline: z.string().max(200).default(""),
  description: z.string().max(600).default(""),
  image: z.object({ url: z.string().min(1, "Add an image"), alt: z.string().default("") }),
  couponCode: z.string().optional(),
  discountLabel: z.string().max(40).default(""),
  ctaLabel: z.string().default("View offer"),
  ctaHref: z.string().default("/packages"),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  isActive: z.boolean().default(true),
  order: z.coerce.number().int().default(0),
});

export async function saveOffer(raw: unknown): Promise<AdminResult> {
  const g = await guardAction("offers:manage");
  if (!g.ok) return DENIED(g.message);

  const parsed = offerSchema.safeParse(raw);
  if (!parsed.success) return DENIED(parsed.error.issues[0]?.message ?? "Check the offer fields.");

  const d = parsed.data;
  const slug = d.slug?.trim() ? slugify(d.slug) : slugify(d.title);

  if (new Date(d.endsAt) <= new Date(d.startsAt)) {
    return DENIED("The end date must be after the start date.");
  }

  try {
    const { id, ...rest } = d;
    const doc = {
      ...rest,
      slug,
      startsAt: new Date(d.startsAt),
      endsAt: new Date(d.endsAt),
    };

    let savedId = id;
    if (id) {
      await Offer.updateOne({ _id: id }, { $set: doc });
    } else {
      const created = await Offer.create(doc);
      savedId = String(created._id);
    }

    await audit(g.actor, id ? "offer.update" : "offer.create", "offers", {
      id: savedId,
      label: d.title,
    });

    revalidatePath("/admin/offers");
    revalidatePath("/");
    return { ok: true, id: savedId, message: id ? "Offer saved." : "Offer created." };
  } catch (error) {
    console.error("[saveOffer]", error);
    return DENIED("Could not save that offer.");
  }
}

export async function deleteOffer(id: string): Promise<AdminResult> {
  const g = await guardAction("offers:manage");
  if (!g.ok) return DENIED(g.message);

  try {
    await Offer.deleteOne({ _id: id });
    await audit(g.actor, "offer.delete", "offers", { id });
    revalidatePath("/admin/offers");
    revalidatePath("/");
    return { ok: true, message: "Offer deleted." };
  } catch {
    return DENIED("Could not delete that offer.");
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Reviews                                   */
/* -------------------------------------------------------------------------- */

export async function setReviewStatus(
  id: string,
  status: "approved" | "rejected" | "pending",
): Promise<AdminResult> {
  const g = await guardAction("reviews:manage");
  if (!g.ok) return DENIED(g.message);

  try {
    const review = await Review.findById(id);
    if (!review) return DENIED("Review not found.");

    const before = review.status;
    review.status = status;
    await review.save();

    // Approving/unapproving a review changes the package's public rating, so
    // recompute it from the approved set rather than incrementing a counter.
    if (review.subject?.refId && review.subject.kind === "package") {
      await recomputeRating(Package, review.subject.refId.toString());
    }
    if (review.subject?.refId && review.subject.kind === "hotel") {
      await recomputeRating(Hotel, review.subject.refId.toString());
    }
    if (review.subject?.refId && review.subject.kind === "activity") {
      await recomputeRating(Activity, review.subject.refId.toString());
    }

    await audit(g.actor, "review.status", "reviews", { id }, { from: before, to: status });

    revalidatePath("/admin/reviews");
    revalidatePath("/");
    return { ok: true, message: `Review ${status}.` };
  } catch (error) {
    console.error("[setReviewStatus]", error);
    return DENIED("Could not update that review.");
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function recomputeRating(model: any, refId: string) {
  const agg = await Review.aggregate([
    { $match: { "subject.refId": (await import("mongoose")).default.Types.ObjectId.createFromHexString(refId), status: "approved" } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const avg = agg[0]?.avg ?? 0;
  const count = agg[0]?.count ?? 0;

  await model.updateOne(
    { _id: refId },
    { $set: { ratingAverage: Math.round(avg * 10) / 10, ratingCount: count } },
  );
}

export async function toggleReviewFeatured(id: string): Promise<AdminResult> {
  const g = await guardAction("reviews:manage");
  if (!g.ok) return DENIED(g.message);

  try {
    const review = await Review.findById(id);
    if (!review) return DENIED("Review not found.");

    review.isFeatured = !review.isFeatured;
    await review.save();

    await audit(g.actor, "review.feature", "reviews", { id }, { isFeatured: review.isFeatured });

    revalidatePath("/admin/reviews");
    revalidatePath("/");
    return { ok: true, message: review.isFeatured ? "Featured on the homepage." : "Removed from featured." };
  } catch {
    return DENIED("Could not update that review.");
  }
}

/* -------------------------------------------------------------------------- */
/*                                     FAQs                                    */
/* -------------------------------------------------------------------------- */

const faqSchema = z.object({
  id: z.string().optional(),
  question: z.string().trim().min(5),
  answer: z.string().trim().min(10),
  group: z.string().default("general"),
  order: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export async function saveFAQ(raw: unknown): Promise<AdminResult> {
  const g = await guardAction("faqs:manage");
  if (!g.ok) return DENIED(g.message);

  const parsed = faqSchema.safeParse(raw);
  if (!parsed.success) return DENIED(parsed.error.issues[0]?.message ?? "Check the FAQ fields.");

  const { id, ...doc } = parsed.data;

  try {
    let savedId = id;
    if (id) {
      await FAQ.updateOne({ _id: id }, { $set: doc });
    } else {
      const created = await FAQ.create(doc);
      savedId = String(created._id);
    }

    await audit(g.actor, id ? "faq.update" : "faq.create", "faqs", { id: savedId });

    revalidatePath("/admin/faqs");
    revalidatePath("/faqs");
    return { ok: true, id: savedId, message: id ? "FAQ saved." : "FAQ created." };
  } catch {
    return DENIED("Could not save that FAQ.");
  }
}

export async function deleteFAQ(id: string): Promise<AdminResult> {
  const g = await guardAction("faqs:manage");
  if (!g.ok) return DENIED(g.message);

  try {
    await FAQ.deleteOne({ _id: id });
    await audit(g.actor, "faq.delete", "faqs", { id });
    revalidatePath("/admin/faqs");
    revalidatePath("/faqs");
    return { ok: true, message: "FAQ deleted." };
  } catch {
    return DENIED("Could not delete that FAQ.");
  }
}

/* -------------------------------------------------------------------------- */
/*                                    Blog                                     */
/* -------------------------------------------------------------------------- */

const blogSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(5),
  slug: z.string().optional(),
  excerpt: z.string().trim().min(20).max(400),
  body: z.string().trim().min(100, "Write at least a paragraph or two"),
  coverImage: z.object({ url: z.string().min(1, "Add a cover image"), alt: z.string().default("") }),
  category: z.string().min(2),
  tags: z.array(z.string()).default([]),
  authorName: z.string().default("Editorial Team"),
  authorRole: z.string().optional(),
  readingMinutes: z.coerce.number().int().min(1).default(5),
  status: z.enum(PUBLISH_STATUSES).default("draft"),
  isFeatured: z.boolean().default(false),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export async function saveBlogPost(raw: unknown): Promise<AdminResult> {
  const g = await guardAction("blogs:manage");
  if (!g.ok) return DENIED(g.message);

  const parsed = blogSchema.safeParse(raw);
  if (!parsed.success) return DENIED(parsed.error.issues[0]?.message ?? "Check the article fields.");

  const d = parsed.data;
  const slug = d.slug?.trim() ? slugify(d.slug) : slugify(d.title);

  try {
    const clash = await BlogPost.findOne({ slug, _id: { $ne: d.id } }).select("_id");
    if (clash) return DENIED("Another article already uses that URL slug.");

    const doc = {
      title: d.title,
      slug,
      excerpt: d.excerpt,
      body: d.body,
      coverImage: d.coverImage,
      category: d.category,
      tags: d.tags,
      author: { name: d.authorName, role: d.authorRole },
      readingMinutes: d.readingMinutes,
      status: d.status,
      isFeatured: d.isFeatured,
      publishedAt: d.status === "published" ? new Date() : undefined,
      seo: { title: d.seoTitle, description: d.seoDescription },
    };

    let id = d.id;
    if (d.id) {
      await BlogPost.updateOne({ _id: d.id }, { $set: doc });
    } else {
      const created = await BlogPost.create(doc);
      id = String(created._id);
    }

    await audit(g.actor, d.id ? "blog.update" : "blog.create", "blogs", { id, label: d.title });

    revalidatePath("/admin/blogs");
    revalidatePath(`/blog/${slug}`);
    revalidatePath("/blog");
    return { ok: true, id, message: d.id ? "Article saved." : "Article created." };
  } catch (error) {
    console.error("[saveBlogPost]", error);
    return DENIED("Could not save that article.");
  }
}

/* -------------------------------------------------------------------------- */
/*                              Visa applications                              */
/* -------------------------------------------------------------------------- */

export async function updateVisaApplication(
  id: string,
  status: string,
  note?: string,
): Promise<AdminResult> {
  const g = await guardAction("visa:manage");
  if (!g.ok) return DENIED(g.message);

  if (!VISA_APPLICATION_STATUSES.includes(status as never)) return DENIED("Invalid status.");

  try {
    const app = await VisaApplication.findById(id);
    if (!app) return DENIED("Application not found.");

    app.status = status as typeof app.status;
    app.statusHistory.push({
      status,
      note,
      at: new Date(),
      by: g.actor.name ?? "Staff",
    });
    if (note) app.adminNotes = note;
    await app.save();

    await audit(g.actor, "visa.status", "visa", { id, label: app.reference }, { status });

    if (app.user) {
      await Notification.create({
        audience: "customer",
        user: app.user,
        kind: "visa",
        title: `Visa application ${status.replace(/_/g, " ")}`,
        body: `${app.countryName} — ${app.reference}`,
        href: "/account/visa",
      });
    }

    const settings = await getSettings();
    const tpl = emailTemplates.visaUpdate({
      brandName: settings.brand.name,
      name: app.applicantName,
      reference: app.reference,
      country: app.countryName,
      status: status.replace(/_/g, " "),
      note,
    });
    await sendMail({ to: app.email, subject: tpl.subject, html: tpl.html });

    revalidatePath("/admin/visa");
    return { ok: true, message: "Application updated and the traveller notified." };
  } catch (error) {
    console.error("[updateVisaApplication]", error);
    return DENIED("Could not update that application.");
  }
}

/* -------------------------------------------------------------------------- */
/*                               Support tickets                               */
/* -------------------------------------------------------------------------- */

export async function replyToTicketAsAgent(
  ticketId: string,
  body: string,
  status?: string,
): Promise<AdminResult> {
  const g = await guardAction("tickets:manage");
  if (!g.ok) return DENIED(g.message);

  if (!body?.trim()) return DENIED("Write a reply first.");

  try {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) return DENIED("Ticket not found.");

    ticket.messages.push({
      author: "agent",
      authorName: g.actor.name ?? "Support",
      body: body.trim(),
      at: new Date(),
    });

    if (status && TICKET_STATUSES.includes(status as never)) {
      ticket.status = status as typeof ticket.status;
    } else if (ticket.status === "open") {
      ticket.status = "in_progress";
    }

    ticket.assignedTo = g.actor.id as never;
    await ticket.save();

    await audit(g.actor, "ticket.reply", "tickets", { id: ticketId, label: ticket.reference });

    if (ticket.user) {
      await Notification.create({
        audience: "customer",
        user: ticket.user,
        kind: "ticket",
        title: "Reply on your support ticket",
        body: ticket.subject,
        href: "/account/support",
      });
    }

    const settings = await getSettings();
    const tpl = emailTemplates.ticketUpdate({
      brandName: settings.brand.name,
      name: ticket.name,
      reference: ticket.reference,
      subject: ticket.subject,
      status: ticket.status.replace(/_/g, " "),
    });
    await sendMail({ to: ticket.email, subject: tpl.subject, html: tpl.html });

    revalidatePath("/admin/tickets");
    return { ok: true, message: "Reply sent." };
  } catch (error) {
    console.error("[replyToTicketAsAgent]", error);
    return DENIED("Could not send that reply.");
  }
}

export async function setTicketStatus(ticketId: string, status: string): Promise<AdminResult> {
  const g = await guardAction("tickets:manage");
  if (!g.ok) return DENIED(g.message);

  if (!TICKET_STATUSES.includes(status as never)) return DENIED("Invalid status.");

  try {
    await SupportTicket.updateOne({ _id: ticketId }, { $set: { status } });
    await audit(g.actor, "ticket.status", "tickets", { id: ticketId }, { status });

    revalidatePath("/admin/tickets");
    return { ok: true, message: `Ticket marked ${status.replace(/_/g, " ")}.` };
  } catch {
    return DENIED("Could not update that ticket.");
  }
}

/* -------------------------------------------------------------------------- */
/*                                Staff & roles                                */
/* -------------------------------------------------------------------------- */

const staffSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  role: z.enum(ADMIN_ROLES),
  password: z.string().min(8).optional().or(z.literal("")),
  extraPermissions: z.array(z.enum(PERMISSIONS)).default([]),
  revokedPermissions: z.array(z.enum(PERMISSIONS)).default([]),
  isActive: z.boolean().default(true),
});

export async function saveStaff(raw: unknown): Promise<AdminResult> {
  const g = await guardAction("staff:manage");
  if (!g.ok) return DENIED(g.message);

  const parsed = staffSchema.safeParse(raw);
  if (!parsed.success) return DENIED(parsed.error.issues[0]?.message ?? "Check the staff fields.");

  const d = parsed.data;
  const email = d.email.toLowerCase();

  try {
    const clash = await AdminUser.findOne({ email, _id: { $ne: d.id } }).select("_id");
    if (clash) return DENIED("A staff account with that email already exists.");

    // A super admin can never lock themselves out of their own account.
    if (d.id === g.actor.id && (!d.isActive || d.role !== "super_admin")) {
      const self = await AdminUser.findById(d.id).select("role");
      if (self?.role === "super_admin") {
        return DENIED("You can't demote or deactivate your own super-admin account.");
      }
    }

    const doc: Record<string, unknown> = {
      name: d.name,
      email,
      role: d.role,
      extraPermissions: d.extraPermissions,
      revokedPermissions: d.revokedPermissions,
      isActive: d.isActive,
    };

    if (d.password) {
      doc.passwordHash = await bcrypt.hash(d.password, 12);
    } else if (!d.id) {
      return DENIED("Set a password for the new staff account.");
    }

    let id = d.id;
    if (d.id) {
      await AdminUser.updateOne({ _id: d.id }, { $set: doc });
    } else {
      const created = await AdminUser.create(doc);
      id = String(created._id);
    }

    await audit(g.actor, d.id ? "staff.update" : "staff.create", "staff", { id, label: email }, {
      role: d.role,
      isActive: d.isActive,
    });

    revalidatePath("/admin/staff");
    return { ok: true, id, message: d.id ? "Staff account saved." : "Staff account created." };
  } catch (error) {
    console.error("[saveStaff]", error);
    return DENIED("Could not save that staff account.");
  }
}

/* -------------------------------------------------------------------------- */
/*                                Site settings                                */
/* -------------------------------------------------------------------------- */

const settingsSchema = z.object({
  brand: z.object({
    name: z.string().min(1),
    tagline: z.string().min(1),
    logoUrl: z.string().optional(),
  }),
  contact: z.object({
    phone: z.string().min(1),
    whatsapp: z.string().min(1),
    email: z.string().min(1),
    address: z.string().min(1),
    officeHours: z.string().optional(),
  }),
  social: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    youtube: z.string().optional(),
    linkedin: z.string().optional(),
    x: z.string().optional(),
  }),
  announcement: z.object({
    enabled: z.boolean(),
    intervalMs: z.coerce.number().int().min(3000).max(20000),
    items: z.array(z.object({ text: z.string(), href: z.string().optional(), emphasis: z.string().optional() })),
  }),
  payments: z.object({
    partialPaymentEnabled: z.boolean(),
    depositPercent: z.coerce.number().min(5).max(100),
    balanceDueDaysBeforeTravel: z.coerce.number().int().min(1).max(120),
    taxPercentDefault: z.coerce.number().min(0).max(30),
    serviceFeeINR: z.coerce.number().min(0),
    razorpayEnabled: z.boolean(),
    stripeEnabled: z.boolean(),
  }),
  features: z.object({
    wishlistEnabled: z.boolean(),
    reviewsEnabled: z.boolean(),
    blogEnabled: z.boolean(),
    flightsEnabled: z.boolean(),
    hotelsEnabled: z.boolean(),
    activitiesEnabled: z.boolean(),
    visaEnabled: z.boolean(),
    cabsEnabled: z.boolean(),
  }),
  seo: z.object({
    defaultTitle: z.string().min(1),
    titleTemplate: z.string().min(1),
    defaultDescription: z.string().min(1),
    keywords: z.array(z.string()).default([]),
    googleSiteVerification: z.string().optional(),
  }),
  currency: z.object({
    rates: z.record(z.string(), z.coerce.number().positive()),
  }),
});

export async function saveSiteSettings(raw: unknown): Promise<AdminResult> {
  const g = await guardAction("settings:manage");
  if (!g.ok) return DENIED(g.message);

  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) {
    return DENIED(parsed.error.issues[0]?.message ?? "Please check the settings fields.");
  }

  const d = parsed.data;

  try {
    await SiteSettings.updateOne(
      { key: "default" },
      {
        $set: {
          brand: d.brand,
          contact: d.contact,
          social: d.social,
          announcement: d.announcement,
          payments: d.payments,
          features: d.features,
          seo: d.seo,
          "currency.rates": d.currency.rates,
          updatedBy: g.actor.id,
        },
      },
      { upsert: true },
    );

    await audit(g.actor, "settings.update", "settings");

    // Settings feed every page — flush the lot.
    revalidatePath("/", "layout");

    return { ok: true, message: "Settings saved. The site has been refreshed." };
  } catch (error) {
    console.error("[saveSiteSettings]", error);
    return DENIED("Could not save those settings.");
  }
}

const homepageSchema = z.object({
  heroHeadline: z.string().min(5),
  heroSubheadline: z.string().min(5),
  heroMediaKind: z.enum(["video", "slideshow"]),
  heroVideoUrl: z.string().optional(),
  heroSlides: z
    .array(
      z.object({
        url: z.string().min(1),
        alt: z.string().default(""),
        location: z.string().optional(),
        caption: z.string().optional(),
      }),
    )
    .default([]),
  sections: z.record(z.string(), z.boolean()).default({}),
  liveActivityEnabled: z.boolean().default(true),
  trustPoints: z
    .array(z.object({ icon: z.string(), title: z.string(), description: z.string() }))
    .default([]),
});

export async function saveHomepage(raw: unknown): Promise<AdminResult> {
  const g = await guardAction("homepage:manage");
  if (!g.ok) return DENIED(g.message);

  const parsed = homepageSchema.safeParse(raw);
  if (!parsed.success) {
    return DENIED(parsed.error.issues[0]?.message ?? "Please check the homepage fields.");
  }

  try {
    await SiteSettings.updateOne(
      { key: "default" },
      { $set: { homepage: parsed.data, updatedBy: g.actor.id } },
      { upsert: true },
    );

    await audit(g.actor, "homepage.update", "homepage");

    revalidatePath("/");
    return { ok: true, message: "Homepage updated." };
  } catch (error) {
    console.error("[saveHomepage]", error);
    return DENIED("Could not save the homepage.");
  }
}

/* -------------------------------------------------------------------------- */
/*                                 Legal pages                                 */
/* -------------------------------------------------------------------------- */

export async function saveLegalPage(
  slug: string,
  title: string,
  body: string,
  isPlaceholder: boolean,
): Promise<AdminResult> {
  const g = await guardAction("settings:manage");
  if (!g.ok) return DENIED(g.message);

  if (!body?.trim() || body.trim().length < 50) {
    return DENIED("Legal copy needs to be substantially longer than that.");
  }

  try {
    await LegalPage.updateOne(
      { slug },
      {
        $set: {
          title,
          body: body.trim(),
          isPlaceholder,
          lastReviewedAt: isPlaceholder ? undefined : new Date(),
        },
      },
      { upsert: true },
    );

    await audit(g.actor, "legal.update", "settings", { id: slug, label: title }, { isPlaceholder });

    revalidatePath(`/legal/${slug}`);
    return {
      ok: true,
      message: isPlaceholder
        ? "Saved — still flagged as placeholder text."
        : "Saved and marked as lawyer-reviewed.",
    };
  } catch (error) {
    console.error("[saveLegalPage]", error);
    return DENIED("Could not save that page.");
  }
}

/* -------------------------------------------------------------------------- */
/*                                    Media                                    */
/* -------------------------------------------------------------------------- */

export async function deleteMedia(id: string): Promise<AdminResult> {
  const g = await guardAction("media:manage");
  if (!g.ok) return DENIED(g.message);

  try {
    const item = await MediaItem.findById(id);
    if (!item) return DENIED("Media not found.");

    if (item.publicId) {
      const { destroyAsset } = await import("@/lib/cloudinary");
      await destroyAsset(item.publicId).catch((error) => {
        console.error("[deleteMedia] cloudinary:", error);
      });
    }

    await MediaItem.deleteOne({ _id: id });
    await audit(g.actor, "media.delete", "media", { id, label: item.alt });

    revalidatePath("/admin/media");
    return { ok: true, message: "Media deleted." };
  } catch (error) {
    console.error("[deleteMedia]", error);
    return DENIED("Could not delete that media item.");
  }
}

/* -------------------------------------------------------------------------- */
/*                               Notifications                                 */
/* -------------------------------------------------------------------------- */

export async function markAdminNotificationsRead(): Promise<AdminResult> {
  const g = await guardAction("dashboard:view");
  if (!g.ok) return DENIED(g.message);

  try {
    await Notification.updateMany({ audience: "admin", isRead: false }, { $set: { isRead: true } });
    revalidatePath("/admin/notifications");
    revalidatePath("/admin");
    return { ok: true, message: "All caught up." };
  } catch {
    return DENIED("Could not update notifications.");
  }
}

export { generateReference };
