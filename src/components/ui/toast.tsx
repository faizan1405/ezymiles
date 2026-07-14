"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";
import { create } from "zustand";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
  duration: number;
}

interface ToastStore {
  toasts: ToastItem[];
  push: (t: Omit<ToastItem, "id" | "duration" | "tone"> & { tone?: ToastTone; duration?: number }) => void;
  dismiss: (id: string) => void;
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: ({ title, description, tone = "info", duration = 5000 }) =>
    set((state) => ({
      toasts: [
        ...state.toasts.filter((t) => t.title !== title),
        { id: crypto.randomUUID(), title, description, tone, duration },
      ].slice(-3),
    })),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative API: toast.success("Saved"), toast.error("Something went wrong") */
export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, tone: "success" }),
  error: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, tone: "error", duration: 7000 }),
  info: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, tone: "info" }),
  warning: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, tone: "warning" }),
};

const TONE_META: Record<ToastTone, { icon: typeof Info; ring: string; iconColor: string }> = {
  success: { icon: CheckCircle2, ring: "border-emerald-200", iconColor: "text-emerald-600" },
  error: { icon: XCircle, ring: "border-red-200", iconColor: "text-red-600" },
  warning: { icon: AlertTriangle, ring: "border-amber-200", iconColor: "text-amber-600" },
  info: { icon: Info, ring: "border-lagoon-200", iconColor: "text-lagoon-600" },
};

function ToastCard({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const { icon: Icon, ring, iconColor } = TONE_META[item.tone];

  React.useEffect(() => {
    const timer = setTimeout(() => dismiss(item.id), item.duration);
    return () => clearTimeout(timer);
  }, [item.id, item.duration, dismiss]);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.97 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "pointer-events-auto flex w-[min(24rem,calc(100vw-2rem))] items-start gap-3 rounded-2xl border bg-surface p-4 shadow-float",
        ring,
      )}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", iconColor)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-midnight-900">{item.title}</p>
        {item.description ? (
          <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-muted">{item.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => dismiss(item.id)}
        className="-m-1 rounded-full p-1 text-midnight-400 transition-colors hover:bg-sand-100 hover:text-midnight-900"
        aria-label="Dismiss notification"
      >
        <X className="size-4" aria-hidden />
      </button>
    </motion.li>
  );
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const reduced = useReducedMotion();

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-200 flex flex-col items-end sm:bottom-6 sm:right-6"
      role="region"
      aria-label="Notifications"
    >
      <ul className="flex flex-col gap-2.5" aria-live="polite" aria-atomic="false">
        <AnimatePresence initial={false} mode={reduced ? "wait" : "sync"}>
          {toasts.map((t) => (
            <ToastCard key={t.id} item={t} />
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
