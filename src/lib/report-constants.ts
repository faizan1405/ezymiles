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
