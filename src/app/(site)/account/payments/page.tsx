import type { Metadata } from "next";
import Link from "next/link";
import { Receipt, Download } from "lucide-react";

import { requireUser } from "@/lib/session";
import { tryConnectDB } from "@/lib/db";
import { Booking, Payment, Refund } from "@/models";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { formatDate, serialise } from "@/lib/utils";
import type { IBooking, IPayment, IRefund } from "@/models";

export const metadata: Metadata = {
  title: "Payments & invoices",
  robots: { index: false, follow: false },
};

const STATUS_TONE = {
  paid: "success",
  created: "neutral",
  authorised: "info",
  partially_paid: "warning",
  failed: "danger",
  refunded: "info",
  partially_refunded: "info",
} as const;

export default async function PaymentsPage() {
  const user = await requireUser();

  if (!(await tryConnectDB())) {
    return (
      <EmptyState
        title="Payments are unavailable right now"
        description="Our database is temporarily unreachable. Please refresh in a moment."
      />
    );
  }

  const bookings = (serialise(
    await Booking.find({ user: user.id, deletedAt: null }).select("_id reference item").lean(),
  ) as unknown as IBooking[]) ?? [];

  const bookingIds = bookings.map((b) => b._id);
  const byId = new Map(bookings.map((b) => [String(b._id), b]));

  const [payments, refunds] = await Promise.all([
    Payment.find({ booking: { $in: bookingIds } }).sort({ createdAt: -1 }).lean(),
    Refund.find({ booking: { $in: bookingIds } }).sort({ createdAt: -1 }).lean(),
  ]);

  const paymentRows = serialise(payments) as unknown as IPayment[];
  const refundRows = serialise(refunds) as unknown as IRefund[];

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-3xl text-midnight-900 sm:text-4xl">Payments & invoices</h1>
        <p className="mt-2 text-[0.9375rem] text-muted">
          Every transaction against your bookings, and the invoice for each one.
        </p>
      </header>

      {/* -------------------------------- Payments ------------------------------- */}
      <section>
        <h2 className="mb-5 text-xl text-midnight-900">Payment history</h2>

        {paymentRows.length === 0 ? (
          <EmptyState
            icon={<Receipt />}
            title="No payments yet"
            description="Once you pay for a booking, the receipt and invoice appear here."
            action={
              <Button asChild variant="accent">
                <Link href="/packages">Browse packages</Link>
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-hairline bg-white">
            <table className="w-full min-w-[42rem] text-sm">
              <caption className="sr-only">Your payment history</caption>
              <thead>
                <tr className="border-b border-hairline bg-sand-50 text-left">
                  <Th>Date</Th>
                  <Th>Booking</Th>
                  <Th>Method</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Amount</Th>
                  <Th className="text-right">Invoice</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {paymentRows.map((p) => {
                  const booking = byId.get(String(p.booking));

                  return (
                    <tr key={String(p._id)}>
                      <Td>{formatDate(p.paidAt ?? p.createdAt)}</Td>
                      <Td>
                        {booking ? (
                          <span className="block max-w-48 truncate">
                            <span className="font-semibold text-midnight-900">{booking.reference}</span>
                            <span className="block truncate text-xs text-muted">
                              {booking.item.title}
                            </span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </Td>
                      <Td className="capitalize">
                        {p.gateway}
                        {p.method ? ` · ${p.method}` : ""}
                      </Td>
                      <Td>
                        <Badge tone={STATUS_TONE[p.status] ?? "neutral"} size="sm">
                          {p.status.replace("_", " ")}
                        </Badge>
                      </Td>
                      <Td className="text-right">
                        <Price amountINR={p.amountINR} className="text-sm" />
                      </Td>
                      <Td className="text-right">
                        {booking && p.status === "paid" ? (
                          <Link
                            href={`/account/trips/${booking.reference}/invoice`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-lagoon-700 hover:underline"
                          >
                            <Download className="size-3.5" aria-hidden />
                            Invoice
                          </Link>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* -------------------------------- Refunds -------------------------------- */}
      {refundRows.length ? (
        <section>
          <h2 className="mb-5 text-xl text-midnight-900">Refunds</h2>

          <ul className="space-y-3">
            {refundRows.map((r) => {
              const booking = byId.get(String(r.booking));
              return (
                <li
                  key={String(r._id)}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-hairline bg-white p-5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-midnight-900">
                      {booking?.reference ?? "Booking"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      Requested {formatDate(r.createdAt)}
                      {r.reason ? ` · ${r.reason}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge
                      tone={
                        r.status === "completed"
                          ? "success"
                          : r.status === "rejected"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {r.status}
                    </Badge>
                    <Price amountINR={r.amountINR} className="text-base" />
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="mt-4 text-xs text-muted">
            Refunds settle to the original payment method, usually within 5–7 working days of being
            processed.
          </p>
        </section>
      ) : null}
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={`px-5 py-3 text-[0.625rem] font-bold uppercase tracking-wider text-muted ${className}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-4 align-top text-midnight-800 ${className}`}>{children}</td>;
}
