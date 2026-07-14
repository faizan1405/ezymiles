import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Eye } from "lucide-react";

import { requireAnyPermission } from "@/lib/session";
import { tryConnectDB } from "@/lib/db";
import { Destination, Package } from "@/models";
import { PUBLISH_STATUSES } from "@/models/types";
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
import { Pagination } from "@/components/ui/pagination";
import { buildQueryString, formatDuration, formatPrice, serialise, titleCase } from "@/lib/utils";
import type { QueryFilter } from "mongoose";
import type { IPackage } from "@/models";

export const metadata: Metadata = { title: "Packages", robots: { index: false } };

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminPackagesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireAnyPermission(["packages:view", "packages:manage"]);
  const canManage = user.permissions?.includes("packages:manage") ?? false;

  const sp = await searchParams;
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1) || 1);
  const pageSize = 20;

  if (!(await tryConnectDB())) {
    return (
      <div>
        <AdminPageHeader title="Packages" />
        <p className="rounded-2xl border border-hairline bg-white p-8 text-center text-sm text-muted">
          The database is unreachable.
        </p>
      </div>
    );
  }

  const query: QueryFilter<IPackage> = { deletedAt: null };

  const status = typeof sp.status === "string" ? sp.status : undefined;
  if (status) query.status = status as IPackage["status"];

  const scope = typeof sp.scope === "string" ? sp.scope : undefined;
  if (scope) query.scope = scope as IPackage["scope"];

  const q = typeof sp.q === "string" && sp.q ? sp.q : undefined;
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ title: rx }, { slug: rx }, { citiesCovered: rx }];
  }

  const [rows, total, counts, destinations] = await Promise.all([
    Package.find(query)
      .populate("destination", "name")
      .sort({ updatedAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Package.countDocuments(query),
    Package.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Destination.countDocuments({ deletedAt: null }),
  ]);

  const packages = serialise(rows) as unknown as (IPackage & { destination?: { name: string } })[];

  const byStatus = Object.fromEntries(
    (counts as { _id: string; count: number }[]).map((c) => [c._id, c.count]),
  );

  const buildHref = (next: number) => {
    const params: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(sp)) {
      if (key !== "page" && typeof value === "string") params[key] = value;
    }
    return `/admin/packages${buildQueryString({ ...params, page: next })}`;
  };

  return (
    <div>
      <AdminPageHeader
        title="Packages"
        description="Create, duplicate, price and publish. Archived packages keep resolving for old bookings."
        action={
          canManage ? (
            <Button asChild variant="accent" disabled={destinations === 0}>
              <Link href="/admin/packages/new">
                <Plus aria-hidden />
                New package
              </Link>
            </Button>
          ) : null
        }
      />

      {destinations === 0 ? (
        <p className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Add at least one destination before creating a package — every package hangs off one.{" "}
          <Link href="/admin/destinations/new" className="font-semibold underline">
            Create a destination
          </Link>
        </p>
      ) : null}

      <FilterBar
        searchPlaceholder="Search title, slug or city…"
        tabs={[
          { key: "", label: "All" },
          ...PUBLISH_STATUSES.map((s) => ({
            key: s,
            label: titleCase(s),
            count: byStatus[s] ?? 0,
          })),
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

      <Table caption="Packages">
        <thead>
          <tr className="border-b border-hairline bg-sand-50">
            <Th>Package</Th>
            <Th>Destination</Th>
            <Th>Duration</Th>
            <Th className="text-right">From</Th>
            <Th className="text-right">Views</Th>
            <Th>Status</Th>
            <Th />
          </tr>
        </thead>

        <tbody className="divide-y divide-hairline">
          {packages.length === 0 ? (
            <TableEmpty
              colSpan={7}
              message={q || status ? "No packages match those filters." : "No packages yet. Create your first one."}
            />
          ) : (
            packages.map((p) => (
              <tr key={String(p._id)} className="transition-colors hover:bg-sand-50">
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg">
                      <SmartImage
                        src={p.heroImage?.url}
                        alt={p.heroImage?.alt || p.title}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <Link
                        href={`/admin/packages/${String(p._id)}`}
                        className="block max-w-64 truncate text-sm font-semibold text-midnight-900 hover:text-lagoon-700"
                      >
                        {p.title}
                      </Link>
                      <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        {p.isFeatured ? <Tag>Featured</Tag> : null}
                        {p.isTrending ? <Tag>Trending</Tag> : null}
                        {p.isBestseller ? <Tag>Bestseller</Tag> : null}
                        {p.isDemoData ? <Tag tone="amber">Demo</Tag> : null}
                      </span>
                    </div>
                  </div>
                </Td>

                <Td className="text-xs">{p.destination?.name ?? "—"}</Td>

                <Td className="whitespace-nowrap text-xs">
                  {formatDuration(p.durationDays, p.durationNights)}
                </Td>

                <Td className="whitespace-nowrap text-right text-sm font-semibold">
                  {formatPrice(p.startingPriceINR, "INR", { compact: true })}
                </Td>

                <Td className="text-right text-xs text-muted">{p.viewCount ?? 0}</Td>

                <Td>
                  <StatusPill status={p.status} tone={STATUS_TONE[p.status] ?? "neutral"} />
                </Td>

                <Td>
                  <div className="flex items-center gap-1">
                    <a
                      href={`/packages/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Preview ${p.title}`}
                      className="flex size-8 items-center justify-center rounded-lg text-midnight-400 hover:bg-sand-100 hover:text-midnight-900"
                    >
                      <Eye className="size-4" aria-hidden />
                    </a>

                    {canManage ? (
                      <EntityActions
                        kind="package"
                        id={String(p._id)}
                        label={p.title}
                        status={p.status}
                        editHref={`/admin/packages/${String(p._id)}`}
                        canDuplicate
                      />
                    ) : null}
                  </div>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      <Pagination
        page={page}
        totalPages={Math.ceil(total / pageSize)}
        buildHref={buildHref}
        className="mt-8"
      />
    </div>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone?: "amber" }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wide ${
        tone === "amber" ? "bg-amber-50 text-amber-800" : "bg-sand-100 text-midnight-600"
      }`}
    >
      {children}
    </span>
  );
}
