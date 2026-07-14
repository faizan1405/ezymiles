import {
  PenLine,
  BedDouble,
  Receipt,
  Headset,
  ShieldCheck,
  MapPinned,
  Stamp,
  CalendarClock,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/primitives";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import type { Settings } from "@/lib/settings";

const ICONS = {
  "pen-line": PenLine,
  "bed-double": BedDouble,
  receipt: Receipt,
  headset: Headset,
  "shield-check": ShieldCheck,
  "map-pinned": MapPinned,
  stamp: Stamp,
  "calendar-clock": CalendarClock,
} as const;

const DEFAULT_POINTS = [
  {
    icon: "pen-line",
    title: "Itineraries written for you",
    description:
      "Not a template with your name pasted on. We start from your dates, your pace and your budget.",
  },
  {
    icon: "bed-double",
    title: "Stays we've actually vetted",
    description:
      "Every property on our list has been inspected or stayed in. If it slips, it comes off the list.",
  },
  {
    icon: "receipt",
    title: "Transparent pricing",
    description:
      "One price, itemised. Inclusions and exclusions stated plainly before you pay a rupee.",
  },
  {
    icon: "headset",
    title: "24/7 support on the road",
    description:
      "A real person on WhatsApp while you're travelling — not a ticket queue in another timezone.",
  },
  {
    icon: "shield-check",
    title: "Secure, verified payments",
    description:
      "Every payment signature is verified server-side. We never calculate your total in the browser.",
  },
  {
    icon: "map-pinned",
    title: "Local destination experts",
    description:
      "The person planning your trip has been there — and will tell you when it isn't the right season.",
  },
  {
    icon: "stamp",
    title: "Visa guidance",
    description:
      "Document checklists, timelines and lodgement support. The decision stays with the embassy.",
  },
  {
    icon: "calendar-clock",
    title: "Flexible packages",
    description:
      "Add a night, drop a city, change the hotel tier. The itinerary bends before you do.",
  },
] as const;

export function WhyChooseUs({ trustPoints }: { trustPoints?: Settings["homepage"]["trustPoints"] }) {
  const points = trustPoints?.length ? trustPoints : DEFAULT_POINTS;

  return (
    <section className="section-y bg-canvas">
      <div className="container-page">
        <Reveal>
          <SectionHeading
            eyebrow="Why travel with us"
            title="Eight reasons people come back"
            description="No inflated numbers, no invented awards. Just the things we hold ourselves to on every single booking."
            align="center"
            className="text-center"
          />
        </Reveal>

        <RevealGroup as="ul" stagger={0.06} className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {points.map((p) => {
            const Icon = ICONS[p.icon as keyof typeof ICONS] ?? ShieldCheck;
            return (
              <RevealItem as="li" key={p.title}>
                <div className="flex flex-col">
                  <span className="flex size-12 items-center justify-center rounded-2xl wash-ocean text-white shadow-tile">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-5 font-display text-lg leading-snug text-midnight-900">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-[0.875rem] leading-relaxed text-muted">{p.description}</p>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
