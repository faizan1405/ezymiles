import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Clock,
  MapPin,
  Plane,
  BedDouble,
  Car,
  UtensilsCrossed,
  Ticket,
  Check,
  X,
  Info,
  Stamp,
  Star,
  ShieldAlert,
} from "lucide-react";

import { getPackageBySlug, getRelatedPackages, getReviewsForSubject } from "@/server/catalog";
import { getSettings } from "@/lib/settings";
import { Gallery } from "@/components/packages/gallery";
import { ItineraryTimeline } from "@/components/packages/itinerary-timeline";
import { BookingCard } from "@/components/packages/booking-card";
import { StickyMobileBar } from "@/components/packages/sticky-mobile-bar";
import { RecentlyViewed } from "@/components/packages/recently-viewed";
import { PackageCard } from "@/components/packages/package-card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Badge, Rating, SectionHeading } from "@/components/ui/primitives";
import { Accordion, AccordionItem } from "@/components/ui/overlays";
import { ReviewList } from "@/components/reviews/review-list";
import { FaqJsonLd, TourProductJsonLd } from "@/components/seo/json-ld";
import { formatDuration, percentOff } from "@/lib/utils";
import { SITE_URL } from "@/config/site";

export const revalidate = 600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await getPackageBySlug(slug);

  if (!pkg) return { title: "Package not found" };

  const title = pkg.seo?.title || pkg.title;
  const description =
    pkg.seo?.description ||
    `${formatDuration(pkg.durationDays, pkg.durationNights)} · ${pkg.citiesCovered.join(", ")}. ${pkg.subtitle || pkg.overview.slice(0, 140)}`;

  return {
    title,
    description,
    keywords: pkg.seo?.keywords,
    alternates: { canonical: `/packages/${pkg.slug}` },
    robots: pkg.seo?.noIndex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      title,
      description,
      url: `${SITE_URL}/packages/${pkg.slug}`,
      images: pkg.heroImage?.url ? [{ url: pkg.heroImage.url, alt: pkg.heroImage.alt }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: pkg.heroImage?.url ? [pkg.heroImage.url] : undefined,
    },
  };
}

export default async function PackageDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const pkg = await getPackageBySlug(slug);
  if (!pkg) notFound();

  const [settings, related, reviews] = await Promise.all([
    getSettings(),
    getRelatedPackages(String(pkg._id), String(pkg.destination?._id ?? ""), 4),
    getReviewsForSubject(String(pkg._id), 8),
  ]);

  const discount = pkg.originalPriceINR
    ? percentOff(pkg.originalPriceINR, pkg.startingPriceINR)
    : 0;

  const galleryItems = [
    { url: pkg.heroImage?.url ?? "", alt: pkg.heroImage?.alt || pkg.title },
    ...(pkg.gallery ?? []).map((g) => ({ url: g.url, alt: g.alt || pkg.title })),
  ].filter((g) => g.url);

  const upcomingDepartures = (pkg.departures ?? [])
    .filter((d) => new Date(d.date) >= new Date() && d.status !== "closed")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 12)
    .map((d) => ({
      id: String(d._id),
      date: String(d.date),
      departureCity: d.departureCity,
      seatsLeft: Math.max(0, d.seatsTotal - d.seatsBooked),
      status: d.status,
      priceAdjustmentINR: d.priceAdjustmentINR,
    }));

  const variants = (pkg.variants ?? []).map((v) => ({
    key: v.key,
    label: v.label,
    hotelCategory: v.hotelCategory,
    durationDays: v.durationDays,
    pricePerAdultINR: v.pricePerAdultINR,
    originalPricePerAdultINR: v.originalPricePerAdultINR,
  }));

  // Only mark up ratings when they came from real, approved reviews.
  const hasGenuineReviews = reviews.some((r) => r.isVerifiedBooking);

  return (
    <>
      {/* --------------------------------- Header --------------------------------- */}
      <div className="border-b border-hairline bg-white pb-8 pt-6">
        <div className="container-page">
          <Breadcrumbs
            items={[
              { name: "Packages", href: "/packages" },
              ...(pkg.destination
                ? [
                    {
                      name: pkg.destination.name,
                      href: `/destinations/${pkg.destination.slug}`,
                    },
                  ]
                : []),
              { name: pkg.title, href: `/packages/${pkg.slug}` },
            ]}
          />

          <div className="mt-6 flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                {pkg.isBestseller ? <Badge tone="gold">Bestseller</Badge> : null}
                {pkg.isTrending ? <Badge tone="ink">Trending</Badge> : null}
                {discount > 0 ? <Badge tone="sunset">{discount}% off</Badge> : null}
                {pkg.isDemoData ? <Badge tone="warning">Demo data</Badge> : null}
              </div>

              <h1 className="mt-3 text-3xl leading-tight text-midnight-900 sm:text-4xl lg:text-[2.75rem]">
                {pkg.title}
              </h1>

              {pkg.subtitle ? (
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                  {pkg.subtitle}
                </p>
              ) : null}

              <ul className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
                <li className="flex items-center gap-1.5">
                  <Clock className="size-4 text-lagoon-600" aria-hidden />
                  {formatDuration(pkg.durationDays, pkg.durationNights)}
                </li>
                <li className="flex items-center gap-1.5">
                  <MapPin className="size-4 text-lagoon-600" aria-hidden />
                  {pkg.citiesCovered.join(" · ")}
                </li>
                <li className="flex items-center gap-1.5">
                  <BedDouble className="size-4 text-lagoon-600" aria-hidden />
                  {pkg.hotelCategory}★ stays
                </li>
                {pkg.ratingCount > 0 ? (
                  <li>
                    <Rating value={pkg.ratingAverage} count={pkg.ratingCount} size="md" />
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------- Gallery -------------------------------- */}
      <div className="container-page pt-8">
        <Gallery items={galleryItems} videoUrl={pkg.videoUrl} title={pkg.title} />
      </div>

      {/* --------------------------------- Body ----------------------------------- */}
      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_23rem] lg:gap-14">
        <article className="min-w-0 space-y-14">
          {/* Overview */}
          <Section id="overview" title="Overview">
            <p className="whitespace-pre-line text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {pkg.overview}
            </p>

            {pkg.highlights?.length ? (
              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {pkg.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2.5 rounded-xl bg-sand-50 p-3.5">
                    <Star className="mt-0.5 size-4 shrink-0 fill-gild-400 text-gild-400" aria-hidden />
                    <span className="text-[0.875rem] leading-relaxed text-midnight-800">{h}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </Section>

          {/* Itinerary */}
          <Section id="itinerary" title="Day by day" description="Expand any day to see what's actually planned.">
            <ItineraryTimeline days={pkg.itinerary ?? []} />
          </Section>

          {/* Stays, flights, transfers, meals */}
          <Section id="inclusions" title="What's in the package">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoTile
                icon={<BedDouble aria-hidden />}
                title="Hotels"
                items={
                  pkg.hotels?.length
                    ? pkg.hotels.map(
                        (h) => `${h.city}: ${h.name} (${h.category}★, ${h.nights} ${h.nights === 1 ? "night" : "nights"})`,
                      )
                    : [`${pkg.hotelCategory}★ properties, confirmed on booking`]
                }
              />
              <InfoTile
                icon={<Plane aria-hidden />}
                title="Flights"
                items={[
                  pkg.flightsIncluded
                    ? (pkg.flightNote ?? "Return economy flights included")
                    : "Not included — we can add them on request",
                ]}
              />
              <InfoTile
                icon={<Car aria-hidden />}
                title="Transfers"
                items={[
                  pkg.transfersIncluded
                    ? (pkg.transfersNote ?? "All airport and intercity transfers included")
                    : "Not included",
                ]}
              />
              <InfoTile
                icon={<UtensilsCrossed aria-hidden />}
                title="Meals"
                items={[pkg.mealsIncluded ? "Daily breakfast, plus meals shown in the itinerary" : "Not included"]}
              />
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <ListBlock
                title="Included"
                tone="positive"
                items={pkg.inclusions ?? []}
                emptyText="Inclusions will be confirmed on your quote."
              />
              <ListBlock
                title="Not included"
                tone="negative"
                items={pkg.exclusions ?? []}
                emptyText="Exclusions will be confirmed on your quote."
              />
            </div>
          </Section>

          {/* Activities */}
          {pkg.activitiesIncluded ? (
            <Section id="activities" title="Experiences included">
              <ul className="flex flex-wrap gap-2">
                {(pkg.itinerary ?? [])
                  .flatMap((d) => d.activities ?? [])
                  .filter((a, i, arr) => a && arr.indexOf(a) === i)
                  .map((a) => (
                    <li
                      key={a}
                      className="flex items-center gap-2 rounded-full border border-hairline px-3.5 py-2 text-[0.8125rem] font-medium text-midnight-800"
                    >
                      <Ticket className="size-3.5 text-lagoon-600" aria-hidden />
                      {a}
                    </li>
                  ))}
              </ul>
            </Section>
          ) : null}

          {/* Important info */}
          <Section id="important" title="Before you book">
            <div className="space-y-4">
              {pkg.importantInfo?.length ? (
                <Notice icon={<Info aria-hidden />} title="Important information" items={pkg.importantInfo} />
              ) : null}

              {pkg.visaDetails ? (
                <Notice
                  icon={<Stamp aria-hidden />}
                  title="Visa"
                  items={[pkg.visaDetails]}
                  footer="Final approval always rests with the relevant embassy or immigration authority."
                />
              ) : null}
            </div>

            <div className="mt-6">
              <Accordion type="multiple" className="rounded-2xl border border-hairline px-5">
                {pkg.cancellationPolicy?.length ? (
                  <AccordionItem value="cancellation" trigger="Cancellation policy">
                    <ul className="space-y-2">
                      {pkg.cancellationPolicy.map((c) => (
                        <li key={c.window} className="flex justify-between gap-4 border-b border-hairline pb-2 last:border-0">
                          <span>{c.window}</span>
                          <span className="shrink-0 font-semibold text-midnight-900">{c.charge}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionItem>
                ) : null}

                {pkg.paymentPolicy?.length ? (
                  <AccordionItem value="payment" trigger="Payment policy">
                    <ul className="list-disc space-y-1.5 pl-5">
                      {pkg.paymentPolicy.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </AccordionItem>
                ) : null}

                {pkg.termsAndConditions?.length ? (
                  <AccordionItem value="terms" trigger="Terms and conditions">
                    <ul className="list-disc space-y-1.5 pl-5">
                      {pkg.termsAndConditions.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </AccordionItem>
                ) : null}
              </Accordion>
            </div>
          </Section>

          {/* Reviews */}
          {settings.features.reviewsEnabled ? (
            <Section id="reviews" title="Traveller reviews">
              <ReviewList reviews={reviews} averageRating={pkg.ratingAverage} totalCount={pkg.ratingCount} />
            </Section>
          ) : null}

          {/* FAQs */}
          {pkg.faqs?.length ? (
            <Section id="faqs" title="Questions people actually ask">
              <Accordion type="single" collapsible className="rounded-2xl border border-hairline px-5">
                {pkg.faqs.map((faq, i) => (
                  <AccordionItem key={faq.question} value={`faq-${i}`} trigger={faq.question}>
                    {faq.answer}
                  </AccordionItem>
                ))}
              </Accordion>
              <FaqJsonLd faqs={pkg.faqs} />
            </Section>
          ) : null}
        </article>

        {/* ------------------------------ Booking rail ------------------------------ */}
        <aside id="booking" className="lg:sticky lg:top-28 lg:h-fit">
          <BookingCard
            packageSlug={pkg.slug}
            packageId={String(pkg._id)}
            packageTitle={pkg.title}
            variants={variants}
            departures={upcomingDepartures}
            isDemoData={pkg.isDemoData}
            whatsappNumber={settings.contact.whatsapp}
            phoneNumber={settings.contact.phone}
          />
        </aside>
      </div>

      {/* -------------------------------- Related -------------------------------- */}
      {related.length ? (
        <section className="border-t border-hairline wash-ivory py-14">
          <div className="container-page">
            <SectionHeading
              title="You might also like"
              description="Same region, different shape of trip."
            />
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <li key={p.id}>
                  <PackageCard pkg={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <RecentlyViewed currentSlug={pkg.slug} />

      <StickyMobileBar
        priceINR={pkg.startingPriceINR}
        originalINR={pkg.originalPriceINR}
        label={pkg.priceBasis === "per_couple" ? "per couple" : "per person"}
      />

      <TourProductJsonLd
        name={pkg.title}
        description={pkg.subtitle || pkg.overview.slice(0, 200)}
        image={pkg.heroImage?.url ?? ""}
        slug={pkg.slug}
        priceINR={pkg.startingPriceINR}
        rating={{ average: pkg.ratingAverage, count: pkg.ratingCount }}
        hasGenuineReviews={hasGenuineReviews}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-2xl text-midnight-900 sm:text-[1.75rem]">{title}</h2>
      {description ? <p className="mt-2 text-sm text-muted">{description}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function InfoTile({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-hairline p-5">
      <p className="flex items-center gap-2 text-sm font-bold text-midnight-900">
        <span className="flex size-8 items-center justify-center rounded-lg bg-sand-100 text-lagoon-700 [&_svg]:size-4">
          {icon}
        </span>
        {title}
      </p>
      <ul className="mt-3 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="text-[0.8125rem] leading-relaxed text-muted">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ListBlock({
  title,
  tone,
  items,
  emptyText,
}: {
  title: string;
  tone: "positive" | "negative";
  items: string[];
  emptyText: string;
}) {
  const Icon = tone === "positive" ? Check : X;

  return (
    <div>
      <h3 className="mb-3 text-sm font-bold text-midnight-900">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <Icon
                className={`mt-0.5 size-4 shrink-0 ${tone === "positive" ? "text-emerald-600" : "text-red-500"}`}
                aria-hidden
              />
              <span className="text-[0.875rem] leading-relaxed text-muted">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Notice({
  icon,
  title,
  items,
  footer,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  footer?: string;
}) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <p className="flex items-center gap-2 text-sm font-bold text-amber-900">
        <span className="[&_svg]:size-4">{icon}</span>
        {title}
      </p>
      <ul className="mt-2.5 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="text-[0.8125rem] leading-relaxed text-amber-900">
            {item}
          </li>
        ))}
      </ul>
      {footer ? (
        <p className="mt-3 flex items-start gap-1.5 border-t border-amber-200 pt-3 text-xs text-amber-800">
          <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {footer}
        </p>
      ) : null}
    </div>
  );
}
