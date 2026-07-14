import type { Metadata } from "next";
import { requireAnyPermission } from "@/lib/session";
import { tryConnectDB } from "@/lib/db";
import { VisaApplication, VisaCountry } from "@/models";
import { VISA_APPLICATION_STATUSES } from "@/models/types";
import { AdminPageHeader, Panel, Table, TableEmpty, Td, Th } from "@/components/admin/ui";
import { FilterBar } from "@/components/admin/filter-bar";
import { VisaApplicationActions } from "@/components/admin/visa-actions";
import { formatDate, formatPrice, serialise, titleCase } from "@/lib/utils";
import type { QueryFilter } from "mongoose";
import type { IVisaApplication, IVisaCountry } from "@/models";

export const metadata: Metadata = { title: "Visa", robots: { index: false } };

export default async function AdminVisaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAnyPermission(["visa:view", "visa:manage"]);
  const canManage = user.permissions?.includes("visa:manage") ?? false;

  const sp = await searchParams;

  if (!(await tryConnectDB())) {
    return (
      <div>
        <AdminPageHeader title="Visa" />
        <p className="rounded-2xl border border-hairline bg-white p-8 text-center text-sm text-muted">
          The database is unreachable.
        </p>
      </div>
    );
  }

  const query: QueryFilter<IVisaApplication> = { deletedAt: null };

  const status = typeof sp.status === "string" ? sp.status : undefined;
  if (status) query.status = status as IVisaApplication["status"];

  const q = typeof sp.q === "string" && sp.q ? sp.q : undefined;
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ reference: rx }, { applicantName: rx }, { email: rx }, { countryName: rx }];
  }

  const [appRows, countryRows, counts] = await Promise.all([
    VisaApplication.find(query).sort({ createdAt: -1 }).limit(100).lean(),
    VisaCountry.find({ deletedAt: null }).select("country slug status visaTypes isPopular").lean(),
    VisaApplication.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const applications = serialise(appRows) as unknown as IVisaApplication[];
  const countries = serialise(countryRows) as unknown as IVisaCountry[];

  const byStatus = Object.fromEntries(
    (counts as { _id: string; count: number }[]).map((c) => [c._id, c.count]),
  );

  return (
    <div>
      <AdminPageHeader
        title="Visa"
        description="Applications we're handling, and the country guidance published on the site."
      />

      <FilterBar
        searchPlaceholder="Search reference, applicant or country…"
        tabs={[
          { key: "", label: "All" },
          ...VISA_APPLICATION_STATUSES.map((s) => ({
            key: s,
            label: titleCase(s.replace(/_/g, " ")),
            count: byStatus[s] ?? 0,
          })),
        ]}
      />

      <Table caption="Visa applications">
        <thead>
          <tr className="border-b border-hairline bg-sand-50">
            <Th>Reference</Th>
            <Th>Applicant</Th>
            <Th>Country</Th>
            <Th>Travel</Th>
            <Th className="text-right">Fee</Th>
            <Th>Status</Th>
            <Th />
          </tr>
        </thead>

        <tbody className="divide-y divide-hairline">
          {applications.length === 0 ? (
            <TableEmpty colSpan={7} message="No visa applications yet." />
          ) : (
            applications.map((a) => (
              <tr key={String(a._id)} className="transition-colors hover:bg-sand-50">
                <Td>
                  <span className="block font-mono text-xs font-bold text-midnight-900">
                    {a.reference}
                  </span>
                  <span className="block text-[0.6875rem] text-muted">
                    {formatDate(a.createdAt)}
                  </span>
                </Td>

                <Td>
                  <span className="block text-sm font-semibold text-midnight-900">
                    {a.applicantName}
                  </span>
                  <span className="block truncate text-xs text-muted">{a.email}</span>
                  <span className="block text-xs text-muted">{a.phone}</span>
                </Td>

                <Td className="text-xs">
                  {a.countryName}
                  <span className="block capitalize text-muted">
                    {a.visaType} · {a.travellerCount} applicant(s)
                  </span>
                </Td>

                <Td className="whitespace-nowrap text-xs">
                  {a.travelDate ? formatDate(a.travelDate) : "—"}
                </Td>

                <Td className="whitespace-nowrap text-right text-sm font-semibold">
                  {formatPrice(a.quotedFeeINR)}
                </Td>

                <Td>
                  <span className="text-xs font-semibold capitalize text-midnight-800">
                    {a.status.replace(/_/g, " ")}
                  </span>
                </Td>

                <Td>
                  {canManage ? (
                    <VisaApplicationActions
                      id={String(a._id)}
                      reference={a.reference}
                      status={a.status}
                    />
                  ) : null}
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      {/* --------------------------- Country guidance --------------------------- */}
      <div className="mt-8">
        <Panel title={`Visa countries (${countries.length})`}>
          {countries.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">
              No country guidance published. Run the seed script to load demo content.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {countries.map((c) => (
                <li
                  key={String(c._id)}
                  className="flex items-center justify-between gap-3 rounded-xl border border-hairline p-3"
                >
                  <div className="min-w-0">
                    <a
                      href={`/visa/${c.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-sm font-semibold text-midnight-900 hover:text-lagoon-700"
                    >
                      {c.country}
                    </a>
                    <span className="block text-xs text-muted">
                      {c.visaTypes?.length ?? 0} visa types
                      {c.isPopular ? " · popular" : ""}
                    </span>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-[0.625rem] font-bold uppercase ${
                      c.status === "published"
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-sand-100 text-midnight-600"
                    }`}
                  >
                    {c.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
