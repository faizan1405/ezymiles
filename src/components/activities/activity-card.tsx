import Link from "next/link";
import { Clock, MapPin, Zap } from "lucide-react";
import type { ActivityCardDTO } from "@/types";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge, Rating } from "@/components/ui/primitives";
import { Price } from "@/components/ui/price";
import { formatMinutes, percentOff } from "@/lib/utils";

export function ActivityCard({ activity: a }: { activity: ActivityCardDTO }) {
  const discount = a.originalPriceINR ? percentOff(a.originalPriceINR, a.pricePerAdultINR) : 0;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-surface shadow-tile transition-all duration-500 hover:-translate-y-1 hover:shadow-lift motion-reduce:hover:translate-y-0">
      <div className="relative aspect-4/3 overflow-hidden">
        <SmartImage
          src={a.heroImage}
          alt={a.heroAlt}
          fill
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:group-hover:scale-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight-950/50 to-transparent" />

        {discount > 0 ? (
          <Badge tone="sunset" size="sm" className="absolute left-3 top-3 bg-sunset-600 text-white">
            {discount}% off
          </Badge>
        ) : null}

        <p className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-medium text-white">
          <MapPin className="size-3.5" aria-hidden />
          {a.city}
        </p>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[0.625rem] font-bold uppercase tracking-widest text-lagoon-700">
          {a.category.replace(/-/g, " ")}
        </p>

        <h3 className="mt-1.5 font-display text-base leading-snug text-midnight-900">
          <Link href={`/activities/${a.slug}`} className="after:absolute after:inset-0 hover:text-lagoon-800">
            {a.title}
          </Link>
        </h3>

        <p className="mt-2 line-clamp-2 text-[0.8125rem] leading-relaxed text-muted">{a.summary}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {formatMinutes(a.durationMinutes)}
          </span>
          {a.instantConfirmation ? (
            <span className="flex items-center gap-1 font-semibold text-emerald-700">
              <Zap className="size-3.5" aria-hidden />
              Instant
            </span>
          ) : null}
          {a.ratingCount > 0 ? <Rating value={a.ratingAverage} count={a.ratingCount} /> : null}
        </div>

        <div className="mt-auto pt-4">
          <Price amountINR={a.pricePerAdultINR} original={a.originalPriceINR} className="text-lg" />
          <p className="mt-0.5 text-[0.625rem] text-muted">
            per person{a.isDemoData ? " · demo pricing" : ""}
          </p>
        </div>
      </div>
    </article>
  );
}
