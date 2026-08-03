"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

const ReducedMotionContext = createContext(false);

export function ReducedMotionProvider({ children }: { children: React.ReactNode }) {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  return <ReducedMotionContext.Provider value={reduced}>{children}</ReducedMotionContext.Provider>;
}

export function useReducedMotion() {
  return useContext(ReducedMotionContext);
}
