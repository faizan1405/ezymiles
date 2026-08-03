"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/components/ui/reduced-motion-context";
import { ArrowRight, ShieldCheck, Headset, Star, MapPin } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { Button } from "@/components/ui/button";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { useInViewOnce } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

export interface HeroSlide {
  url: string;
  alt: string;
  caption?: string;
  location?: string;
}

/**
 * Full-bleed hero.
 *
 * Media rules: video never autoplays with sound, always has a poster, and is
 * swapped for a still slideshow on small screens and under reduced motion. A
 * two-axis scrim guarantees the headline stays legible on every frame.
 */
export function Hero({
  headline,
  subheadline,
  slides,
  videoUrl,
  mediaKind,
  children,
}: {
  headline: string;
  subheadline: string;
  slides: HeroSlide[];
  videoUrl?: string;
  mediaKind: "video" | "slideshow";
  /** The unified search panel is injected here. */
  children?: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const [index, setIndex] = React.useState(0);
  const [isDesktop, setIsDesktop] = React.useState(false);
  const { ref: heroRef, inView } = useInViewOnce<HTMLElement>();

  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const usableSlides = slides.length ? slides : FALLBACK_SLIDES;
  const useVideo = mediaKind === "video" && Boolean(videoUrl) && isDesktop && !reduced;

  React.useEffect(() => {
    if (useVideo || usableSlides.length < 2 || reduced || !inView) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % usableSlides.length), 6500);
    return () => clearInterval(id);
  }, [useVideo, usableSlides.length, reduced, inView]);

  const active = usableSlides[index % usableSlides.length];
  const words = headline.split(" ");

  return (
    <section ref={heroRef} className="relative isolate flex min-h-[42rem] flex-col justify-center overflow-hidden pb-14 pt-24 md:min-h-[46rem] lg:min-h-[52rem]">
      {/* ---------------------------------- Media --------------------------------- */}
      <div className="absolute inset-0 -z-10">
        {useVideo ? (
          <video
            className="size-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster={usableSlides[0]?.url}
            aria-hidden
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        ) : (
          <AnimatePresence initial={false} mode="sync">
            <motion.div
              key={active.url + index}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: reduced ? 1 : 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                opacity: { duration: 1.2, ease: "easeInOut" },
                scale: { duration: 8, ease: "linear" },
              }}
            >
              <SmartImage
                src={active.url}
                alt={active.alt}
                fill
                priority={index === 0}
                sizes="100vw"
                quality={85}
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>
        )}

        <div className="absolute inset-0 hero-scrim" />
      </div>

      {/* --------------------------------- Content -------------------------------- */}
      <div className="container-page relative">
        <div className="max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
            className="text-eyebrow mb-5 flex items-center gap-2 text-lagoon-300"
          >
            <span className="inline-block h-px w-8 bg-lagoon-400" aria-hidden />
            Handcrafted travel, since day one
          </motion.p>

          <h1 className="text-[2.25rem] leading-[1.08] text-white sm:text-5xl lg:text-[4.25rem]">
            {words.map((word, i) => (
              <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-1 pr-[0.22em]">
                <motion.span
                  className="inline-block"
                  initial={{ y: reduced ? 0 : "0.9em", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    duration: 0.9,
                    delay: reduced ? 0 : 0.1 + i * 0.05,
                    ease: EASE_OUT_EXPO,
                  }}
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: reduced ? 0 : 0.35, ease: EASE_OUT_EXPO }}
            className="mt-6 max-w-xl text-base leading-relaxed text-midnight-50 sm:text-lg"
          >
            {subheadline}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: reduced ? 0 : 0.45, ease: EASE_OUT_EXPO }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Button asChild size="xl" variant="accent">
              <Link href="/customise-my-trip">
                Plan my trip
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="xl" variant="glass">
              <Link href="/packages">Explore packages</Link>
            </Button>
          </motion.div>

          {/* ----------------------------- Trust strip ----------------------------- */}
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: reduced ? 0 : 0.6 }}
            className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-[0.8125rem] text-midnight-100"
          >
            <li className="flex items-center gap-2">
              <Star className="size-4 fill-gild-400 text-gild-400" aria-hidden />
              Reviews from travellers who actually booked
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-lagoon-300" aria-hidden />
              Server-verified secure payments
            </li>
            <li className="flex items-center gap-2">
              <Headset className="size-4 text-lagoon-300" aria-hidden />
              24/7 support while you travel
            </li>
          </motion.ul>
        </div>

        {/* ------------------------------ Search panel ------------------------------ */}
        {children ? (
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: reduced ? 0 : 0.55, ease: EASE_OUT_EXPO }}
            className="mt-12 lg:mt-16"
          >
            {children}
          </motion.div>
        ) : null}
      </div>

      {/* --------------------------- Location marker ---------------------------- */}
      {!useVideo && active.location ? (
        <div className="pointer-events-none absolute bottom-8 right-6 hidden items-center gap-2.5 lg:flex">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.location}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
              className="flex items-center gap-2 rounded-full glass-dark px-4 py-2.5 text-xs font-semibold text-white"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full rounded-full bg-lagoon-400 animate-pulse-ring" />
                <span className="relative inline-flex size-2 rounded-full bg-lagoon-400" />
              </span>
              <MapPin className="size-3.5" aria-hidden />
              {active.location}
            </motion.div>
          </AnimatePresence>
        </div>
      ) : null}

      {/* ------------------------------ Slide dots ------------------------------ */}
      {!useVideo && usableSlides.length > 1 ? (
        <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 gap-2 lg:flex">
          {usableSlides.map((slide, i) => (
            <button
              key={slide.url + i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show slide ${i + 1}: ${slide.location ?? slide.alt}`}
              aria-current={i === index % usableSlides.length}
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                i === index % usableSlides.length
                  ? "w-10 bg-white"
                  : "w-4 bg-midnight-200 hover:bg-white",
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

/** Used only when an admin has not configured any hero media yet. */
const FALLBACK_SLIDES: HeroSlide[] = [
  {
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=2000&q=80",
    alt: "Turquoise shallows meeting a pale sand beach",
    location: "Somewhere warm",
  },
  {
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=2000&q=80",
    alt: "Mountain ridgeline above the cloud line at sunrise",
    location: "Somewhere high",
  },
];
