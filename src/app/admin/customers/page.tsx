import type { Metadata } from "next";
import { BadgeCheck, AlertCircle } from "lucide-react";

import { requireAnyPermission } from "@/lib/session";
import { tryConnectDB } from "@/lib/db";
import { Booking, User } from "@/models";
import { AdminPageHeader, StatTile, Table, TableEmpty, Td, Th } from "@/components/admin/ui";
import { FilterBar } from "@/components/admin/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { buildQueryString, daysFromNow, formatDate, formatPrice, initials, serialise } from "@/lib/utils";
import type { QueryFilter } from "mongoose";
import type { IUser } from "@/models";

export const metadata: Metadata = { title: "Customers", robots: { index: false } };

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAnyPermission(["customers:view", "customers:manage"]);
  const sp = await searchParams;

  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1) || 1);
  const pageSize = 25;

  if (!(await tryConnectDB())) {
    return (
      <div>
        <AdminPageHeader title="Customers" />
        <p className="rounded-2xl border border-hairline bg-white p-8 text-center text-sm text-muted">
          The database is unreachable.
        </p>
      </div>
    );
  }

  const query: QueryFilter<IUser> = { deletedAt: null };

  const q = typeof sp.q === "string" && sp.q ? sp.q : undefined;
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const [rows, total, verified, thirtyDay] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    User.countDocuments(query),
    User.countDocuments({ deletedAt: null, emailVerified: { $ne: null } }),
    User.countDocuments({
      deletedAt: null,
      createdAt: { $gte: daysFromNow(-30) },
    }),
  ]);

  const customers = serialise(rows) as unknown as IUser[];

  // Lifetime value in one aggregate rather than a query per customer.
  const spend = await Booking.aggregate([
    {
      $match: {
        user: { $in: customers.map((c) => c._id) },
        status: { $in: ["confirmed", "completed"] },
        deletedAt: null,
      },
    },
    {
      $group: {
        _id: "$user",
        total: { $sum: "$payment.amountPaidINR" },
        bookings: { $sum: 1 },
      },
    },
  ]);

  const spendMap = new Map(
    (spend as { _id: string; total: number; bookings: number }[]).map((s) => [
      String(s._id),
      { total: s.total, bookings: s.bookings },
    ]),
  );

  const buildHref = (next: number) => {
    const params: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(sp)) {
      if (key !== "page" && typeof value === "string") params[key] = value;
    }
    return `/admin/customers${buildQueryString({ ...params, page: next })}`;
  };

  return (
    <div>
      <AdminPageHeader title="Customers" description="Registered travellers and what they've booked." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatTile label="Total customers" value={total} />
        <StatTile label="Email verified" value={verified} tone="success" />
        <StatTile label="New (30 days)" value={thirtyDay} />
      </div>

      <FilterBar searchPlaceholder="Search name, email or phone…" />

      <Table caption="Customers">
        <thead>
          <tr className="border-b border-hairline bg-sand-50">
            <Th>Customer</Th>
            <Th>Contact</Th>
            <Th>Joined</Th>
            <Th className="text-right">Bookings</Th>
            <Th className="text-right">Lifetime spend</Th>
            <Th>Marketing</Th>
          </tr>
        </thead>

        <tbody className="divide-y divide-hairline">
          {customers.length === 0 ? (
            <TableEmpty colSpan={6} message="No customers yet." />
          ) : (
            customers.map((c) => {
              const stats = spendMap.get(String(c._id));

              return (
                <tr key={String(c._id)} className="transition-colors hover:bg-sand-50">
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-midnight-900 text-[0.6875rem] font-bold text-white">
                        {initials(c.name)}
                      </span>

                      <div className="min-w-0">
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-midnight-900">
                          {c.name}
                          {c.emailVerified ? (
                            <BadgeCheck className="size-3.5 text-lagoon-600" aria-label="Verified" />
                          ) : (
                            <AlertCircle className="size-3.5 text-amber-500" aria-label="Unverified" />
                          )}
                        </span>
                        <span className="block text-xs text-muted">
                          {c.nationality ?? "—"}
                        </span>
                      </div>
                    </div>
                  </Td>

                  <Td>
                    <span className="block truncate text-xs text-midnight-800">{c.email}</span>
                    <span className="block text-xs text-muted">{c.phone ?? "—"}</span>
                  </Td>

                  <Td className="whitespace-nowrap text-xs">{formatDate(c.createdAt)}</Td>

                  <Td className="text-right text-sm font-semibold">{stats?.bookings ?? 0}</Td>

                  <Td className="whitespace-nowrap text-right text-sm font-semibold">
                    {stats?.total ? formatPrice(stats.total, "INR", { compact: true }) : "—"}
                  </Td>

                  <Td>
                    <span className="flex flex-wrap gap-1">
                      {c.marketingOptIn ? (
                        <span className="rounded bg-lagoon-50 px-1.5 py-0.5 text-[0.5625rem] font-bold uppercase text-lagoon-800">
                          Email
                        </span>
                      ) : null}
                      {c.whatsappOptIn ? (
                        <span className="rounded bg-lagoon-50 px-1.5 py-0.5 text-[0.5625rem] font-bold uppercase text-lagoon-800">
                          WhatsApp
                        </span>
                      ) : null}
                      {!c.marketingOptIn && !c.whatsappOptIn ? (
                        <span className="text-xs text-muted">Opted out</span>
                      ) : null}
                    </span>
                  </Td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>

      <Pagination
        page={page}
        totalPages={Math.ceil(total / pageSize)}
        buildHref={buildHref}
        className="mt-8"
      />
    </div>
  );
}
