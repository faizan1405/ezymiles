"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** ease-out-expo, matching the old framer-motion EASE_OUT_EXPO curve. */
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

type Direction = "up" | "down" | "left" | "right" | "none";

const OFFSETS: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 28 },
  down: { x: 0, y: -28 },
  left: { x: 28, y: 0 },
  right: { x: -28, y: 0 },
  none: { x: 0, y: 0 },
};

/** Matches the old framer viewportOnce: fire once, a little before centred. */
const IO_OPTIONS: IntersectionObserverInit = {
  threshold: 0.2,
  rootMargin: "0px 0px -80px 0px",
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

/**
 * Fires `true` once, the first time the element scrolls into view. Falls back
 * to `true` immediately where IntersectionObserver is unavailable so content is
 * never stuck hidden.
 */
function useInViewOnce<T extends Element>(): { ref: React.RefObject<T | null>; inView: boolean } {
  const ref = React.useRef<T>(null);
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setInView(true);
        observer.disconnect();
      }
    }, IO_OPTIONS);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}

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
  as: Tag = "div",
}: {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "span";
}) {
  const reduced = usePrefersReducedMotion();
  const { ref, inView } = useInViewOnce<HTMLElement>();
  const offset = reduced ? OFFSETS.none : OFFSETS[direction];
  const d = reduced ? 0.3 : duration;
  const delaySec = reduced ? 0 : delay;

  const style: React.CSSProperties = {
    opacity: inView ? 1 : 0,
    transform: inView ? "translate3d(0, 0, 0)" : `translate3d(${offset.x}px, ${offset.y}px, 0)`,
    transition: `opacity ${d}s ${EASE} ${delaySec}s, transform ${d}s ${EASE} ${delaySec}s`,
    willChange: inView ? "auto" : "opacity, transform",
  };

  return React.createElement(Tag, { ref, className, style }, children);
}

/* -------------------------- Staggered reveal group ------------------------- */

type RevealGroupCtx = { inView: boolean; reduced: boolean; stagger: number };
const RevealGroupContext = React.createContext<RevealGroupCtx | null>(null);

/** Staggered list — children animate in sequence as the group enters view. */
export function RevealGroup({
  children,
  stagger = 0.08,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  stagger?: number;
  className?: string;
  as?: "div" | "ul" | "section";
}) {
  const reduced = usePrefersReducedMotion();
  const { ref, inView } = useInViewOnce<HTMLElement>();

  const value = React.useMemo<RevealGroupCtx>(
    () => ({ inView, reduced, stagger }),
    [inView, reduced, stagger],
  );

  // Assign each direct child its position so <RevealItem> can offset its delay.
  let index = 0;
  const items = React.Children.map(children, (child) =>
    React.isValidElement(child)
      ? React.cloneElement(child as React.ReactElement<{ __staggerIndex?: number }>, {
          __staggerIndex: index++,
        })
      : child,
  );

  return (
    <RevealGroupContext.Provider value={value}>
      {React.createElement(Tag, { ref, className }, items)}
    </RevealGroupContext.Provider>
  );
}

export function RevealItem({
  children,
  className,
  as: Tag = "div",
  __staggerIndex = 0,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
  /** Injected by <RevealGroup>; not part of the public API. */
  __staggerIndex?: number;
}) {
  const ctx = React.useContext(RevealGroupContext);
  const reduced = ctx?.reduced ?? false;
  const inView = ctx?.inView ?? true;
  const stagger = ctx?.stagger ?? 0.08;
  const delaySec = reduced ? 0 : __staggerIndex * stagger;
  // willChange is only needed while the element is off-screen; once inView
  // the browser no longer needs the hint.
  const style: React.CSSProperties = {
    opacity: inView ? 1 : 0,
    transform: inView ? "translate3d(0, 0, 0)" : `translate3d(0, ${reduced ? 0 : 22}px, 0)`,
    transition: `opacity 0.6s ${EASE} ${delaySec}s, transform 0.6s ${EASE} ${delaySec}s`,
    willChange: inView ? "auto" : "opacity, transform",
  };

  return React.createElement(Tag, { className, style }, children);
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
  const { ref, inView } = useInViewOnce<HTMLSpanElement>();
  const reduced = usePrefersReducedMotion();
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
  const reduced = usePrefersReducedMotion();
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
