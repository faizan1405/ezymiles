import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, User, HeartHandshake, ShieldCheck } from "lucide-react";

import { getSettings } from "@/lib/settings";
import { SmartImage } from "@/components/ui/smart-image";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SectionHeading } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "About us",
  description:
    "eZyMiles makes travel planning simple, transparent and stress-free through honest recommendations and responsible support.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const settings = await getSettings();

  return (
    <>
      {/* ---------------------------------- Hero ---------------------------------- */}
      <section className="relative isolate flex min-h-[26rem] items-end overflow-hidden pb-12 pt-32">
        <div className="absolute inset-0 -z-10">
          <SmartImage
            src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=2000&q=80"
            alt="Travellers exploring destinations with eZyMiles guidance"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 hero-scrim" />
        </div>

        <div className="container-page">
          <Breadcrumbs tone="dark" items={[{ name: "About", href: "/about" }]} />

          <div className="mt-6 max-w-3xl">
            <h1 className="font-display text-4xl leading-[1.1] text-white sm:text-5xl lg:text-6xl">
              {settings.about.aboutTitle}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-white/80 md:text-lg">
              {settings.brand.tagline}
            </p>
          </div>
        </div>
      </section>

      {/* --------------------------- Section 1: About ----------------------------- */}
      <section className="section-y bg-canvas">
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_20rem] lg:gap-20">
          <Reveal>
            <div>
              <SectionHeading eyebrow="Who we are" title={settings.about.aboutTitle} />
              <p className="mt-6 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                {settings.about.aboutText}
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="flex h-full flex-col justify-center rounded-3xl border border-gild-200/40 bg-gild-50/20 p-8 text-center shadow-tile">
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl wash-gold text-gild-950">
                <HeartHandshake className="size-6" />
              </span>
              <p className="mt-5 font-display text-lg italic leading-relaxed text-midnight-950">
                &ldquo;{settings.about.aboutHighlight}&rdquo;
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------ Section 2: Our Philosophy ----------------------- */}
      <section className="section-y border-y border-hairline bg-white">
        <div className="container-page max-w-4xl text-center">
          <Reveal>
            <div className="flex justify-center">
              <span className="flex size-12 items-center justify-center rounded-2xl wash-ocean text-white shadow-tile">
                <ShieldCheck className="size-6" />
              </span>
            </div>
            <h2 className="mt-6 font-display text-3xl text-midnight-900 sm:text-4xl">
              {settings.about.philosophyTitle}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              {settings.about.philosophyText}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ------------------------ Section 3: Founder's Note ----------------------- */}
      <section className="section-y wash-ivory">
        <div className="container-page">
          <Reveal>
            <SectionHeading eyebrow="Founder's Note" title="Letter from our Founder" />
          </Reveal>

          <div className="mt-10 grid gap-12 lg:grid-cols-[22rem_1fr] lg:gap-16">
            {/* Left: Founder Image Placeholder */}
            <Reveal delay={0.05} className="h-fit">
              <div className="relative aspect-3/4 overflow-hidden rounded-3xl border border-hairline bg-white shadow-lift">
                {settings.about.founderImageUrl ? (
                  <SmartImage
                    src={settings.about.founderImageUrl}
                    alt={settings.about.founderName}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
                    <span className="flex size-16 items-center justify-center rounded-full bg-sand-100 text-lagoon-600">
                      <User className="size-8" />
                    </span>
                    <h4 className="mt-5 font-display text-sm font-semibold tracking-wider text-midnight-900/60 uppercase">
                      Founder Photograph
                    </h4>
                    <p className="mt-2 text-xs leading-relaxed text-muted max-w-xs">
                      A portrait of {settings.about.founderName} will be uploaded here.
                    </p>
                  </div>
                )}
              </div>
            </Reveal>

            {/* Right: Story */}
            <Reveal delay={0.1}>
              <div className="flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-2xl text-midnight-900">
                    {settings.about.founderName}
                  </h3>
                  <p className="text-sm font-semibold text-lagoon-700">
                    {settings.about.founderRole}
                  </p>

                  <div className="mt-6 space-y-4 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
                    {settings.about.founderStory.split(/\n{2,}/).map((p, idx) => (
                      <p key={idx}>{p.trim()}</p>
                    ))}
                  </div>
                </div>

                {/* Highlighted Quote */}
                <div className="mt-10 border-l-4 border-gild-400 pl-5 italic">
                  <p className="font-display text-lg text-midnight-950 sm:text-xl">
                    &ldquo;{settings.about.founderQuote}&rdquo;
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------------------------- CTA ----------------------------------- */}
      <section className="section-y border-t border-hairline bg-white">
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
