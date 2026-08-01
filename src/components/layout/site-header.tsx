"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Search,
  Heart,
  Menu,
  ChevronDown,
  ArrowRight,
  Plane,
  BedDouble,
  Ticket,
  Stamp,
  Compass,
  Phone,
} from "lucide-react";
import type { NavData } from "@/server/nav";
import type { Settings } from "@/lib/settings";
import { cn, formatPrice } from "@/lib/utils";
import { useWishlist } from "@/store/preferences";
import { CurrencySelector } from "./currency-selector";
import { UserMenu } from "./user-menu";
import { MobileNav } from "./mobile-nav";
import { SearchDialog } from "./search-dialog";
import { SmartImage } from "@/components/ui/smart-image";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";

type MenuKey = "domestic" | "international" | "activities" | null;

export function SiteHeader({ nav, settings }: { nav: NavData; settings: Settings }) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = React.useState<MenuKey>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduced = useReducedMotion();

  const wishlistCount = useWishlist((s) => s.ids.length);
  const wishlistHydrated = useWishlist((s) => s.hydrated);

  // Close menus on navigation.
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpenMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  // Cmd/Ctrl-K opens search.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setOpenMenu(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openWithDelay = (key: MenuKey) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(key);
  };

  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 140);
  };

  const linkClass = cn(
    "flex items-center gap-1 rounded-full px-3 py-2 text-[0.875rem] font-semibold transition-colors duration-200 text-midnight-700 hover:bg-midnight-900/[0.05] hover:text-midnight-950",
  );

  const iconButtonClass = cn(
    "flex size-10 items-center justify-center rounded-full transition-colors text-midnight-700 hover:bg-midnight-900/[0.06] hover:text-midnight-900",
  );

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-90 w-full border-b border-hairline bg-white shadow-[0_1px_0_rgb(16_25_43/0.04)]",
        )}
        onMouseLeave={scheduleClose}
      >
        <div className="container-page flex h-[var(--header-height)] min-w-0 items-center gap-2 overflow-hidden">
          <Link
            href="/"
            className="mr-2 shrink-0 rounded-lg px-1 py-1 transition-all duration-200 hover:opacity-80 focus-visible:outline-offset-4 active:opacity-70"
            aria-label={`${settings.brand.name} — home`}
          >
            <Logo tone="light" name={settings.brand.name} logoUrl={settings.brand.logoUrl} />
          </Link>

          {/* ---------------------------- Desktop nav ---------------------------- */}
          <nav
            className="no-scrollbar ml-auto hidden items-center gap-0.5 overflow-x-auto xl:flex"
            aria-label="Primary"
          >
            <MegaTrigger
              label="Domestic Holidays"
              isOpen={openMenu === "domestic"}
              onOpen={() => openWithDelay("domestic")}
              className={linkClass}
            />
            <MegaTrigger
              label="International Holidays"
              isOpen={openMenu === "international"}
              onOpen={() => openWithDelay("international")}
              className={linkClass}
            />

            {settings.features.flightsEnabled ? (
              <Link href="/flights" className={linkClass} onMouseEnter={() => setOpenMenu(null)}>
                Flights
              </Link>
            ) : null}
            {settings.features.hotelsEnabled ? (
              <Link href="/hotels" className={linkClass} onMouseEnter={() => setOpenMenu(null)}>
                Hotels
              </Link>
            ) : null}

            {settings.features.cabsEnabled ? (
              <Link href="/cabs" className={linkClass} onMouseEnter={() => setOpenMenu(null)}>
                Cabs
              </Link>
            ) : null}
            {settings.features.busEnabled ? (
              <Link href="/bus" className={linkClass} onMouseEnter={() => setOpenMenu(null)}>
                Bus
              </Link>
            ) : null}
            {settings.features.trainEnabled ? (
              <Link href="/train" className={linkClass} onMouseEnter={() => setOpenMenu(null)}>
                Trains
              </Link>
            ) : null}

            {settings.features.activitiesEnabled ? (
              <MegaTrigger
                label="Activities"
                isOpen={openMenu === "activities"}
                onOpen={() => openWithDelay("activities")}
                className={linkClass}
              />
            ) : null}

            {settings.features.visaEnabled ? (
              <Link href="/visa" className={linkClass} onMouseEnter={() => setOpenMenu(null)}>
                Visa Assistance
              </Link>
            ) : null}

            <Link
              href="/customise-my-trip"
              className={cn(linkClass, "whitespace-nowrap")}
              onMouseEnter={() => setOpenMenu(null)}
            >
              Customise My Trip
            </Link>
            <Link href="/about" className={linkClass} onMouseEnter={() => setOpenMenu(null)}>
              About
            </Link>
            <Link href="/contact" className={linkClass} onMouseEnter={() => setOpenMenu(null)}>
              Contact
            </Link>
          </nav>

          {/* ----------------------------- Utilities ----------------------------- */}
          <div className={cn("flex items-center gap-0.5", "xl:ml-3 ml-auto")}>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className={iconButtonClass}
              aria-label="Search destinations and packages"
            >
              <Search className="size-[1.15rem]" aria-hidden />
            </button>

            {settings.features.wishlistEnabled ? (
              <Link href="/account/wishlist" className={cn(iconButtonClass, "relative")} aria-label={
                wishlistHydrated && wishlistCount > 0
                  ? `Wishlist, ${wishlistCount} saved`
                  : "Wishlist"
              }>
                <Heart className="size-[1.15rem]" aria-hidden />
                {wishlistHydrated && wishlistCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex size-[1.1rem] items-center justify-center rounded-full bg-sunset-500 text-[0.625rem] font-bold text-white">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                ) : null}
              </Link>
            ) : null}

            <div className="hidden sm:block">
              <CurrencySelector supported={settings.currency.supported} tone="light" />
            </div>

            <UserMenu tone="light" />

            {/* Real click-to-call link. Icon shows from lg; the visible number
                appears at 2xl where there is room. tel: strips spaces so the
                dialled value is the normalised +917900003279. */}
            <a
              href={`tel:${settings.contact.phone.replace(/\s/g, "")}`}
              aria-label={`Call ${settings.brand.name} at ${settings.contact.phone}`}
              className={cn(
                "hidden items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-2 text-[0.8125rem] font-semibold transition-colors text-midnight-700 hover:bg-midnight-900/[0.05] hover:text-midnight-950 lg:inline-flex",
              )}
            >
              <Phone className="size-[1.05rem]" aria-hidden />
              <span className="hidden 2xl:inline">{settings.contact.phone}</span>
            </a>

            <Button
              asChild
              size="sm"
              variant="accent"
              className="ml-1.5 hidden lg:inline-flex"
            >
              <Link href="/customise-my-trip">Plan my trip</Link>
            </Button>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className={cn(iconButtonClass, "xl:hidden")}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="size-5" aria-hidden />
            </button>
          </div>
        </div>

        {/* ------------------------------ Mega menus ------------------------------ */}
        <AnimatePresence>
          {openMenu ? (
            <motion.div
              key={openMenu}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-0 top-full hidden border-t border-hairline bg-white shadow-panel xl:block"
              onMouseEnter={() => openWithDelay(openMenu)}
              onMouseLeave={scheduleClose}
            >
              {openMenu === "activities" ? (
                <ActivitiesMenu nav={nav} />
              ) : (
                <HolidaysMenu nav={nav} scope={openMenu} />
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      <MobileNav
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        nav={nav}
        settings={settings}
      />
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} nav={nav} />
    </>
  );
}

/* --------------------------------- Triggers -------------------------------- */

function MegaTrigger({
  label,
  isOpen,
  onOpen,
  className,
}: {
  label: string;
  isOpen: boolean;
  onOpen: () => void;
  className: string;
}) {
  return (
    <button
      type="button"
      className={cn(className, "whitespace-nowrap")}
      onMouseEnter={onOpen}
      onFocus={onOpen}
      onClick={onOpen}
      aria-expanded={isOpen}
      aria-haspopup="true"
    >
      {label}
      <ChevronDown
        className={cn("size-3.5 transition-transform duration-300", isOpen && "rotate-180")}
        aria-hidden
      />
    </button>
  );
}

/* ------------------------------ Holidays menu ------------------------------ */

function HolidaysMenu({ nav, scope }: { nav: NavData; scope: "domestic" | "international" }) {
  const data = scope === "domestic" ? nav.domestic : nav.international;
  const heading = scope === "domestic" ? "India" : "International";

  return (
    <div className="container-page grid grid-cols-12 gap-8 py-8">
      <div className="col-span-4">
        <MenuHeading>{heading} destinations</MenuHeading>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5">
          {data.destinations.length === 0 ? (
            <li className="col-span-2 py-2 text-sm text-muted">
              Destinations appear here once they are published.
            </li>
          ) : (
            data.destinations.map((d) => (
              <li key={d.slug}>
                <Link
                  href={`/destinations/${d.slug}`}
                  className="group flex items-baseline justify-between gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-sand-50"
                >
                  <span className="text-sm font-medium text-midnight-800 group-hover:text-lagoon-700">
                    {d.name}
                  </span>
                  <span className="shrink-0 text-[0.6875rem] font-semibold text-muted">
                    {formatPrice(d.startingPriceINR, "INR", { compact: true })}
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
        <Link
          href={`/destinations?scope=${scope}`}
          className="mt-3 inline-flex items-center gap-1.5 px-2 text-sm font-semibold text-lagoon-700 hover:gap-2.5 hover:underline"
        >
          All {heading.toLowerCase()} destinations
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>

      <div className="col-span-3">
        <MenuHeading>Travel styles</MenuHeading>
        <ul className="space-y-0.5">
          {nav.tripTypes.slice(0, 8).map((t) => (
            <li key={t.slug}>
              <Link
                href={`/packages?scope=${scope}&tripType=${t.slug}`}
                className="block rounded-lg px-2 py-2 text-sm font-medium text-midnight-800 transition-colors hover:bg-sand-50 hover:text-lagoon-700"
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="col-span-5">
        <MenuHeading>Popular packages</MenuHeading>
        <div className="space-y-2">
          {data.packages.length === 0 ? (
            <p className="text-sm text-muted">Featured packages will appear here.</p>
          ) : (
            data.packages.map((p) => (
              <Link
                key={p.slug}
                href={`/packages/${p.slug}`}
                className="group flex gap-3 rounded-xl p-2 transition-colors hover:bg-sand-50"
              >
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg">
                  <SmartImage
                    src={p.heroImage}
                    alt={p.title}
                    fill
                    sizes="64px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-midnight-900 group-hover:text-lagoon-700">
                    {p.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {p.durationDays} days · from{" "}
                    <span className="font-semibold text-midnight-800">
                      {formatPrice(p.startingPriceINR, "INR", { compact: true })}
                    </span>
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>

        {nav.promo ? (
          <Link
            href={nav.promo.href}
            className="group mt-3 flex items-center gap-3 overflow-hidden rounded-2xl wash-ocean p-4 text-white"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[0.625rem] font-bold uppercase tracking-wider text-gild-300">
                {nav.promo.discountLabel || "Limited offer"}
              </p>
              <p className="mt-1 truncate font-display text-base">{nav.promo.title}</p>
              <p className="truncate text-xs text-lagoon-100">{nav.promo.headline}</p>
            </div>
            <ArrowRight
              className="size-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden
            />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/* ----------------------------- Activities menu ----------------------------- */

function ActivitiesMenu({ nav }: { nav: NavData }) {
  const quickLinks = [
    { href: "/flights", label: "Flights", icon: Plane, note: "Compare fares" },
    { href: "/hotels", label: "Hotels & resorts", icon: BedDouble, note: "Verified stays" },
    { href: "/activities", label: "All experiences", icon: Ticket, note: "Book instantly" },
    { href: "/visa", label: "Visa assistance", icon: Stamp, note: "Document help" },
    { href: "/cabs", label: "Cabs & transfers", icon: Compass, note: "Airport pickups" },
    { href: "/contact", label: "Talk to an expert", icon: Phone, note: "Free consultation" },
  ];

  return (
    <div className="container-page grid grid-cols-12 gap-8 py-8">
      <div className="col-span-5">
        <MenuHeading>Experience categories</MenuHeading>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5">
          {nav.activityCategories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/activities?category=${c.slug}`}
                className="block rounded-lg px-2 py-2 text-sm font-medium text-midnight-800 transition-colors hover:bg-sand-50 hover:text-lagoon-700"
              >
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="col-span-7">
        <MenuHeading>Everything else we handle</MenuHeading>
        <div className="grid grid-cols-2 gap-2">
          {quickLinks.map(({ href, label, icon: Icon, note }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 rounded-xl border border-hairline p-3 transition-all hover:border-lagoon-200 hover:bg-lagoon-50"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sand-100 text-lagoon-700 transition-colors group-hover:bg-white">
                <Icon className="size-[1.15rem]" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-midnight-900">{label}</span>
                <span className="block truncate text-xs text-muted">{note}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function MenuHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-eyebrow mb-3 px-2 text-lagoon-700">{children}</p>
  );
}
