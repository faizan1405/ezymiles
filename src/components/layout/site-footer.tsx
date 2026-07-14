import Link from "next/link";
import { Phone, Mail, MapPin, ShieldCheck, Lock } from "lucide-react";
import {
  InstagramIcon,
  FacebookIcon,
  YoutubeIcon,
  LinkedinIcon,
  XIcon,
} from "@/components/ui/brand-icons";
import type { Settings } from "@/lib/settings";
import type { NavData } from "@/server/nav";
import { Logo } from "./logo";
import { NewsletterForm } from "@/components/forms/newsletter-form";

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

  const socials = [
    { href: settings.social.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: settings.social.facebook, label: "Facebook", Icon: FacebookIcon },
    { href: settings.social.youtube, label: "YouTube", Icon: YoutubeIcon },
    { href: settings.social.linkedin, label: "LinkedIn", Icon: LinkedinIcon },
    { href: settings.social.x, label: "X", Icon: XIcon },
  ].filter((s) => s.href);

  return (
    <footer className="mt-auto bg-midnight-950 text-midnight-100">
      {/* ------------------------------ Newsletter ------------------------------ */}
      <div className="border-b border-white/8">
        <div className="container-page grid gap-8 py-14 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <h2 className="text-3xl text-white sm:text-4xl">
              Two emails a month.
              <span className="block text-lagoon-300">Zero noise.</span>
            </h2>
            <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-midnight-200/70">
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
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-midnight-200/65">
              {settings.brand.tagline}
            </p>

            <address className="mt-6 space-y-3 text-sm not-italic text-midnight-200/70">
              <a
                href={`tel:${settings.contact.phone.replace(/\s/g, "")}`}
                className="flex items-start gap-2.5 transition-colors hover:text-white"
              >
                <Phone className="mt-0.5 size-4 shrink-0 text-lagoon-400" aria-hidden />
                {settings.contact.phone}
              </a>
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
            </address>

            {socials.length ? (
              <ul className="mt-6 flex gap-2">
                {socials.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a
                      href={href!}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="flex size-10 items-center justify-center rounded-full border border-white/12 text-midnight-200/70 transition-colors hover:border-white/30 hover:bg-white/8 hover:text-white"
                    >
                      <Icon className="size-4" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-9 lg:grid-cols-5">
            {columns.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h3 className="text-eyebrow mb-4 text-lagoon-300">{col.title}</h3>
                <ul className="space-y-2.5">
                  {col.links.length === 0 ? (
                    <li className="text-sm text-midnight-200/40">Coming soon</li>
                  ) : (
                    col.links.map((l) => (
                      <li key={l.href + l.label}>
                        <Link
                          href={l.href}
                          className="text-sm text-midnight-200/70 transition-colors hover:text-white"
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
        <div className="mt-12 flex flex-col gap-6 border-t border-white/8 pt-8 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-midnight-200/60">
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
                className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-[0.625rem] font-semibold uppercase tracking-wide text-midnight-200/70"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* -------------------------------- Legal -------------------------------- */}
      <div className="border-t border-white/8">
        <div className="container-page flex flex-col gap-4 py-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-xs text-midnight-200/50">
            © {year} {settings.brand.name}. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {legal.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-xs text-midnight-200/50 transition-colors hover:text-white"
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
