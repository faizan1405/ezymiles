"use client";

import * as React from "react";
import { usePreferences } from "@/store/preferences";
import { DEFAULT_CURRENCY } from "@/config/site";
import { cn, formatPrice, percentOff } from "@/lib/utils";

/**
 * Currency-aware price.
 *
 * The number in the database is always INR. This component only changes what the
 * traveller *sees* — the server always recomputes and charges in the base
 * currency, so a tampered display rate can never change what is collected.
 */
export function Price({
  amountINR,
  original,
  className,
  originalClassName,
  compact,
  showSaving = false,
  suffix,
}: {
  amountINR: number;
  original?: number | null;
  className?: string;
  originalClassName?: string;
  compact?: boolean;
  showSaving?: boolean;
  suffix?: string;
}) {
  const currency = usePreferences((s) => s.currency);
  const hydrated = usePreferences((s) => s.hydrated);

  // Render INR on the server and until the persisted preference rehydrates, so
  // the markup matches and there is no hydration mismatch.
  const active = hydrated ? currency : DEFAULT_CURRENCY;
  const saving = original ? original - amountINR : 0;

  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={cn("font-semibold tracking-tight text-midnight-900", className)}>
        {formatPrice(amountINR, active, { compact })}
        {suffix ? <span className="ml-1 text-xs font-medium text-muted">{suffix}</span> : null}
      </span>

      {original && original > amountINR ? (
        <span className={cn("text-sm text-muted line-through", originalClassName)}>
          {formatPrice(original, active, { compact })}
        </span>
      ) : null}

      {showSaving && saving > 0 ? (
        <span className="text-xs font-semibold text-emerald-700">
          Save {formatPrice(saving, active, { compact: true })} ({percentOff(original!, amountINR)}%)
        </span>
      ) : null}
    </span>
  );
}

/** Currency-aware plain string, for places that need text not markup. */
export function usePriceFormatter() {
  const currency = usePreferences((s) => s.currency);
  const hydrated = usePreferences((s) => s.hydrated);
  const active = hydrated ? currency : DEFAULT_CURRENCY;

  return React.useCallback(
    (amountINR: number, opts?: { compact?: boolean }) => formatPrice(amountINR, active, opts),
    [active],
  );
}
