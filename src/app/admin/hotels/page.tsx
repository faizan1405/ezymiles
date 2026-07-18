import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Star, Plus } from "lucide-react";

import { requireAdmin } from "@/lib/session";
import { tryConnectDB } from "@/lib/db";
import { Hotel } from "@/models";
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
import { formatPrice, pluralise, serialise } from "@/lib/utils";
import type { QueryFilter } from "mongoose";
import type { IHotel } from "@/models";

export const metadata: Metadata = { title: "Hotels", robots: { index: false } };

export default async function AdminHotelsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("hotels:manage");
  const sp = await searchParams;

  if (!(await tryConnectDB())) {
    return (
      <div>
        <AdminPageHeader title="Hotels" />
        <p className="rounded-2xl border border-hairline bg-white p-8 text-center text-sm text-muted">
          The database is unreachable.
        </p>
      </div>
    );
  }

  const query: QueryFilter<IHotel> = { deletedAt: null };

  const status = typeof sp.status === "string" ? sp.status : undefined;
  if (status) query.status = status as IHotel["status"];

  const q = typeof sp.q === "string" && sp.q ? sp.q : undefined;
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: rx }, { city: rx }, { slug: rx }];
  }

  // Safety cap well above realistic catalog size — bounds the query without
  // hiding real inventory. Add pagination here if the catalog ever approaches it.
  const rows = await Hotel.find(query).sort({ city: 1, name: 1 }).limit(500).lean();
  const hotels = serialise(rows) as unknown as IHotel[];

  return (
    <div>
      <AdminPageHeader
        title="Hotels"
        description="Room rates and availability come from these records. Every rate is re-checked on the server at booking."
        action={
          <Button asChild variant="accent">
            <Link href="/admin/hotels/new">
              <Plus aria-hidden />
              Add hotel
            </Link>
          </Button>
        }
      />

      <FilterBar
        searchPlaceholder="Search name or city…"
        tabs={[
          { key: "", label: "All" },
          { key: "published", label: "Published" },
          { key: "draft", label: "Draft" },
          { key: "archived", label: "Archived" },
        ]}
      />

      <Table caption="Hotels">
        <thead>
          <tr className="border-b border-hairline bg-sand-50">
            <Th>Property</Th>
            <Th>City</Th>
            <Th>Rooms</Th>
            <Th className="text-right">From / night</Th>
            <Th>Status</Th>
            <Th />
          </tr>
        </thead>

        <tbody className="divide-y divide-hairline">
          {hotels.length === 0 ? (
            <TableEmpty
              colSpan={6}
              message="No hotels yet. Run the seed script or add properties through the API."
            />
          ) : (
            hotels.map((h) => (
              <tr key={String(h._id)} className="transition-colors hover:bg-sand-50">
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg">
                      <SmartImage
                        src={h.heroImage?.url}
                        alt={h.heroImage?.alt || h.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="block max-w-56 truncate text-sm font-semibold text-midnight-900">
                        {h.name}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 text-[0.6875rem] text-muted">
                        {Array.from({ length: h.starCategory }).map((_, i) => (
                          <Star key={i} className="size-2.5 fill-gild-400 text-gild-400" aria-hidden />
                        ))}
                        <span className="ml-1 capitalize">{h.propertyType}</span>
                        {h.isDemoData ? (
                          <span className="ml-1 rounded bg-amber-50 px-1.5 py-0.5 text-[0.5625rem] font-bold uppercase text-amber-800">
                            Demo
                          </span>
                        ) : null}
                      </span>
                    </div>
                  </div>
                </Td>

                <Td className="text-xs">
                  {h.city}
                  <span className="block text-muted">{h.country}</span>
                </Td>

                <Td className="text-xs">{pluralise(h.rooms?.length ?? 0, "room type")}</Td>

                <Td className="whitespace-nowrap text-right text-sm font-semibold">
                  {formatPrice(h.startingPriceINR, "INR", { compact: true })}
                </Td>

                <Td>
                  <StatusPill status={h.status} tone={STATUS_TONE[h.status] ?? "neutral"} />
                </Td>

                <Td>
                  <div className="flex items-center gap-1">
                    <a
                      href={`/hotels/${h.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Preview ${h.name}`}
                      className="flex size-8 items-center justify-center rounded-lg text-midnight-400 hover:bg-sand-100 hover:text-midnight-900"
                    >
                      <Eye className="size-4" aria-hidden />
                    </a>

                    <EntityActions
                      kind="hotel"
                      id={String(h._id)}
                      label={h.name}
                      status={h.status}
                      editHref={`/admin/hotels/${String(h._id)}`}
                    />
                  </div>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
}
