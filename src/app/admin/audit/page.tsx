import type { Metadata } from "next";
import { ScrollText } from "lucide-react";

import { requireAdmin } from "@/lib/session";
import { tryConnectDB } from "@/lib/db";
import { AuditLog } from "@/models";
import { AdminPageHeader, Table, TableEmpty, Td, Th } from "@/components/admin/ui";
import { FilterBar } from "@/components/admin/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { buildQueryString, formatDateTime, serialise } from "@/lib/utils";
import type { QueryFilter } from "mongoose";
import type { IAuditLog } from "@/models";

export const metadata: Metadata = { title: "Audit log", robots: { index: false } };

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("audit:view");
  const sp = await searchParams;

  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1) || 1);
  const pageSize = 40;

  if (!(await tryConnectDB())) {
    return (
      <div>
        <AdminPageHeader title="Audit log" />
        <p className="rounded-2xl border border-hairline bg-white p-8 text-center text-sm text-muted">
          The database is unreachable.
        </p>
      </div>
    );
  }

  const query: QueryFilter<IAuditLog> = {};

  const moduleFilter = typeof sp.module === "string" ? sp.module : undefined;
  if (moduleFilter) query.module = moduleFilter;

  const q = typeof sp.q === "string" && sp.q ? sp.q : undefined;
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ action: rx }, { "actor.name": rx }, { "actor.email": rx }, { targetLabel: rx }];
  }

  const [rows, total, modules] = await Promise.all([
    AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    AuditLog.countDocuments(query),
    AuditLog.distinct("module"),
  ]);

  const logs = serialise(rows) as unknown as IAuditLog[];

  const buildHref = (next: number) => {
    const params: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(sp)) {
      if (key !== "page" && typeof value === "string") params[key] = value;
    }
    return `/admin/audit${buildQueryString({ ...params, page: next })}`;
  };

  return (
    <div>
      <AdminPageHeader
        title="Audit log"
        description="Who changed what, when, and from where. Written for every mutation in the admin panel."
      />

      <FilterBar
        searchPlaceholder="Search action, staff member or target…"
        filters={[
          {
            key: "module",
            label: "All modules",
            options: (modules as string[]).map((m) => ({ value: m, label: m })),
          },
        ]}
      />

      <Table caption="Audit log">
        <thead>
          <tr className="border-b border-hairline bg-sand-50">
            <Th>When</Th>
            <Th>Who</Th>
            <Th>Action</Th>
            <Th>Target</Th>
            <Th>Details</Th>
            <Th>IP</Th>
          </tr>
        </thead>

        <tbody className="divide-y divide-hairline">
          {logs.length === 0 ? (
            <TableEmpty
              colSpan={6}
              message="Nothing logged yet. Every admin change from here on will appear."
            />
          ) : (
            logs.map((log) => (
              <tr key={String(log._id)} className="transition-colors hover:bg-sand-50">
                <Td className="whitespace-nowrap text-xs">{formatDateTime(log.createdAt)}</Td>

                <Td>
                  <span className="block text-xs font-semibold text-midnight-900">
                    {log.actor?.name}
                  </span>
                  <span className="block truncate text-[0.6875rem] text-muted">
                    {log.actor?.role?.replace(/_/g, " ")}
                  </span>
                </Td>

                <Td>
                  <span className="flex items-center gap-1.5 font-mono text-xs text-midnight-800">
                    <ScrollText className="size-3.5 text-lagoon-600" aria-hidden />
                    {log.action}
                  </span>
                </Td>

                <Td className="max-w-48 truncate text-xs">{log.targetLabel ?? log.targetId ?? "—"}</Td>

                <Td className="max-w-56">
                  {log.changes ? (
                    <code className="block truncate font-mono text-[0.625rem] text-muted">
                      {JSON.stringify(log.changes)}
                    </code>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </Td>

                <Td className="font-mono text-[0.625rem] text-muted">{log.ip ?? "—"}</Td>
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
