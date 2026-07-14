"use client";

import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Swipeable rail. Desktop gets arrow controls; touch devices just scroll.
 * Slides keep their natural width so the same component works for cards of any
 * size, and the whole thing is keyboard-navigable via the arrow buttons.
 */
export function Carousel({
  children,
  className,
  slideClassName,
  ariaLabel,
  showControls = true,
  align = "start",
}: {
  children: React.ReactNode;
  className?: string;
  slideClassName?: string;
  ariaLabel: string;
  showControls?: boolean;
  align?: "start" | "center";
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align,
    containScroll: "trimSnaps",
    dragFree: false,
    skipSnaps: false,
  });

  const [canPrev, setCanPrev] = React.useState(false);
  const [canNext, setCanNext] = React.useState(false);

  const onSelect = React.useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  React.useEffect(() => {
    if (!emblaApi) return;
    // Syncs the initial prev/next button state with the embla instance,
    // then subscribes for further changes — the canonical pattern here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    onSelect();
    emblaApi.on("select", onSelect).on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const slides = React.Children.toArray(children);

  return (
    <div className={cn("relative", className)}>
      <div
        className="overflow-hidden"
        ref={emblaRef}
        role="group"
        aria-roledescription="carousel"
        aria-label={ariaLabel}
      >
        <div className="-ml-4 flex touch-pan-y">
          {slides.map((child, i) => (
            <div
              key={i}
              className={cn("min-w-0 shrink-0 grow-0 pl-4", slideClassName)}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}`}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {showControls && slides.length > 1 ? (
        <div className="mt-6 flex items-center justify-end gap-2">
          <CarouselButton
            direction="prev"
            disabled={!canPrev}
            onClick={() => emblaApi?.scrollPrev()}
            label={`Previous ${ariaLabel}`}
          />
          <CarouselButton
            direction="next"
            disabled={!canNext}
            onClick={() => emblaApi?.scrollNext()}
            label={`Next ${ariaLabel}`}
          />
        </div>
      ) : null}
    </div>
  );
}

function CarouselButton({
  direction,
  disabled,
  onClick,
  label,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "flex size-11 items-center justify-center rounded-full border border-midnight-900/12 bg-white text-midnight-800",
        "transition-all duration-200 hover:border-midnight-900/30 hover:shadow-tile",
        "disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:shadow-none",
      )}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}
