import type { Metadata } from "next";
import { Bus, ShieldCheck, Clock, Ticket } from "lucide-react";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EnquiryForm } from "@/components/forms/enquiry-form";
import { SectionHeading } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Bus booking — eZyMiles",
  description:
    "Book bus tickets online across India. Compare fares, choose your seat and travel stress-free with eZyMiles.",
  alternates: { canonical: "/bus" },
};

type SearchParams = Record<string, string | string[] | undefined>;

const FEATURES = [
  {
    icon: Ticket,
    title: "Easy booking",
    body: "Enter your route and date — we show every available bus with seat availability in seconds.",
  },
  {
    icon: ShieldCheck,
    title: "Safe & verified operators",
    body: "We partner only with verified operators with strong safety records and GPS-tracked fleets.",
  },
  {
    icon: Clock,
    title: "Instant confirmation",
    body: "Your seat is confirmed immediately. Get a digital ticket and boarding details in your inbox.",
  },
];

export default async function BusPage({
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
          <Breadcrumbs items={[{ name: "Bus booking", href: "/bus" }]} />

          <div className="mt-6 max-w-3xl">
            <h1 className="text-3xl leading-tight text-midnight-900 sm:text-4xl lg:text-5xl">
              Book bus tickets online
            </h1>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              Compare prices across leading bus operators, pick your preferred seats and travel
              with confidence. From Volvo luxury to budget-friendly seater options.
            </p>
          </div>
        </div>
      </header>

      <div className="container-page section-y">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <SectionHeading eyebrow="Why book with us" title="Travel smarter by road" />

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
                "Free cancellation on most operators",
                "Multiple payment methods — UPI, cards and net banking",
                "Seat selection available before checkout",
                "24/7 customer support for any issues during travel",
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
                  <Bus className="size-5" aria-hidden />
                </span>
                <div>
                  <h2 className="font-display text-xl text-midnight-900">Search buses</h2>
                  <p className="text-xs text-muted">Find the best fares in seconds.</p>
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
                  title="Book your bus tickets"
                  submitLabel="Search buses"
                  subject={{
                    kind: "bus",
                    title: [
                      from ? `from ${from}` : null,
                      to ? `to ${to}` : null,
                      date ? `on ${date}` : null,
                    ]
                      .filter(Boolean)
                      .join(" ") || "Bus booking enquiry",
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
