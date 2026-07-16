import type { Metadata } from "next";
import { Plane, Radio, FlaskConical, ArrowRight } from "lucide-react";

import { requireAdmin } from "@/lib/session";
import { tryConnectDB } from "@/lib/db";
import { FlightBooking, FlightSearch } from "@/models";
import { integrations } from "@/lib/env";
import { AdminPageHeader, Panel, StatTile, Table, TableEmpty, Td, Th } from "@/components/admin/ui";
import { DataSourceBadge } from "@/components/flights/data-source-badge";
import { formatDateTime, formatPrice, serialise } from "@/lib/utils";
import type { IFlightBooking, IFlightSearch } from "@/models";

export const metadata: Metadata = { title: "Flights", robots: { index: false } };

export default async function AdminFlightsPage() {
  await requireAdmin("flights:manage");

  const isLive = integrations.liveFlights;

  if (!(await tryConnectDB())) {
    return (
      <div>
        <AdminPageHeader title="Flights" />
        <p className="rounded-2xl border border-hairline bg-white p-8 text-center text-sm text-muted">
          The database is unreachable.
        </p>
      </div>
    );
  }

  const [searchRows, bookingRows, totalSearches, popularRoutes] = await Promise.all([
    FlightSearch.find({}).sort({ createdAt: -1 }).limit(20).lean(),
    FlightBooking.find({}).sort({ createdAt: -1 }).limit(20).lean(),
    FlightSearch.countDocuments({}),
    FlightSearch.aggregate([
      { $unwind: "$legs" },
      {
        $group: {
          _id: { from: "$legs.from", to: "$legs.to" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
  ]);

  const searches = serialise(searchRows) as unknown as IFlightSearch[];
  const bookings = serialise(bookingRows) as unknown as IFlightBooking[];

  return (
    <div>
      <AdminPageHeader
        title="Flights"
        description="Provider status, what travellers are searching for, and every flight booking taken."
      />

      {/* ----------------------------- Provider status ---------------------------- */}
      <div
        className={`mb-6 flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${
          isLive ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
        }`}
      >
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${
              isLive ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
            }`}
          >
            {isLive ? (
              <Radio className="size-4" aria-hidden />
            ) : (
              <FlaskConical className="size-4" aria-hidden />
            )}
          </span>

          <div>
            <p className="text-sm font-bold text-midnight-900">
              {isLive
                ? "Live supplier connected"
                : "No flight supplier connected — serving demo inventory"}
            </p>
            <p className="mt-1 max-w-2xl text-[0.8125rem] leading-relaxed text-muted">
              {isLive
                ? "Fares come from your contracted supplier and are re-confirmed on the server before any payment is taken."
                : "Search returns deterministic demo itineraries, labelled as demo data everywhere they appear. They cannot be ticketed. To go live: implement the FlightProvider interface in src/server/flights/, set FLIGHT_PROVIDER=amadeus, and add your credentials. Nothing in the UI or booking flow changes."}
            </p>
          </div>
        </div>

        <DataSourceBadge source={isLive ? "live" : "demo"} className="shrink-0" />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatTile label="Total searches" value={totalSearches} sub="all time" />
        <StatTile label="Flight bookings" value={bookings.length} sub="most recent 20 shown" />
        <StatTile
          label="Provider"
          value={isLive ? "Amadeus" : "Demo"}
          sub={isLive ? "live inventory" : "not ticketable"}
          tone={isLive ? "success" : "warning"}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ------------------------------ Popular routes ---------------------------- */}
        <Panel title="Most searched routes">
          {popularRoutes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No searches recorded yet.</p>
          ) : (
            <ol className="space-y-2.5">
              {(popularRoutes as { _id: { from: string; to: string }; count: number }[]).map(
                (route, i) => (
                  <li
                    key={`${route._id.from}-${route._id.to}`}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <span className="w-4 text-xs font-bold text-midnight-400">{i + 1}</span>
                      <span className="flex items-center gap-1.5 font-mono font-semibold text-midnight-900">
                        {route._id.from}
                        <ArrowRight className="size-3 text-lagoon-600" aria-hidden />
                        {route._id.to}
                      </span>
                    </span>
                    <span className="text-sm font-bold tabular-nums text-midnight-700">
                      {route.count}
                    </span>
                  </li>
                ),
              )}
            </ol>
          )}
        </Panel>

        {/* ------------------------------ Recent searches --------------------------- */}
        <Panel title="Recent searches">
          {searches.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No searches recorded yet.</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {searches.slice(0, 8).map((s) => (
                <li key={String(s._id)} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 font-mono text-sm font-semibold text-midnight-900">
                      {s.legs[0]?.from}
                      <ArrowRight className="size-3 text-lagoon-600" aria-hidden />
                      {s.legs[0]?.to}
                    </span>
                    <span className="block text-[0.6875rem] text-muted">
                      {s.adults}A
                      {s.children ? ` ${s.children}C` : ""}
                      {s.infants ? ` ${s.infants}I` : ""} · {s.cabinClass.replace("_", " ")} ·{" "}
                      {s.resultCount} results
                    </span>
                  </span>

                  <span className="shrink-0 text-[0.6875rem] text-muted">
                    {formatDateTime(s.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* ----------------------------- Flight bookings ---------------------------- */}
      <div className="mt-8">
        <h2 className="mb-4 text-sm font-bold text-midnight-900">Flight bookings</h2>

        <Table caption="Flight bookings">
          <thead>
            <tr className="border-b border-hairline bg-sand-50">
              <Th>Route</Th>
              <Th>Airline</Th>
              <Th>Departs</Th>
              <Th className="text-right">Fare</Th>
              <Th>Source</Th>
              <Th>PNR</Th>
            </tr>
          </thead>

          <tbody className="divide-y divide-hairline">
            {bookings.length === 0 ? (
              <TableEmpty colSpan={6} message="No flight bookings yet." />
            ) : (
              bookings.map((b) => {
                const first = b.segments[0];
                const last = b.segments[b.segments.length - 1];

                return (
                  <tr key={String(b._id)} className="transition-colors hover:bg-sand-50">
                    <Td>
                      <span className="flex items-center gap-1.5 font-mono text-sm font-semibold text-midnight-900">
                        <Plane className="size-3.5 text-lagoon-600" aria-hidden />
                        {first?.from} → {last?.to}
                      </span>
                      <span className="block text-[0.6875rem] capitalize text-muted">
                        {b.tripType.replace("_", " ")}
                      </span>
                    </Td>

                    <Td className="text-xs">
                      {first?.airlineName}
                      <span className="block text-muted">{first?.flightNumber}</span>
                    </Td>

                    <Td className="whitespace-nowrap text-xs">
                      {first ? formatDateTime(first.departAt) : "—"}
                    </Td>

                    <Td className="whitespace-nowrap text-right text-sm font-semibold">
                      {formatPrice(b.fare?.totalINR ?? 0)}
                    </Td>

                    <Td>
                      <DataSourceBadge source={b.dataSource} />
                    </Td>

                    <Td className="font-mono text-xs">{b.pnr ?? "—"}</Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
