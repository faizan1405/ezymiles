import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Plane,
  Mail,
  Phone,
  MessageCircle,
} from "lucide-react";

import { getBookingByReference } from "@/server/bookings";
import { getSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { Price } from "@/components/ui/price";
import { SmartImage } from "@/components/ui/smart-image";
import { formatDate, whatsappLink } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Booking confirmation",
  robots: { index: false, follow: false },
};

export default async function ConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { reference } = await params;
  const sp = await searchParams;

  const [booking, settings] = await Promise.all([
    getBookingByReference(reference),
    getSettings(),
  ]);

  if (!booking) notFound();

  const held = sp.held === "1";
  const failed = sp.failed === "1" || booking.status === "failed";
  const confirmed = booking.status === "confirmed" || booking.status === "completed";

  const state = failed ? "failed" : confirmed ? "confirmed" : "held";

  const META = {
    confirmed: {
      Icon: CheckCircle2,
      tone: "bg-lagoon-600",
      title: "You're going.",
      body: "Your booking is confirmed and a receipt is on its way to your inbox.",
    },
    held: {
      Icon: Clock,
      tone: "bg-amber-500",
      title: "Your booking is held",
      body: held
        ? "Online payment isn't enabled on this environment, so we've reserved your booking. Our team will contact you shortly to collect payment."
        : "We're waiting on payment. Your place is held — you can retry payment any time from your account.",
    },
    failed: {
      Icon: AlertTriangle,
      tone: "bg-red-500",
      title: "That payment didn't complete",
      body: "Nothing has been charged. Your booking is still held — you can retry payment from your account.",
    },
  } as const;

  const { Icon, tone, title, body } = META[state];

  return (
    <div className="container-page section-y">
      <div className="mx-auto max-w-3xl">
        {/* --------------------------------- Status --------------------------------- */}
        <div className="text-center">
          <span
            className={`mx-auto flex size-20 items-center justify-center rounded-3xl text-white ${tone}`}
          >
            <Icon className="size-9" aria-hidden />
          </span>

          <h1 className="mt-7 text-3xl text-midnight-900 sm:text-4xl">{title}</h1>
          <p className="mx-auto mt-4 max-w-lg text-[0.9375rem] leading-relaxed text-muted">{body}</p>

          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-sand-100 px-4 py-2.5 text-sm">
            <span className="text-muted">Booking reference</span>
            <span className="font-bold tracking-wide text-midnight-900">{booking.reference}</span>
          </p>
        </div>

        {/* ---------------------------------- Item ---------------------------------- */}
        <div className="mt-10 overflow-hidden rounded-3xl border border-hairline bg-white shadow-tile">
          <div className="flex flex-col gap-5 border-b border-hairline p-6 sm:flex-row sm:items-center">
            {booking.item.image ? (
              <div className="relative aspect-16/10 w-full shrink-0 overflow-hidden rounded-2xl sm:size-28 sm:aspect-auto">
                <SmartImage
                  src={booking.item.image}
                  alt={booking.item.title}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </div>
            ) : null}

            <div className="min-w-0 flex-1">
              <Badge tone="lagoon" size="sm">
                {booking.type}
              </Badge>
              <h2 className="mt-2 font-display text-xl text-midnight-900">{booking.item.title}</h2>
              {booking.travelDate ? (
                <p className="mt-1 text-sm text-muted">
                  Travelling {formatDate(booking.travelDate)}
                  {booking.endDate ? ` → ${formatDate(booking.endDate)}` : ""}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-muted">
                {booking.travellerCounts.adults} adults
                {booking.travellerCounts.children > 0
                  ? `, ${booking.travellerCounts.children} children`
                  : ""}
              </p>
            </div>
          </div>

          {/* --------------------------------- Money --------------------------------- */}
          <dl className="divide-y divide-hairline">
            <Row label="Total">
              <Price amountINR={booking.pricing.totalINR} className="text-base" />
            </Row>
            <Row label="Paid">
              <Price amountINR={booking.payment.amountPaidINR} className="text-base" />
            </Row>
            {booking.payment.balanceINR > 0 ? (
              <Row label="Balance due" highlight>
                <span className="flex flex-col items-end">
                  <Price amountINR={booking.payment.balanceINR} className="text-base text-sunset-700" />
                  {booking.payment.dueDate ? (
                    <span className="text-[0.6875rem] text-muted">
                      by {formatDate(booking.payment.dueDate)}
                    </span>
                  ) : null}
                </span>
              </Row>
            ) : null}
          </dl>
        </div>

        {/* --------------------------------- Actions -------------------------------- */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" variant="accent">
            <Link href="/account/trips">
              <Plane aria-hidden />
              View in my account
            </Link>
          </Button>

          {confirmed ? (
            <Button asChild size="lg" variant="outline">
              <Link href={`/account/trips/${booking.reference}/voucher`}>
                <Download aria-hidden />
                Download voucher
              </Link>
            </Button>
          ) : null}

          <Button asChild size="lg" variant="outline">
            <Link href="/packages">Keep exploring</Link>
          </Button>
        </div>

        {/* -------------------------------- Next steps ------------------------------- */}
        <div className="mt-12 rounded-3xl wash-ocean p-8 text-white">
          <h2 className="font-display text-xl">What happens next</h2>

          <ol className="mt-5 space-y-4">
            {(confirmed
              ? [
                  "A confirmation email with your invoice is on its way.",
                  "Your travel designer will call within one business day to confirm the details.",
                  "Vouchers and final documents land in your account 7 days before departure.",
                ]
              : [
                  "Our team will contact you to complete payment.",
                  "Your dates are held in the meantime — nothing is confirmed until payment clears.",
                  "You can retry payment yourself from your account at any time.",
                ]
            ).map((stepText, i) => (
              <li key={stepText} className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-midnight-800 text-[0.6875rem] font-bold">
                  {i + 1}
                </span>
                <span className="text-[0.9375rem] leading-relaxed text-lagoon-100">{stepText}</span>
              </li>
            ))}
          </ol>

          <div className="mt-7 flex flex-wrap gap-2">
            <Button asChild variant="glass" size="md">
              <a href={`tel:${settings.contact.phone.replace(/\s/g, "")}`}>
                <Phone aria-hidden />
                {settings.contact.phone}
              </a>
            </Button>
            <Button asChild variant="glass" size="md">
              <a
                href={whatsappLink(
                  settings.contact.whatsapp,
                  `Hi! I'm asking about booking ${booking.reference}.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle aria-hidden />
                WhatsApp us
              </a>
            </Button>
            <Button asChild variant="glass" size="md">
              <a href={`mailto:${settings.contact.email}?subject=Booking ${booking.reference}`}>
                <Mail aria-hidden />
                Email
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
  highlight,
}: {
  label: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 px-6 py-4 ${highlight ? "bg-sunset-50" : ""}`}>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-semibold text-midnight-900">{children}</dd>
    </div>
  );
}
