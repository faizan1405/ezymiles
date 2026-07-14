import type { Metadata } from "next";
import { requireAnyPermission } from "@/lib/session";
import { tryConnectDB } from "@/lib/db";
import { Booking, Refund } from "@/models";
import {
  AdminPageHeader,
  StatusPill,
  Table,
  TableEmpty,
  Td,
  Th,
  STATUS_TONE,
} from "@/components/admin/ui";
import { RefundActions } from "@/components/admin/refund-actions";
import { formatDateTime, formatPrice, serialise } from "@/lib/utils";
import type { IBooking, IRefund } from "@/models";

export const metadata: Metadata = { title: "Refunds", robots: { index: false } };

export default async function AdminRefundsPage() {
  const user = await requireAnyPermission(["refunds:view", "refunds:manage"]);
  const canManage = user.permissions?.includes("refunds:manage") ?? false;

  if (!(await tryConnectDB())) {
    return (
      <div>
        <AdminPageHeader title="Refunds" />
        <p className="rounded-2xl border border-hairline bg-white p-8 text-center text-sm text-muted">
          The database is unreachable.
        </p>
      </div>
    );
  }

  const rows = await Refund.find({}).sort({ createdAt: -1 }).limit(100).lean();
  const refunds = serialise(rows) as unknown as IRefund[];

  const bookings = await Booking.find({ _id: { $in: refunds.map((r) => r.booking) } })
    .select("reference guestName guestEmail item.title")
    .lean();

  const bookingMap = new Map(
    (serialise(bookings) as unknown as IBooking[]).map((b) => [String(b._id), b]),
  );

  return (
    <div>
      <AdminPageHeader
        title="Refunds"
        description="Approving a refund pushes it to the payment gateway. Nothing is reversed automatically."
      />

      <Table caption="Refunds">
        <thead>
          <tr className="border-b border-hairline bg-sand-50">
            <Th>Raised</Th>
            <Th>Booking</Th>
            <Th>Reason</Th>
            <Th className="text-right">Amount</Th>
            <Th>Status</Th>
            <Th />
          </tr>
        </thead>

        <tbody className="divide-y divide-hairline">
          {refunds.length === 0 ? (
            <TableEmpty
              colSpan={6}
              message="No refunds have been raised. Raise one from a booking's actions menu."
            />
          ) : (
            refunds.map((r) => {
              const booking = bookingMap.get(String(r.booking));

              return (
                <tr key={String(r._id)} className="transition-colors hover:bg-sand-50">
                  <Td className="whitespace-nowrap text-xs">{formatDateTime(r.createdAt)}</Td>

                  <Td>
                    {booking ? (
                      <>
                        <span className="block font-mono text-xs font-bold text-midnight-900">
                          {booking.reference}
                        </span>
                        <span className="block max-w-48 truncate text-xs text-muted">
                          {booking.guestName}
                        </span>
                      </>
                    ) : (
                      "—"
                    )}
                  </Td>

                  <Td className="max-w-64">
                    <span className="block text-xs leading-relaxed text-muted">{r.reason}</span>
                    {r.notes ? (
                      <span className="mt-1 block text-[0.625rem] font-medium text-amber-700">
                        {r.notes}
                      </span>
                    ) : null}
                  </Td>

                  <Td className="whitespace-nowrap text-right text-sm font-semibold">
                    {formatPrice(r.amountINR)}
                  </Td>

                  <Td>
                    <StatusPill status={r.status} tone={STATUS_TONE[r.status] ?? "neutral"} />
                    {r.gatewayRefundId ? (
                      <span className="mt-1 block font-mono text-[0.625rem] text-muted">
                        {r.gatewayRefundId}
                      </span>
                    ) : null}
                  </Td>

                  <Td>
                    {canManage && (r.status === "requested" || r.status === "processing") ? (
                      <RefundActions refundId={String(r._id)} status={r.status} />
                    ) : null}
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
