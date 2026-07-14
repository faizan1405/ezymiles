"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Copy, Check, Timer } from "lucide-react";
import type { OfferDTO } from "@/types";
import { SmartImage } from "@/components/ui/smart-image";
import { SectionHeading, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { toast } from "@/components/ui/toast";
import { cn, formatDate } from "@/lib/utils";

const KIND_LABEL: Record<string, string> = {
  early_bird: "Early bird",
  honeymoon: "Honeymoon",
  group: "Group booking",
  flight_inclusive: "Flight inclusive",
  festival: "Festival",
  seasonal: "Seasonal",
};

export function Offers({ offers }: { offers: OfferDTO[] }) {
  if (offers.length === 0) return null;

  const [hero, ...rest] = offers;

  return (
    <section className="section-y bg-canvas">
      <div className="container-page">
        <Reveal>
          <SectionHeading
            eyebrow="Live offers"
            title="Deals that are actually running"
            description="Each one has a real end date and a working coupon code. When it expires, it disappears from this page."
          />
        </Reveal>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <OfferHero offer={hero} />
          </Reveal>

          <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            {rest.slice(0, 2).map((o) => (
              <RevealItem key={o.id}>
                <OfferTile offer={o} />
              </RevealItem>
            ))}
          </RevealGroup>
        </div>

        {rest.length > 2 ? (
          <RevealGroup className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rest.slice(2, 5).map((o) => (
              <RevealItem key={o.id}>
                <OfferTile offer={o} />
              </RevealItem>
            ))}
          </RevealGroup>
        ) : null}
      </div>
    </section>
  );
}

function OfferHero({ offer }: { offer: OfferDTO }) {
  return (
    <article className="group relative h-full min-h-[22rem] overflow-hidden rounded-3xl bg-midnight-950">
      <SmartImage
        src={offer.image}
        alt={offer.title}
        fill
        sizes="(max-width: 1024px) 100vw, 60vw"
        className="object-cover opacity-70 transition-transform duration-700 group-hover:scale-105 motion-reduce:group-hover:scale-100"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-midnight-950 via-midnight-950/70 to-transparent" />

      <div className="relative flex h-full flex-col justify-end p-7 sm:p-9">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="gold" size="sm" className="bg-gild-400 text-midnight-950">
            {KIND_LABEL[offer.kind] ?? "Offer"}
          </Badge>
          {offer.discountLabel ? (
            <Badge tone="glass" size="sm">
              {offer.discountLabel}
            </Badge>
          ) : null}
        </div>

        <h3 className="mt-4 max-w-lg font-display text-3xl leading-tight text-white sm:text-4xl">
          {offer.title}
        </h3>
        <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-white/70">
          {offer.headline || offer.description}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button asChild size="lg" variant="accent">
            <Link href={offer.ctaHref}>
              {offer.ctaLabel}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
          {offer.couponCode ? <CouponChip code={offer.couponCode} tone="dark" /> : null}
        </div>

        <p className="mt-5 flex items-center gap-1.5 text-xs text-white/50">
          <Timer className="size-3.5" aria-hidden />
          Ends {formatDate(offer.endsAt)}
        </p>
      </div>
    </article>
  );
}

function OfferTile({ offer }: { offer: OfferDTO }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-surface shadow-tile transition-shadow hover:shadow-lift">
      <div className="relative aspect-16/9 overflow-hidden">
        <SmartImage
          src={offer.image}
          alt={offer.title}
          fill
          sizes="(max-width: 640px) 90vw, 30vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:group-hover:scale-100"
        />
        {offer.discountLabel ? (
          <span className="absolute left-3 top-3 rounded-full bg-sunset-600 px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-wide text-white">
            {offer.discountLabel}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[0.625rem] font-bold uppercase tracking-widest text-lagoon-700">
          {KIND_LABEL[offer.kind] ?? "Offer"}
        </p>
        <h3 className="mt-1.5 font-display text-lg leading-snug text-midnight-900">
          <Link href={offer.ctaHref} className="hover:text-lagoon-800">
            {offer.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
          {offer.headline || offer.description}
        </p>

        <div className="mt-auto pt-4">
          {offer.couponCode ? <CouponChip code={offer.couponCode} /> : null}
          <p className="mt-3 text-xs text-muted">Ends {formatDate(offer.endsAt)}</p>
        </div>
      </div>
    </article>
  );
}

function CouponChip({ code, tone = "light" }: { code: string; tone?: "light" | "dark" }) {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Coupon copied", `Apply ${code} at checkout.`);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Could not copy", `Use the code ${code} at checkout.`);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy coupon code ${code}`}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-dashed px-3.5 py-2 text-[0.8125rem] font-bold tracking-wide transition-colors",
        tone === "dark"
          ? "border-white/30 text-white hover:bg-white/10"
          : "border-midnight-300 text-midnight-900 hover:bg-sand-50",
      )}
    >
      {copied ? <Check className="size-3.5 text-lagoon-500" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      {code}
    </button>
  );
}
