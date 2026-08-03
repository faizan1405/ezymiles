"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/components/ui/reduced-motion-context";
import { Price } from "@/components/ui/price";
import { Button } from "@/components/ui/button";

/**
 * Mobile booking bar.
 *
 * Appears once the inline booking card has scrolled out of view, so it never
 * covers the thing it duplicates. Hidden entirely on desktop.
 */
export function StickyMobileBar({
  priceINR,
  originalINR,
  label = "per person",
  ctaLabel = "Book now",
  targetId = "booking",
}: {
  priceINR: number;
  originalINR?: number;
  label?: string;
  ctaLabel?: string;
  targetId?: string;
}) {
  const [visible, setVisible] = React.useState(false);
  const reduced = useReducedMotion();

  React.useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: "-120px 0px 0px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);

  const scrollToBooking = () => {
    document.getElementById(targetId)?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "center",
    });
  };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={reduced ? { opacity: 0 } : { y: "100%" }}
          animate={reduced ? { opacity: 1 } : { y: 0 }}
          exit={reduced ? { opacity: 0 } : { y: "100%" }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="no-print fixed inset-x-0 bottom-0 z-70 border-t border-hairline bg-white lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="container-page flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <Price amountINR={priceINR} original={originalINR} className="text-lg" />
              <p className="text-[0.6875rem] text-muted">{label}</p>
            </div>
            <Button size="lg" variant="accent" onClick={scrollToBooking} className="shrink-0">
              {ctaLabel}
            </Button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
