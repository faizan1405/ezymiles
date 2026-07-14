import type { Variants, Transition } from "framer-motion";

/**
 * Shared motion vocabulary.
 *
 * Rules of the house:
 *  • motion supports the content — it never competes with it
 *  • nothing loops forever in the reading path
 *  • every variant degrades to "no movement, just opacity" under reduced motion
 *    (handled by <Reveal> and useReducedMotion at the call site)
 */

export const EASE_OUT_EXPO: Transition["ease"] = [0.16, 1, 0.3, 1];
export const EASE_SOFT: Transition["ease"] = [0.65, 0, 0.35, 1];

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: EASE_OUT_EXPO },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: EASE_SOFT } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.55, ease: EASE_OUT_EXPO } },
};

export const staggerContainer = (stagger = 0.08, delay = 0): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren: delay },
  },
});

/** Word-by-word entrance for editorial headlines. */
export const wordReveal: Variants = {
  hidden: { opacity: 0, y: "0.6em" },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: EASE_OUT_EXPO },
  },
};

export const panelIn: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.28, ease: EASE_OUT_EXPO } },
  exit: { opacity: 0, y: 8, scale: 0.99, transition: { duration: 0.18, ease: EASE_SOFT } },
};

export const drawerIn: Variants = {
  hidden: { x: "100%" },
  show: { x: 0, transition: { duration: 0.42, ease: EASE_OUT_EXPO } },
  exit: { x: "100%", transition: { duration: 0.3, ease: EASE_SOFT } },
};

/** Default viewport config: fire once, slightly before the element is centred. */
export const viewportOnce = { once: true, amount: 0.2, margin: "0px 0px -80px 0px" } as const;
