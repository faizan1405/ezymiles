import "server-only";
import { connectDB } from "@/lib/db";
import { Enquiry, Lead, LeadNote, Notification, type IEnquiry } from "@/models";
import { generateReference } from "@/lib/utils";

/**
 * Every inbound form lands here.
 *
 * An Enquiry is the immutable record of what was submitted. A Lead is the
 * working record sales acts on — repeat enquiries from the same person attach to
 * the existing open Lead rather than fragmenting the pipeline.
 */

type EnquiryPayload = Omit<IEnquiry, "_id" | "createdAt" | "updatedAt" | "lead">;

/** Crude but useful intent score — drives the "hot leads" view in admin. */
function scoreLead(payload: EnquiryPayload): number {
  let score = 10;
  const p = payload.preferences;

  if (payload.type === "custom_trip") score += 30;
  if (payload.type === "package") score += 25;
  if (payload.type === "callback") score += 20;
  if (payload.type === "corporate" || payload.type === "group") score += 25;

  if (p?.startDate) score += 10;
  if (p?.budgetPerPersonINR && p.budgetPerPersonINR > 100_000) score += 15;
  else if (p?.budgetPerPersonINR && p.budgetPerPersonINR > 50_000) score += 8;
  if (p?.flightsRequired) score += 5;
  if (payload.subject?.refId) score += 10;
  if (payload.message && payload.message.length > 120) score += 5;

  return Math.min(100, score);
}

function estimateValue(payload: EnquiryPayload): number {
  const p = payload.preferences;
  if (!p?.budgetPerPersonINR) return 0;
  const heads = (p.adults ?? 1) + (p.children ?? 0) * 0.6;
  return Math.round(p.budgetPerPersonINR * heads);
}

export async function createEnquiryWithLead(payload: EnquiryPayload) {
  await connectDB();

  const enquiry = await Enquiry.create(payload);

  // Attach to an existing open lead from the same person, if there is one.
  const existing = await Lead.findOne({
    $or: [{ email: payload.email }, { phone: payload.phone }],
    status: { $nin: ["won", "lost", "junk"] },
    deletedAt: null,
  });

  const score = scoreLead(payload);
  const value = estimateValue(payload);

  let lead;

  if (existing) {
    existing.enquiries.push(enquiry._id);
    existing.score = Math.max(existing.score, score);
    existing.estimatedValueINR = Math.max(existing.estimatedValueINR, value);
    if (payload.preferences?.destination) existing.destination = payload.preferences.destination;
    existing.type = payload.type;
    await existing.save();
    lead = existing;

    await LeadNote.create({
      lead: lead._id,
      authorName: "System",
      kind: "note",
      body: `New ${payload.type.replace("_", " ")} enquiry received from ${payload.sourcePage}.`,
    });
  } else {
    lead = await Lead.create({
      reference: generateReference("LEAD"),
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      type: payload.type,
      status: "new",
      score,
      destination: payload.preferences?.destination ?? payload.subject?.title,
      estimatedValueINR: value,
      enquiries: [enquiry._id],
      sourcePage: payload.sourcePage,
      campaign: payload.campaign,
    });

    await LeadNote.create({
      lead: lead._id,
      authorName: "System",
      kind: "note",
      body: `Lead created from a ${payload.type.replace("_", " ")} enquiry on ${payload.sourcePage}.`,
    });
  }

  enquiry.lead = lead._id;
  await enquiry.save();

  await Notification.create({
    audience: "admin",
    kind: "lead",
    title: `New ${payload.type.replace("_", " ")} enquiry`,
    body: `${payload.name} · ${payload.phone}${
      payload.subject?.title ? ` · ${payload.subject.title}` : ""
    }`,
    href: `/admin/leads/${lead._id.toString()}`,
  });

  return { enquiry, lead };
}

/**
 * Creates a "follow-up due" admin notification for every open lead whose
 * follow-up date has arrived, at most once per lead per calendar day.
 *
 * There is no background job runner in this deployment, so this is called
 * on-view from the admin dashboard and notifications pages — a few seconds of
 * staleness is an acceptable trade for not standing up a scheduler.
 */
export async function syncFollowUpNotifications(): Promise<void> {
  await connectDB();

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const due = await Lead.find({
    deletedAt: null,
    followUpDate: { $lte: now },
    status: { $nin: ["won", "lost", "junk"] },
  })
    .select("_id reference name followUpDate")
    .lean();

  if (due.length === 0) return;

  const alreadyNotified = await Notification.find({
    audience: "admin",
    kind: "lead",
    href: { $in: due.map((lead) => `/admin/leads/${lead._id.toString()}`) },
    createdAt: { $gte: startOfDay },
    title: "Follow-up due",
  })
    .select("href")
    .lean();

  const notifiedHrefs = new Set(alreadyNotified.map((n) => n.href));

  const toCreate = due.filter((lead) => !notifiedHrefs.has(`/admin/leads/${lead._id.toString()}`));
  if (toCreate.length === 0) return;

  await Notification.insertMany(
    toCreate.map((lead) => ({
      audience: "admin",
      kind: "lead",
      title: "Follow-up due",
      body: `${lead.name} (${lead.reference}) is due for follow-up.`,
      href: `/admin/leads/${lead._id.toString()}`,
    })),
  );
}
