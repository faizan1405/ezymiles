import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Eye } from "lucide-react";

import { requireAdmin } from "@/lib/session";
import { tryConnectDB } from "@/lib/db";
import { Destination, Package } from "@/models";
import {
  AdminPageHeader,
  StatusPill,
  Table,
  TableEmpty,
  Td,
  Th,
  STATUS_TONE,
} from "@/components/admin/ui";
import { FilterBar } from "@/components/admin/filter-bar";
import { EntityActions } from "@/components/admin/entity-actions";
import { SmartImage } from "@/components/ui/smart-image";
import { Button } from "@/components/ui/button";
import { formatPrice, serialise } from "@/lib/utils";
import type { QueryFilter } from "mongoose";
import type { IDestination } from "@/models";

export const metadata: Metadata = { title: "Destinations", robots: { index: false } };

export default async function AdminDestinationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("destinations:manage");
  const sp = await searchParams;

  if (!(await tryConnectDB())) {
    return (
      <div>
        <AdminPageHeader title="Destinations" />
        <p className="rounded-2xl border border-hairline bg-white p-8 text-center text-sm text-muted">
          The database is unreachable.
        </p>
      </div>
    );
  }

  const query: QueryFilter<IDestination> = { deletedAt: null };

  const scope = typeof sp.scope === "string" ? sp.scope : undefined;
  if (scope) query.scope = scope as IDestination["scope"];

  const status = typeof sp.status === "string" ? sp.status : undefined;
  if (status) query.status = status as IDestination["status"];

  const q = typeof sp.q === "string" && sp.q ? sp.q : undefined;
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: rx }, { country: rx }, { slug: rx }];
  }

  const rows = await Destination.find(query).sort({ displayOrder: 1, name: 1 }).lean();
  const destinations = serialise(rows) as unknown as IDestination[];

  // One grouped count rather than a query per row.
  const counts = await Package.aggregate([
    { $match: { deletedAt: null } },
    { $group: { _id: "$destination", count: { $sum: 1 } } },
  ]);

  const packageCounts = new Map(
    (counts as { _id: string; count: number }[]).map((c) => [String(c._id), c.count]),
  );

  return (
    <div>
      <AdminPageHeader
        title="Destinations"
        description="Every package hangs off a destination. Coordinates place the marker on the homepage atlas."
        action={
          <Button asChild variant="accent">
            <Link href="/admin/destinations/new">
              <Plus aria-hidden />
              New destination
            </Link>
          </Button>
        }
      />

      <FilterBar
        searchPlaceholder="Search name or country…"
        tabs={[
          { key: "", label: "All" },
          { key: "published", label: "Published" },
          { key: "draft", label: "Draft" },
          { key: "archived", label: "Archived" },
        ]}
        filters={[
          {
            key: "scope",
            label: "All regions",
            options: [
              { value: "domestic", label: "India" },
              { value: "international", label: "International" },
            ],
          },
        ]}
      />

      <Table caption="Destinations">
        <thead>
          <tr className="border-b border-hairline bg-sand-50">
            <Th>Destination</Th>
            <Th>Country</Th>
            <Th className="text-right">Packages</Th>
            <Th className="text-right">From</Th>
            <Th>Status</Th>
            <Th />
          </tr>
        </thead>

        <tbody className="divide-y divide-hairline">
          {destinations.length === 0 ? (
            <TableEmpty colSpan={6} message="No destinations yet. Create your first one." />
          ) : (
            destinations.map((d) => {
              const count = packageCounts.get(String(d._id)) ?? 0;

              return (
                <tr key={String(d._id)} className="transition-colors hover:bg-sand-50">
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg">
                        <SmartImage
                          src={d.heroImage?.url}
                          alt={d.heroImage?.alt || d.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <Link
                          href={`/admin/destinations/${String(d._id)}`}
                          className="block truncate text-sm font-semibold text-midnight-900 hover:text-lagoon-700"
                        >
                          {d.name}
                        </Link>
                        <span className="mt-0.5 flex gap-1.5">
                          {d.isFeatured ? (
                            <span className="rounded bg-sand-100 px-1.5 py-0.5 text-[0.5625rem] font-bold uppercase text-midnight-600">
                              Featured
                            </span>
                          ) : null}
                          {d.isTrending ? (
                            <span className="rounded bg-sand-100 px-1.5 py-0.5 text-[0.5625rem] font-bold uppercase text-midnight-600">
                              Trending
                            </span>
                          ) : null}
                          {d.packageFeatured ? (
                            <span className="rounded bg-sand-100 px-1.5 py-0.5 text-[0.5625rem] font-bold uppercase text-midnight-600">
                              Intl. rail
                            </span>
                          ) : null}
                          {d.hotelFeatured ? (
                            <span className="rounded bg-sand-100 px-1.5 py-0.5 text-[0.5625rem] font-bold uppercase text-midnight-600">
                              Hotel rail
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </div>
                  </Td>

                  <Td className="text-xs">
                    {d.country}
                    <span className="block text-muted">
                      {d.scope === "domestic" ? "India" : "International"}
                    </span>
                  </Td>

                  <Td className="text-right">
                    <span
                      className={`text-sm font-semibold ${count === 0 ? "text-amber-700" : "text-midnight-900"}`}
                    >
                      {count}
                    </span>
                  </Td>

                  <Td className="whitespace-nowrap text-right text-sm">
                    {d.startingPriceINR > 0
                      ? formatPrice(d.startingPriceINR, "INR", { compact: true })
                      : "—"}
                  </Td>

                  <Td>
                    <StatusPill status={d.status} tone={STATUS_TONE[d.status] ?? "neutral"} />
                  </Td>

                  <Td>
                    <div className="flex items-center gap-1">
                      <a
                        href={`/destinations/${d.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Preview ${d.name}`}
                        className="flex size-8 items-center justify-center rounded-lg text-midnight-400 hover:bg-sand-100 hover:text-midnight-900"
                      >
                        <Eye className="size-4" aria-hidden />
                      </a>

                      <EntityActions
                        kind="destination"
                        id={String(d._id)}
                        label={d.name}
                        status={d.status}
                        editHref={`/admin/destinations/${String(d._id)}`}
                      />
                    </div>
                  </Td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>
    </div>
  );
}
