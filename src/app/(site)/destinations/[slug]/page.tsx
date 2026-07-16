import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CalendarRange, Clock, Globe2, Languages, Coins, Stamp, ArrowRight } from "lucide-react";

import { getDestinationBySlug, getPackages, getActivities, getFAQs } from "@/server/catalog";
import { getSettings } from "@/lib/settings";
import { SmartImage } from "@/components/ui/smart-image";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PackageCard } from "@/components/packages/package-card";
import { ActivityCard } from "@/components/activities/activity-card";
import { Accordion, AccordionItem } from "@/components/ui/overlays";
import { SectionHeading, EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { EnquiryForm } from "@/components/forms/enquiry-form";
import { FaqJsonLd } from "@/components/seo/json-ld";
import { Reveal } from "@/components/ui/reveal";
import { SITE_URL } from "@/config/site";

export const revalidate = 900;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const destination = await getDestinationBySlug(slug);

  if (!destination) return { title: "Destination not found" };

  const title = destination.seo?.title || `${destination.name} holiday packages`;
  const description =
    destination.seo?.description ||
    destination.summary ||
    `Plan a trip to ${destination.name}, ${destination.country} — packages, activities and honest advice on when to go.`;

  return {
    title,
    description,
    alternates: { canonical: `/destinations/${destination.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/destinations/${destination.slug}`,
      images: destination.heroImage?.url
        ? [{ url: destination.heroImage.url, alt: destination.heroImage.alt }]
        : undefined,
    },
  };
}

export default async function DestinationPage({ params }: PageProps) {
  const { slug } = await params;

  const destination = await getDestinationBySlug(slug);
  if (!destination) notFound();

  const [packages, activities, faqs, settings] = await Promise.all([
    getPackages({ destinationSlug: slug, pageSize: 6 }),
    getActivities({ destinationSlug: slug, pageSize: 4 }),
    getFAQs("general"),
    getSettings(),
  ]);

  const destinationFaqs = destination.faqs?.length
    ? destination.faqs
    : faqs.slice(0, 5).map((f) => ({ question: f.question, answer: f.answer }));

  return (
    <>
      {/* ---------------------------------- Hero ---------------------------------- */}
      <section className="relative isolate flex min-h-[32rem] items-end overflow-hidden pb-12 pt-32 lg:min-h-[40rem]">
        <div className="absolute inset-0 -z-10">
          <SmartImage
            src={destination.heroImage?.url}
            alt={destination.heroImage?.alt || destination.name}
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
              { name: "Destinations", href: "/destinations" },
              { name: destination.name, href: `/destinations/${destination.slug}` },
            ]}
          />

          <div className="mt-6 max-w-2xl">
            <p className="text-eyebrow text-lagoon-300">{destination.country}</p>
            <h1 className="mt-3 text-4xl leading-[1.1] text-white sm:text-5xl lg:text-6xl">
              {destination.name}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-midnight-50">{destination.summary}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="accent">
                <Link href={`/packages?destination=${destination.slug}`}>
                  See {packages.total} {packages.total === 1 ? "package" : "packages"}
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="glass">
                <Link href={`/customise-my-trip?destination=${encodeURIComponent(destination.name)}`}>
                  Build a custom trip
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------- Facts --------------------------------- */}
      <section className="border-b border-hairline bg-white py-8">
        <div className="container-page">
          <dl className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            <Fact
              icon={<Clock aria-hidden />}
              label="Ideal length"
              value={`${destination.recommendedDurationDays} days`}
            />
            <Fact
              icon={<CalendarRange aria-hidden />}
              label="Best months"
              value={destination.bestMonths?.slice(0, 4).join(", ") || "Year-round"}
            />
            {destination.currencyUsed ? (
              <Fact icon={<Coins aria-hidden />} label="Currency" value={destination.currencyUsed} />
            ) : null}
            {destination.languages?.length ? (
              <Fact
                icon={<Languages aria-hidden />}
                label="Languages"
                value={destination.languages.slice(0, 2).join(", ")}
              />
            ) : null}
            {destination.timezone ? (
              <Fact icon={<Globe2 aria-hidden />} label="Timezone" value={destination.timezone} />
            ) : null}
          </dl>

          {destination.visaNote ? (
            <p className="mt-6 flex items-start gap-2.5 rounded-2xl bg-sand-50 p-4 text-sm text-muted">
              <Stamp className="mt-0.5 size-4 shrink-0 text-lagoon-700" aria-hidden />
              <span>
                <span className="font-semibold text-midnight-900">Visa: </span>
                {destination.visaNote}{" "}
                {settings.features.visaEnabled ? (
                  <Link href="/visa" className="font-semibold text-lagoon-700 underline hover:no-underline">
                    See visa assistance
                  </Link>
                ) : null}
              </span>
            </p>
          ) : null}
        </div>
      </section>

      {/* -------------------------------- Editorial -------------------------------- */}
      <section className="section-y">
        <div className="container-page grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <Reveal>
            <div>
              <h2 className="text-2xl text-midnight-900 sm:text-3xl">
                What {destination.name} is actually like
              </h2>
              <p className="mt-5 whitespace-pre-line text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {destination.description || destination.summary}
              </p>

              {destination.highlights?.length ? (
                <>
                  <h3 className="mt-10 text-lg text-midnight-900">Worth building the trip around</h3>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {destination.highlights.map((h) => (
                      <li
                        key={h}
                        className="flex items-start gap-2.5 rounded-xl border border-hairline p-3.5"
                      >
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-lagoon-500" aria-hidden />
                        <span className="text-[0.875rem] leading-relaxed text-midnight-800">{h}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}

              {destination.gallery?.length ? (
                <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {destination.gallery.slice(0, 6).map((img, i) => (
                    <div
                      key={`${img.url}-${i}`}
                      className="relative aspect-4/3 overflow-hidden rounded-xl"
                    >
                      <SmartImage
                        src={img.url}
                        alt={img.alt || `${destination.name} — ${i + 1}`}
                        fill
                        sizes="(max-width: 640px) 45vw, 22vw"
                        className="object-cover transition-transform duration-700 hover:scale-105 motion-reduce:hover:scale-100"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="lg:sticky lg:top-28">
              <div className="rounded-3xl border border-hairline bg-white p-6 shadow-tile">
                <h2 className="font-display text-xl text-midnight-900">
                  Ask us anything about {destination.name}
                </h2>
                <p className="mt-2 text-sm text-muted">
                  A designer who has been there will reply — not a call centre.
                </p>
                <div className="mt-6">
                  <EnquiryForm
                    type="general"
                    compact
                    submitLabel="Send my question"
                    subject={{
                      kind: "destination",
                      refId: String(destination._id),
                      title: destination.name,
                      slug: destination.slug,
                    }}
                  />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* -------------------------------- Packages -------------------------------- */}
      <section className="section-y wash-ivory">
        <div className="container-page">
          <SectionHeading
            eyebrow="Ready to book"
            title={`Packages in ${destination.name}`}
            action={
              <Button asChild variant="outline">
                <Link href={`/packages?destination=${destination.slug}`}>View all</Link>
              </Button>
            }
          />

          {packages.items.length === 0 ? (
            <EmptyState
              className="mt-8"
              title={`No packages published for ${destination.name} yet`}
              description="We can still plan it — tell us your dates and we'll build one from scratch."
              action={
                <Button asChild variant="accent">
                  <Link href={`/customise-my-trip?destination=${encodeURIComponent(destination.name)}`}>
                    Design a custom trip
                  </Link>
                </Button>
              }
            />
          ) : (
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {packages.items.map((p) => (
                <li key={p.id}>
                  <PackageCard pkg={p} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ------------------------------- Activities ------------------------------- */}
      {activities.items.length ? (
        <section className="section-y">
          <div className="container-page">
            <SectionHeading
              eyebrow="Things to do"
              title={`Experiences in ${destination.name}`}
              action={
                <Button asChild variant="outline">
                  <Link href={`/activities?destination=${destination.slug}`}>All experiences</Link>
                </Button>
              }
            />
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {activities.items.map((a) => (
                <li key={a.id}>
                  <ActivityCard activity={a} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ----------------------------------- FAQ ---------------------------------- */}
      {destinationFaqs.length ? (
        <section className="section-y border-t border-hairline bg-white">
          <div className="container-page max-w-3xl">
            <SectionHeading title={`${destination.name} — common questions`} align="center" className="text-center" />
            <Accordion type="single" collapsible className="mt-8 rounded-2xl border border-hairline px-5">
              {destinationFaqs.map((faq, i) => (
                <AccordionItem key={faq.question} value={`faq-${i}`} trigger={faq.question}>
                  {faq.answer}
                </AccordionItem>
              ))}
            </Accordion>
            <FaqJsonLd faqs={destinationFaqs} />
          </div>
        </section>
      ) : null}
    </>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[0.625rem] font-bold uppercase tracking-wider text-muted">
        <span className="text-lagoon-600 [&_svg]:size-3.5">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-semibold text-midnight-900">{value}</dd>
    </div>
  );
}
