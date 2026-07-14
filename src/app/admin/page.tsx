import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock, Eye, Target, AlertTriangle } from "lucide-react";

import { requireAdmin } from "@/lib/session";
import { getDashboardMetrics } from "@/server/admin/metrics";
import { AdminPageHeader, Panel, StatTile, delta } from "@/components/admin/ui";
import { formatDate, formatDateTime, formatPrice, formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminDashboard() {
  await requireAdmin("dashboard:view");
  const m = await getDashboardMetrics();

  const isEmpty =
    m.enquiries.total === 0 && m.bookings.confirmed === 0 && m.leads.total === 0;

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="Everything below is counted straight from the database — no estimates, no padding."
      />

      {isEmpty ? (
        <div className="mb-7 flex items-start gap-3 rounded-2xl border border-dashed border-hairline bg-white p-5">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-midnight-900">Nothing to report yet</p>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted">
              There are no enquiries, leads or bookings in the database. Run{" "}
              <code className="rounded bg-sand-100 px-1.5 py-0.5 font-mono text-xs">npm run seed</code>{" "}
              to load demo content, or wait for real traffic — these tiles will fill themselves.
            </p>
          </div>
        </div>
      ) : null}

      {/* --------------------------------- Tiles --------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Revenue collected"
          value={formatPrice(m.revenue.total, "INR", { compact: true })}
          sub="all time"
          href="/admin/payments"
        />
        <StatTile
          label="Revenue (30 days)"
          value={formatPrice(m.revenue.last30, "INR", { compact: true })}
          delta={delta(m.revenue.last30, m.revenue.prev30)}
          sub="vs previous 30"
          href="/admin/payments"
        />
        <StatTile
          label="Pending collection"
          value={formatPrice(m.revenue.pendingCollection, "INR", { compact: true })}
          sub="balances still due"
          tone={m.revenue.pendingCollection > 0 ? "warning" : "default"}
          href="/admin/bookings?status=pending_payment"
        />
        <StatTile
          label="Conversion rate"
          value={`${m.conversionRate}%`}
          sub="confirmed bookings ÷ leads"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Total enquiries"
          value={formatNumber(m.enquiries.total)}
          delta={delta(m.enquiries.last30, m.enquiries.prev30)}
          sub={`${m.enquiries.last30} in 30 days`}
          href="/admin/leads"
        />
        <StatTile
          label="New leads"
          value={formatNumber(m.leads.new)}
          sub="not yet contacted"
          tone={m.leads.new > 0 ? "warning" : "default"}
          href="/admin/leads?status=new"
        />
        <StatTile
          label="Follow-ups due"
          value={formatNumber(m.leads.followUpDue)}
          sub="overdue or due today"
          tone={m.leads.followUpDue > 0 ? "warning" : "default"}
          href="/admin/leads?due=1"
        />
        <StatTile
          label="Confirmed bookings"
          value={formatNumber(m.bookings.confirmed)}
          sub={`${m.bookings.last30} created in 30 days`}
          tone="success"
          href="/admin/bookings?status=confirmed"
        />
      </div>

      {/* -------------------------------- Panels --------------------------------- */}
      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <Panel
          title="Popular destinations"
          action={
            <Link href="/admin/bookings" className="text-xs font-semibold text-lagoon-700 hover:underline">
              All bookings
            </Link>
          }
        >
          {m.popularDestinations.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No confirmed bookings yet.</p>
          ) : (
            <ol className="space-y-3">
              {m.popularDestinations.map((d, i) => {
                const max = m.popularDestinations[0].bookings || 1;
                return (
                  <li key={d.name} className="flex items-center gap-3">
                    <span className="w-4 shrink-0 text-xs font-bold text-midnight-400">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-midnight-900">
                        {d.name}
                      </span>
                      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-sand-100">
                        <span
                          className="block h-full rounded-full bg-lagoon-500"
                          style={{ width: `${(d.bookings / max) * 100}%` }}
                        />
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-bold tabular-nums text-midnight-700">
                      {d.bookings}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>

        <Panel
          title="Most viewed packages"
          action={
            <Link href="/admin/packages" className="text-xs font-semibold text-lagoon-700 hover:underline">
              Manage
            </Link>
          }
        >
          {m.mostViewedPackages.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No packages published yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {m.mostViewedPackages.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/packages/${p.slug}`}
                    target="_blank"
                    className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-sand-50"
                  >
                    <span className="min-w-0 truncate text-sm text-midnight-800">{p.title}</span>
                    <span className="flex shrink-0 items-center gap-3 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Eye className="size-3.5" aria-hidden />
                        {p.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="size-3.5" aria-hidden />
                        {p.enquiries}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Upcoming departures">
          {m.upcomingDepartures.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No fixed departures scheduled.</p>
          ) : (
            <ul className="space-y-2.5">
              {m.upcomingDepartures.map((d) => (
                <li
                  key={`${d.slug}-${d.date}`}
                  className="flex items-center justify-between gap-3 rounded-xl bg-sand-50 px-3 py-2.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-midnight-900">
                      {d.title}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <CalendarClock className="size-3" aria-hidden />
                      {formatDate(d.date)}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-xs font-bold ${
                      d.seatsLeft <= 4 ? "text-sunset-700" : "text-midnight-700"
                    }`}
                  >
                    {d.seatsLeft} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Booking sources">
          {m.bookingSources.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No bookings yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {m.bookingSources.map((s) => (
                <li key={s.source} className="flex items-center justify-between gap-3">
                  <span className="text-sm capitalize text-midnight-800">{s.source}</span>
                  <span className="text-sm font-bold tabular-nums text-midnight-900">{s.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* --------------------------------- Feed ---------------------------------- */}
      <div className="mt-5">
        <Panel title="Recent activity">
          {m.recentActivity.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Nothing has happened yet.</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {m.recentActivity.map((a, i) => (
                <li key={`${a.href}-${i}`}>
                  <Link
                    href={a.href}
                    className="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-sand-50"
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span
                          className={`size-1.5 shrink-0 rounded-full ${
                            a.kind === "booking" ? "bg-emerald-500" : "bg-lagoon-500"
                          }`}
                          aria-hidden
                        />
                        <span className="truncate text-sm font-medium text-midnight-900">
                          {a.title}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate pl-3.5 text-xs text-muted">
                        {a.subtitle}
                      </span>
                    </span>

                    <span className="flex shrink-0 items-center gap-2 text-xs text-muted">
                      {formatDateTime(a.at)}
                      <ArrowRight className="size-3.5" aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
