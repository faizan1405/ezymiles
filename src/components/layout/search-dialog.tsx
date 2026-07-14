"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Loader2, MapPin, Package as PackageIcon, Ticket, ArrowRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/overlays";
import { Input } from "@/components/ui/field";
import type { NavData } from "@/server/nav";
import { formatPrice } from "@/lib/utils";

interface SearchHit {
  kind: "destination" | "package" | "activity";
  title: string;
  subtitle: string;
  href: string;
  priceINR?: number;
}

const ICONS = {
  destination: MapPin,
  package: PackageIcon,
  activity: Ticket,
} as const;

export function SearchDialog({
  open,
  onOpenChange,
  nav,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nav: NavData;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [hits, setHits] = React.useState<SearchHit[]>([]);
  const [loading, setLoading] = React.useState(false);

  const trending = [...nav.international.destinations, ...nav.domestic.destinations].slice(0, 6);

  React.useEffect(() => {
    // Resets the dialog's local state whenever it closes.
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
      setHits([]);
    }
  }, [open]);

  React.useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Search failed");
        const data = (await res.json()) as { hits: SearchHit[] };
        setHits(data.hits);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setHits([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = query.trim();
    if (!term) return;
    onOpenChange(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Search"
        description="Find a destination, a holiday package or an experience."
        size="lg"
      >
        <form onSubmit={submit}>
          <Input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try “Bali honeymoon”, “Ladakh”, “scuba diving”…"
            leadingIcon={<Search />}
            aria-label="Search destinations, packages and activities"
          />
        </form>

        <div className="mt-5 min-h-[12rem]">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Searching…
            </div>
          ) : query.trim().length >= 2 ? (
            hits.length ? (
              <ul className="space-y-1" role="listbox" aria-label="Search results">
                {hits.map((hit) => {
                  const Icon = ICONS[hit.kind];
                  return (
                    <li key={`${hit.kind}-${hit.href}`}>
                      <Link
                        href={hit.href}
                        onClick={() => onOpenChange(false)}
                        className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-sand-50"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sand-100 text-lagoon-700">
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-midnight-900">
                            {hit.title}
                          </span>
                          <span className="block truncate text-xs text-muted">{hit.subtitle}</span>
                        </span>
                        {hit.priceINR ? (
                          <span className="shrink-0 text-xs font-semibold text-midnight-700">
                            from {formatPrice(hit.priceINR, "INR", { compact: true })}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
                <li className="pt-2">
                  <button
                    type="button"
                    onClick={submit}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-sand-50 py-3 text-sm font-semibold text-lagoon-700 hover:bg-sand-100"
                  >
                    See all results for “{query.trim()}”
                    <ArrowRight className="size-4" aria-hidden />
                  </button>
                </li>
              </ul>
            ) : (
              <p className="py-12 text-center text-sm text-muted">
                Nothing matched “{query.trim()}”. Try a country, a city or a travel style.
              </p>
            )
          ) : (
            <div>
              <p className="text-eyebrow mb-3 text-lagoon-700">Popular right now</p>
              <div className="flex flex-wrap gap-2">
                {trending.length === 0 ? (
                  <p className="text-sm text-muted">Start typing to search the catalogue.</p>
                ) : (
                  trending.map((d) => (
                    <Link
                      key={d.slug}
                      href={`/destinations/${d.slug}`}
                      onClick={() => onOpenChange(false)}
                      className="rounded-full border border-hairline px-3.5 py-2 text-sm font-medium text-midnight-800 transition-colors hover:border-lagoon-300 hover:bg-lagoon-50"
                    >
                      {d.name}
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
