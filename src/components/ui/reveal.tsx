"use client";

import * as React from "react";
import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import { EASE_OUT_EXPO, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Direction = "up" | "down" | "left" | "right" | "none";

const OFFSETS: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 28 },
  down: { x: 0, y: -28 },
  left: { x: 28, y: 0 },
  right: { x: -28, y: 0 },
  none: { x: 0, y: 0 },
};

/**
 * Scroll-triggered reveal. Under `prefers-reduced-motion` it collapses to a
 * plain fade with no transform, so nothing slides across the viewport.
 */
export function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.65,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "span";
}) {
  const reduced = useReducedMotion();
  const offset = reduced ? OFFSETS.none : OFFSETS[direction];
  const MotionTag = motion[as] as typeof motion.div;

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: reduced ? 0.3 : duration, delay: reduced ? 0 : delay, ease: EASE_OUT_EXPO }}
    >
      {children}
    </MotionTag>
  );
}

/** Staggered list — children animate in sequence as the group enters view. */
export function RevealGroup({
  children,
  stagger = 0.08,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  stagger?: number;
  className?: string;
  as?: "div" | "ul" | "section";
}) {
  const reduced = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduced ? 0 : stagger } },
  };

  return (
    <MotionTag
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
    >
      {children}
    </MotionTag>
  );
}

export function RevealItem({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  const reduced = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;

  const item: Variants = {
    hidden: { opacity: 0, y: reduced ? 0 : 22 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } },
  };

  return (
    <MotionTag className={className} variants={item}>
      {children}
    </MotionTag>
  );
}

/* ------------------------------ Count-up number ---------------------------- */

export function CountUp({
  to,
  suffix = "",
  prefix = "",
  duration = 1600,
  className,
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduced = useReducedMotion();
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    if (!inView) return;
    if (reduced) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(to);
      return;
    }

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      // ease-out-expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.round(to * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, to, duration, reduced]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {value.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

/* ------------------------------- Tilt on hover ----------------------------- */
/**
 * Subtle 3D tilt. Desktop + fine-pointer only; disabled for reduced motion and
 * never attached on touch devices (no cursor-following on mobile).
 */
export function Tilt({
  children,
  className,
  max = 6,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const reduced = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = React.useState(false);
  const [style, setStyle] = React.useState<React.CSSProperties>({});

  React.useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)");
    const update = () => setEnabled(mq.matches && !reduced);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [reduced]);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setStyle({
      transform: `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`,
    });
  };

  const reset = () => setStyle({ transform: "perspective(900px) rotateX(0deg) rotateY(0deg)" });

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={enabled ? { ...style, transition: "transform 400ms cubic-bezier(0.16,1,0.3,1)" } : undefined}
      className={className}
    >
      {children}
    </div>
  );
}
