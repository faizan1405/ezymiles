import type { Metadata } from "next";
import { Car, Plane, Clock, MapPin, ShieldCheck } from "lucide-react";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EnquiryForm } from "@/components/forms/enquiry-form";
import { SectionHeading } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Cabs & airport transfers",
  description:
    "Airport pickups, local rentals and outstation cars — quoted by a human, with the driver's details sent before travel.",
  alternates: { canonical: "/cabs" },
};

type SearchParams = Record<string, string | string[] | undefined>;

const MODES = [
  {
    key: "airport",
    Icon: Plane,
    title: "Airport transfer",
    body: "Meet-and-greet at arrivals, flight tracked, waiting time included. Fixed price agreed before travel.",
  },
  {
    key: "local",
    Icon: Clock,
    title: "Local rental",
    body: "A car and driver for 4, 8 or 12 hours. Ideal for a day of sightseeing at your own pace.",
  },
  {
    key: "outstation",
    Icon: MapPin,
    title: "Outstation",
    body: "One-way or return between cities, with tolls and driver allowance stated up front.",
  },
];

export default async function CabsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const mode = typeof sp.mode === "string" ? sp.mode : undefined;
  const pickup = typeof sp.pickup === "string" ? sp.pickup : undefined;
  const drop = typeof sp.drop === "string" ? sp.drop : undefined;
  const date = typeof sp.date === "string" ? sp.date : undefined;
  const time = typeof sp.time === "string" ? sp.time : undefined;

  const hasQuery = Boolean(pickup || drop);

  return (
    <>
      <header className="border-b border-hairline wash-ivory pb-12 pt-8">
        <div className="container-page">
          <Breadcrumbs items={[{ name: "Cabs & transfers", href: "/cabs" }]} />

          <div className="mt-6 max-w-3xl">
            <h1 className="text-3xl leading-tight text-midnight-900 sm:text-4xl lg:text-5xl">
              Ground transport, arranged properly
            </h1>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              We don&apos;t run an automated cab marketplace, and we&apos;re not going to pretend we
              do. Every transfer is quoted by a person against a vetted local operator — you get a
              fixed price, and the driver&apos;s name and number the day before you travel.
            </p>
          </div>
        </div>
      </header>

      <div className="container-page section-y">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <SectionHeading eyebrow="What we arrange" title="Three ways we move you" />

            <ul className="mt-8 space-y-4">
              {MODES.map(({ key, Icon, title, body }) => (
                <li key={key}>
                  <div
                    className={`flex gap-4 rounded-2xl border p-5 transition-colors ${
                      mode === key ? "border-lagoon-300 bg-lagoon-50/50" : "border-hairline bg-white"
                    }`}
                  >
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
                "Fixed, all-inclusive pricing — tolls, parking and driver allowance stated up front",
                "Vetted operators only; no aggregator roulette at 2 am",
                "Flight tracking on airport pickups, so a delay doesn't cost you the car",
                "Driver details shared the day before travel",
              ].map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm text-muted">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-lagoon-600" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* --------------------------------- Quote --------------------------------- */}
          <Reveal>
            <div className="rounded-3xl border border-hairline bg-white p-6 shadow-lift sm:p-8 lg:sticky lg:top-28">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl wash-ocean text-white">
                  <Car className="size-5" aria-hidden />
                </span>
                <div>
                  <h2 className="font-display text-xl text-midnight-900">Get a fixed quote</h2>
                  <p className="text-xs text-muted">Usually back within a couple of hours.</p>
                </div>
              </div>

              {hasQuery ? (
                <dl className="mt-6 space-y-1.5 rounded-2xl bg-sand-50 p-4 text-sm">
                  {mode ? (
                    <Row label="Type" value={MODES.find((m) => m.key === mode)?.title ?? mode} />
                  ) : null}
                  {pickup ? <Row label="Pickup" value={pickup} /> : null}
                  {drop ? <Row label="Drop" value={drop} /> : null}
                  {date ? <Row label="Date" value={`${date}${time ? ` at ${time}` : ""}`} /> : null}
                </dl>
              ) : null}

              <div className="mt-6">
                <EnquiryForm
                  type="general"
                  compact
                  title="Request a transfer quote"
                  submitLabel="Request quote"
                  subject={{
                    kind: "cab",
                    title: [
                      MODES.find((m) => m.key === mode)?.title ?? "Transfer",
                      pickup ? `from ${pickup}` : null,
                      drop ? `to ${drop}` : null,
                      date ? `on ${date}${time ? ` ${time}` : ""}` : null,
                    ]
                      .filter(Boolean)
                      .join(" "),
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
