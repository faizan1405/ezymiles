import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MessageCircle, Flame } from "lucide-react";

import { requireAnyPermission } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { AdminUser, Enquiry, Lead, LeadNote } from "@/models";
import { getSettings } from "@/lib/settings";
import { AdminPageHeader, Panel, StatusPill, STATUS_TONE } from "@/components/admin/ui";
import { LeadWorkspace } from "@/components/admin/lead-workspace";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime, formatPrice, serialise, whatsappLink } from "@/lib/utils";
import type { IEnquiry, ILead, ILeadNote } from "@/models";

export const metadata: Metadata = { title: "Lead", robots: { index: false } };

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAnyPermission(["leads:view", "leads:manage"]);
  const { id } = await params;

  await connectDB();

  const doc = await Lead.findById(id).populate("assignedTo", "name").lean().catch(() => null);
  if (!doc) notFound();

  const [notes, enquiries, staff, settings] = await Promise.all([
    LeadNote.find({ lead: id }).sort({ createdAt: -1 }).lean(),
    Enquiry.find({ lead: id }).sort({ createdAt: -1 }).lean(),
    AdminUser.find({ isActive: true, deletedAt: null }).select("name role").lean(),
    getSettings(),
  ]);

  const lead = serialise(doc) as unknown as ILead & { assignedTo?: { _id: string; name: string } };
  const noteRows = serialise(notes) as unknown as ILeadNote[];
  const enquiryRows = serialise(enquiries) as unknown as IEnquiry[];

  const canManage = user.permissions?.includes("leads:manage") ?? false;

  return (
    <div>
      <Link
        href="/admin/leads"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-lagoon-700 hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All leads
      </Link>

      <AdminPageHeader
        title={lead.name}
        description={`${lead.reference} · created ${formatDate(lead.createdAt)} from ${lead.sourcePage}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <a href={`tel:${lead.phone}`}>
                <Phone aria-hidden />
                Call
              </a>
            </Button>
            <Button asChild size="sm" variant="outline">
              <a
                href={whatsappLink(
                  lead.phone,
                  `Hi ${lead.name.split(" ")[0]}, this is ${settings.brand.name} about your travel enquiry.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle aria-hidden />
                WhatsApp
              </a>
            </Button>
            <Button asChild size="sm" variant="outline">
              <a href={`mailto:${lead.email}?subject=Your enquiry ${lead.reference}`}>
                <Mail aria-hidden />
                Email
              </a>
            </Button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-5">
          {/* -------------------------------- Enquiries ------------------------------ */}
          <Panel title={`Enquiries (${enquiryRows.length})`}>
            {enquiryRows.length === 0 ? (
              <p className="py-4 text-sm text-muted">No enquiry records attached.</p>
            ) : (
              <ul className="space-y-4">
                {enquiryRows.map((e) => (
                  <li key={String(e._id)} className="rounded-xl border border-hairline p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-lagoon-700">
                        {e.type.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted">{formatDateTime(e.createdAt)}</p>
                    </div>

                    {e.subject?.title ? (
                      <p className="mt-2 text-sm font-semibold text-midnight-900">
                        About: {e.subject.title}
                      </p>
                    ) : null}

                    {e.message ? (
                      <p className="mt-2 whitespace-pre-line text-[0.875rem] leading-relaxed text-muted">
                        {e.message}
                      </p>
                    ) : null}

                    {e.preferences ? (
                      <dl className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-sand-50 p-3 sm:grid-cols-4">
                        {e.preferences.destination ? (
                          <Fact label="Destination" value={e.preferences.destination} />
                        ) : null}
                        {e.preferences.departureCity ? (
                          <Fact label="From" value={e.preferences.departureCity} />
                        ) : null}
                        {e.preferences.startDate ? (
                          <Fact label="Start" value={formatDate(e.preferences.startDate)} />
                        ) : null}
                        {e.preferences.durationDays ? (
                          <Fact label="Days" value={String(e.preferences.durationDays)} />
                        ) : null}
                        {e.preferences.adults ? (
                          <Fact
                            label="Travellers"
                            value={`${e.preferences.adults}A${
                              e.preferences.children ? ` + ${e.preferences.children}C` : ""
                            }`}
                          />
                        ) : null}
                        {e.preferences.budgetPerPersonINR ? (
                          <Fact
                            label="Budget pp"
                            value={formatPrice(e.preferences.budgetPerPersonINR, "INR", { compact: true })}
                          />
                        ) : null}
                        {e.preferences.hotelCategory ? (
                          <Fact label="Hotels" value={`${e.preferences.hotelCategory}★`} />
                        ) : null}
                        {e.preferences.travelStyle ? (
                          <Fact label="Style" value={e.preferences.travelStyle} />
                        ) : null}
                        {e.preferences.activities?.length ? (
                          <Fact label="Interests" value={e.preferences.activities.join(", ")} />
                        ) : null}
                      </dl>
                    ) : null}

                    {e.campaign?.utmSource ? (
                      <p className="mt-2 text-[0.6875rem] text-muted">
                        Campaign: {e.campaign.utmSource}
                        {e.campaign.utmCampaign ? ` / ${e.campaign.utmCampaign}` : ""}
                        {e.campaign.utmMedium ? ` / ${e.campaign.utmMedium}` : ""}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* ---------------------------------- Notes -------------------------------- */}
          <LeadWorkspace
            leadId={String(lead._id)}
            notes={noteRows.map((n) => ({
              id: String(n._id),
              body: n.body,
              kind: n.kind,
              authorName: n.authorName,
              createdAt: String(n.createdAt),
            }))}
            canManage={canManage}
            lead={{
              status: lead.status,
              assignedTo: lead.assignedTo?._id ? String(lead.assignedTo._id) : "",
              followUpDate: lead.followUpDate ? String(lead.followUpDate).slice(0, 10) : "",
              estimatedValueINR: lead.estimatedValueINR,
              lostReason: lead.lostReason ?? "",
            }}
            staff={serialise(staff).map((s) => ({ id: String(s._id), name: s.name }))}
          />
        </div>

        {/* --------------------------------- Sidebar -------------------------------- */}
        <aside className="space-y-5">
          <Panel title="Lead">
            <dl className="space-y-3 text-sm">
              <Row label="Status">
                <StatusPill status={lead.status} tone={STATUS_TONE[lead.status] ?? "neutral"} />
              </Row>
              <Row label="Score">
                <span className="flex items-center gap-1 font-bold text-midnight-900">
                  {lead.score >= 60 ? (
                    <Flame className="size-3.5 text-sunset-500" aria-hidden />
                  ) : null}
                  {lead.score}/100
                </span>
              </Row>
              <Row label="Type">
                <span className="capitalize">{lead.type.replace(/_/g, " ")}</span>
              </Row>
              <Row label="Est. value">
                <span className="font-semibold">
                  {lead.estimatedValueINR > 0 ? formatPrice(lead.estimatedValueINR) : "—"}
                </span>
              </Row>
              <Row label="Assigned">{lead.assignedTo?.name ?? "Unassigned"}</Row>
              <Row label="Follow-up">
                {lead.followUpDate ? formatDate(lead.followUpDate) : "Not set"}
              </Row>
              <Row label="Last contact">
                {lead.lastContactedAt ? formatDate(lead.lastContactedAt) : "Never"}
              </Row>
            </dl>
          </Panel>

          <Panel title="Contact">
            <dl className="space-y-3 text-sm">
              <Row label="Email">
                <a href={`mailto:${lead.email}`} className="text-lagoon-700 hover:underline">
                  {lead.email}
                </a>
              </Row>
              <Row label="Phone">
                <a href={`tel:${lead.phone}`} className="text-lagoon-700 hover:underline">
                  {lead.phone}
                </a>
              </Row>
              <Row label="Source">
                <span className="truncate">{lead.sourcePage}</span>
              </Row>
            </dl>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="shrink-0 text-xs text-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right text-midnight-900">{children}</dd>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.625rem] font-bold uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-0.5 truncate text-xs font-semibold capitalize text-midnight-900">{value}</dd>
    </div>
  );
}
