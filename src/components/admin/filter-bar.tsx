"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input, Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

/**
 * URL-driven list filters. Keeps admin lists server-rendered, bookmarkable and
 * back-button-correct rather than hiding state in component memory.
 */
export function FilterBar({
  searchPlaceholder = "Search…",
  filters = [],
  tabs,
}: {
  searchPlaceholder?: string;
  filters?: { key: string; label: string; options: FilterOption[] }[];
  tabs?: { key: string; label: string; count?: number }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [query, setQuery] = React.useState(params.get("q") ?? "");

  const push = React.useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(params.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      next.delete("page");

      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router],
  );

  // Debounce the search box so typing doesn't fire a request per keystroke.
  React.useEffect(() => {
    const current = params.get("q") ?? "";
    if (query === current) return;

    const timer = setTimeout(() => push({ q: query || undefined }), 350);
    return () => clearTimeout(timer);
  }, [query, params, push]);

  const activeStatus = params.get("status") ?? "";
  const hasFilters = [...params.keys()].some((k) => k !== "page");

  return (
    <div className="mb-5 space-y-3">
      {tabs?.length ? (
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto" role="tablist">
          {tabs.map((tab) => {
            const active = activeStatus === tab.key || (!activeStatus && tab.key === "");
            return (
              <button
                key={tab.key || "all"}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => push({ status: tab.key || undefined })}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[0.8125rem] font-semibold transition-colors",
                  active
                    ? "bg-midnight-900 text-white"
                    : "bg-white text-midnight-600 hover:bg-sand-100",
                )}
              >
                {tab.label}
                {typeof tab.count === "number" ? (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[0.625rem] font-bold",
                      active ? "bg-midnight-700" : "bg-sand-100 text-midnight-600",
                    )}
                  >
                    {tab.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-56 flex-1">
          <label htmlFor="admin-search" className="sr-only">
            {searchPlaceholder}
          </label>
          <Input
            id="admin-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            leadingIcon={<Search />}
            className="h-10"
          />
        </div>

        {filters.map((filter) => (
          <div key={filter.key}>
            <label htmlFor={`filter-${filter.key}`} className="sr-only">
              {filter.label}
            </label>
            <Select
              id={`filter-${filter.key}`}
              value={params.get(filter.key) ?? ""}
              onChange={(e) => push({ [filter.key]: e.target.value || undefined })}
              className="h-10 w-auto min-w-40 text-sm"
            >
              <option value="">{filter.label}</option>
              {filter.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
        ))}

        {hasFilters ? (
          <button
            type="button"
            onClick={() => router.push(pathname)}
            className="flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold text-lagoon-700 hover:bg-sand-100"
          >
            <X className="size-3.5" aria-hidden />
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
