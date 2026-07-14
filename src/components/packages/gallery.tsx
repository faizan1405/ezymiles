"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Expand, ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { Dialog, DialogContent } from "@/components/ui/overlays";
import { cn } from "@/lib/utils";

export interface GalleryItem {
  url: string;
  alt: string;
  type?: "image" | "video";
}

export function Gallery({
  items,
  videoUrl,
  title,
}: {
  items: GalleryItem[];
  videoUrl?: string;
  title: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [index, setIndex] = React.useState(0);
  const [videoOpen, setVideoOpen] = React.useState(false);
  const reduced = useReducedMotion();

  const media = items.length ? items : [{ url: "", alt: title }];
  const [hero, ...thumbs] = media;

  const go = React.useCallback(
    (delta: number) => setIndex((i) => (i + delta + media.length) % media.length),
    [media.length],
  );

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go]);

  const openAt = (i: number) => {
    setIndex(i);
    setOpen(true);
  };

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-4 sm:grid-rows-2 sm:gap-3">
        {/* Hero frame */}
        <button
          type="button"
          onClick={() => openAt(0)}
          className="group relative col-span-2 row-span-2 aspect-4/3 overflow-hidden rounded-2xl sm:aspect-auto sm:min-h-[24rem]"
          aria-label={`Open gallery: ${hero.alt}`}
        >
          <SmartImage
            src={hero.url}
            alt={hero.alt}
            fill
            priority
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:group-hover:scale-100"
          />
          <span className="absolute inset-0 bg-midnight-950/0 transition-colors group-hover:bg-midnight-950/15" />
          <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-xs font-semibold text-midnight-900 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <Expand className="size-3.5" aria-hidden />
            View all {media.length}
          </span>
        </button>

        {/* Thumbs */}
        {thumbs.slice(0, 4).map((item, i) => (
          <button
            key={`${item.url}-${i}`}
            type="button"
            onClick={() => openAt(i + 1)}
            className="group relative hidden aspect-4/3 overflow-hidden rounded-2xl sm:block"
            aria-label={`Open gallery: ${item.alt}`}
          >
            <SmartImage
              src={item.url}
              alt={item.alt}
              fill
              sizes="25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:group-hover:scale-100"
            />
            {i === 3 && media.length > 5 ? (
              <span className="absolute inset-0 flex items-center justify-center bg-midnight-950/55 text-sm font-semibold text-white">
                +{media.length - 5} more
              </span>
            ) : null}
          </button>
        ))}

        {videoUrl ? (
          <button
            type="button"
            onClick={() => setVideoOpen(true)}
            className="group absolute left-3 top-3 flex items-center gap-2 rounded-full glass px-3.5 py-2 text-xs font-semibold text-midnight-900"
            aria-label="Play the package video"
          >
            <PlayCircle className="size-4" aria-hidden />
            Watch the film
          </button>
        ) : null}
      </div>

      {/* -------------------------------- Lightbox ------------------------------- */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={`${title} — gallery`} size="xl">
          <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-sand-100 sm:aspect-16/9">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={index}
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0"
              >
                <SmartImage
                  src={media[index].url}
                  alt={media[index].alt}
                  fill
                  sizes="(max-width: 768px) 90vw, 56rem"
                  className="object-cover"
                />
              </motion.div>
            </AnimatePresence>

            {media.length > 1 ? (
              <>
                <LightboxButton side="left" onClick={() => go(-1)} />
                <LightboxButton side="right" onClick={() => go(1)} />
              </>
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-muted">{media[index].alt}</p>
            <p className="text-xs font-semibold text-midnight-900" aria-live="polite">
              {index + 1} / {media.length}
            </p>
          </div>

          {media.length > 1 ? (
            <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
              {media.map((item, i) => (
                <button
                  key={`${item.url}-thumb-${i}`}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Show image ${i + 1}`}
                  aria-current={i === index}
                  className={cn(
                    "relative size-16 shrink-0 overflow-hidden rounded-lg transition-all",
                    i === index ? "ring-2 ring-lagoon-600 ring-offset-2" : "opacity-60 hover:opacity-100",
                  )}
                >
                  <SmartImage src={item.url} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* --------------------------------- Video --------------------------------- */}
      <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
        <DialogContent title={`${title} — video`} size="xl">
          <div className="aspect-video overflow-hidden rounded-2xl bg-midnight-950">
            {videoUrl ? (
              <video controls playsInline className="size-full" poster={hero.url}>
                <source src={videoUrl} type="video/mp4" />
                Your browser cannot play this video.
              </video>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function LightboxButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous image" : "Next image"}
      className={cn(
        "absolute top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full glass text-midnight-900 transition-transform hover:scale-105 motion-reduce:hover:scale-100",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}
