import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/session";
import { getBookingByReference } from "@/server/bookings";
import { getSettings } from "@/lib/settings";
import { connectDB } from "@/lib/db";
import { Payment } from "@/models";
import { PrintButton } from "@/components/account/print-button";
import { formatDate, formatPrice, serialise } from "@/lib/utils";
import type { IBooking, IPayment } from "@/models";

export const metadata: Metadata = {
  title: "Invoice",
  robots: { index: false, follow: false },
};

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const user = await requireUser();
  const { reference } = await params;

  const booking = (await getBookingByReference(reference, { userId: user.id })) as IBooking | null;
  if (!booking) notFound();

  await connectDB();
  const payments = serialise(
    await Payment.find({ booking: booking._id }).sort({ createdAt: 1 }).lean(),
  ) as unknown as IPayment[];

  const settings = await getSettings();
  const invoiceNumber = `INV-${booking.reference}`;

  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl text-midnight-900">Invoice</h1>
          <p className="mt-1 text-sm text-muted">Save as a PDF from the print dialog.</p>
        </div>
        <PrintButton />
      </div>

      <article className="rounded-2xl border border-hairline bg-white p-8 print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-hairline pb-6">
          <div>
            <p className="font-display text-2xl text-midnight-900">{settings.brand.name}</p>
            <address className="mt-2 text-xs not-italic leading-relaxed text-muted">
              {settings.contact.address}
              <br />
              {settings.contact.email}
              <br />
              {settings.contact.phone}
            </address>
          </div>

          <div className="text-right">
            <p className="text-[0.625rem] font-bold uppercase tracking-widest text-lagoon-700">
              Tax invoice
            </p>
            <p className="mt-1 font-mono text-lg font-bold text-midnight-900">{invoiceNumber}</p>
            <p className="mt-1 text-xs text-muted">Issued {formatDate(booking.createdAt)}</p>
          </div>
        </header>

        <section className="grid gap-6 border-b border-hairline py-6 sm:grid-cols-2">
          <div>
            <h2 className="text-[0.625rem] font-bold uppercase tracking-widest text-muted">
              Billed to
            </h2>
            <p className="mt-2 text-sm font-semibold text-midnight-900">{booking.guestName}</p>
            <p className="text-xs text-muted">{booking.guestEmail}</p>
            <p className="text-xs text-muted">{booking.guestPhone}</p>
          </div>

          <div className="sm:text-right">
            <h2 className="text-[0.625rem] font-bold uppercase tracking-widest text-muted">
              Booking
            </h2>
            <p className="mt-2 text-sm font-semibold text-midnight-900">{booking.reference}</p>
            <p className="text-xs text-muted">{booking.item.title}</p>
            {booking.travelDate ? (
              <p className="text-xs text-muted">Travelling {formatDate(booking.travelDate)}</p>
            ) : null}
          </div>
        </section>

        {/* ------------------------------- Line items ------------------------------ */}
        <section className="py-6">
          <table className="w-full text-sm">
            <caption className="sr-only">Invoice line items</caption>
            <thead>
              <tr className="border-b border-hairline text-left">
                <th scope="col" className="pb-3 text-[0.625rem] font-bold uppercase tracking-wider text-muted">
                  Description
                </th>
                <th scope="col" className="pb-3 text-right text-[0.625rem] font-bold uppercase tracking-wider text-muted">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {booking.pricing.lines.map((line, i) => (
                <tr key={`${line.label}-${i}`}>
                  <td className="py-3 text-midnight-800">{line.label}</td>
                  <td
                    className={`py-3 text-right tabular-nums ${
                      line.kind === "discount" ? "text-emerald-700" : "text-midnight-800"
                    }`}
                  >
                    {formatPrice(line.amountINR)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-midnight-900">
                <th scope="row" className="pt-4 text-left font-bold text-midnight-900">
                  Total
                </th>
                <td className="pt-4 text-right text-lg font-bold tabular-nums text-midnight-900">
                  {formatPrice(booking.pricing.totalINR)}
                </td>
              </tr>
              <tr>
                <th scope="row" className="pt-2 text-left text-sm font-medium text-muted">
                  Paid
                </th>
                <td className="pt-2 text-right tabular-nums text-muted">
                  {formatPrice(booking.payment.amountPaidINR)}
                </td>
              </tr>
              {booking.payment.balanceINR > 0 ? (
                <tr>
                  <th scope="row" className="pt-2 text-left text-sm font-bold text-sunset-700">
                    Balance due
                    {booking.payment.dueDate ? ` by ${formatDate(booking.payment.dueDate)}` : ""}
                  </th>
                  <td className="pt-2 text-right font-bold tabular-nums text-sunset-700">
                    {formatPrice(booking.payment.balanceINR)}
                  </td>
                </tr>
              ) : null}
            </tfoot>
          </table>
        </section>

        {/* -------------------------------- Payments ------------------------------- */}
        {payments.length ? (
          <section className="border-t border-hairline py-6">
            <h2 className="text-[0.625rem] font-bold uppercase tracking-widest text-muted">
              Payments received
            </h2>
            <ul className="mt-3 space-y-1.5">
              {payments
                .filter((p) => p.status === "paid")
                .map((p) => (
                  <li key={String(p._id)} className="flex justify-between gap-4 text-sm">
                    <span className="text-muted">
                      {formatDate(p.paidAt ?? p.createdAt)} · {p.gateway}
                      {p.method ? ` · ${p.method}` : ""}
                      {p.gatewayPaymentId ? ` · ${p.gatewayPaymentId}` : ""}
                    </span>
                    <span className="shrink-0 font-semibold text-midnight-900">
                      {formatPrice(p.amountINR)}
                    </span>
                  </li>
                ))}
            </ul>
          </section>
        ) : null}

        <footer className="border-t border-hairline pt-6 text-xs leading-relaxed text-muted">
          <p>
            This is a computer-generated invoice and is valid without a signature. Amounts are in
            Indian Rupees (INR).
            {booking.isDemoData
              ? " This booking was made against demo inventory in a non-production environment."
              : ""}
          </p>
          <p className="mt-2">
            Registration and tax identifiers to be added in Admin → Site Settings before launch.
          </p>
        </footer>
      </article>
    </div>
  );
}
