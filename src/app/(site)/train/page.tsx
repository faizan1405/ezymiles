import type { Metadata } from "next";
import { Train, ShieldCheck, Clock, Ticket } from "lucide-react";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EnquiryForm } from "@/components/forms/enquiry-form";
import { SectionHeading } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Train booking — eZyMiles",
  description:
    "Book train tickets online across India. Check seat availability, compare classes and plan your journey with eZyMiles.",
  alternates: { canonical: "/train" },
};

type SearchParams = Record<string, string | string[] | undefined>;

const FEATURES = [
  {
    icon: Ticket,
    title: "Instant availability check",
    body: "See live seat availability across all classes for every train on your route — no more guessing at the counter.",
  },
  {
    icon: ShieldCheck,
    title: "Safe & secure booking",
    body: "Your payment and personal details are protected with bank-grade encryption. We're an IRCTC-authorised partner.",
  },
  {
    icon: Clock,
    title: "Fast confirmations",
    body: "Get your e-ticket within minutes of booking. No waiting, no paperwork — just a QR code on your phone.",
  },
];

export default async function TrainPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const from = typeof sp.from === "string" ? sp.from : undefined;
  const to = typeof sp.to === "string" ? sp.to : undefined;
  const date = typeof sp.date === "string" ? sp.date : undefined;
  const passengers = typeof sp.passengers === "string" ? sp.passengers : undefined;

  const hasQuery = Boolean(from || to);

  return (
    <>
      <header className="border-b border-hairline wash-ivory pb-12 pt-8">
        <div className="container-page">
          <Breadcrumbs items={[{ name: "Train booking", href: "/train" }]} />

          <div className="mt-6 max-w-3xl">
            <h1 className="text-3xl leading-tight text-midnight-900 sm:text-4xl lg:text-5xl">
              Book train tickets online
            </h1>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              Compare trains, classes and fares across the Indian Railways network. From
              Shatabdi day trips to Rajdhani long-haul — book with confidence.
            </p>
          </div>
        </div>
      </header>

      <div className="container-page section-y">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <SectionHeading eyebrow="Why book with us" title="Travel smarter by rail" />

            <ul className="mt-8 space-y-4">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <li key={title}>
                  <div className="flex gap-4 rounded-2xl border border-hairline bg-white p-5">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sand-100 text-lagoon-700">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <div>
                      <h3 className="font-display text-lg text-midnight-900">{title}</h3>
                      <p className="mt-1.5 text-[0.875rem] leading-relaxed text-muted">{body}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <ul className="mt-8 space-y-3">
              {[
                "IRCTC-authorised partner — reliable and authentic tickets",
                "All classes available: Sleeper, 3AC, 2AC, Chair Car and more",
                "Waitlist alerts — get notified when your status improves",
                "Easy cancellation and refund policies",
              ].map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm text-muted">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-lagoon-600" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <Reveal>
            <div className="rounded-3xl border border-hairline bg-white p-6 shadow-lift sm:p-8 lg:sticky lg:top-28">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl wash-ocean text-white">
                  <Train className="size-5" aria-hidden />
                </span>
                <div>
                  <h2 className="font-display text-xl text-midnight-900">Search trains</h2>
                  <p className="text-xs text-muted">Find the best trains for your journey.</p>
                </div>
              </div>

              {hasQuery ? (
                <dl className="mt-6 space-y-1.5 rounded-2xl bg-sand-50 p-4 text-sm">
                  {from ? <Row label="From" value={from} /> : null}
                  {to ? <Row label="To" value={to} /> : null}
                  {date ? <Row label="Date" value={date} /> : null}
                  {passengers ? <Row label="Passengers" value={passengers} /> : null}
                </dl>
              ) : null}

              <div className="mt-6">
                <EnquiryForm
                  type="general"
                  compact
                  title="Book your train tickets"
                  submitLabel="Search trains"
                  subject={{
                    kind: "train",
                    title: [
                      from ? `from ${from}` : null,
                      to ? `to ${to}` : null,
                      date ? `on ${date}` : null,
                    ]
                      .filter(Boolean)
                      .join(" ") || "Train booking enquiry",
                  }}
                />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="truncate font-semibold text-midnight-900">{value}</dd>
    </div>
  );
}