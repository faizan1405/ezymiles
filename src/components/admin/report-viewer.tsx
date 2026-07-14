"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, Input } from "@/components/ui/field";
import { Table, TableEmpty, Th, Td } from "./ui";
import { REPORT_KEYS, REPORT_LABELS, type ReportKey } from "@/server/admin/reports";

/** Minimal CSV writer — quotes any field containing a comma, quote or newline. */
function toCsv(columns: string[], rows: (string | number)[][]): string {
  const escape = (value: string | number) => {
    const s = String(value ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [columns, ...rows].map((row) => row.map(escape).join(",")).join("\n");
}

export function ReportViewer({
  reportKey,
  columns,
  rows,
  rangeLabel,
  dbUnreachable,
}: {
  reportKey: ReportKey;
  columns: string[];
  rows: (string | number)[][];
  rangeLabel: string;
  dbUnreachable?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const push = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.push(`${pathname}?${next.toString()}`);
  };

  const exportCsv = () => {
    const csv = toCsv(columns, rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportKey}-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="no-print mb-5 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="report-type" className="mb-1 block text-xs font-semibold text-midnight-700">
            Report
          </label>
          <Select
            id="report-type"
            value={reportKey}
            onChange={(e) => push({ type: e.target.value })}
            className="h-10 w-56"
          >
            {REPORT_KEYS.map((k) => (
              <option key={k} value={k}>
                {REPORT_LABELS[k]}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="report-from" className="mb-1 block text-xs font-semibold text-midnight-700">
            From
          </label>
          <Input
            id="report-from"
            type="date"
            defaultValue={params.get("from") ?? ""}
            onChange={(e) => push({ from: e.target.value || undefined })}
            className="h-10"
          />
        </div>

        <div>
          <label htmlFor="report-to" className="mb-1 block text-xs font-semibold text-midnight-700">
            To
          </label>
          <Input
            id="report-to"
            type="date"
            defaultValue={params.get("to") ?? ""}
            onChange={(e) => push({ to: e.target.value || undefined })}
            className="h-10"
          />
        </div>

        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer aria-hidden />
            Print / Save as PDF
          </Button>
          <Button variant="accent" onClick={exportCsv} disabled={rows.length === 0}>
            <Download aria-hidden />
            Export CSV
          </Button>
        </div>
      </div>

      <p className="mb-3 text-xs text-muted">
        {rangeLabel} · {rows.length} row{rows.length === 1 ? "" : "s"}
      </p>

      {dbUnreachable ? (
        <p className="rounded-2xl border border-hairline bg-white p-8 text-center text-sm text-muted">
          The database is unreachable.
        </p>
      ) : (
        <Table caption={`${REPORT_LABELS[reportKey]} report`}>
          <thead>
            <tr className="border-b border-hairline bg-sand-50">
              {columns.map((c) => (
                <Th key={c}>{c}</Th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {rows.length === 0 ? (
              <TableEmpty colSpan={columns.length || 1} message="No data for this range." />
            ) : (
              rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <Td key={j} className="whitespace-nowrap">
                      {cell}
                    </Td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}
    </div>
  );
}
