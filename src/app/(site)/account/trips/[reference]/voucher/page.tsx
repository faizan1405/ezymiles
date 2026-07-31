import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { requireUser } from "@/lib/session";
import { getBookingByReference } from "@/server/bookings";
import { getSettings } from "@/lib/settings";
import { PrintButton } from "@/components/account/print-button";
import { formatDate, formatPrice } from "@/lib/utils";
import type { IBooking, ITraveller } from "@/models";

export const metadata: Metadata = {
  title: "Travel voucher",
  robots: { index: false, follow: false },
};

/**
 * Voucher and invoice are printable HTML rather than server-generated PDFs: the
 * browser's own "Save as PDF" produces a correct, selectable, accessible file
 * without shipping a headless renderer. Print styles live in globals.css.
 */
export default async function VoucherPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const user = await requireUser();
  const { reference } = await params;

  // travellers are populated here, so the ObjectId[] on IBooking is replaced.
  const booking = (await getBookingByReference(reference, { userId: user.id })) as
    | (Omit<IBooking, "travellers"> & { travellers: ITraveller[] })
    | null;

  if (!booking) notFound();

  const settings = await getSettings();

  const isConfirmed = booking.status === "confirmed" || booking.status === "completed";

  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl text-midnight-900">Travel voucher</h1>
          <p className="mt-1 text-sm text-muted">
            Present this at check-in. Save it as a PDF from the print dialog.
          </p>
        </div>
        <PrintButton />
      </div>

      {!isConfirmed ? (
        <p className="no-print mb-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          This booking isn&apos;t confirmed yet, so this voucher is provisional and not valid for
          check-in.
        </p>
      ) : null}

      <article className="rounded-2xl border border-hairline bg-white p-8 print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-hairline pb-6">
          <div>
            <p className="font-display text-2xl text-midnight-900">{settings.brand.name}</p>
            <p className="mt-1 text-xs text-muted">{settings.brand.tagline}</p>
          </div>
          <div className="text-right">
            <p className="text-[0.625rem] font-bold uppercase tracking-widest text-lagoon-700">
              Travel voucher
            </p>
            <p className="mt-1 font-mono text-lg font-bold text-midnight-900">{booking.reference}</p>
            {isConfirmed ? (
              <p className="mt-1 flex items-center justify-end gap-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="size-3.5" aria-hidden />
                Confirmed
              </p>
            ) : null}
          </div>
        </header>

        <section className="py-6">
          <h2 className="text-[0.625rem] font-bold uppercase tracking-widest text-muted">Booking</h2>
          <p className="mt-2 font-display text-xl text-midnight-900">{booking.item.title}</p>

          <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
            <Field label="Type" value={booking.type} />
            {booking.travelDate ? (
              <Field label="Travel date" value={formatDate(booking.travelDate)} />
            ) : null}
            {booking.endDate ? <Field label="Return" value={formatDate(booking.endDate)} /> : null}
            <Field
              label="Travellers"
              value={`${booking.travellerCounts.adults} adults${
                booking.travellerCounts.children ? `, ${booking.travellerCounts.children} children` : ""
              }`}
            />
          </dl>
        </section>

        {booking.travellers?.length ? (
          <section className="border-t border-hairline py-6">
            <h2 className="text-[0.625rem] font-bold uppercase tracking-widest text-muted">
              Travellers
            </h2>
            <ul className="mt-3 space-y-1.5">
              {booking.travellers.map((t) => (
                <li key={String(t._id)} className="text-sm text-midnight-800">
                  {t.title} {t.firstName} {t.lastName}
                  <span className="ml-2 text-xs text-muted">
                    {t.type}
                    {t.passportNumber ? ` · passport ${t.passportNumber}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="border-t border-hairline py-6">
          <h2 className="text-[0.625rem] font-bold uppercase tracking-widest text-muted">Payment</h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            <Row label="Total" value={formatPrice(booking.pricing.totalINR)} />
            <Row label="Paid" value={formatPrice(booking.payment.amountPaidINR)} />
            {booking.payment.balanceINR > 0 ? (
              <Row label="Balance due" value={formatPrice(booking.payment.balanceINR)} strong />
            ) : null}
          </dl>
        </section>

        <footer className="border-t border-hairline pt-6 text-xs leading-relaxed text-muted">
          <p>
            <span className="font-semibold text-midnight-900">Support: </span>
            {settings.contact.phone} · {settings.contact.email}
          </p>
          <p className="mt-2">
            Present this voucher along with photo identification. Services are subject to the terms
            you accepted at booking.
          </p>
        </footer>
      </article>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.625rem] font-bold uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold capitalize text-midnight-900">{value}</dd>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className={strong ? "font-bold text-sunset-700" : "font-semibold text-midnight-900"}>
        {value}
      </dd>
    </div>
  );
}
