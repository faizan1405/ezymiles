"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plane,
  UtensilsCrossed,
  Ticket,
  Car,
  Stamp,
  Clock,
  MapPin,
  Zap,
  Users,
} from "lucide-react";
import type { PackageCardDTO } from "@/types";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge, Rating } from "@/components/ui/primitives";
import { Price } from "@/components/ui/price";
import { Button } from "@/components/ui/button";
import { WishlistButton } from "./wishlist-button";
import { CallbackDialog } from "@/components/forms/callback-dialog";
import { cn, formatDuration, percentOff } from "@/lib/utils";

const INCLUSION_ICONS = [
  { key: "flightsIncluded", Icon: Plane, label: "Flights included" },
  { key: "mealsIncluded", Icon: UtensilsCrossed, label: "Meals included" },
  { key: "activitiesIncluded", Icon: Ticket, label: "Activities included" },
  { key: "transfersIncluded", Icon: Car, label: "Transfers included" },
  { key: "visaIncluded", Icon: Stamp, label: "Visa assistance included" },
] as const;

export function PackageCard({
  pkg,
  layout = "grid",
  className,
}: {
  pkg: PackageCardDTO;
  layout?: "grid" | "list";
  className?: string;
}) {
  const [callbackOpen, setCallbackOpen] = React.useState(false);
  const discount = pkg.originalPriceINR ? percentOff(pkg.originalPriceINR, pkg.startingPriceINR) : 0;
  const isList = layout === "list";

  return (
    <>
      <article
        className={cn(
          "group relative flex overflow-hidden rounded-2xl border border-hairline bg-surface shadow-tile transition-all duration-500",
          "hover:-translate-y-1 hover:shadow-lift motion-reduce:hover:translate-y-0",
          isList ? "flex-col sm:flex-row" : "h-full flex-col",
          className,
        )}
      >
        {/* ---------------------------------- Media --------------------------------- */}
        <div
          className={cn(
            "relative shrink-0 overflow-hidden",
            isList ? "aspect-16/10 sm:aspect-auto sm:w-72 lg:w-80" : "aspect-4/3",
          )}
        >
          <SmartImage
            src={pkg.heroImage}
            alt={pkg.heroAlt}
            fill
            sizes={isList ? "(max-width: 640px) 100vw, 320px" : "(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"}
            className="object-cover transition-transform duration-700 group-hover:scale-[1.06] motion-reduce:group-hover:scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-midnight-950/55 via-transparent to-transparent" />

          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {discount > 0 ? (
              <Badge tone="sunset" size="sm" className="bg-sunset-600 text-white">
                {discount}% off
              </Badge>
            ) : null}
            {pkg.isBestseller ? (
              <Badge tone="gold" size="sm" className="bg-gild-400 text-midnight-950">
                Bestseller
              </Badge>
            ) : null}
            {pkg.isTrending && !pkg.isBestseller ? (
              <Badge tone="ink" size="sm">
                Trending
              </Badge>
            ) : null}
          </div>

          <div className="absolute right-3 top-3">
            <WishlistButton packageId={pkg.id} title={pkg.title} />
          </div>

          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-medium text-white">
            <MapPin className="size-3.5" aria-hidden />
            <span className="truncate">
              {pkg.citiesCovered.length
                ? pkg.citiesCovered.slice(0, 3).join(" · ")
                : pkg.destinationName}
            </span>
          </div>
        </div>

        {/* --------------------------------- Content -------------------------------- */}
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-lagoon-700">
                {pkg.destinationName || (pkg.scope === "domestic" ? "India" : "International")}
              </p>
              <h3 className="mt-1.5 font-display text-lg leading-snug text-midnight-900">
                <Link
                  href={`/packages/${pkg.slug}`}
                  className="after:absolute after:inset-0 after:content-[''] hover:text-lagoon-800"
                >
                  {pkg.title}
                </Link>
              </h3>
            </div>
            {pkg.ratingCount > 0 ? (
              <div className="shrink-0">
                <Rating value={pkg.ratingAverage} count={pkg.ratingCount} />
              </div>
            ) : null}
          </div>

          {isList && pkg.subtitle ? (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{pkg.subtitle}</p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" aria-hidden />
              {formatDuration(pkg.durationDays, pkg.durationNights)}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5" aria-hidden />
              {pkg.tripStyle === "group" ? "Group departure" : "Private trip"}
            </span>
            {pkg.instantConfirmation ? (
              <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                <Zap className="size-3.5" aria-hidden />
                Instant confirmation
              </span>
            ) : null}
          </div>

          {/* Inclusions */}
          <ul className="mt-3.5 flex flex-wrap gap-1.5">
            {INCLUSION_ICONS.filter(({ key }) => pkg[key]).map(({ key, Icon, label }) => (
              <li key={key}>
                <span
                  className="flex size-7 items-center justify-center rounded-lg bg-sand-100 text-midnight-600"
                  title={label}
                >
                  <Icon className="size-3.5" aria-hidden />
                  <span className="sr-only">{label}</span>
                </span>
              </li>
            ))}
            <li>
              <span className="flex h-7 items-center rounded-lg bg-sand-100 px-2 text-[0.6875rem] font-semibold text-midnight-600">
                {pkg.hotelCategory}★ stays
              </span>
            </li>
          </ul>

          {/* Price + actions */}
          <div className="mt-auto pt-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <Price
                  amountINR={pkg.startingPriceINR}
                  original={pkg.originalPriceINR}
                  className="text-xl"
                />
                <p className="mt-0.5 text-[0.6875rem] text-muted">
                  {pkg.priceBasis === "per_couple" ? "per couple" : "per person"}
                  {pkg.isDemoData ? " · demo pricing" : ""}
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-4 flex gap-2">
              <Button asChild size="sm" variant="primary" className="flex-1">
                <Link href={`/packages/${pkg.slug}`}>View details</Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => setCallbackOpen(true)}
              >
                Request callback
              </Button>
            </div>
          </div>
        </div>
      </article>

      <CallbackDialog
        open={callbackOpen}
        onOpenChange={setCallbackOpen}
        subject={{ kind: "package", refId: pkg.id, title: pkg.title, slug: pkg.slug }}
      />
    </>
  );
}

export function PackageCardSkeleton({ layout = "grid" }: { layout?: "grid" | "list" }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-hairline bg-surface",
        layout === "list" ? "flex flex-col sm:flex-row" : "",
      )}
    >
      <div className={cn("skeleton", layout === "list" ? "aspect-16/10 sm:w-72" : "aspect-4/3")} />
      <div className="flex-1 space-y-3 p-5">
        <div className="skeleton h-3 w-20 rounded-full" />
        <div className="skeleton h-5 w-3/4 rounded-full" />
        <div className="skeleton h-3 w-1/2 rounded-full" />
        <div className="skeleton h-8 w-32 rounded-lg" />
        <div className="flex gap-2 pt-2">
          <div className="skeleton h-9 flex-1 rounded-full" />
          <div className="skeleton h-9 flex-1 rounded-full" />
        </div>
      </div>
    </div>
  );
}
