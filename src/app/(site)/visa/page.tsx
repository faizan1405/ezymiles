import type { Metadata } from "next";
import Link from "next/link";
import { Stamp, Clock, FileCheck2, ShieldAlert, ArrowRight, Search } from "lucide-react";

import { getVisaCountries } from "@/server/catalog";
import { SmartImage } from "@/components/ui/smart-image";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Price } from "@/components/ui/price";
import { SectionHeading, EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import type { IVisaCountry } from "@/models";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Visa assistance",
  description:
    "Document checklists, realistic processing times and lodgement support for popular destinations. We prepare; the embassy decides.",
  alternates: { canonical: "/visa" },
};

export default async function VisaPage() {
  const countries = (await getVisaCountries()) as unknown as IVisaCountry[];

  const popular = countries.filter((c) => c.isPopular);
  const others = countries.filter((c) => !c.isPopular);

  return (
    <>
      <header className="border-b border-hairline wash-ivory pb-12 pt-8">
        <div className="container-page">
          <Breadcrumbs items={[{ name: "Visa assistance", href: "/visa" }]} />

          <div className="mt-6 max-w-3xl">
            <h1 className="text-3xl leading-tight text-midnight-900 sm:text-4xl lg:text-5xl">
              Visas, minus the guesswork
            </h1>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              We tell you exactly which documents are needed, how long it realistically takes, and
              what it costs — before you commit to dates you might not be able to travel on.
            </p>
          </div>

          {/* The one thing that must never be ambiguous. */}
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden />
            <p className="text-[0.875rem] leading-relaxed text-amber-900">
              <span className="font-semibold">We are not a visa authority.</span> We prepare, check
              and lodge your application, and we&apos;ll tell you honestly if we think it&apos;s weak.
              The decision — approval, rejection, extra documents, interviews — rests entirely with
              the relevant embassy, consulate or immigration authority. Fees quoted are indicative and
              can change without notice.
            </p>
          </div>
        </div>
      </header>

      <div className="container-page section-y">
        {countries.length === 0 ? (
          <EmptyState
            icon={<Stamp />}
            title="No countries published yet"
            description="Visa guidance appears here once it's been added from the admin panel."
            action={
              <Button asChild variant="accent">
                <Link href="/contact">Ask us about a visa</Link>
              </Button>
            }
          />
        ) : (
          <>
            {popular.length ? (
              <section>
                <Reveal>
                  <SectionHeading
                    eyebrow="Most requested"
                    title="Popular destinations"
                    description="Indian passport holders, tourist and business visas."
                  />
                </Reveal>

                <RevealGroup as="ul" className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {popular.map((c) => (
                    <RevealItem as="li" key={String(c._id)}>
                      <CountryCard country={c} />
                    </RevealItem>
                  ))}
                </RevealGroup>
              </section>
            ) : null}

            {others.length ? (
              <section className="mt-16">
                <Reveal>
                  <SectionHeading title="All countries we handle" />
                </Reveal>

                <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {others.map((c) => {
                    const cheapest = [...c.visaTypes].sort(
                      (a, b) =>
                        a.governmentFeeINR + a.serviceFeeINR - (b.governmentFeeINR + b.serviceFeeINR),
                    )[0];

                    return (
                      <li key={String(c._id)}>
                        <Link
                          href={`/visa/${c.slug}`}
                          className="group flex items-center justify-between gap-3 rounded-2xl border border-hairline bg-white p-4 transition-colors hover:border-lagoon-300 hover:bg-lagoon-50"
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="text-2xl" aria-hidden>
                              {c.flagEmoji || "🌍"}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-midnight-900">
                                {c.country}
                              </span>
                              {cheapest ? (
                                <span className="block text-xs text-muted">
                                  from{" "}
                                  <Price
                                    amountINR={cheapest.governmentFeeINR + cheapest.serviceFeeINR}
                                    className="text-xs font-semibold text-muted"
                                  />{" "}
                                  · {cheapest.processingTimeDays}
                                </span>
                              ) : null}
                            </span>
                          </span>
                          <ArrowRight
                            className="size-4 shrink-0 text-midnight-400 transition-transform group-hover:translate-x-1"
                            aria-hidden
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}
          </>
        )}

        {/* ------------------------------- How it works ------------------------------ */}
        <section className="mt-20">
          <SectionHeading
            eyebrow="How it works"
            title="Four steps, no surprises"
            align="center"
            className="text-center"
          />

          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                Icon: Search,
                title: "Check the requirements",
                body: "Pick your destination and see the real checklist, timeline and fee.",
              },
              {
                Icon: FileCheck2,
                title: "Send your documents",
                body: "We review everything and flag anything likely to cause a rejection.",
              },
              {
                Icon: Stamp,
                title: "We lodge it",
                body: "Appointment booking, form filling and submission — handled.",
              },
              {
                Icon: Clock,
                title: "Track the decision",
                body: "Live status in your account until the embassy decides.",
              },
            ].map(({ Icon, title, body }, i) => (
              <li key={title} className="relative">
                <span className="flex size-12 items-center justify-center rounded-2xl wash-ocean text-white">
                  <Icon className="size-5" aria-hidden />
                </span>
                <p className="mt-4 text-[0.625rem] font-bold uppercase tracking-widest text-lagoon-700">
                  Step {i + 1}
                </p>
                <h3 className="mt-1 font-display text-lg text-midnight-900">{title}</h3>
                <p className="mt-2 text-[0.875rem] leading-relaxed text-muted">{body}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}

function CountryCard({ country }: { country: IVisaCountry }) {
  const cheapest = [...country.visaTypes].sort(
    (a, b) => a.governmentFeeINR + a.serviceFeeINR - (b.governmentFeeINR + b.serviceFeeINR),
  )[0];

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-surface shadow-tile transition-all duration-500 hover:-translate-y-1 hover:shadow-lift motion-reduce:hover:translate-y-0">
      <div className="relative aspect-16/10 overflow-hidden">
        <SmartImage
          src={country.heroImage?.url}
          alt={country.heroImage?.alt || country.country}
          fill
          sizes="(max-width: 640px) 90vw, 30vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:group-hover:scale-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight-950/70 to-transparent" />
        <p className="absolute bottom-3 left-4 flex items-center gap-2 font-display text-xl text-white">
          <span aria-hidden>{country.flagEmoji}</span>
          {country.country}
        </p>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="line-clamp-2 text-[0.875rem] leading-relaxed text-muted">{country.summary}</p>

        <dl className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-sand-50 p-3">
            <dt className="text-[0.625rem] font-bold uppercase tracking-wider text-muted">
              Processing
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-midnight-900">
              {cheapest?.processingTimeDays ?? "—"}
            </dd>
          </div>
          <div className="rounded-xl bg-sand-50 p-3">
            <dt className="text-[0.625rem] font-bold uppercase tracking-wider text-muted">From</dt>
            <dd className="mt-0.5">
              <Price
                amountINR={cheapest ? cheapest.governmentFeeINR + cheapest.serviceFeeINR : 0}
                className="text-sm"
              />
            </dd>
          </div>
        </dl>

        <div className="mt-auto pt-5">
          <Link
            href={`/visa/${country.slug}`}
            className="flex items-center justify-center gap-1.5 rounded-full bg-midnight-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-midnight-800 after:absolute after:inset-0"
          >
            See requirements
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
