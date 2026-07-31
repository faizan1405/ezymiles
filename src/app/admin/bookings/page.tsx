import type { Metadata } from "next";
import { requireAnyPermission } from "@/lib/session";
import { tryConnectDB } from "@/lib/db";
import { Booking } from "@/models";
import { BOOKING_STATUSES, BOOKING_TYPES } from "@/models/types";
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
import { BookingActions } from "@/components/admin/booking-actions";
import { Pagination } from "@/components/ui/pagination";
import { buildQueryString, formatDate, formatPrice, serialise, titleCase } from "@/lib/utils";
import type { QueryFilter } from "mongoose";
import type { IBooking } from "@/models";

export const metadata: Metadata = { title: "Bookings", robots: { index: false } };

type SearchParams = Record<string, string | string[] | undefined>;

function one(sp: SearchParams, key: string) {
  const v = sp[key];
  return typeof v === "string" && v ? v : undefined;
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireAnyPermission(["bookings:view", "bookings:manage"]);
  const sp = await searchParams;

  const canManage = user.permissions?.includes("bookings:manage") ?? false;
  const canRefund = user.permissions?.includes("refunds:manage") ?? false;

  const page = Math.max(1, Number(one(sp, "page") ?? 1) || 1);
  const pageSize = 20;

  if (!(await tryConnectDB())) {
    return (
      <div>
        <AdminPageHeader title="Bookings" />
        <p className="rounded-2xl border border-hairline bg-white p-8 text-center text-sm text-muted">
          The database is unreachable.
        </p>
      </div>
    );
  }

  const query: QueryFilter<IBooking> = { deletedAt: null };

  const status = one(sp, "status");
  if (status) query.status = status as IBooking["status"];

  const type = one(sp, "type");
  if (type) query.type = type as IBooking["type"];

  const q = one(sp, "q");
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [
      { reference: rx },
      { guestName: rx },
      { guestEmail: rx },
      { guestPhone: rx },
      { "item.title": rx },
    ];
  }

  const [rows, total, counts] = await Promise.all([
    Booking.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Booking.countDocuments(query),
    Booking.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const byStatus = Object.fromEntries(
    (counts as { _id: string; count: number }[]).map((c) => [c._id, c.count]),
  );
  const totalAll = Object.values(byStatus).reduce<number>((a, b) => a + b, 0);

  const bookings = serialise(rows) as unknown as IBooking[];

  const buildHref = (next: number) => {
    const params: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(sp)) {
      if (key !== "page" && typeof value === "string") params[key] = value;
    }
    return `/admin/bookings${buildQueryString({ ...params, page: next })}`;
  };

  return (
    <div>
      <AdminPageHeader
        title="Bookings"
        description="Confirm, complete, cancel and refund. Every change is written to the audit log."
      />

      <FilterBar
        searchPlaceholder="Search reference, name, email or trip…"
        tabs={[
          { key: "", label: "All", count: totalAll },
          ...BOOKING_STATUSES.map((s) => ({
            key: s,
            label: titleCase(s.replace(/_/g, " ")),
            count: byStatus[s] ?? 0,
          })),
        ]}
        filters={[
          {
            key: "type",
            label: "All services",
            options: BOOKING_TYPES.map((t) => ({ value: t, label: titleCase(t) })),
          },
        ]}
      />

      <Table caption="Bookings">
        <thead>
          <tr className="border-b border-hairline bg-sand-50">
            <Th>Reference</Th>
            <Th>Customer</Th>
            <Th>Item</Th>
            <Th>Travel</Th>
            <Th className="text-right">Total</Th>
            <Th className="text-right">Balance</Th>
            <Th>Status</Th>
            <Th />
          </tr>
        </thead>

        <tbody className="divide-y divide-hairline">
          {bookings.length === 0 ? (
            <TableEmpty colSpan={8} message="No bookings match those filters." />
          ) : (
            bookings.map((b) => (
              <tr key={String(b._id)} className="transition-colors hover:bg-sand-50">
                <Td>
                  <span className="block font-mono text-xs font-bold text-midnight-900">
                    {b.reference}
                  </span>
                  <span className="mt-0.5 block text-[0.6875rem] capitalize text-muted">
                    {b.type} · {formatDate(b.createdAt)}
                  </span>
                </Td>

                <Td>
                  <span className="block text-sm font-semibold text-midnight-900">
                    {b.guestName ?? "—"}
                  </span>
                  <span className="block truncate text-xs text-muted">{b.guestEmail}</span>
                  <span className="block text-xs text-muted">{b.guestPhone}</span>
                </Td>

                <Td>
                  <span className="block max-w-56 truncate text-sm">{b.item.title}</span>
                  <span className="block text-xs text-muted">
                    {b.travellerCounts.adults}A
                    {b.travellerCounts.children ? ` + ${b.travellerCounts.children}C` : ""}
                  </span>
                </Td>

                <Td className="whitespace-nowrap text-xs">
                  {b.travelDate ? formatDate(b.travelDate) : "—"}
                </Td>

                <Td className="whitespace-nowrap text-right text-sm font-semibold">
                  {formatPrice(b.pricing.totalINR)}
                </Td>

                <Td className="whitespace-nowrap text-right text-sm">
                  {b.payment.balanceINR > 0 ? (
                    <span className="font-semibold text-sunset-700">
                      {formatPrice(b.payment.balanceINR)}
                    </span>
                  ) : (
                    <span className="text-emerald-700">Paid</span>
                  )}
                </Td>

                <Td>
                  <StatusPill status={b.status} tone={STATUS_TONE[b.status] ?? "neutral"} />
                </Td>

                <Td>
                  {canManage || canRefund ? (
                    <BookingActions
                      bookingId={String(b._id)}
                      reference={b.reference}
                      status={b.status}
                      amountPaidINR={b.payment.amountPaidINR}
                      canManage={canManage}
                      canRefund={canRefund}
                    />
                  ) : null}
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
