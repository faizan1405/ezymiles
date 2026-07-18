import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Plus } from "lucide-react";

import { requireAdmin } from "@/lib/session";
import { tryConnectDB } from "@/lib/db";
import { Activity } from "@/models";
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
import { ACTIVITY_CATEGORIES } from "@/config/site";
import { formatMinutes, formatPrice, serialise } from "@/lib/utils";
import type { QueryFilter } from "mongoose";
import type { IActivity } from "@/models";

export const metadata: Metadata = { title: "Activities", robots: { index: false } };

export default async function AdminActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("activities:manage");
  const sp = await searchParams;

  if (!(await tryConnectDB())) {
    return (
      <div>
        <AdminPageHeader title="Activities" />
        <p className="rounded-2xl border border-hairline bg-white p-8 text-center text-sm text-muted">
          The database is unreachable.
        </p>
      </div>
    );
  }

  const query: QueryFilter<IActivity> = { deletedAt: null };

  const status = typeof sp.status === "string" ? sp.status : undefined;
  if (status) query.status = status as IActivity["status"];

  const category = typeof sp.category === "string" ? sp.category : undefined;
  if (category) query.category = category;

  const q = typeof sp.q === "string" && sp.q ? sp.q : undefined;
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ title: rx }, { city: rx }, { slug: rx }];
  }

  const rows = await Activity.find(query).sort({ city: 1, title: 1 }).limit(500).lean();
  const activities = serialise(rows) as unknown as IActivity[];

  return (
    <div>
      <AdminPageHeader
        title="Activities"
        description="Slots, capacity and add-ons. Capacity is decremented only once a payment clears."
        action={
          <Button asChild variant="accent">
            <Link href="/admin/activities/new">
              <Plus aria-hidden />
              Add activity
            </Link>
          </Button>
        }
      />

      <FilterBar
        searchPlaceholder="Search title or city…"
        tabs={[
          { key: "", label: "All" },
          { key: "published", label: "Published" },
          { key: "draft", label: "Draft" },
          { key: "archived", label: "Archived" },
        ]}
        filters={[
          {
            key: "category",
            label: "All categories",
            options: ACTIVITY_CATEGORIES.map((c) => ({ value: c.slug, label: c.label })),
          },
        ]}
      />

      <Table caption="Activities">
        <thead>
          <tr className="border-b border-hairline bg-sand-50">
            <Th>Experience</Th>
            <Th>City</Th>
            <Th>Duration</Th>
            <Th>Slots</Th>
            <Th className="text-right">Price</Th>
            <Th>Status</Th>
            <Th />
          </tr>
        </thead>

        <tbody className="divide-y divide-hairline">
          {activities.length === 0 ? (
            <TableEmpty colSpan={7} message="No activities yet. Run the seed script to load demo content." />
          ) : (
            activities.map((a) => (
              <tr key={String(a._id)} className="transition-colors hover:bg-sand-50">
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg">
                      <SmartImage
                        src={a.heroImage?.url}
                        alt={a.heroImage?.alt || a.title}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="block max-w-56 truncate text-sm font-semibold text-midnight-900">
                        {a.title}
                      </span>
                      <span className="mt-0.5 block text-[0.6875rem] capitalize text-muted">
                        {a.category.replace(/-/g, " ")}
                        {a.isDemoData ? " · demo" : ""}
                      </span>
                    </div>
                  </div>
                </Td>

                <Td className="text-xs">{a.city}</Td>

                <Td className="whitespace-nowrap text-xs">{formatMinutes(a.durationMinutes)}</Td>

                <Td className="text-xs">
                  {a.slots?.length ? (
                    <span>
                      {a.slots.length} slots
                      <span className="block text-muted">
                        {a.slots.reduce((sum, s) => sum + (s.capacity - s.booked), 0)} places free
                      </span>
                    </span>
                  ) : (
                    "—"
                  )}
                </Td>

                <Td className="whitespace-nowrap text-right text-sm font-semibold">
                  {formatPrice(a.pricePerAdultINR, "INR", { compact: true })}
                </Td>

                <Td>
                  <StatusPill status={a.status} tone={STATUS_TONE[a.status] ?? "neutral"} />
                </Td>

                <Td>
                  <div className="flex items-center gap-1">
                    <a
                      href={`/activities/${a.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Preview ${a.title}`}
                      className="flex size-8 items-center justify-center rounded-lg text-midnight-400 hover:bg-sand-100 hover:text-midnight-900"
                    >
                      <Eye className="size-4" aria-hidden />
                    </a>

                    <EntityActions
                      kind="activity"
                      id={String(a._id)}
                      label={a.title}
                      status={a.status}
                      editHref={`/admin/activities/${String(a._id)}`}
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
