"use server";

import { connectDB } from "@/lib/db";
import { Notification, VisaApplication, VisaCountry } from "@/models";
import { getCurrentUser } from "@/lib/session";
import { guard } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";
import { sendMail } from "@/lib/mail";
import { renderTemplate } from "@/lib/email-templates";
import { createEnquiryWithLead } from "@/server/leads";
import { visaApplicationSchema } from "@/lib/validation";
import { generateReference, serialise } from "@/lib/utils";
import type { ActionResult } from "./enquiry";

/**
 * A visa "application" here is a request for our assistance — not a submission
 * to an embassy. The status machine reflects our workflow, and every customer
 * touchpoint repeats that the decision belongs to the authority.
 */
export async function submitVisaApplication(raw: unknown): Promise<ActionResult> {
  const limit = await guard("visa", { limit: 4, windowSeconds: 300 });
  if (!limit.success) {
    return { ok: false, message: "Too many submissions. Please wait a minute and try again." };
  }

  const parsed = visaApplicationSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors };
  }

  const d = parsed.data;
  if (d.website) return { ok: true, message: "Thank you — we'll be in touch." };

  try {
    await connectDB();

    const country = await VisaCountry.findOne({ slug: d.visaCountrySlug, status: "published" });
    if (!country) {
      return { ok: false, message: "We don't currently handle visas for that country." };
    }

    const visaType =
      country.visaTypes.find((v) => v.type === d.visaType) ?? country.visaTypes[0];

    // Fees are derived from the database, never from the form.
    const quotedFee = visaType
      ? (visaType.governmentFeeINR + visaType.serviceFeeINR) * d.travellerCount
      : 0;

    const user = await getCurrentUser();
    const reference = generateReference("VISA");

    await VisaApplication.create({
      reference,
      user: user?.id,
      visaCountry: country._id,
      countryName: country.country,
      visaType: visaType?.type ?? d.visaType,
      nationality: d.nationality,
      applicantName: d.applicantName,
      email: d.email,
      phone: d.phone,
      passportNumber: d.passportNumber,
      travelDate: d.travelDate ? new Date(d.travelDate) : undefined,
      travellerCount: d.travellerCount,
      quotedFeeINR: quotedFee,
      documents: country.documentChecklist.map((doc) => ({
        title: doc.title,
        status: "pending" as const,
      })),
      status: "submitted",
      statusHistory: [
        { status: "submitted", at: new Date(), by: "customer", note: "Application request received." },
      ],
    });

    // Also raise a lead so sales/ops see it in one pipeline.
    await createEnquiryWithLead({
      type: "visa",
      name: d.applicantName,
      email: d.email,
      phone: d.phone,
      countryCode: "+91",
      message: d.message,
      sourcePage: `/visa/${country.slug}`,
      consent: d.consent,
      campaign: undefined,
      preferences: undefined,
      subject: {
        kind: "visa",
        refId: country._id as never,
        title: `${country.country} — ${visaType?.label ?? d.visaType}`,
        slug: country.slug,
      },
    });

    await Notification.create({
      audience: "admin",
      kind: "visa",
      title: `New visa request — ${country.country}`,
      body: `${d.applicantName} · ${d.travellerCount} applicant(s) · ${reference}`,
      href: `/admin/visa`,
    });

    const settings = await getSettings();
    const tpl = await renderTemplate("visaUpdate", {
      brandName: settings.brand.name,
      name: d.applicantName,
      reference,
      country: country.country,
      status: "Received — under review",
      note: "We'll review your details and send you a document checklist within one business day.",
    });
    await sendMail({ to: d.email, subject: tpl.subject, html: tpl.html });

    return {
      ok: true,
      reference,
      message:
        "Your visa request is with our team. We'll send a document checklist within one business day.",
    };
  } catch (error) {
    console.error("[submitVisaApplication]", error);
    return {
      ok: false,
      message: "Something went wrong on our side. Please try again, or call us directly.",
    };
  }
}

/** Public tracking: reference + email, so a guest can check without an account. */
export async function trackVisaApplication(reference: string, email: string) {
  const limit = await guard("visa-track", { limit: 15, windowSeconds: 300 });
  if (!limit.success) {
    return { ok: false as const, message: "Too many lookups. Please wait a moment." };
  }

  try {
    await connectDB();

    const application = await VisaApplication.findOne({
      reference: reference.trim().toUpperCase(),
      email: email.trim().toLowerCase(),
      deletedAt: null,
    }).lean();

    if (!application) {
      return {
        ok: false as const,
        message: "We couldn't find an application with that reference and email.",
      };
    }

    return { ok: true as const, application: serialise(application) };
  } catch (error) {
    console.error("[trackVisaApplication]", error);
    return { ok: false as const, message: "We couldn't look that up. Please try again." };
  }
}
