import Link from "next/link";
import { Users, CalendarCheck, TrendingUp, ArrowRight } from "lucide-react";
import { CountUp, Reveal } from "@/components/ui/reveal";
import { formatDate } from "@/lib/utils";

interface LiveActivityData {
  recentDestinations: { title: string; count: number }[];
  upcomingDepartures: { title: string; slug: string; date: string; seatsLeft: number; seatsTotal: number }[];
  confirmedTravellers: number;
  upcomingTours: number;
}

/**
 * Social proof, but honest.
 *
 * Everything here is counted straight from the bookings collection. If there are
 * no confirmed bookings yet, the section renders nothing rather than inventing
 * "someone in Mumbai just booked" notifications.
 */
export function LiveActivity({ data }: { data: LiveActivityData | null }) {
  if (!data) return null;

  const hasSignal =
    data.confirmedTravellers > 0 ||
    data.upcomingDepartures.length > 0 ||
    data.recentDestinations.length > 0;

  if (!hasSignal) return null;

  return (
    <section className="border-y border-hairline bg-white py-14">
      <div className="container-page">
        <Reveal>
          <div className="grid gap-10 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-16">
            {/* Counters */}
            <dl className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:gap-12">
              <Stat
                icon={<Users aria-hidden />}
                value={data.confirmedTravellers}
                label="Confirmed bookings"
                note="All-time, from our database"
              />
              <Stat
                icon={<CalendarCheck aria-hidden />}
                value={data.upcomingTours}
                label="Trips departing soon"
                note="Confirmed and upcoming"
              />
              <Stat
                icon={<TrendingUp aria-hidden />}
                value={data.recentDestinations.length}
                label="Destinations booked"
                note="In the last 30 days"
                className="col-span-2 sm:col-span-1"
              />
            </dl>

            {/* Upcoming fixed departures */}
            {data.upcomingDepartures.length ? (
              <div className="min-w-0">
                <h3 className="text-eyebrow mb-4 text-lagoon-700">Group departures filling now</h3>
                <ul className="divide-y divide-hairline rounded-2xl border border-hairline">
                  {data.upcomingDepartures.map((d) => {
                    const pct = d.seatsTotal
                      ? Math.round(((d.seatsTotal - d.seatsLeft) / d.seatsTotal) * 100)
                      : 0;
                    return (
                      <li key={`${d.slug}-${d.date}`}>
                        <Link
                          href={`/packages/${d.slug}`}
                          className="group flex items-center gap-4 p-4 transition-colors hover:bg-sand-50"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-midnight-900 group-hover:text-lagoon-800">
                              {d.title}
                            </p>
                            <p className="mt-0.5 text-xs text-muted">
                              Departs {formatDate(d.date)} ·{" "}
                              <span className={d.seatsLeft <= 4 ? "font-semibold text-sunset-700" : ""}>
                                {d.seatsLeft} of {d.seatsTotal} seats left
                              </span>
                            </p>
                            <div
                              className="mt-2 h-1 overflow-hidden rounded-full bg-sand-200"
                              role="progressbar"
                              aria-valuenow={pct}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`${pct}% booked`}
                            >
                              <div
                                className="h-full rounded-full bg-lagoon-500 transition-[width] duration-700"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                          <ArrowRight
                            className="size-4 shrink-0 text-midnight-400 transition-transform group-hover:translate-x-1"
                            aria-hidden
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Stat({
  icon,
  value,
  label,
  note,
  className,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  note: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="flex items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-wider text-muted">
        <span className="text-lagoon-600 [&_svg]:size-4">{icon}</span>
        {label}
      </dt>
      <dd className="mt-2 font-display text-4xl text-midnight-900">
        <CountUp to={value} />
      </dd>
      <p className="mt-1 text-xs text-muted">{note}</p>
    </div>
  );
}
