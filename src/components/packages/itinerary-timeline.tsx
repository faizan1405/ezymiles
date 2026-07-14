"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ChevronDown,
  MapPin,
  BedDouble,
  Car,
  Ticket,
  Coffee,
  UtensilsCrossed,
  Moon,
  Plus,
} from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { cn } from "@/lib/utils";
import type { IItineraryDay } from "@/models";

const MEAL_META = {
  breakfast: { label: "Breakfast", Icon: Coffee },
  lunch: { label: "Lunch", Icon: UtensilsCrossed },
  dinner: { label: "Dinner", Icon: Moon },
} as const;

/**
 * Day-by-day timeline.
 *
 * The first day opens by default; the rest expand on demand so the page doesn't
 * open as a wall of text. Each row is a real disclosure widget (button +
 * aria-expanded + region), so it works on a keyboard and reads correctly.
 */
export function ItineraryTimeline({ days }: { days: IItineraryDay[] }) {
  const [open, setOpen] = React.useState<number[]>(days.length ? [days[0].day] : []);
  const reduced = useReducedMotion();

  if (!days.length) {
    return (
      <p className="rounded-2xl border border-dashed border-hairline bg-sand-50 p-6 text-sm text-muted">
        The day-by-day itinerary for this trip is being finalised. Ask us and we&apos;ll send it over.
      </p>
    );
  }

  const toggle = (day: number) =>
    setOpen((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));

  const allOpen = open.length === days.length;

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <button
          type="button"
          onClick={() => setOpen(allOpen ? [] : days.map((d) => d.day))}
          className="text-sm font-semibold text-lagoon-700 hover:underline"
        >
          {allOpen ? "Collapse all days" : "Expand all days"}
        </button>
      </div>

      <ol className="relative">
        {/* The spine */}
        <span
          className="absolute bottom-4 left-[1.375rem] top-4 w-px bg-gradient-to-b from-lagoon-300 via-hairline to-transparent"
          aria-hidden
        />

        {days.map((day, i) => {
          const isOpen = open.includes(day.day);
          const panelId = `itinerary-day-${day.day}`;

          return (
            <motion.li
              key={day.day}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: reduced ? 0 : Math.min(i * 0.04, 0.3) }}
              className="relative pb-3 pl-14 last:pb-0"
            >
              {/* Node */}
              <span
                className={cn(
                  "absolute left-0 top-3 flex size-11 items-center justify-center rounded-full border-4 border-canvas text-[0.8125rem] font-bold transition-colors duration-300",
                  isOpen ? "bg-midnight-900 text-white" : "bg-sand-200 text-midnight-700",
                )}
                aria-hidden
              >
                {day.day}
              </span>

              <div
                className={cn(
                  "overflow-hidden rounded-2xl border transition-colors duration-300",
                  isOpen ? "border-lagoon-200 bg-white shadow-tile" : "border-hairline bg-white",
                )}
              >
                <h3>
                  <button
                    type="button"
                    onClick={() => toggle(day.day)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex w-full items-start justify-between gap-4 p-5 text-left"
                  >
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[0.625rem] font-bold uppercase tracking-widest text-lagoon-700">
                          Day {day.day}
                        </span>
                        {day.city ? (
                          <span className="flex items-center gap-1 text-[0.6875rem] text-muted">
                            <MapPin className="size-3" aria-hidden />
                            {day.city}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1.5 block font-display text-lg leading-snug text-midnight-900">
                        {day.title}
                      </span>
                    </span>

                    <ChevronDown
                      className={cn(
                        "mt-1 size-5 shrink-0 text-midnight-400 transition-transform duration-300",
                        isOpen && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </button>
                </h3>

                <motion.div
                  id={panelId}
                  role="region"
                  initial={false}
                  animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                  transition={{ duration: reduced ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-hairline p-5">
                    {day.description ? (
                      <p className="text-[0.9375rem] leading-relaxed text-muted">{day.description}</p>
                    ) : null}

                    {day.images?.length ? (
                      <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto">
                        {day.images.map((img, idx) => (
                          <div
                            key={`${img.url}-${idx}`}
                            className="relative aspect-4/3 w-48 shrink-0 overflow-hidden rounded-xl"
                          >
                            <SmartImage
                              src={img.url}
                              alt={img.alt || `${day.title} — image ${idx + 1}`}
                              fill
                              sizes="192px"
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {/* Facts */}
                    <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                      {day.hotel ? (
                        <Fact icon={<BedDouble aria-hidden />} label="Stay" value={day.hotel} />
                      ) : null}
                      {day.transfers ? (
                        <Fact icon={<Car aria-hidden />} label="Transfers" value={day.transfers} />
                      ) : null}
                      {day.meals?.length ? (
                        <Fact
                          icon={<UtensilsCrossed aria-hidden />}
                          label="Meals"
                          value={day.meals.map((m) => MEAL_META[m]?.label ?? m).join(", ")}
                        />
                      ) : null}
                      {day.activities?.length ? (
                        <Fact
                          icon={<Ticket aria-hidden />}
                          label="Included today"
                          value={day.activities.join(" · ")}
                        />
                      ) : null}
                    </dl>

                    {day.optionalExperiences?.length ? (
                      <div className="mt-5 rounded-xl bg-sand-50 p-4">
                        <p className="mb-2 flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-wider text-midnight-700">
                          <Plus className="size-3.5" aria-hidden />
                          Optional add-ons
                        </p>
                        <ul className="flex flex-wrap gap-2">
                          {day.optionalExperiences.map((exp) => (
                            <li
                              key={exp}
                              className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-midnight-700"
                            >
                              {exp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-sand-100 text-lagoon-700 [&_svg]:size-4">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-[0.625rem] font-bold uppercase tracking-wider text-muted">{label}</dt>
        <dd className="text-[0.8125rem] font-medium text-midnight-800">{value}</dd>
      </div>
    </div>
  );
}
