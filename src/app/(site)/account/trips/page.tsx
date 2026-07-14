import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";

import { requireUser } from "@/lib/session";
import { getUserBookings } from "@/server/bookings";
import { TripCard } from "@/components/account/trip-card";
import { EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import type { IBooking } from "@/models";

export const metadata: Metadata = {
  title: "My trips",
  robots: { index: false, follow: false },
};

const FILTERS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
  { key: "all", label: "All" },
] as const;

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const filter = (typeof sp.filter === "string" ? sp.filter : "upcoming") as
    | "upcoming"
    | "past"
    | "cancelled"
    | "all";

  const all = (await getUserBookings(user.id)) as unknown as IBooking[];
  const now = new Date();

  const bookings = all.filter((b) => {
    const travelled = b.travelDate ? new Date(b.travelDate) < now : false;
    const cancelled = b.status === "cancelled" || b.status === "cancellation_requested";

    if (filter === "all") return true;
    if (filter === "cancelled") return cancelled;
    if (filter === "past") return !cancelled && (travelled || b.status === "completed");
    return !cancelled && !travelled && b.status !== "completed";
  });

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl text-midnight-900 sm:text-4xl">My trips</h1>
        <p className="mt-2 text-[0.9375rem] text-muted">
          Every booking, its payment status, and the documents that go with it.
        </p>
      </header>

      <div className="mb-7 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Link
              key={f.key}
              href={`/account/trips?filter=${f.key}`}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "rounded-full bg-midnight-900 px-4 py-2 text-sm font-semibold text-white"
                  : "rounded-full border border-hairline px-4 py-2 text-sm font-semibold text-midnight-700 transition-colors hover:bg-sand-50"
              }
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          icon={<Compass />}
          title={
            filter === "upcoming"
              ? "No upcoming trips"
              : filter === "past"
                ? "No past trips yet"
                : filter === "cancelled"
                  ? "Nothing cancelled"
                  : "No bookings yet"
          }
          description="When you book, everything — itinerary, invoice, voucher — shows up right here."
          action={
            <Button asChild variant="accent">
              <Link href="/packages">Browse packages</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-4">
          {bookings.map((booking) => (
            <li key={String(booking._id)}>
              <TripCard booking={booking} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
