import type { Metadata } from "next";
import Link from "next/link";
import { Stamp, ShieldAlert } from "lucide-react";

import { requireUser } from "@/lib/session";
import { tryConnectDB } from "@/lib/db";
import { VisaApplication } from "@/models";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { formatDate, formatDateTime, serialise } from "@/lib/utils";
import type { IVisaApplication } from "@/models";

export const metadata: Metadata = {
  title: "Visa applications",
  robots: { index: false, follow: false },
};

const STATUS_TONE = {
  submitted: "info",
  documents_pending: "warning",
  under_review: "info",
  lodged_with_embassy: "info",
  approved: "success",
  rejected: "danger",
  cancelled: "neutral",
} as const;

export default async function AccountVisaPage() {
  const user = await requireUser();

  if (!(await tryConnectDB())) {
    return <EmptyState title="Unavailable right now" description="Please refresh in a moment." />;
  }

  const applications = serialise(
    await VisaApplication.find({ user: user.id, deletedAt: null }).sort({ createdAt: -1 }).lean(),
  ) as unknown as IVisaApplication[];

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl text-midnight-900 sm:text-4xl">Visa applications</h1>
        <p className="mt-2 text-[0.9375rem] text-muted">
          Status, documents and fees for everything we&apos;re handling for you.
        </p>
      </header>

      {applications.length === 0 ? (
        <EmptyState
          icon={<Stamp />}
          title="No visa applications"
          description="Start one from any destination's visa page and track it here."
          action={
            <Button asChild variant="accent">
              <Link href="/visa">Check visa requirements</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-4">
          {applications.map((app) => (
            <li key={String(app._id)}>
              <article className="rounded-2xl border border-hairline bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[0.625rem] font-bold uppercase tracking-widest text-lagoon-700">
                      {app.reference}
                    </p>
                    <h2 className="mt-1 font-display text-lg text-midnight-900">
                      {app.countryName} — {app.visaType}
                    </h2>
                    <p className="mt-1 text-xs text-muted">
                      {app.travellerCount} applicant{app.travellerCount === 1 ? "" : "s"}
                      {app.travelDate ? ` · travelling ${formatDate(app.travelDate)}` : ""}
                    </p>
                  </div>

                  <Badge tone={STATUS_TONE[app.status] ?? "neutral"}>
                    {app.status.replace(/_/g, " ")}
                  </Badge>
                </div>

                {app.statusHistory?.length ? (
                  <p className="mt-3 text-xs text-muted">
                    Last update: {formatDateTime(app.statusHistory.at(-1)!.at)}
                    {app.statusHistory.at(-1)!.note ? ` — ${app.statusHistory.at(-1)!.note}` : ""}
                  </p>
                ) : null}

                {app.documents?.length ? (
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {app.documents.map((doc) => (
                      <li
                        key={doc.title}
                        className={`rounded-lg px-2.5 py-1.5 text-[0.6875rem] font-medium ${
                          doc.status === "received"
                            ? "bg-emerald-50 text-emerald-800"
                            : doc.status === "rejected"
                              ? "bg-red-50 text-red-700"
                              : "bg-sand-100 text-midnight-700"
                        }`}
                      >
                        {doc.title}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-5 flex items-center justify-between gap-4 border-t border-hairline pt-4">
                  <span className="text-xs text-muted">Quoted fee</span>
                  <Price amountINR={app.quotedFeeINR} className="text-base" />
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 flex items-start gap-2.5 rounded-2xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        We prepare and lodge applications. Approval, refusal and any request for further documents or
        interviews is decided solely by the relevant embassy or immigration authority.
      </p>
    </div>
  );
}
