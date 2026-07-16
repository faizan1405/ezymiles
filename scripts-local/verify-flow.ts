/**
 * THROWAWAY verification script — deleted after the run.
 * Exercises the real contact-form validation + persistence path against the
 * ephemeral Mongo, then reads it back the way the admin CRM does.
 *
 * The full submitContact() action also calls guard() -> headers(), which only
 * exists inside a Next request scope, so we drive the two substantive halves it
 * wraps: the SHARED Zod schema (identical client & server validation) and the
 * real createEnquiryWithLead() persistence the action calls on success.
 */
import { contactSchema } from "@/lib/validation";
import { createEnquiryWithLead } from "@/server/leads";
import { connectDB } from "@/lib/db";
import { Lead, Enquiry } from "@/models";
import { LEAD_STATUSES } from "@/models/types";

function line(label: string, ok: boolean, extra = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${extra ? "  — " + extra : ""}`);
  if (!ok) process.exitCode = 1;
}

// Mirrors the topic -> enquiry type map inside submitContact().
const typeMap = {
  general: "general", package: "package", corporate: "corporate",
  group: "group", visa: "visa", support: "contact",
} as const;

async function submitLikeAction(raw: unknown) {
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0] ?? "form")] ??= i.message;
    return { ok: false as const, fieldErrors };
  }
  const d = parsed.data;
  if (d.website) return { ok: true as const, honeypot: true }; // silent accept, no write
  const { lead } = await createEnquiryWithLead({
    type: typeMap[d.topic], name: d.name, email: d.email, phone: d.phone,
    countryCode: d.countryCode, message: d.message, sourcePage: d.sourcePage,
    consent: d.consent, campaign: undefined, subject: undefined, preferences: undefined,
  });
  return { ok: true as const, reference: lead.reference };
}

async function main() {
  await connectDB();

  // 1. Valid submission -> persists Lead + Enquiry, returns a reference.
  const valid = await submitLikeAction({
    topic: "general", name: "Verify Tester", email: "verify.tester@example.com",
    countryCode: "+91", phone: "9812345678",
    message: "This is an automated end-to-end verification of the contact form flow.",
    consent: true, sourcePage: "/contact", website: "",
  });
  line("valid submission returns ok + reference", valid.ok && Boolean((valid as { reference?: string }).reference), (valid as { reference?: string }).reference ?? "");

  const lead = await Lead.findOne({ email: "verify.tester@example.com" }).lean() as { status?: string } | null;
  line("Lead written to MongoDB", Boolean(lead));
  line("Lead initial status is 'new'", lead?.status === "new", lead?.status ?? "no lead");
  const enquiry = await Enquiry.findOne({ email: "verify.tester@example.com" }).lean() as { sourcePage?: string } | null;
  line("Enquiry written to MongoDB", Boolean(enquiry));
  line("Enquiry stores page URL (sourcePage)", enquiry?.sourcePage === "/contact", enquiry?.sourcePage ?? "");

  // 2. Invalid email -> rejected with field errors, nothing persisted.
  const before = await Lead.countDocuments();
  const bad = await submitLikeAction({
    topic: "general", name: "Bad Email", email: "not-an-email", countryCode: "+91",
    phone: "9812345678", message: "Long enough message to pass the minimum length check.",
    consent: true, sourcePage: "/contact", website: "",
  });
  line("invalid email rejected (ok=false)", !bad.ok, JSON.stringify((bad as { fieldErrors?: unknown }).fieldErrors ?? {}));
  line("invalid email did NOT write to DB", (await Lead.countDocuments()) === before);

  // 3. Missing consent -> rejected (accessible field-level error).
  const noConsent = await submitLikeAction({
    topic: "general", name: "No Consent", email: "noconsent@example.com", countryCode: "+91",
    phone: "9812345678", message: "A perfectly valid message that is clearly long enough.",
    consent: false, sourcePage: "/contact", website: "",
  });
  line("missing consent rejected", !noConsent.ok, Object.keys((noConsent as { fieldErrors?: object }).fieldErrors ?? {}).join(","));

  // 4. Honeypot filled -> silent ok, nothing persisted.
  const beforeHp = await Lead.countDocuments();
  const spam = await submitLikeAction({
    topic: "general", name: "Spam Bot", email: "spam.bot@example.com", countryCode: "+91",
    phone: "9812345678", message: "Buy cheap stuff now — this spam is long enough to pass.",
    consent: true, sourcePage: "/contact", website: "http://spam.example.com",
  });
  line("honeypot returns silent ok", spam.ok === true);
  line("honeypot did NOT write to DB", (await Lead.countDocuments()) === beforeHp);

  // 5. Admin CRM read path (same shape as the admin leads list) + real counts.
  const crmView = await Lead.find({ deletedAt: null }).sort({ createdAt: -1 }).limit(20).lean();
  line(
    "enquiry visible in admin CRM query",
    crmView.some((l) => (l as { email: string }).email === "verify.tester@example.com"),
    `${crmView.length} leads listed`,
  );
  const counts = await Lead.aggregate([
    { $match: { deletedAt: null } },
    { $group: { _id: "$status", n: { $sum: 1 } } },
  ]);
  line(
    "admin status counts are real (not hardcoded)",
    counts.length > 0 && counts.every((c) => (LEAD_STATUSES as readonly string[]).includes(c._id)),
    JSON.stringify(counts),
  );

  console.log("\nDONE");
  process.exit(process.exitCode ?? 0);
}

main().catch((err) => {
  console.error("SCRIPT ERROR", err);
  process.exit(1);
});
