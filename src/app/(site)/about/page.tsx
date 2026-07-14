import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, HeartHandshake, Scale, Users } from "lucide-react";

import { getSettings } from "@/lib/settings";
import { getLiveActivity } from "@/server/catalog";
import { SmartImage } from "@/components/ui/smart-image";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SectionHeading } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem, CountUp } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Who we are, how we plan trips, and the things we refuse to do — including inventing statistics about ourselves.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  {
    Icon: Compass,
    title: "We plan, we don't push",
    body: "If a destination is wrong for your dates, your budget or your group, we say so. A trip we talk you out of costs us one sale. A trip you regret costs us a customer.",
  },
  {
    Icon: Scale,
    title: "One price, itemised",
    body: "You see what each night, each transfer and each tax costs before you pay. No convenience fees appearing at checkout, no 'plus taxes' asterisks.",
  },
  {
    Icon: HeartHandshake,
    title: "A named human, start to finish",
    body: "One designer owns your trip. They answer the phone while you're away, and they're still there when you come back to plan the next one.",
  },
  {
    Icon: Users,
    title: "Small groups, real guides",
    body: "Our group departures stay small. Our local guides are paid properly and live where they guide. That's the whole model.",
  },
];

export default async function AboutPage() {
  const [settings, activity] = await Promise.all([getSettings(), getLiveActivity()]);

  return (
    <>
      {/* ---------------------------------- Hero ---------------------------------- */}
      <section className="relative isolate flex min-h-[30rem] items-end overflow-hidden pb-14 pt-32">
        <div className="absolute inset-0 -z-10">
          <SmartImage
            src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=2000&q=80"
            alt="Two travellers looking out over a valley at dawn"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 hero-scrim" />
        </div>

        <div className="container-page">
          <Breadcrumbs tone="dark" items={[{ name: "About", href: "/about" }]} />

          <div className="mt-6 max-w-2xl">
            <h1 className="text-4xl leading-[1.1] text-white sm:text-5xl lg:text-6xl">
              {settings.brand.tagline}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-white/80">
              We&apos;re a small travel atelier. We&apos;d rather plan twenty destinations properly
              than list two hundred badly, and we&apos;d rather lose a booking than sell you the wrong
              trip.
            </p>
          </div>
        </div>
      </section>

      {/* -------------------------------- The story ------------------------------- */}
      <section className="section-y">
        <div className="container-page grid gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <div>
              <SectionHeading eyebrow="Why we exist" title="Travel got optimised. It didn't get better." />

              <div className="mt-7 space-y-5 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                <p>
                  Somewhere along the way, booking a holiday turned into a race against a countdown
                  timer. Fake scarcity. &ldquo;Only 2 rooms left!&rdquo; Prices that change when you
                  come back to the tab. A support line that answers on the third day of your trip.
                </p>
                <p>
                  We built {settings.brand.name} because we wanted the opposite: a real person who has
                  been to the place you&apos;re going, an itinerary written for you rather than
                  copy-pasted, and a price that doesn&apos;t move between the search results and the
                  payment page.
                </p>
                <p>
                  We don&apos;t claim to be the biggest, and we won&apos;t print a made-up number of
                  &ldquo;happy travellers&rdquo; on this page. What we&apos;ll show you instead is
                  what&apos;s actually in our system.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative aspect-3/4 overflow-hidden rounded-2xl">
                <SmartImage
                  src="https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&q=80"
                  alt="A narrow street of old buildings at golden hour"
                  fill
                  sizes="(max-width: 1024px) 45vw, 22vw"
                  className="object-cover"
                />
              </div>
              <div className="relative mt-8 aspect-3/4 overflow-hidden rounded-2xl">
                <SmartImage
                  src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80"
                  alt="A cathedral square photographed from above"
                  fill
                  sizes="(max-width: 1024px) 45vw, 22vw"
                  className="object-cover"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* --------------------------- Honest numbers only -------------------------- */}
      {activity && (activity.confirmedTravellers > 0 || activity.upcomingTours > 0) ? (
        <section className="border-y border-hairline bg-white py-14">
          <div className="container-page">
            <p className="text-center text-eyebrow text-lagoon-700">Straight from our database</p>

            <dl className="mt-8 grid grid-cols-2 gap-8 text-center sm:grid-cols-3">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Confirmed bookings
                </dt>
                <dd className="mt-2 font-display text-4xl text-midnight-900">
                  <CountUp to={activity.confirmedTravellers} />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Trips departing soon
                </dt>
                <dd className="mt-2 font-display text-4xl text-midnight-900">
                  <CountUp to={activity.upcomingTours} />
                </dd>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Destinations booked (30 days)
                </dt>
                <dd className="mt-2 font-display text-4xl text-midnight-900">
                  <CountUp to={activity.recentDestinations.length} />
                </dd>
              </div>
            </dl>

            <p className="mt-6 text-center text-xs text-muted">
              These are live counts, not marketing figures. If they&apos;re small, it&apos;s because
              we&apos;re honest about them.
            </p>
          </div>
        </section>
      ) : null}

      {/* --------------------------------- Values --------------------------------- */}
      <section className="section-y wash-ivory">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="How we work"
              title="Four rules we don't bend"
              align="center"
              className="text-center"
            />
          </Reveal>

          <RevealGroup as="ul" className="mt-12 grid gap-6 sm:grid-cols-2">
            {VALUES.map(({ Icon, title, body }) => (
              <RevealItem as="li" key={title}>
                <div className="h-full rounded-2xl border border-hairline bg-white p-7">
                  <span className="flex size-12 items-center justify-center rounded-2xl wash-ocean text-white">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-5 font-display text-xl text-midnight-900">{title}</h3>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">{body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ---------------------------------- CTA ----------------------------------- */}
      <section className="section-y">
        <div className="container-page">
          <div className="rounded-3xl wash-ocean p-10 text-center text-white sm:p-16">
            <h2 className="mx-auto max-w-2xl text-3xl leading-tight sm:text-4xl">
              Tell us what a good day looks like. We&apos;ll build the rest around it.
            </h2>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="xl" variant="gold">
                <Link href="/customise-my-trip">
                  Plan my trip
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild size="xl" variant="glass">
                <Link href="/contact">Talk to a designer</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
