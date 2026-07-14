import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, Users, MapPin, Check, X, ShieldAlert, CalendarX2, Baby } from "lucide-react";

import { getActivityBySlug, getActivities, getReviewsForSubject } from "@/server/catalog";
import { Gallery } from "@/components/packages/gallery";
import { ActivityBookingCard } from "@/components/activities/activity-booking";
import { ActivityCard } from "@/components/activities/activity-card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Rating, SectionHeading } from "@/components/ui/primitives";
import { ReviewList } from "@/components/reviews/review-list";
import { StickyMobileBar } from "@/components/packages/sticky-mobile-bar";
import { formatMinutes } from "@/lib/utils";
import { SITE_URL } from "@/config/site";

export const revalidate = 600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const activity = await getActivityBySlug(slug);

  if (!activity) return { title: "Experience not found" };

  return {
    title: activity.title,
    description: activity.summary,
    alternates: { canonical: `/activities/${activity.slug}` },
    openGraph: {
      title: activity.title,
      description: activity.summary,
      url: `${SITE_URL}/activities/${activity.slug}`,
      images: activity.heroImage?.url ? [{ url: activity.heroImage.url }] : undefined,
    },
  };
}

export default async function ActivityPage({ params }: PageProps) {
  const { slug } = await params;

  const activity = await getActivityBySlug(slug);
  if (!activity) notFound();

  const [related, reviews] = await Promise.all([
    getActivities({ category: activity.category, pageSize: 4 }),
    getReviewsForSubject(String(activity._id), 6),
  ]);

  const gallery = [
    { url: activity.heroImage?.url ?? "", alt: activity.heroImage?.alt || activity.title },
    ...(activity.gallery ?? []).map((g) => ({ url: g.url, alt: g.alt || activity.title })),
  ].filter((g) => g.url);

  const slots = (activity.slots ?? []).map((s) => ({
    time: s.time,
    label: s.label ?? "",
    placesLeft: Math.max(0, s.capacity - s.booked),
  }));

  return (
    <>
      <div className="border-b border-hairline bg-white pb-8 pt-6">
        <div className="container-page">
          <Breadcrumbs
            items={[
              { name: "Activities", href: "/activities" },
              { name: activity.title, href: `/activities/${activity.slug}` },
            ]}
          />

          <div className="mt-6 max-w-3xl">
            <p className="text-eyebrow text-lagoon-700">{activity.category.replace(/-/g, " ")}</p>
            <h1 className="mt-3 text-3xl leading-tight text-midnight-900 sm:text-4xl">
              {activity.title}
            </h1>

            <ul className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
              <li className="flex items-center gap-1.5">
                <MapPin className="size-4 text-lagoon-600" aria-hidden />
                {activity.city}
              </li>
              <li className="flex items-center gap-1.5">
                <Clock className="size-4 text-lagoon-600" aria-hidden />
                {formatMinutes(activity.durationMinutes)}
              </li>
              <li className="flex items-center gap-1.5">
                <Users className="size-4 text-lagoon-600" aria-hidden />
                {activity.minParticipants}–{activity.maxParticipants} people
              </li>
              {activity.minAge ? (
                <li className="flex items-center gap-1.5">
                  <Baby className="size-4 text-lagoon-600" aria-hidden />
                  Ages {activity.minAge}+
                </li>
              ) : null}
              {activity.ratingCount > 0 ? (
                <li>
                  <Rating value={activity.ratingAverage} count={activity.ratingCount} size="md" />
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>

      <div className="container-page pt-8">
        <Gallery items={gallery} title={activity.title} />
      </div>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_22rem] lg:gap-14">
        <article className="min-w-0 space-y-12">
          <section>
            <h2 className="text-2xl text-midnight-900">About this experience</h2>
            <p className="mt-4 whitespace-pre-line text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {activity.description || activity.summary}
            </p>
          </section>

          <section className="grid gap-8 sm:grid-cols-2">
            <div>
              <h2 className="mb-3 text-lg text-midnight-900">What&apos;s included</h2>
              <ul className="space-y-2">
                {(activity.inclusions ?? []).map((item: string) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                    <span className="text-[0.875rem] leading-relaxed text-muted">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-lg text-midnight-900">Not included</h2>
              <ul className="space-y-2">
                {(activity.exclusions ?? []).map((item: string) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <X className="mt-0.5 size-4 shrink-0 text-red-500" aria-hidden />
                    <span className="text-[0.875rem] leading-relaxed text-muted">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {activity.safetyInfo?.length ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
              <h2 className="flex items-center gap-2 text-lg text-amber-900">
                <ShieldAlert className="size-5" aria-hidden />
                Safety information
              </h2>
              <ul className="mt-3 space-y-2">
                {activity.safetyInfo.map((item: string) => (
                  <li key={item} className="text-[0.875rem] leading-relaxed text-amber-900/85">
                    • {item}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <h2 className="flex items-center gap-2 text-lg text-midnight-900">
              <CalendarX2 className="size-5 text-lagoon-600" aria-hidden />
              Cancellation
            </h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
              {activity.cancellationPolicy}
            </p>
            {activity.pickupAvailable ? (
              <p className="mt-4 rounded-xl bg-sand-50 p-4 text-[0.875rem] text-muted">
                <span className="font-semibold text-midnight-900">Pickup: </span>
                {activity.pickupNote ?? "Hotel pickup can be arranged — add it when you book."}
              </p>
            ) : null}
          </section>

          <section id="reviews">
            <h2 className="text-2xl text-midnight-900">Reviews</h2>
            <div className="mt-6">
              <ReviewList
                reviews={reviews}
                averageRating={activity.ratingAverage}
                totalCount={activity.ratingCount}
              />
            </div>
          </section>
        </article>

        <aside id="booking" className="lg:sticky lg:top-28 lg:h-fit">
          <ActivityBookingCard
            slug={activity.slug}
            slots={slots}
            addOns={activity.addOns ?? []}
            pickupAvailable={activity.pickupAvailable}
            minParticipants={activity.minParticipants}
            maxParticipants={activity.maxParticipants}
            instantConfirmation={activity.instantConfirmation}
            isDemoData={activity.isDemoData}
          />
        </aside>
      </div>

      {related.items.filter((a) => a.slug !== activity.slug).length ? (
        <section className="border-t border-hairline wash-ivory py-14">
          <div className="container-page">
            <SectionHeading title="More like this" />
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.items
                .filter((a) => a.slug !== activity.slug)
                .slice(0, 4)
                .map((a) => (
                  <li key={a.id}>
                    <ActivityCard activity={a} />
                  </li>
                ))}
            </ul>
          </div>
        </section>
      ) : null}

      <StickyMobileBar
        priceINR={activity.pricePerAdultINR}
        originalINR={activity.originalPriceINR}
        label="per person"
        ctaLabel="Check availability"
      />
    </>
  );
}
