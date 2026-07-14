import type { Metadata } from "next";
import { requireAnyPermission } from "@/lib/session";
import { tryConnectDB } from "@/lib/db";
import { SupportTicket } from "@/models";
import { TICKET_STATUSES } from "@/models/types";
import { AdminPageHeader } from "@/components/admin/ui";
import { FilterBar } from "@/components/admin/filter-bar";
import { TicketQueue } from "@/components/admin/ticket-queue";
import { serialise, titleCase } from "@/lib/utils";
import type { QueryFilter } from "mongoose";
import type { ISupportTicket } from "@/models";

export const metadata: Metadata = { title: "Support", robots: { index: false } };

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAnyPermission(["tickets:view", "tickets:manage"]);
  const canManage = user.permissions?.includes("tickets:manage") ?? false;

  const sp = await searchParams;

  if (!(await tryConnectDB())) {
    return (
      <div>
        <AdminPageHeader title="Support" />
        <p className="rounded-2xl border border-hairline bg-white p-8 text-center text-sm text-muted">
          The database is unreachable.
        </p>
      </div>
    );
  }

  const query: QueryFilter<ISupportTicket> = {};

  const status = typeof sp.status === "string" ? sp.status : undefined;
  if (status) query.status = status as ISupportTicket["status"];

  const q = typeof sp.q === "string" && sp.q ? sp.q : undefined;
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ reference: rx }, { subject: rx }, { name: rx }, { email: rx }];
  }

  const [rows, counts] = await Promise.all([
    SupportTicket.find(query).sort({ priority: -1, createdAt: -1 }).limit(60).lean(),
    SupportTicket.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  const byStatus = Object.fromEntries(
    (counts as { _id: string; count: number }[]).map((c) => [c._id, c.count]),
  );

  const tickets = serialise(rows) as unknown as ISupportTicket[];

  return (
    <div>
      <AdminPageHeader
        title="Support"
        description="Replying emails the customer and moves the ticket forward automatically."
      />

      <FilterBar
        searchPlaceholder="Search reference, subject or customer…"
        tabs={[
          { key: "", label: "All" },
          ...TICKET_STATUSES.map((s) => ({
            key: s,
            label: titleCase(s.replace(/_/g, " ")),
            count: byStatus[s] ?? 0,
          })),
        ]}
      />

      <TicketQueue
        canManage={canManage}
        tickets={tickets.map((t) => ({
          id: String(t._id),
          reference: t.reference,
          name: t.name,
          email: t.email,
          subject: t.subject,
          category: t.category,
          priority: t.priority,
          status: t.status,
          messages: t.messages.map((m) => ({
            author: m.author,
            authorName: m.authorName,
            body: m.body,
            at: String(m.at),
          })),
          createdAt: String(t.createdAt),
        }))}
      />
    </div>
  );
}
