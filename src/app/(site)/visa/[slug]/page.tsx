import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, FileCheck2, ShieldAlert, CalendarClock, ArrowRight } from "lucide-react";

import { getVisaCountryBySlug } from "@/server/catalog";
import { SmartImage } from "@/components/ui/smart-image";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Price } from "@/components/ui/price";
import { Accordion, AccordionItem } from "@/components/ui/overlays";
import { Button } from "@/components/ui/button";
import { VisaApplicationForm } from "@/components/visa/visa-application-form";
import { FaqJsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/config/site";
import type { IVisaCountry } from "@/models";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const country = (await getVisaCountryBySlug(slug)) as unknown as IVisaCountry | null;

  if (!country) return { title: "Visa information not found" };

  const title = country.seo?.title || `${country.country} visa for Indian passport holders`;
  const description =
    country.seo?.description ||
    country.summary ||
    `Documents, processing time and fees for a ${country.country} visa — plus lodgement support.`;

  return {
    title,
    description,
    alternates: { canonical: `/visa/${country.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/visa/${country.slug}`,
      images: country.heroImage?.url ? [{ url: country.heroImage.url }] : undefined,
    },
  };
}

export default async function VisaCountryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const country = (await getVisaCountryBySlug(slug)) as unknown as IVisaCountry | null;
  if (!country) notFound();

  const preselected = typeof sp.type === "string" ? sp.type : undefined;

  return (
    <>
      {/* ---------------------------------- Hero ---------------------------------- */}
      <section className="relative isolate flex min-h-[24rem] items-end overflow-hidden pb-10 pt-28">
        <div className="absolute inset-0 -z-10">
          <SmartImage
            src={country.heroImage?.url}
            alt={country.heroImage?.alt || country.country}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 hero-scrim" />
        </div>

        <div className="container-page">
          <Breadcrumbs
            tone="dark"
            items={[
              { name: "Visa assistance", href: "/visa" },
              { name: country.country, href: `/visa/${country.slug}` },
            ]}
          />

          <div className="mt-6 max-w-2xl">
            <p className="text-eyebrow text-lagoon-300">
              For {country.forNationality} passport holders
            </p>
            <h1 className="mt-3 flex items-center gap-3 text-4xl leading-tight text-white sm:text-5xl">
              <span aria-hidden>{country.flagEmoji}</span>
              {country.country} visa
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/80">{country.summary}</p>
          </div>
        </div>
      </section>

      <div className="container-page section-y">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
          <div className="min-w-0 space-y-12">
            {/* ------------------------------ Visa types ------------------------------ */}
            <section>
              <h2 className="text-2xl text-midnight-900">Visa options and fees</h2>
              <p className="mt-2 text-sm text-muted">
                Government fees are set by the embassy and change without notice — treat these as
                indicative until we confirm them for your dates.
              </p>

              <ul className="mt-6 space-y-3">
                {country.visaTypes.map((v) => (
                  <li key={v.type}>
                    <div className="rounded-2xl border border-hairline bg-white p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="font-display text-lg text-midnight-900">
                            {v.label || v.type}
                          </h3>
                          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
                            <div className="flex items-center gap-1.5">
                              <Clock className="size-3.5 text-lagoon-600" aria-hidden />
                              <dt className="sr-only">Processing time</dt>
                              <dd>{v.processingTimeDays}</dd>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <CalendarClock className="size-3.5 text-lagoon-600" aria-hidden />
                              <dt className="sr-only">Stay duration</dt>
                              <dd>Stay up to {v.stayDurationDays}</dd>
                            </div>
                            <div>
                              <dt className="sr-only">Entry type</dt>
                              <dd className="capitalize">{v.entryType} entry</dd>
                            </div>
                          </dl>
                        </div>

                        <div className="text-right">
                          <Price
                            amountINR={v.governmentFeeINR + v.serviceFeeINR}
                            className="text-xl"
                          />
                          <p className="mt-0.5 text-[0.625rem] text-muted">per applicant</p>
                          <p className="mt-1 text-[0.625rem] text-muted">
                            Govt <Price amountINR={v.governmentFeeINR} className="text-[0.625rem] font-semibold text-muted" /> +
                            service{" "}
                            <Price amountINR={v.serviceFeeINR} className="text-[0.625rem] font-semibold text-muted" />
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* ------------------------------- Checklist ------------------------------ */}
            <section>
              <h2 className="flex items-center gap-2 text-2xl text-midnight-900">
                <FileCheck2 className="size-6 text-lagoon-600" aria-hidden />
                Document checklist
              </h2>

              <ul className="mt-6 space-y-2.5">
                {country.documentChecklist.map((doc) => (
                  <li
                    key={doc.title}
                    className="flex items-start gap-3 rounded-xl border border-hairline bg-white p-4"
                  >
                    <span
                      className={`mt-1 size-2 shrink-0 rounded-full ${doc.required ? "bg-lagoon-500" : "bg-sand-300"}`}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-midnight-900">
                        {doc.title}
                        {!doc.required ? (
                          <span className="ml-2 text-[0.625rem] font-bold uppercase tracking-wide text-muted">
                            Optional
                          </span>
                        ) : null}
                      </p>
                      {doc.note ? (
                        <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-muted">{doc.note}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* ------------------------------- Eligibility ---------------------------- */}
            {country.eligibilityNotes?.length ? (
              <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
                <h2 className="flex items-center gap-2 text-lg text-amber-900">
                  <ShieldAlert className="size-5" aria-hidden />
                  Eligibility and disclaimer
                </h2>
                <ul className="mt-3 space-y-2">
                  {country.eligibilityNotes.map((note) => (
                    <li key={note} className="text-[0.875rem] leading-relaxed text-amber-900/85">
                      • {note}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 border-t border-amber-200 pt-4 text-xs leading-relaxed text-amber-900/75">
                  Approval is at the sole discretion of the {country.country} embassy, consulate or
                  immigration authority. We cannot influence, guarantee or expedite a decision, and
                  government fees are generally non-refundable if an application is refused.
                </p>
              </section>
            ) : null}

            {/* --------------------------------- Process ------------------------------ */}
            {country.processSteps?.length ? (
              <section>
                <h2 className="text-2xl text-midnight-900">How your application moves</h2>
                <ol className="mt-6 space-y-4">
                  {country.processSteps.map((step, i) => (
                    <li key={step.title} className="flex gap-4">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-midnight-900 text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      <div>
                        <h3 className="font-display text-base text-midnight-900">{step.title}</h3>
                        <p className="mt-1 text-[0.875rem] leading-relaxed text-muted">
                          {step.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {/* ----------------------------------- FAQ -------------------------------- */}
            {country.faqs?.length ? (
              <section>
                <h2 className="text-2xl text-midnight-900">Common questions</h2>
                <Accordion type="single" collapsible className="mt-6 rounded-2xl border border-hairline px-5">
                  {country.faqs.map((faq, i) => (
                    <AccordionItem key={faq.question} value={`faq-${i}`} trigger={faq.question}>
                      {faq.answer}
                    </AccordionItem>
                  ))}
                </Accordion>
                <FaqJsonLd faqs={country.faqs} />
              </section>
            ) : null}
          </div>

          {/* --------------------------------- Form --------------------------------- */}
          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <div className="rounded-3xl border border-hairline bg-white p-6 shadow-lift">
              <h2 className="font-display text-xl text-midnight-900">
                Start your {country.country} application
              </h2>
              <p className="mt-2 text-sm text-muted">
                We&apos;ll review your details and send a personalised checklist within one business day.
              </p>

              <div className="mt-6">
                <VisaApplicationForm
                  countrySlug={country.slug}
                  countryName={country.country}
                  defaultType={preselected}
                  visaTypes={country.visaTypes.map((v) => ({
                    type: v.type,
                    label: v.label,
                    governmentFeeINR: v.governmentFeeINR,
                    serviceFeeINR: v.serviceFeeINR,
                    processingTimeDays: v.processingTimeDays,
                  }))}
                />
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-sand-50 p-5 text-center">
              <p className="text-sm text-muted">Already applied?</p>
              <Button asChild variant="ghost" className="mt-1">
                <Link href="/visa/track">
                  Track your application
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
