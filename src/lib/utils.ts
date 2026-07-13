import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  CURRENCY_META,
  DEFAULT_CURRENCY,
  type CurrencyCode,
} from "@/config/site";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* -------------------------------- Currency -------------------------------- */

/** Convert an INR base amount into the requested display currency. */
export function convertFromINR(amountINR: number, currency: CurrencyCode): number {
  const meta = CURRENCY_META[currency] ?? CURRENCY_META[DEFAULT_CURRENCY];
  return amountINR * meta.rateFromINR;
}

/**
 * Format a price for display. All prices in the database are stored in INR
 * (the base currency); display conversion is presentational only — the server
 * always charges in the stored base currency.
 */
export function formatPrice(
  amountINR: number,
  currency: CurrencyCode = DEFAULT_CURRENCY,
  opts: { compact?: boolean; decimals?: boolean } = {},
): string {
  const meta = CURRENCY_META[currency] ?? CURRENCY_META[DEFAULT_CURRENCY];
  const value = convertFromINR(amountINR, currency);

  return new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency: meta.code,
    notation: opts.compact ? "compact" : "standard",
    maximumFractionDigits: opts.decimals ? 2 : 0,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, locale = "en-IN") {
  return new Intl.NumberFormat(locale).format(value);
}

/* --------------------------------- Dates ---------------------------------- */

export function formatDate(
  value: Date | string | number | null | undefined,
  opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
) {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", opts).format(d);
}

export function formatDateTime(value: Date | string | number | null | undefined) {
  return formatDate(value, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "5 Days / 4 Nights" */
export function formatDuration(days: number, nights?: number) {
  const n = nights ?? Math.max(0, days - 1);
  return `${days} ${days === 1 ? "Day" : "Days"} / ${n} ${n === 1 ? "Night" : "Nights"}`;
}

/** Minutes → "12h 40m" */
export function formatMinutes(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${m ? `${m}m` : ""}`.trim() : `${m}m`;
}

export function daysBetween(a: Date | string, b: Date | string) {
  const start = new Date(a).getTime();
  const end = new Date(b).getTime();
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

export function addDays(date: Date | string, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** yyyy-mm-dd for <input type="date"> — local time, not UTC-shifted. */
export function toDateInput(date: Date | string | number) {
  const d = new Date(date);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}

/* --------------------------------- Strings -------------------------------- */

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export function titleCase(input: string) {
  return input.replace(/\w\S*/g, (t) => t[0].toUpperCase() + t.slice(1).toLowerCase());
}

export function truncate(input: string, max = 140) {
  if (input.length <= max) return input;
  return `${input.slice(0, max).trimEnd()}…`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/* ---------------------------------- Misc ---------------------------------- */

export function percentOff(original: number, offer: number) {
  if (!original || original <= offer) return 0;
  return Math.round(((original - offer) / original) * 100);
}

export function pluralise(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Deterministic, collision-resistant reference like VYR-8K3M2Q. */
export function generateReference(prefix: string) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `${prefix}-${out}`;
}

export function range(n: number, start = 0) {
  return Array.from({ length: n }, (_, i) => i + start);
}

/** Clamp for filters/pagination. */
export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Strip Mongo internals so documents can cross the server→client boundary. */
export function serialise<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function buildQueryString(params: Record<string, string | number | boolean | undefined | null | string[]>) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      value.filter(Boolean).forEach((v) => sp.append(key, String(v)));
    } else {
      sp.set(key, String(value));
    }
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export function whatsappLink(number: string, message: string) {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
