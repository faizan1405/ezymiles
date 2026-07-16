"use client";

import * as React from "react";
import { Search, CheckCircle2, Circle, XCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Badge } from "@/components/ui/primitives";
import { Price } from "@/components/ui/price";
import { trackVisaApplication } from "@/server/actions/visa";
import { formatDate, formatDateTime, cn } from "@/lib/utils";
import { VISA_APPLICATION_STATUSES, type VisaApplicationStatus } from "@/models/types";

const STATUS_LABELS: Record<VisaApplicationStatus, string> = {
  submitted: "Request received",
  documents_pending: "Waiting on your documents",
  under_review: "Under review by our team",
  lodged_with_embassy: "Lodged with the embassy",
  approved: "Approved",
  rejected: "Refused by the authority",
  cancelled: "Cancelled",
};

/** The linear path a healthy application walks. */
const TIMELINE: VisaApplicationStatus[] = [
  "submitted",
  "documents_pending",
  "under_review",
  "lodged_with_embassy",
  "approved",
];

interface TrackedApplication {
  reference: string;
  countryName: string;
  visaType: string;
  applicantName: string;
  travellerCount: number;
  travelDate?: string;
  status: VisaApplicationStatus;
  quotedFeeINR: number;
  statusHistory: { status: string; note?: string; at: string }[];
  documents: { title: string; status: string }[];
}

export function VisaTracker() {
  const [reference, setReference] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [application, setApplication] = React.useState<TrackedApplication | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await trackVisaApplication(reference, email);

    if (result.ok) {
      setApplication(result.application as unknown as TrackedApplication);
    } else {
      setApplication(null);
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div>
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl border border-hairline bg-white p-6 shadow-tile"
        noValidate
      >
        <Field label="Application reference" htmlFor="tr-ref" required>
          <Input
            id="tr-ref"
            value={reference}
            onChange={(e) => setReference(e.target.value.toUpperCase())}
            placeholder="VISA-XXXXXX"
            className="uppercase"
            required
          />
        </Field>

        <Field label="Email you applied with" htmlFor="tr-email" required>
          <Input
            id="tr-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </Field>

        {error ? (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <Button type="submit" block size="lg" variant="accent" loading={loading} loadingText="Looking up">
          <Search aria-hidden />
          Track application
        </Button>
      </form>

      {application ? (
        <div className="mt-8 rounded-2xl border border-hairline bg-white p-6 shadow-tile">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-lagoon-700">
                {application.reference}
              </p>
              <h2 className="mt-1.5 font-display text-2xl text-midnight-900">
                {application.countryName} — {application.visaType}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {application.applicantName} · {application.travellerCount} applicant
                {application.travellerCount === 1 ? "" : "s"}
                {application.travelDate ? ` · travelling ${formatDate(application.travelDate)}` : ""}
              </p>
            </div>

            <Badge
              tone={
                application.status === "approved"
                  ? "success"
                  : application.status === "rejected" || application.status === "cancelled"
                    ? "danger"
                    : "info"
              }
              size="lg"
            >
              {STATUS_LABELS[application.status]}
            </Badge>
          </div>

          {/* Progress */}
          {application.status !== "rejected" && application.status !== "cancelled" ? (
            <ol className="mt-8 space-y-0">
              {TIMELINE.map((step, i) => {
                const currentIndex = TIMELINE.indexOf(application.status);
                const done = currentIndex >= 0 && i < currentIndex;
                const active = application.status === step;

                return (
                  <li key={step} className="relative flex gap-4 pb-6 last:pb-0">
                    {i < TIMELINE.length - 1 ? (
                      <span
                        className={cn(
                          "absolute left-[0.6875rem] top-6 h-full w-px",
                          done ? "bg-lagoon-400" : "bg-hairline",
                        )}
                        aria-hidden
                      />
                    ) : null}

                    <span className="relative z-10 mt-0.5">
                      {done ? (
                        <CheckCircle2 className="size-6 text-lagoon-600" aria-hidden />
                      ) : active ? (
                        <span className="flex size-6 items-center justify-center rounded-full bg-midnight-900">
                          <span className="size-2 rounded-full bg-white" />
                        </span>
                      ) : (
                        <Circle className="size-6 text-sand-300" aria-hidden />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          active ? "text-midnight-900" : done ? "text-midnight-700" : "text-midnight-400",
                        )}
                      >
                        {STATUS_LABELS[step]}
                      </p>
                      {application.statusHistory
                        .filter((h) => h.status === step)
                        .slice(-1)
                        .map((h) => (
                          <p key={h.at} className="mt-0.5 text-xs text-muted">
                            {formatDateTime(h.at)}
                            {h.note ? ` — ${h.note}` : ""}
                          </p>
                        ))}
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="mt-6 flex items-start gap-3 rounded-xl bg-red-50 p-4">
              <XCircle className="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-red-900">
                  {STATUS_LABELS[application.status]}
                </p>
                {application.statusHistory.slice(-1).map((h) => (
                  <p key={h.at} className="mt-1 text-[0.8125rem] text-red-800">
                    {h.note ?? "Contact our team for the details and your options."}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {application.documents.length ? (
            <div className="mt-8 border-t border-hairline pt-6">
              <h3 className="text-sm font-bold text-midnight-900">Documents</h3>
              <ul className="mt-3 space-y-1.5">
                {application.documents.map((doc) => (
                  <li key={doc.title} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted">{doc.title}</span>
                    <Badge
                      tone={
                        doc.status === "received"
                          ? "success"
                          : doc.status === "rejected"
                            ? "danger"
                            : "neutral"
                      }
                      size="sm"
                    >
                      {doc.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-6 flex items-baseline justify-between border-t border-hairline pt-6">
            <span className="text-sm text-muted">Quoted fee</span>
            <Price amountINR={application.quotedFeeINR} className="text-lg" />
          </div>

          <p className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Status reflects our workflow. The final decision is made by the embassy or immigration
            authority and can change at any point in the process.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export { VISA_APPLICATION_STATUSES };
