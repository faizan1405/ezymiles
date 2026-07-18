import Link from "next/link";
import { Phone, Mail, MapPin, Clock, ShieldCheck, Lock, MessageCircle } from "lucide-react";
import {
  SocialIcons,
  InstagramHandle,
  socialLinks,
  FOLLOW_DESCRIPTION,
} from "./social-links";
import type { Settings } from "@/lib/settings";
import type { NavData } from "@/server/nav";
import { BRAND } from "@/config/site";
import { Logo } from "./logo";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { whatsappLink } from "@/lib/utils";

export function SiteFooter({ settings, nav }: { settings: Settings; nav: NavData }) {
  const year = new Date().getFullYear();

  const columns: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: "India",
      links: nav.domestic.destinations.slice(0, 7).map((d) => ({
        href: `/destinations/${d.slug}`,
        label: d.name,
      })),
    },
    {
      title: "International",
      links: nav.international.destinations.slice(0, 7).map((d) => ({
        href: `/destinations/${d.slug}`,
        label: d.name,
      })),
    },
    {
      title: "Holiday themes",
      links: nav.tripTypes.slice(0, 7).map((t) => ({
        href: `/packages?tripType=${t.slug}`,
        label: t.label,
      })),
    },
    {
      title: "Services",
      links: [
        { href: "/flights", label: "Flights" },
        { href: "/hotels", label: "Hotels & resorts" },
        { href: "/activities", label: "Activities" },
        { href: "/visa", label: "Visa assistance" },
        { href: "/cabs", label: "Cabs & transfers" },
        { href: "/customise-my-trip", label: "Custom trips" },
      ],
    },
    {
      title: "Company",
      links: [
        { href: "/about", label: "About us" },
        { href: "/contact", label: "Contact" },
        { href: "/blog", label: "Travel inspiration" },
        { href: "/faqs", label: "FAQs" },
        { href: "/sitemap.xml", label: "Sitemap" },
      ],
    },
  ];

  const legal = [
    { href: "/legal/privacy-policy", label: "Privacy policy" },
    { href: "/legal/terms-and-conditions", label: "Terms & conditions" },
    { href: "/legal/booking-terms", label: "Booking terms" },
    { href: "/legal/cancellation-policy", label: "Cancellation policy" },
    { href: "/legal/refund-policy", label: "Refund policy" },
    { href: "/legal/payment-policy", label: "Payment policy" },
    { href: "/legal/cookie-policy", label: "Cookie policy" },
  ];

  const hasSocials = socialLinks(settings.social).length > 0;

  return (
    <footer className="mt-auto bg-midnight-950 text-midnight-100">
      {/* ------------------------------ Newsletter ------------------------------ */}
      <div className="border-b border-midnight-800">
        <div className="container-page grid gap-8 py-14 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <h2 className="text-3xl text-white sm:text-4xl">
              Two emails a month.
              <span className="block text-lagoon-300">Zero noise.</span>
            </h2>
            <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-midnight-200">
              Seasonal windows worth booking, honest destination notes, and the occasional
              early-bird fare before it goes public.
            </p>
          </div>
          <NewsletterForm variant="footer" />
        </div>
      </div>

      {/* -------------------------------- Links -------------------------------- */}
      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Logo tone="dark" name={settings.brand.name} logoUrl={settings.brand.logoUrl} />
            <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-lagoon-300">
              {settings.brand.tagline}
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-midnight-200">
              {settings.brand.name} makes travel planning simple, transparent and stress-free through honest recommendations and responsible support.
            </p>
            <p className="mt-4 text-sm font-bold text-white">
              Trust Before Transactions.
            </p>

            <address className="mt-6 space-y-3 text-sm not-italic text-midnight-200">
              <span className="flex items-start justify-between gap-2.5">
                <a
                  href={`tel:${settings.contact.phone.replace(/\s/g, "")}`}
                  className="flex items-start gap-2.5 transition-colors hover:text-white"
                >
                  <Phone className="mt-0.5 size-4 shrink-0 text-lagoon-400" aria-hidden />
                  {settings.contact.phone}
                </a>
                <a
                  href={whatsappLink(
                    settings.contact.whatsapp,
                    "Hi! I'd like help planning a trip.",
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Chat with ${settings.brand.name} on WhatsApp`}
                  className="text-midnight-300 transition-colors hover:text-[#25D366]"
                >
                  <MessageCircle className="size-4 shrink-0" aria-hidden />
                </a>
              </span>
              <a
                href={`mailto:${settings.contact.email}`}
                className="flex items-start gap-2.5 transition-colors hover:text-white"
              >
                <Mail className="mt-0.5 size-4 shrink-0 text-lagoon-400" aria-hidden />
                {settings.contact.email}
              </a>
              <span className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-lagoon-400" aria-hidden />
                {settings.contact.address}
              </span>
              {settings.contact.officeHours ? (
                <span className="flex items-start gap-2.5">
                  <Clock className="mt-0.5 size-4 shrink-0 text-lagoon-400" aria-hidden />
                  {settings.contact.officeHours}
                </span>
              ) : null}
            </address>

            {hasSocials ? (
              <div className="mt-8">
                <h3 className="text-eyebrow text-lagoon-300">Follow {settings.brand.name}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-midnight-200">
                  {FOLLOW_DESCRIPTION}
                </p>
                <SocialIcons
                  social={settings.social}
                  brandName={settings.brand.name}
                  tone="dark"
                  className="mt-4"
                />
                <InstagramHandle
                  social={settings.social}
                  brandName={settings.brand.name}
                  tone="dark"
                  className="mt-3"
                />
              </div>
            ) : null}
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-9 lg:grid-cols-5">
            {columns.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h3 className="text-eyebrow mb-4 text-lagoon-300">{col.title}</h3>
                <ul className="space-y-2.5">
                  {col.links.length === 0 ? (
                    <li className="text-sm text-midnight-300">Coming soon</li>
                  ) : (
                    col.links.map((l) => (
                      <li key={l.href + l.label}>
                        <Link
                          href={l.href}
                          className="text-sm text-midnight-200 transition-colors hover:text-white"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* ------------------------------ Trust row ------------------------------ */}
        <div className="mt-12 flex flex-col gap-6 border-t border-midnight-800 pt-8 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-midnight-300">
            <span className="flex items-center gap-2">
              <Lock className="size-4 text-lagoon-400" aria-hidden />
              256-bit encrypted checkout
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-lagoon-400" aria-hidden />
              Payments verified server-side
            </span>
          </div>

          <div className="flex items-center gap-2" aria-label="Accepted payment methods">
            {["UPI", "Visa", "Mastercard", "RuPay", "Amex", "Net banking"].map((p) => (
              <span
                key={p}
                className="rounded-md border border-midnight-800 bg-midnight-900 px-2.5 py-1.5 text-[0.625rem] font-semibold uppercase tracking-wide text-midnight-200"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* -------------------------------- Legal -------------------------------- */}
      <div className="border-t border-midnight-800">
        <div className="container-page flex flex-col gap-4 py-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-xs text-midnight-300">
            © {year} {BRAND.legalName}. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {legal.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-xs text-midnight-300 transition-colors hover:text-white"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
