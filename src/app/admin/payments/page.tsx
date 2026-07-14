import type { Metadata } from "next";
import { requireAnyPermission } from "@/lib/session";
import { tryConnectDB } from "@/lib/db";
import { Booking, Payment } from "@/models";
import { PAYMENT_STATUSES } from "@/models/types";
import {
  AdminPageHeader,
  StatTile,
  StatusPill,
  Table,
  TableEmpty,
  Td,
  Th,
  STATUS_TONE,
} from "@/components/admin/ui";
import { FilterBar } from "@/components/admin/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { buildQueryString, formatDateTime, formatPrice, serialise, titleCase } from "@/lib/utils";
import type { QueryFilter } from "mongoose";
import type { IBooking, IPayment } from "@/models";

export const metadata: Metadata = { title: "Payments", robots: { index: false } };

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAnyPermission(["payments:view", "payments:manage"]);
  const sp = await searchParams;

  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1) || 1);
  const pageSize = 25;

  if (!(await tryConnectDB())) {
    return (
      <div>
        <AdminPageHeader title="Payments" />
        <p className="rounded-2xl border border-hairline bg-white p-8 text-center text-sm text-muted">
          The database is unreachable.
        </p>
      </div>
    );
  }

  const query: QueryFilter<IPayment> = {};
  const status = typeof sp.status === "string" ? sp.status : undefined;
  if (status) query.status = status as IPayment["status"];

  const q = typeof sp.q === "string" && sp.q ? sp.q : undefined;
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ gatewayOrderId: rx }, { gatewayPaymentId: rx }, { invoiceNumber: rx }];
  }

  const [rows, total, collected, failed, counts] = await Promise.all([
    Payment.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Payment.countDocuments(query),
    Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amountINR" } } },
    ]),
    Payment.countDocuments({ status: "failed" }),
    Payment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  const payments = serialise(rows) as unknown as IPayment[];

  // One extra round trip rather than N — resolve the booking labels in a batch.
  const bookings = await Booking.find({ _id: { $in: payments.map((p) => p.booking) } })
    .select("reference guestName item.title")
    .lean();

  const bookingMap = new Map(
    (serialise(bookings) as unknown as IBooking[]).map((b) => [String(b._id), b]),
  );

  const byStatus = Object.fromEntries(
    (counts as { _id: string; count: number }[]).map((c) => [c._id, c.count]),
  );

  const buildHref = (next: number) => {
    const params: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(sp)) {
      if (key !== "page" && typeof value === "string") params[key] = value;
    }
    return `/admin/payments${buildQueryString({ ...params, page: next })}`;
  };

  return (
    <div>
      <AdminPageHeader
        title="Payments"
        description="Every gateway transaction, verified server-side before it was ever marked paid."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Collected"
          value={formatPrice((collected[0]?.total as number) ?? 0, "INR", { compact: true })}
          sub="all successful payments"
          tone="success"
        />
        <StatTile label="Transactions" value={total} sub="matching current filters" />
        <StatTile
          label="Failed"
          value={failed}
          sub="not charged"
          tone={failed > 0 ? "warning" : "default"}
        />
      </div>

      <FilterBar
        searchPlaceholder="Search gateway order or payment id…"
        tabs={[
          { key: "", label: "All" },
          ...PAYMENT_STATUSES.map((s) => ({
            key: s,
            label: titleCase(s.replace(/_/g, " ")),
            count: byStatus[s] ?? 0,
          })),
        ]}
      />

      <Table caption="Payments">
        <thead>
          <tr className="border-b border-hairline bg-sand-50">
            <Th>When</Th>
            <Th>Booking</Th>
            <Th>Gateway</Th>
            <Th>Reference</Th>
            <Th className="text-right">Amount</Th>
            <Th>Status</Th>
          </tr>
        </thead>

        <tbody className="divide-y divide-hairline">
          {payments.length === 0 ? (
            <TableEmpty colSpan={6} message="No payments match those filters." />
          ) : (
            payments.map((p) => {
              const booking = bookingMap.get(String(p.booking));

              return (
                <tr key={String(p._id)} className="transition-colors hover:bg-sand-50">
                  <Td className="whitespace-nowrap text-xs">
                    {formatDateTime(p.paidAt ?? p.createdAt)}
                  </Td>

                  <Td>
                    {booking ? (
                      <>
                        <span className="block font-mono text-xs font-bold text-midnight-900">
                          {booking.reference}
                        </span>
                        <span className="block max-w-48 truncate text-xs text-muted">
                          {booking.guestName} · {booking.item?.title}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </Td>

                  <Td className="text-xs capitalize">
                    {p.gateway}
                    {p.method ? <span className="block text-muted">{p.method}</span> : null}
                    {p.instalment > 1 ? (
                      <span className="block text-[0.625rem] text-muted">
                        instalment {p.instalment}
                      </span>
                    ) : null}
                  </Td>

                  <Td className="max-w-40 truncate font-mono text-[0.6875rem] text-muted">
                    {p.gatewayPaymentId ?? p.gatewayOrderId ?? "—"}
                  </Td>

                  <Td className="whitespace-nowrap text-right text-sm font-semibold">
                    {formatPrice(p.amountINR)}
                  </Td>

                  <Td>
                    <StatusPill status={p.status} tone={STATUS_TONE[p.status] ?? "neutral"} />
                    {p.failureReason ? (
                      <span className="mt-1 block max-w-40 truncate text-[0.625rem] text-red-600">
                        {p.failureReason}
                      </span>
                    ) : null}
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
