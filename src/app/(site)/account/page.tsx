import type { Metadata } from "next";
import Link from "next/link";
import { Plane, Heart, Receipt, Stamp, ArrowRight, Compass } from "lucide-react";

import { requireUser } from "@/lib/session";
import { tryConnectDB } from "@/lib/db";
import { Booking, User, VisaApplication } from "@/models";
import { getPackagesByIds } from "@/server/catalog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";
import { TripCard } from "@/components/account/trip-card";
import { PackageCard } from "@/components/packages/package-card";
import { serialise } from "@/lib/utils";
import type { IBooking } from "@/models";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

export default async function AccountOverviewPage() {
  const user = await requireUser();

  if (!(await tryConnectDB())) {
    return (
      <EmptyState
        title="We can't reach your account right now"
        description="Our database is temporarily unavailable. Please refresh in a moment."
      />
    );
  }

  const now = new Date();

  const [upcoming, counts, wishlistIds, visaCount] = await Promise.all([
    Booking.find({
      user: user.id,
      deletedAt: null,
      status: { $in: ["confirmed", "pending_payment"] },
      $or: [{ travelDate: { $gte: now } }, { travelDate: { $exists: false } }],
    })
      .sort({ travelDate: 1 })
      .limit(3)
      .lean(),
    Booking.aggregate([
      { $match: { user: user.id, deletedAt: null } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]).catch(() => []),
    User.findById(user.id).select("wishlist").lean(),
    VisaApplication.countDocuments({ user: user.id, deletedAt: null }).catch(() => 0),
  ]);

  const byStatus = Object.fromEntries(
    (counts as { _id: string; count: number }[]).map((c) => [c._id, c.count]),
  );

  const confirmed = byStatus.confirmed ?? 0;
  const pending = byStatus.pending_payment ?? 0;
  const completed = byStatus.completed ?? 0;

  const savedIds = (wishlistIds?.wishlist ?? []).map(String);
  const saved = savedIds.length ? await getPackagesByIds(savedIds.slice(0, 3)) : [];

  const trips = serialise(upcoming) as unknown as IBooking[];

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-3xl text-midnight-900 sm:text-4xl">
          Hello, {(user.name ?? "traveller").split(" ")[0]}
        </h1>
        <p className="mt-2 text-[0.9375rem] text-muted">
          Everything you&apos;ve booked, saved and asked us about, in one place.
        </p>
      </header>

      {/* --------------------------------- Stats --------------------------------- */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          Account summary
        </h2>

        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={<Plane aria-hidden />}
            label="Upcoming trips"
            value={confirmed}
            href="/account/trips"
          />
          <StatCard
            icon={<Receipt aria-hidden />}
            label="Awaiting payment"
            value={pending}
            href="/account/payments"
            tone={pending > 0 ? "warning" : "default"}
          />
          <StatCard
            icon={<Heart aria-hidden />}
            label="Saved packages"
            value={savedIds.length}
            href="/account/wishlist"
          />
          <StatCard
            icon={<Stamp aria-hidden />}
            label="Visa applications"
            value={visaCount}
            href="/account/visa"
          />
        </dl>

        {completed > 0 ? (
          <p className="mt-4 text-sm text-muted">
            You&apos;ve completed {completed} {completed === 1 ? "trip" : "trips"} with us.{" "}
            <Link href="/account/trips?filter=past" className="font-semibold text-lagoon-700 hover:underline">
              See past trips
            </Link>
          </p>
        ) : null}
      </section>

      {/* -------------------------------- Upcoming ------------------------------- */}
      <section>
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-2xl text-midnight-900">Next up</h2>
          {trips.length ? (
            <Button asChild variant="ghost" size="sm">
              <Link href="/account/trips">
                All trips
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          ) : null}
        </div>

        {trips.length === 0 ? (
          <EmptyState
            icon={<Compass />}
            title="Nothing booked yet"
            description="When you book, your itinerary, vouchers and invoices all land here."
            action={
              <Button asChild variant="accent">
                <Link href="/packages">Find a trip</Link>
              </Button>
            }
          />
        ) : (
          <ul className="space-y-4">
            {trips.map((booking) => (
              <li key={String(booking._id)}>
                <TripCard booking={booking} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* -------------------------------- Wishlist ------------------------------- */}
      {saved.length ? (
        <section>
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-2xl text-midnight-900">Still thinking about</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/account/wishlist">
                All saved
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>

          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((pkg) => (
              <li key={pkg.id}>
                <PackageCard pkg={pkg} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href: string;
  tone?: "default" | "warning";
}) {
  return (
    <Link
      href={href}
      className={`group rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-tile motion-reduce:hover:translate-y-0 ${
        tone === "warning" ? "border-sunset-200 bg-sunset-50" : "border-hairline bg-white"
      }`}
    >
      <dt className="flex items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-wider text-muted">
        <span className={tone === "warning" ? "text-sunset-600" : "text-lagoon-600"}>
          <span className="[&_svg]:size-4">{icon}</span>
        </span>
        {label}
      </dt>
      <dd className="mt-2 font-display text-3xl text-midnight-900">{value}</dd>
    </Link>
  );
}
