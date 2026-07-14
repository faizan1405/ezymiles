import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { getReport, REPORT_KEYS, type ReportKey } from "@/server/admin/reports";
import { AdminPageHeader } from "@/components/admin/ui";
import { ReportViewer } from "@/components/admin/report-viewer";

export const metadata: Metadata = { title: "Reports & export", robots: { index: false } };

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("dashboard:view");

  const sp = await searchParams;
  const typeParam = typeof sp.type === "string" ? sp.type : "bookings";
  const type: ReportKey = (REPORT_KEYS as readonly string[]).includes(typeParam)
    ? (typeParam as ReportKey)
    : "bookings";
  const from = typeof sp.from === "string" ? sp.from : undefined;
  const to = typeof sp.to === "string" ? sp.to : undefined;

  const report = await getReport(type, { from, to });

  return (
    <div>
      <AdminPageHeader
        title="Reports & export"
        description="Generated live from the database for the selected range — export as CSV, or print to save as PDF."
      />

      <ReportViewer
        reportKey={type}
        columns={report.columns}
        rows={report.rows}
        rangeLabel={report.rangeLabel}
        dbUnreachable={report.dbUnreachable}
      />
    </div>
  );
}
