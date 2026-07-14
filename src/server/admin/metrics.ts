import "server-only";
import { tryConnectDB } from "@/lib/db";
import {
  Booking,
  Enquiry,
  Lead,
  Package,
  Payment,
  User,
  Destination,
} from "@/models";
import { serialise } from "@/lib/utils";
import { syncFollowUpNotifications } from "@/server/leads";

/**
 * Dashboard metrics.
 *
 * Every figure here is counted from the database. Nothing is estimated, padded
 * or hard-coded — an empty database shows zeros, and that is the correct answer.
 */

export interface DashboardMetrics {
  enquiries: { total: number; last30: number; prev30: number };
  leads: { total: number; new: number; followUpDue: number; won: number; lost: number };
  bookings: { confirmed: number; pending: number; cancelled: number; last30: number };
  revenue: { total: number; last30: number; prev30: number; pendingCollection: number };
  conversionRate: number;
  popularDestinations: { name: string; bookings: number }[];
  mostViewedPackages: { title: string; slug: string; views: number; enquiries: number }[];
  bookingSources: { source: string; count: number }[];
  upcomingDepartures: { title: string; slug: string; date: string; seatsLeft: number }[];
  recentActivity: {
    kind: "booking" | "lead" | "payment";
    title: string;
    subtitle: string;
    at: string;
    href: string;
  }[];
  customers: { total: number; last30: number };
}

const EMPTY: DashboardMetrics = {
  enquiries: { total: 0, last30: 0, prev30: 0 },
  leads: { total: 0, new: 0, followUpDue: 0, won: 0, lost: 0 },
  bookings: { confirmed: 0, pending: 0, cancelled: 0, last30: 0 },
  revenue: { total: 0, last30: 0, prev30: 0, pendingCollection: 0 },
  conversionRate: 0,
  popularDestinations: [],
  mostViewedPackages: [],
  bookingSources: [],
  upcomingDepartures: [],
  recentActivity: [],
  customers: { total: 0, last30: 0 },
};

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  if (!(await tryConnectDB())) return EMPTY;

  // Best-effort: there's no background job runner, so "follow-up due" admin
  // notifications are synced on every dashboard view instead.
  syncFollowUpNotifications().catch((error) => console.error("[syncFollowUpNotifications]", error));

  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 86_400_000);
  const d60 = new Date(now.getTime() - 60 * 86_400_000);

  try {
    const [
      enquiryTotal,
      enquiryLast30,
      enquiryPrev30,
      leadTotal,
      leadNew,
      followUpDue,
      leadWon,
      leadLost,
      bookingConfirmed,
      bookingPending,
      bookingCancelled,
      bookingLast30,
      revenueAgg,
      revenue30Agg,
      revenuePrev30Agg,
      pendingAgg,
      destAgg,
      viewedPackages,
      sourceAgg,
      departuresAgg,
      recentBookings,
      recentLeads,
      customerTotal,
      customerLast30,
    ] = await Promise.all([
      Enquiry.countDocuments({}),
      Enquiry.countDocuments({ createdAt: { $gte: d30 } }),
      Enquiry.countDocuments({ createdAt: { $gte: d60, $lt: d30 } }),

      Lead.countDocuments({ deletedAt: null }),
      Lead.countDocuments({ deletedAt: null, status: "new" }),
      Lead.countDocuments({
        deletedAt: null,
        followUpDate: { $lte: now },
        status: { $nin: ["won", "lost", "junk"] },
      }),
      Lead.countDocuments({ deletedAt: null, status: "won" }),
      Lead.countDocuments({ deletedAt: null, status: "lost" }),

      Booking.countDocuments({ deletedAt: null, status: "confirmed" }),
      Booking.countDocuments({ deletedAt: null, status: "pending_payment" }),
      Booking.countDocuments({ deletedAt: null, status: { $in: ["cancelled", "cancellation_requested"] } }),
      Booking.countDocuments({ deletedAt: null, createdAt: { $gte: d30 } }),

      Payment.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amountINR" } } },
      ]),
      Payment.aggregate([
        { $match: { status: "paid", paidAt: { $gte: d30 } } },
        { $group: { _id: null, total: { $sum: "$amountINR" } } },
      ]),
      Payment.aggregate([
        { $match: { status: "paid", paidAt: { $gte: d60, $lt: d30 } } },
        { $group: { _id: null, total: { $sum: "$amountINR" } } },
      ]),
      Booking.aggregate([
        { $match: { deletedAt: null, status: { $in: ["confirmed", "pending_payment"] } } },
        { $group: { _id: null, total: { $sum: "$payment.balanceINR" } } },
      ]),

      Booking.aggregate([
        { $match: { deletedAt: null, status: { $in: ["confirmed", "completed"] } } },
        { $group: { _id: "$item.title", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),

      Package.find({ status: "published", deletedAt: null })
        .select("title slug viewCount enquiryCount")
        .sort({ viewCount: -1 })
        .limit(6)
        .lean(),

      Booking.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: "$source", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),

      Package.aggregate([
        { $match: { status: "published", deletedAt: null } },
        { $unwind: "$departures" },
        {
          $match: {
            "departures.date": { $gte: now },
            "departures.status": { $in: ["open", "filling_fast"] },
          },
        },
        { $sort: { "departures.date": 1 } },
        { $limit: 6 },
        {
          $project: {
            title: 1,
            slug: 1,
            date: "$departures.date",
            seatsLeft: { $subtract: ["$departures.seatsTotal", "$departures.seatsBooked"] },
          },
        },
      ]),

      Booking.find({ deletedAt: null })
        .select("reference item.title guestName status createdAt pricing.totalINR")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      Lead.find({ deletedAt: null })
        .select("reference name destination type createdAt")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      User.countDocuments({ deletedAt: null }),
      User.countDocuments({ deletedAt: null, createdAt: { $gte: d30 } }),
    ]);

    const revenueTotal = (revenueAgg[0]?.total as number) ?? 0;
    const revenue30 = (revenue30Agg[0]?.total as number) ?? 0;
    const revenuePrev30 = (revenuePrev30Agg[0]?.total as number) ?? 0;
    const pendingCollection = (pendingAgg[0]?.total as number) ?? 0;

    const totalBookings = bookingConfirmed + bookingPending + bookingCancelled;
    const conversionRate =
      leadTotal > 0 ? Math.round((bookingConfirmed / leadTotal) * 1000) / 10 : 0;

    const recentActivity: DashboardMetrics["recentActivity"] = [
      ...recentBookings.map((b) => ({
        kind: "booking" as const,
        title: b.item?.title ?? "Booking",
        subtitle: `${b.guestName ?? "Guest"} · ${b.reference} · ${b.status.replace("_", " ")}`,
        at: String(b.createdAt),
        href: `/admin/bookings?q=${b.reference}`,
      })),
      ...recentLeads.map((l) => ({
        kind: "lead" as const,
        title: `${l.name} — ${l.type.replace("_", " ")}`,
        subtitle: [l.destination, l.reference].filter(Boolean).join(" · "),
        at: String(l.createdAt),
        href: `/admin/leads/${String(l._id)}`,
      })),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 8);

    return serialise({
      enquiries: { total: enquiryTotal, last30: enquiryLast30, prev30: enquiryPrev30 },
      leads: {
        total: leadTotal,
        new: leadNew,
        followUpDue,
        won: leadWon,
        lost: leadLost,
      },
      bookings: {
        confirmed: bookingConfirmed,
        pending: bookingPending,
        cancelled: bookingCancelled,
        last30: bookingLast30,
      },
      revenue: {
        total: revenueTotal,
        last30: revenue30,
        prev30: revenuePrev30,
        pendingCollection,
      },
      conversionRate,
      popularDestinations: (destAgg as { _id: string; count: number }[]).map((d) => ({
        name: d._id ?? "—",
        bookings: d.count,
      })),
      mostViewedPackages: viewedPackages.map((p) => ({
        title: p.title,
        slug: p.slug,
        views: p.viewCount ?? 0,
        enquiries: p.enquiryCount ?? 0,
      })),
      bookingSources: (sourceAgg as { _id: string; count: number }[]).map((s) => ({
        source: s._id ?? "direct",
        count: s.count,
      })),
      upcomingDepartures: (
        departuresAgg as { title: string; slug: string; date: Date; seatsLeft: number }[]
      ).map((d) => ({
        title: d.title,
        slug: d.slug,
        date: String(d.date),
        seatsLeft: d.seatsLeft,
      })),
      recentActivity,
      customers: { total: customerTotal, last30: customerLast30 },
      _totalBookings: totalBookings,
    }) as DashboardMetrics;
  } catch (error) {
    console.error("[getDashboardMetrics]", error);
    return EMPTY;
  }
}

/** Referenced by the destinations module for a "no packages yet" nudge. */
export async function getDestinationsWithoutPackages() {
  if (!(await tryConnectDB())) return [];

  try {
    const rows = await Destination.aggregate([
      { $match: { status: "published", deletedAt: null } },
      {
        $lookup: {
          from: "packages",
          localField: "_id",
          foreignField: "destination",
          as: "packages",
        },
      },
      { $match: { packages: { $size: 0 } } },
      { $project: { name: 1, slug: 1 } },
      { $limit: 10 },
    ]);

    return serialise(rows) as { _id: string; name: string; slug: string }[];
  } catch {
    return [];
  }
}
