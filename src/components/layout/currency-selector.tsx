"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { CURRENCIES, CURRENCY_META, type CurrencyCode } from "@/config/site";
import { usePreferences } from "@/store/preferences";
import { cn } from "@/lib/utils";

export function CurrencySelector({
  supported = [...CURRENCIES],
  tone = "light",
}: {
  supported?: string[];
  tone?: "light" | "dark";
}) {
  const currency = usePreferences((s) => s.currency);
  const setCurrency = usePreferences((s) => s.setCurrency);
  const hydrated = usePreferences((s) => s.hydrated);

  const active = hydrated ? currency : "INR";
  const options = CURRENCIES.filter((c) => supported.includes(c));

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={cn(
          "flex items-center gap-1 rounded-full px-2.5 py-2 text-[0.8125rem] font-semibold transition-colors",
          tone === "dark"
            ? "text-white hover:bg-white/12 hover:text-white"
            : "text-midnight-700 hover:bg-midnight-900/[0.06] hover:text-midnight-900",
        )}
        aria-label={`Change currency, currently ${active}`}
      >
        <span aria-hidden>{CURRENCY_META[active as CurrencyCode].symbol.trim()}</span>
        <span>{active}</span>
        <ChevronDown className="size-3.5" aria-hidden />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          className="z-150 w-56 rounded-2xl border border-hairline bg-surface p-1.5 shadow-float data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <p className="px-3 py-2 text-[0.6875rem] font-bold uppercase tracking-wider text-muted">
            Display currency
          </p>
          {options.map((code) => (
            <DropdownMenu.Item
              key={code}
              onSelect={() => setCurrency(code)}
              className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm outline-none transition-colors data-[highlighted]:bg-sand-100"
            >
              <span className="flex items-center gap-2.5">
                <span className="w-8 font-semibold text-midnight-900">{code}</span>
                <span className="text-muted">{CURRENCY_META[code].label}</span>
              </span>
              {active === code ? <Check className="size-4 text-lagoon-600" aria-hidden /> : null}
            </DropdownMenu.Item>
          ))}
          <p className="mt-1 border-t border-hairline px-3 py-2 text-[0.6875rem] leading-relaxed text-muted">
            Prices are shown as an indication. All bookings are charged in INR.
          </p>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
