import type { Metadata } from "next";
import { LifeBuoy } from "lucide-react";

import { requireUser } from "@/lib/session";
import { tryConnectDB } from "@/lib/db";
import { Booking, SupportTicket } from "@/models";
import { SupportPanel } from "@/components/account/support-panel";
import { EmptyState } from "@/components/ui/primitives";
import { serialise } from "@/lib/utils";
import type { IBooking, ISupportTicket } from "@/models";

export const metadata: Metadata = {
  title: "Support",
  robots: { index: false, follow: false },
};

export default async function SupportPage() {
  const user = await requireUser();

  if (!(await tryConnectDB())) {
    return (
      <EmptyState
        icon={<LifeBuoy />}
        title="Support is unavailable right now"
        description="Please refresh in a moment, or call us directly."
      />
    );
  }

  const [tickets, bookings] = await Promise.all([
    SupportTicket.find({ user: user.id }).sort({ createdAt: -1 }).lean(),
    Booking.find({ user: user.id, deletedAt: null }).select("reference item.title").lean(),
  ]);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl text-midnight-900 sm:text-4xl">Support</h1>
        <p className="mt-2 text-[0.9375rem] text-muted">
          Open a ticket and it goes straight to the team handling your booking — not a queue.
        </p>
      </header>

      <SupportPanel
        tickets={serialise(tickets) as unknown as ISupportTicket[]}
        bookings={(serialise(bookings) as unknown as IBooking[]).map((b) => ({
          reference: b.reference,
          title: b.item.title,
        }))}
      />
    </div>
  );
}
