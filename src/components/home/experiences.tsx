import Link from "next/link";
import {
  Mountain,
  Waves,
  FerrisWheel,
  Bird,
  Landmark,
  Ship,
  Martini,
  Flower2,
  Utensils,
  Camera,
  ArrowUpRight,
} from "lucide-react";
import { ACTIVITY_CATEGORIES } from "@/config/site";
import { SectionHeading } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";

const ICONS = {
  mountain: Mountain,
  waves: Waves,
  "ferris-wheel": FerrisWheel,
  bird: Bird,
  landmark: Landmark,
  ship: Ship,
  martini: Martini,
  "flower-2": Flower2,
  utensils: Utensils,
  camera: Camera,
} as const;

const BLURBS: Record<string, string> = {
  adventure: "Ridge walks, rafting, via ferrata",
  "water-sports": "Dives, reefs, quiet lagoons",
  "theme-parks": "Skip-the-queue, family-tested",
  wildlife: "Ethical safaris, real guides",
  "cultural-tours": "Old towns, with someone who knows",
  cruises: "Sunset sails and island hops",
  nightlife: "Rooftops, not tourist traps",
  wellness: "Retreats, hot springs, silence",
  "food-experiences": "Markets, home kitchens, tastings",
  sightseeing: "The classics, done properly",
};

export function Experiences() {
  return (
    <section className="section-y wash-ivory">
      <div className="container-page">
        <Reveal>
          <SectionHeading
            eyebrow="Experiences"
            title="The bit you'll actually remember"
            description="Hotels blur together. Days don't. Book the experiences on their own, or fold them into a package."
            action={
              <Button asChild variant="outline">
                <Link href="/activities">
                  Browse experiences
                  <ArrowUpRight aria-hidden />
                </Link>
              </Button>
            }
          />
        </Reveal>

        <RevealGroup as="ul" className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {ACTIVITY_CATEGORIES.map((c) => {
            const Icon = ICONS[c.icon as keyof typeof ICONS] ?? Camera;
            return (
              <RevealItem as="li" key={c.slug}>
                <Link
                  href={`/activities?category=${c.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-hairline bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-lagoon-200 hover:shadow-lift motion-reduce:hover:translate-y-0"
                >
                  <span className="flex size-11 items-center justify-center rounded-xl bg-sand-100 text-lagoon-700 transition-colors duration-300 group-hover:bg-lagoon-600 group-hover:text-white">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-display text-base text-midnight-900">{c.label}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{BLURBS[c.slug]}</p>
                </Link>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
