"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import type { Settings } from "@/lib/settings";

/**
 * Editable promo strip. Rotates between messages, can be dismissed for the
 * session, and is switched off entirely from Admin → Site Settings.
 */
export function AnnouncementBar({ announcement }: { announcement: Settings["announcement"] }) {
  const [dismissed, setDismissed] = React.useState(false);
  const [index, setIndex] = React.useState(0);
  const reduced = useReducedMotion();

  const items = announcement.items?.filter((i) => i.text) ?? [];
  const count = items.length;

  React.useEffect(() => {
    // sessionStorage only exists client-side, so this can't be read during
    // the initial render — an effect is the correct (only) way to hydrate it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(sessionStorage.getItem("ezymiles.announcement.dismissed") === "1");
  }, []);

  React.useEffect(() => {
    if (count < 2 || dismissed) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % count),
      Math.max(3000, announcement.intervalMs || 5000),
    );
    return () => clearInterval(id);
  }, [count, announcement.intervalMs, dismissed]);

  if (!announcement.enabled || count === 0 || dismissed) return null;

  const current = items[index % count];

  const close = () => {
    setDismissed(true);
    sessionStorage.setItem("ezymiles.announcement.dismissed", "1");
  };

  const body = (
    <span className="flex items-center gap-2 text-center">
      <Sparkles className="size-3.5 shrink-0 text-gild-300" aria-hidden />
      {current.emphasis ? (
        <span className="hidden rounded-full bg-white/12 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider text-gild-200 sm:inline">
          {current.emphasis}
        </span>
      ) : null}
      <span className="truncate">{current.text}</span>
    </span>
  );

  return (
    <div className="relative z-50 bg-midnight-950 text-white">
      <div className="container-page flex h-10 items-center justify-center">
        <div className="flex min-w-0 flex-1 items-center justify-center text-[0.75rem] font-medium sm:text-[0.8125rem]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={index}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="min-w-0"
            >
              {current.href ? (
                <Link href={current.href} className="hover:text-gild-200">
                  {body}
                </Link>
              ) : (
                body
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          type="button"
          onClick={close}
          aria-label="Dismiss announcement"
          className="-mr-2 ml-2 shrink-0 rounded-full p-1.5 text-white/55 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
