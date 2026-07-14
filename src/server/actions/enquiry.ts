"use server";

import { randomBytes } from "node:crypto";
import { connectDB } from "@/lib/db";
import { NewsletterSubscriber } from "@/models";
import { guard } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";
import { sendMail } from "@/lib/mail";
import { emailTemplates } from "@/lib/email-templates";
import { createEnquiryWithLead } from "@/server/leads";
import {
  callbackSchema,
  contactSchema,
  customTripSchema,
  enquirySchema,
  newsletterSchema,
} from "@/lib/validation";

export interface ActionResult {
  ok: boolean;
  message: string;
  reference?: string;
  fieldErrors?: Record<string, string>;
}

const RATE_LIMITED: ActionResult = {
  ok: false,
  message: "Too many submissions. Please wait a minute and try again.",
};

const GENERIC_ERROR: ActionResult = {
  ok: false,
  message: "Something went wrong on our side. Please try again, or call us directly.",
};

function zodFieldErrors(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/* ------------------------------ General enquiry ---------------------------- */

export async function submitEnquiry(raw: unknown): Promise<ActionResult> {
  const limit = await guard("enquiry", { limit: 5, windowSeconds: 120 });
  if (!limit.success) return RATE_LIMITED;

  const parsed = enquirySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  // Honeypot: accept silently so bots learn nothing, but write nothing.
  if (data.website) return { ok: true, message: "Thank you — we'll be in touch shortly." };

  try {
    const { lead } = await createEnquiryWithLead({
      type: data.type,
      name: data.name,
      email: data.email,
      phone: data.phone,
      countryCode: data.countryCode,
      message: data.message,
      subject: data.subject
        ? {
            kind: data.subject.kind,
            title: data.subject.title,
            slug: data.subject.slug,
            refId: data.subject.refId as never,
          }
        : undefined,
      sourcePage: data.sourcePage,
      campaign: data.campaign,
      consent: data.consent,
      preferences: undefined,
    });

    const settings = await getSettings();
    const tpl = emailTemplates.enquiryReceived({
      brandName: settings.brand.name,
      name: data.name,
      reference: lead.reference,
      subject: data.subject?.title,
    });
    await sendMail({ to: data.email, subject: tpl.subject, html: tpl.html });

    return {
      ok: true,
      message: "Thank you — a travel designer will reach out within one business day.",
      reference: lead.reference,
    };
  } catch (error) {
    console.error("[submitEnquiry]", error);
    return GENERIC_ERROR;
  }
}

/* ----------------------------- Callback request ---------------------------- */

export async function submitCallback(raw: unknown): Promise<ActionResult> {
  const limit = await guard("callback", { limit: 5, windowSeconds: 120 });
  if (!limit.success) return RATE_LIMITED;

  const parsed = callbackSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  if (data.website) return { ok: true, message: "Thank you — we'll call you shortly." };

  try {
    const { lead } = await createEnquiryWithLead({
      type: "callback",
      name: data.name,
      email: data.email || `${data.phone}@callback.placeholder`,
      phone: data.phone,
      countryCode: data.countryCode,
      message: [data.preferredTime ? `Preferred time: ${data.preferredTime}` : null, data.message]
        .filter(Boolean)
        .join(" — "),
      subject: data.subject
        ? {
            kind: data.subject.kind,
            title: data.subject.title,
            slug: data.subject.slug,
            refId: data.subject.refId as never,
          }
        : undefined,
      sourcePage: data.sourcePage,
      consent: data.consent,
      preferences: undefined,
      campaign: undefined,
    });

    if (data.email) {
      const settings = await getSettings();
      const tpl = emailTemplates.callbackReceived({
        brandName: settings.brand.name,
        name: data.name,
        phone: `${data.countryCode} ${data.phone}`,
      });
      await sendMail({ to: data.email, subject: tpl.subject, html: tpl.html });
    }

    return {
      ok: true,
      message: "Got it — we'll call you during business hours.",
      reference: lead.reference,
    };
  } catch (error) {
    console.error("[submitCallback]", error);
    return GENERIC_ERROR;
  }
}

/* -------------------------------- Custom trip ------------------------------ */

export async function submitCustomTrip(raw: unknown): Promise<ActionResult> {
  const limit = await guard("custom-trip", { limit: 4, windowSeconds: 300 });
  if (!limit.success) return RATE_LIMITED;

  const parsed = customTripSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const d = parsed.data;
  if (d.website) return { ok: true, message: "Thank you — your trip brief has been received." };

  try {
    const { lead } = await createEnquiryWithLead({
      type: "custom_trip",
      name: d.name,
      email: d.email,
      phone: d.phone,
      countryCode: "+91",
      message: d.specialRequests,
      sourcePage: d.sourcePage,
      consent: d.consent,
      campaign: undefined,
      subject: undefined,
      preferences: {
        destination: d.destination,
        departureCity: d.departureCity,
        startDate: d.startDate ? new Date(d.startDate) : undefined,
        endDate: d.endDate ? new Date(d.endDate) : undefined,
        flexibleDates: d.flexibleDates,
        durationDays: d.durationDays,
        adults: d.adults,
        children: d.children,
        budgetPerPersonINR: d.budgetPerPersonINR,
        travelStyle: d.travelStyle,
        hotelCategory: d.hotelCategory,
        flightsRequired: d.flightsRequired,
        visaRequired: d.visaRequired,
        activities: d.activities,
        specialRequests: d.specialRequests,
      },
    });

    const settings = await getSettings();
    const tpl = emailTemplates.enquiryReceived({
      brandName: settings.brand.name,
      name: d.name,
      reference: lead.reference,
      subject: `${d.durationDays}-day trip to ${d.destination}`,
    });
    await sendMail({ to: d.email, subject: tpl.subject, html: tpl.html });

    return {
      ok: true,
      message: "Your trip brief is with our designers. Expect a tailored itinerary within 24 hours.",
      reference: lead.reference,
    };
  } catch (error) {
    console.error("[submitCustomTrip]", error);
    return GENERIC_ERROR;
  }
}

/* ---------------------------------- Contact -------------------------------- */

export async function submitContact(raw: unknown): Promise<ActionResult> {
  const limit = await guard("contact", { limit: 5, windowSeconds: 120 });
  if (!limit.success) return RATE_LIMITED;

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const d = parsed.data;
  if (d.website) return { ok: true, message: "Thank you — we'll be in touch." };

  const typeMap = {
    general: "general",
    package: "package",
    corporate: "corporate",
    group: "group",
    visa: "visa",
    support: "contact",
  } as const;

  try {
    const { lead } = await createEnquiryWithLead({
      type: typeMap[d.topic],
      name: d.name,
      email: d.email,
      phone: d.phone,
      countryCode: d.countryCode,
      message: d.message,
      sourcePage: d.sourcePage,
      consent: d.consent,
      campaign: undefined,
      subject: undefined,
      preferences: undefined,
    });

    const settings = await getSettings();
    const tpl = emailTemplates.enquiryReceived({
      brandName: settings.brand.name,
      name: d.name,
      reference: lead.reference,
    });
    await sendMail({ to: d.email, subject: tpl.subject, html: tpl.html });

    return {
      ok: true,
      message: "Message received. We usually reply within a few hours.",
      reference: lead.reference,
    };
  } catch (error) {
    console.error("[submitContact]", error);
    return GENERIC_ERROR;
  }
}

/* -------------------------------- Newsletter ------------------------------- */

export async function subscribeNewsletter(raw: unknown): Promise<ActionResult> {
  const limit = await guard("newsletter", { limit: 5, windowSeconds: 300 });
  if (!limit.success) return RATE_LIMITED;

  const parsed = newsletterSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const d = parsed.data;

  try {
    await connectDB();

    const existing = await NewsletterSubscriber.findOne({ email: d.email });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        await existing.save();
      }
      return { ok: true, message: "You're already on the list — we'll keep the good stuff coming." };
    }

    await NewsletterSubscriber.create({
      email: d.email,
      name: d.name,
      phone: d.phone,
      whatsappOptIn: d.whatsappOptIn,
      source: d.source,
      unsubscribeToken: randomBytes(24).toString("hex"),
    });

    return { ok: true, message: "You're in. Two emails a month, nothing else." };
  } catch (error) {
    console.error("[subscribeNewsletter]", error);
    return GENERIC_ERROR;
  }
}
