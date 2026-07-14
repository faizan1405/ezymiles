import type { Metadata } from "next";
import Link from "next/link";
import { Flame, ArrowRight } from "lucide-react";

import { requireAnyPermission } from "@/lib/session";
import { tryConnectDB } from "@/lib/db";
import { AdminUser, Lead } from "@/models";
import { LEAD_STATUSES, ENQUIRY_TYPES } from "@/models/types";
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
import { Pagination } from "@/components/ui/pagination";
import { buildQueryString, formatDate, formatPrice, serialise, titleCase } from "@/lib/utils";
import type { QueryFilter } from "mongoose";
import type { ILead } from "@/models";

export const metadata: Metadata = { title: "Leads", robots: { index: false } };

type SearchParams = Record<string, string | string[] | undefined>;

function one(sp: SearchParams, key: string) {
  const v = sp[key];
  return typeof v === "string" && v ? v : undefined;
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAnyPermission(["leads:view", "leads:manage"]);
  const sp = await searchParams;

  const page = Math.max(1, Number(one(sp, "page") ?? 1) || 1);
  const pageSize = 20;

  if (!(await tryConnectDB())) {
    return (
      <div>
        <AdminPageHeader title="Leads" />
        <p className="rounded-2xl border border-hairline bg-white p-8 text-center text-sm text-muted">
          The database is unreachable. Check MONGODB_URI and refresh.
        </p>
      </div>
    );
  }

  const query: QueryFilter<ILead> = { deletedAt: null };

  const status = one(sp, "status");
  if (status) query.status = status as ILead["status"];

  const type = one(sp, "type");
  if (type) query.type = type as ILead["type"];

  const assigned = one(sp, "assigned");
  if (assigned) query.assignedTo = assigned as never;

  if (one(sp, "due")) {
    query.followUpDate = { $lte: new Date() };
    query.status = { $nin: ["won", "lost", "junk"] } as never;
  }

  const q = one(sp, "q");
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: rx }, { email: rx }, { phone: rx }, { reference: rx }, { destination: rx }];
  }

  const [rows, total, staff, statusCounts] = await Promise.all([
    Lead.find(query)
      .populate("assignedTo", "name")
      .sort({ score: -1, createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Lead.countDocuments(query),
    AdminUser.find({ isActive: true, deletedAt: null }).select("name").lean(),
    Lead.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const counts = Object.fromEntries(
    (statusCounts as { _id: string; count: number }[]).map((s) => [s._id, s.count]),
  );
  const totalAll = Object.values(counts).reduce<number>((a, b) => a + b, 0);

  const leads = serialise(rows) as unknown as (ILead & { assignedTo?: { name: string } })[];

  const buildHref = (next: number) => {
    const params: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(sp)) {
      if (key !== "page" && typeof value === "string") params[key] = value;
    }
    return `/admin/leads${buildQueryString({ ...params, page: next })}`;
  };

  return (
    <div>
      <AdminPageHeader
        title="Leads"
        description="Every enquiry becomes a lead. Hot leads float to the top by score."
      />

      <FilterBar
        searchPlaceholder="Search name, email, phone or reference…"
        tabs={[
          { key: "", label: "All", count: totalAll },
          ...LEAD_STATUSES.map((s) => ({
            key: s,
            label: titleCase(s.replace(/_/g, " ")),
            count: counts[s] ?? 0,
          })),
        ]}
        filters={[
          {
            key: "type",
            label: "All types",
            options: ENQUIRY_TYPES.map((t) => ({
              value: t,
              label: titleCase(t.replace(/_/g, " ")),
            })),
          },
          {
            key: "assigned",
            label: "Anyone",
            options: staff.map((s) => ({ value: String(s._id), label: s.name })),
          },
        ]}
      />

      <Table caption="Leads">
        <thead>
          <tr className="border-b border-hairline bg-sand-50">
            <Th>Lead</Th>
            <Th>Type</Th>
            <Th>Destination</Th>
            <Th>Value</Th>
            <Th>Status</Th>
            <Th>Assigned</Th>
            <Th>Follow-up</Th>
            <Th />
          </tr>
        </thead>

        <tbody className="divide-y divide-hairline">
          {leads.length === 0 ? (
            <TableEmpty colSpan={8} message="No leads match those filters." />
          ) : (
            leads.map((lead) => {
              const overdue =
                lead.followUpDate &&
                new Date(lead.followUpDate) <= new Date() &&
                !["won", "lost", "junk"].includes(lead.status);

              return (
                <tr key={String(lead._id)} className="transition-colors hover:bg-sand-50">
                  <Td>
                    <Link href={`/admin/leads/${String(lead._id)}`} className="group block">
                      <span className="flex items-center gap-1.5">
                        {lead.score >= 60 ? (
                          <Flame className="size-3.5 shrink-0 text-sunset-500" aria-label="Hot lead" />
                        ) : null}
                        <span className="font-semibold text-midnight-900 group-hover:text-lagoon-700">
                          {lead.name}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {lead.email} · {lead.phone}
                      </span>
                      <span className="block text-[0.6875rem] text-muted">{lead.reference}</span>
                    </Link>
                  </Td>

                  <Td className="text-xs capitalize">{lead.type.replace(/_/g, " ")}</Td>
                  <Td className="text-xs">{lead.destination ?? "—"}</Td>
                  <Td className="text-xs font-semibold">
                    {lead.estimatedValueINR > 0
                      ? formatPrice(lead.estimatedValueINR, "INR", { compact: true })
                      : "—"}
                  </Td>

                  <Td>
                    <StatusPill status={lead.status} tone={STATUS_TONE[lead.status] ?? "neutral"} />
                  </Td>

                  <Td className="text-xs">{lead.assignedTo?.name ?? "Unassigned"}</Td>

                  <Td className={`text-xs ${overdue ? "font-semibold text-sunset-700" : ""}`}>
                    {lead.followUpDate ? formatDate(lead.followUpDate) : "—"}
                  </Td>

                  <Td>
                    <Link
                      href={`/admin/leads/${String(lead._id)}`}
                      className="flex size-8 items-center justify-center rounded-lg text-midnight-400 hover:bg-sand-100 hover:text-midnight-900"
                      aria-label={`Open ${lead.name}`}
                    >
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </Td>
                </tr>
              );
            })
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
