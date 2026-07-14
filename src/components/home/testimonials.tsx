"use client";

import * as React from "react";
import { BadgeCheck, Quote, PlayCircle } from "lucide-react";
import type { ReviewDTO } from "@/types";
import { Carousel } from "@/components/ui/carousel";
import { Rating, SectionHeading } from "@/components/ui/primitives";
import { SmartImage } from "@/components/ui/smart-image";
import { Dialog, DialogContent } from "@/components/ui/overlays";
import { formatDate, initials } from "@/lib/utils";

export function Testimonials({ reviews }: { reviews: ReviewDTO[] }) {
  const [video, setVideo] = React.useState<ReviewDTO | null>(null);

  if (reviews.length === 0) return null;

  return (
    <section className="section-y bg-midnight-950 text-white">
      <div className="container-page">
        <SectionHeading
          eyebrow="In their words"
          title="Reviews from people who travelled with us"
          description="Every review below is tied to a real booking in our system. We don't buy them and we don't write them."
          tone="dark"
        />

        <div className="mt-10">
          <Carousel ariaLabel="Traveller reviews" slideClassName="w-[88%] sm:w-[55%] lg:w-[38%]">
            {reviews.map((r) => (
              <TestimonialCard key={r.id} review={r} onPlay={() => setVideo(r)} />
            ))}
          </Carousel>
        </div>
      </div>

      <Dialog open={Boolean(video)} onOpenChange={(open) => !open && setVideo(null)}>
        {video?.videoUrl ? (
          <DialogContent title={`${video.authorName}'s trip`} size="xl">
            <div className="aspect-video overflow-hidden rounded-2xl bg-midnight-950">
              <video controls playsInline className="size-full" poster={video.authorPhoto}>
                <source src={video.videoUrl} type="video/mp4" />
                Your browser cannot play this video.
              </video>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </section>
  );
}

function TestimonialCard({ review: r, onPlay }: { review: ReviewDTO; onPlay: () => void }) {
  return (
    <figure className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
      <Quote className="size-7 shrink-0 text-lagoon-400/50" aria-hidden />

      <blockquote className="mt-4 flex-1">
        {r.title ? (
          <p className="mb-2 font-display text-lg leading-snug text-white">{r.title}</p>
        ) : null}
        <p className="text-[0.9375rem] leading-relaxed text-white/70">
          {r.body.length > 260 ? `${r.body.slice(0, 260).trimEnd()}…` : r.body}
        </p>
      </blockquote>

      <div className="mt-5">
        <Rating value={r.rating} size="sm" className="[&_span]:text-white/80" />
      </div>

      <figcaption className="mt-5 flex items-center gap-3 border-t border-white/10 pt-5">
        <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-lagoon-700">
          {r.authorPhoto ? (
            <SmartImage src={r.authorPhoto} alt={r.authorName} fill sizes="44px" className="object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center text-sm font-bold text-white">
              {initials(r.authorName)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-white">
            {r.authorName}
            {r.isVerifiedBooking ? (
              <span title="Verified booking">
                <BadgeCheck className="size-4 shrink-0 text-lagoon-400" aria-hidden />
                <span className="sr-only">Verified booking</span>
              </span>
            ) : null}
          </p>
          <p className="truncate text-xs text-white/50">
            {[r.destination ?? r.subjectTitle, r.travelledOn ? formatDate(r.travelledOn, { month: "short", year: "numeric" }) : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        {r.videoUrl ? (
          <button
            type="button"
            onClick={onPlay}
            aria-label={`Play ${r.authorName}'s video review`}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <PlayCircle className="size-5" aria-hidden />
          </button>
        ) : null}
      </figcaption>
    </figure>
  );
}
