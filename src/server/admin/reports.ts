import "server-only";
import { tryConnectDB } from "@/lib/db";
import { Booking, Payment, Enquiry, Lead, User, Package } from "@/models";
import { formatDate } from "@/lib/utils";

/**
 * Tabular data for the admin Reports & Export section. Every report returns
 * the same shape (columns + rows) so one table component and one CSV exporter
 * cover all seven report types.
 */

export const REPORT_KEYS = [
  "bookings",
  "revenue",
  "enquiries",
  "lead-conversion",
  "payments",
  "customers",
  "package-performance",
] as const;
export type ReportKey = (typeof REPORT_KEYS)[number];

export const REPORT_LABELS: Record<ReportKey, string> = {
  bookings: "Bookings",
  revenue: "Revenue",
  enquiries: "Enquiries",
  "lead-conversion": "Lead conversion",
  payments: "Payments",
  customers: "Customers",
  "package-performance": "Package performance",
};

export interface ReportRange {
  from?: string;
  to?: string;
}

export interface ReportTable {
  columns: string[];
  rows: (string | number)[][];
  rangeLabel: string;
  dbUnreachable?: boolean;
}

function dateFilter(range: ReportRange): Record<string, Date> | undefined {
  const filter: Record<string, Date> = {};
  if (range.from) filter.$gte = new Date(range.from);
  if (range.to) {
    const to = new Date(range.to);
    to.setHours(23, 59, 59, 999);
    filter.$lte = to;
  }
  return Object.keys(filter).length ? filter : undefined;
}

function rangeLabel(range: ReportRange): string {
  if (!range.from && !range.to) return "All time";
  return `${range.from ? formatDate(range.from) : "the beginning"} – ${range.to ? formatDate(range.to) : "today"}`;
}

export async function getReport(key: ReportKey, range: ReportRange): Promise<ReportTable> {
  const label = rangeLabel(range);

  if (!(await tryConnectDB())) {
    return { columns: [], rows: [], rangeLabel: label, dbUnreachable: true };
  }

  const created = dateFilter(range);

  switch (key) {
    case "bookings": {
      const rows = await Booking.find({ deletedAt: null, ...(created ? { createdAt: created } : {}) })
        .sort({ createdAt: -1 })
        .limit(5000)
        .select(
          "reference type status guestName guestEmail pricing.totalINR payment.amountPaidINR payment.status travelDate createdAt",
        )
        .lean();

      return {
        columns: [
          "Reference",
          "Type",
          "Status",
          "Customer",
          "Email",
          "Total (INR)",
          "Paid (INR)",
          "Payment status",
          "Travel date",
          "Created",
        ],
        rows: rows.map((b) => [
          b.reference,
          b.type,
          b.status,
          b.guestName ?? "",
          b.guestEmail ?? "",
          b.pricing?.totalINR ?? 0,
          b.payment?.amountPaidINR ?? 0,
          b.payment?.status ?? "",
          b.travelDate ? formatDate(b.travelDate) : "",
          formatDate(b.createdAt),
        ]),
        rangeLabel: label,
      };
    }

    case "revenue": {
      const agg = await Payment.aggregate([
        { $match: { status: "paid", ...(created ? { paidAt: created } : {}) } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$paidAt" } },
            payments: { $sum: 1 },
            revenueINR: { $sum: "$amountINR" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      return {
        columns: ["Date", "Payments", "Revenue (INR)"],
        rows: agg.map((r) => [r._id as string, r.payments as number, r.revenueINR as number]),
        rangeLabel: label,
      };
    }

    case "enquiries": {
      const rows = await Enquiry.find({ ...(created ? { createdAt: created } : {}) })
        .sort({ createdAt: -1 })
        .limit(5000)
        .select("name email phone type sourcePage preferences.destination createdAt")
        .lean();

      return {
        columns: ["Name", "Email", "Phone", "Type", "Destination", "Source page", "Created"],
        rows: rows.map((e) => [
          e.name,
          e.email,
          e.phone,
          e.type,
          e.preferences?.destination ?? "",
          e.sourcePage,
          formatDate(e.createdAt),
        ]),
        rangeLabel: label,
      };
    }

    case "lead-conversion": {
      const rows = await Lead.find({ deletedAt: null, ...(created ? { createdAt: created } : {}) })
        .sort({ createdAt: -1 })
        .limit(5000)
        .select("reference name status estimatedValueINR sourcePage createdAt convertedBooking")
        .lean();

      const total = rows.length;
      const won = rows.filter((r) => r.status === "won").length;
      const lost = rows.filter((r) => r.status === "lost").length;
      const open = total - won - lost;
      const rate = total > 0 ? `${Math.round((won / total) * 100)}%` : "0%";

      return {
        columns: ["Reference", "Name", "Status", "Estimated value (INR)", "Source", "Created", "Converted"],
        rows: [
          ...rows.map((r) => [
            r.reference,
            r.name,
            r.status,
            r.estimatedValueINR ?? 0,
            r.sourcePage,
            formatDate(r.createdAt),
            r.convertedBooking ? "Yes" : "No",
          ]),
          ["", "", "", "", "", "", ""],
          ["Summary", `${total} leads`, `${won} won`, `${lost} lost`, `${open} open`, `Conversion: ${rate}`, ""],
        ],
        rangeLabel: label,
      };
    }

    case "payments": {
      const rows = await Payment.find({ ...(created ? { createdAt: created } : {}) })
        .sort({ createdAt: -1 })
        .limit(5000)
        .populate("booking", "reference guestName")
        .select("booking gateway amountINR status method instalment paidAt createdAt")
        .lean();

      return {
        columns: ["Booking", "Customer", "Gateway", "Amount (INR)", "Status", "Method", "Instalment", "Paid at"],
        rows: rows.map((p) => {
          const booking = p.booking as unknown as { reference?: string; guestName?: string } | null;
          return [
            booking?.reference ?? "",
            booking?.guestName ?? "",
            p.gateway,
            p.amountINR,
            p.status,
            p.method ?? "",
            p.instalment,
            p.paidAt ? formatDate(p.paidAt) : "",
          ];
        }),
        rangeLabel: label,
      };
    }

    case "customers": {
      const rows = await User.find({ deletedAt: null, ...(created ? { createdAt: created } : {}) })
        .sort({ createdAt: -1 })
        .limit(5000)
        .select("name email phone preferredCurrency marketingOptIn lastLoginAt createdAt")
        .lean();

      const bookingCounts = await Booking.aggregate([
        { $match: { deletedAt: null, user: { $ne: null } } },
        { $group: { _id: "$user", count: { $sum: 1 }, totalINR: { $sum: "$pricing.totalINR" } } },
      ]);
      const byUser = new Map(bookingCounts.map((b) => [String(b._id), b]));

      return {
        columns: [
          "Name",
          "Email",
          "Phone",
          "Bookings",
          "Lifetime value (INR)",
          "Marketing opt-in",
          "Last login",
          "Joined",
        ],
        rows: rows.map((u) => {
          const stats = byUser.get(String(u._id));
          return [
            u.name,
            u.email,
            u.phone ?? "",
            stats?.count ?? 0,
            stats?.totalINR ?? 0,
            u.marketingOptIn ? "Yes" : "No",
            u.lastLoginAt ? formatDate(u.lastLoginAt) : "Never",
            formatDate(u.createdAt),
          ];
        }),
        rangeLabel: label,
      };
    }

    case "package-performance": {
      const packages = await Package.find({ deletedAt: null })
        .select("title slug viewCount enquiryCount bookingCount ratingAverage ratingCount status")
        .lean();

      const revenueAgg = await Booking.aggregate([
        {
          $match: {
            deletedAt: null,
            type: "package",
            status: { $in: ["confirmed", "completed"] },
            ...(created ? { createdAt: created } : {}),
          },
        },
        { $group: { _id: "$item.refId", revenueINR: { $sum: "$pricing.totalINR" } } },
      ]);
      const revenueByPackage = new Map(revenueAgg.map((r) => [String(r._id), r.revenueINR as number]));

      const rows = packages
        .map((p) => [
          p.title,
          p.slug,
          p.status,
          p.viewCount ?? 0,
          p.enquiryCount ?? 0,
          p.bookingCount ?? 0,
          revenueByPackage.get(String(p._id)) ?? 0,
          p.ratingAverage ? p.ratingAverage.toFixed(1) : "—",
          p.ratingCount ?? 0,
        ])
        .sort((a, b) => (b[6] as number) - (a[6] as number));

      return {
        columns: [
          "Package",
          "Slug",
          "Status",
          "Views",
          "Enquiries",
          "Bookings",
          "Revenue (INR)",
          "Avg. rating",
          "Reviews",
        ],
        rows,
        rangeLabel: label,
      };
    }
  }
}
