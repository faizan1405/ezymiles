"use client";

import Link from "next/link";
import { Accordion, AccordionItem, Sheet, SheetContent } from "@/components/ui/overlays";
import { Button } from "@/components/ui/button";
import { CurrencySelector } from "./currency-selector";
import { SocialIcons, InstagramHandle, socialLinks } from "./social-links";
import type { NavData } from "@/server/nav";
import type { Settings } from "@/lib/settings";
import { formatPrice, whatsappLink } from "@/lib/utils";
import { MessageCircle, Phone, ArrowRight } from "lucide-react";

export function MobileNav({
  open,
  onOpenChange,
  nav,
  settings,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nav: NavData;
  settings: Settings;
}) {
  const simpleLinks = [
    settings.features.flightsEnabled && { href: "/flights", label: "Flights" },
    settings.features.hotelsEnabled && { href: "/hotels", label: "Hotels" },
    settings.features.visaEnabled && { href: "/visa", label: "Visa Assistance" },
    settings.features.cabsEnabled && { href: "/cabs", label: "Cabs & Transfers" },
    { href: "/customise-my-trip", label: "Customise My Trip" },
    { href: "/blog", label: "Travel Inspiration" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title="Menu" side="right">
        <nav className="flex flex-col px-5 py-4" aria-label="Mobile">
          <Accordion type="single" collapsible className="border-b border-hairline">
            <AccordionItem value="domestic" trigger="Domestic Holidays">
              <DestinationList
                items={nav.domestic.destinations}
                allHref="/destinations?scope=domestic"
                allLabel="All India destinations"
              />
            </AccordionItem>
            <AccordionItem value="international" trigger="International Holidays">
              <DestinationList
                items={nav.international.destinations}
                allHref="/destinations?scope=international"
                allLabel="All international destinations"
              />
            </AccordionItem>
            {settings.features.activitiesEnabled ? (
              <AccordionItem value="activities" trigger="Activities">
                <ul className="grid grid-cols-2 gap-1">
                  {nav.activityCategories.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/activities?category=${c.slug}`}
                        className="block rounded-lg py-2 text-sm font-medium text-midnight-800"
                      >
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </AccordionItem>
            ) : null}
            <AccordionItem value="styles" trigger="Travel Styles">
              <ul className="grid grid-cols-2 gap-1">
                {nav.tripTypes.map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={`/packages?tripType=${t.slug}`}
                      className="block rounded-lg py-2 text-sm font-medium text-midnight-800"
                    >
                      {t.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </AccordionItem>
          </Accordion>

          <ul className="mt-1 divide-y divide-hairline">
            {simpleLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="flex items-center justify-between py-4 text-[0.9375rem] font-semibold text-midnight-900"
                >
                  {l.label}
                  <ArrowRight className="size-4 text-midnight-400" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-between rounded-2xl bg-sand-50 p-3">
            <span className="pl-2 text-sm font-medium text-midnight-700">Currency</span>
            <CurrencySelector supported={settings.currency.supported} />
          </div>

          <div className="mt-4 grid gap-2">
            <Button asChild size="lg" variant="accent" block>
              <Link href="/customise-my-trip">Plan my trip</Link>
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button asChild size="md" variant="outline">
                <a href={`tel:${settings.contact.phone.replace(/\s/g, "")}`}>
                  <Phone aria-hidden />
                  Call us
                </a>
              </Button>
              <Button asChild size="md" variant="outline">
                <a
                  href={whatsappLink(
                    settings.contact.whatsapp,
                    "Hi! I'd like help planning a trip.",
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle aria-hidden />
                  WhatsApp
                </a>
              </Button>
            </div>
          </div>

          {socialLinks(settings.social).length ? (
            <div className="mt-6 border-t border-hairline pt-5">
              <p className="text-[0.625rem] font-bold uppercase tracking-widest text-muted">
                Follow {settings.brand.name}
              </p>
              <SocialIcons
                social={settings.social}
                brandName={settings.brand.name}
                className="mt-3"
              />
              <InstagramHandle
                social={settings.social}
                brandName={settings.brand.name}
                className="mt-3"
              />
            </div>
          ) : null}

          <p className="mt-6 pb-4 text-center text-xs text-muted">{settings.contact.officeHours}</p>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function DestinationList({
  items,
  allHref,
  allLabel,
}: {
  items: NavData["domestic"]["destinations"];
  allHref: string;
  allLabel: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">Destinations appear here once published.</p>;
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-1">
        {items.map((d) => (
          <li key={d.slug}>
            <Link
              href={`/destinations/${d.slug}`}
              className="block rounded-lg py-2 text-sm font-medium text-midnight-800"
            >
              {d.name}
              <span className="block text-[0.6875rem] text-muted">
                from {formatPrice(d.startingPriceINR, "INR", { compact: true })}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href={allHref}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-lagoon-700"
      >
        {allLabel}
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </>
  );
}
