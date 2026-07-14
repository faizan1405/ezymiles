"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  Users,
  CalendarCheck,
  CreditCard,
  Undo2,
  Package as PackageIcon,
  MapPin,
  Plane,
  BedDouble,
  Ticket,
  Stamp,
  TicketPercent,
  Megaphone,
  Star,
  Newspaper,
  HelpCircle,
  LayoutTemplate,
  Image as ImageIcon,
  LifeBuoy,
  ShieldCheck,
  Settings,
  ScrollText,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";

import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";
import type { Permission } from "@/models/types";

interface AdminLink {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
  exact?: boolean;
}

interface AdminGroup {
  title: string;
  links: AdminLink[];
}

/**
 * The navigation is permission-filtered, but that is a convenience, not the
 * boundary: every page and every mutation re-checks the permission server-side.
 */
const GROUPS: AdminGroup[] = [
  {
    title: "Overview",
    links: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard:view", exact: true },
    ],
  },
  {
    title: "Sales",
    links: [
      { href: "/admin/leads", label: "Leads", icon: Target, permission: "leads:view" },
      { href: "/admin/customers", label: "Customers", icon: Users, permission: "customers:view" },
      { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck, permission: "bookings:view" },
    ],
  },
  {
    title: "Finance",
    links: [
      { href: "/admin/payments", label: "Payments", icon: CreditCard, permission: "payments:view" },
      { href: "/admin/refunds", label: "Refunds", icon: Undo2, permission: "refunds:view" },
      { href: "/admin/coupons", label: "Coupons", icon: TicketPercent, permission: "coupons:manage" },
    ],
  },
  {
    title: "Catalogue",
    links: [
      { href: "/admin/packages", label: "Packages", icon: PackageIcon, permission: "packages:view" },
      { href: "/admin/destinations", label: "Destinations", icon: MapPin, permission: "destinations:manage" },
      { href: "/admin/hotels", label: "Hotels", icon: BedDouble, permission: "hotels:manage" },
      { href: "/admin/activities", label: "Activities", icon: Ticket, permission: "activities:manage" },
      { href: "/admin/flights", label: "Flights", icon: Plane, permission: "flights:manage" },
      { href: "/admin/visa", label: "Visa", icon: Stamp, permission: "visa:view" },
    ],
  },
  {
    title: "Content",
    links: [
      { href: "/admin/offers", label: "Offers", icon: Megaphone, permission: "offers:manage" },
      { href: "/admin/reviews", label: "Reviews", icon: Star, permission: "reviews:manage" },
      { href: "/admin/blogs", label: "Blog", icon: Newspaper, permission: "blogs:manage" },
      { href: "/admin/faqs", label: "FAQs", icon: HelpCircle, permission: "faqs:manage" },
      { href: "/admin/homepage", label: "Homepage", icon: LayoutTemplate, permission: "homepage:manage" },
      { href: "/admin/media", label: "Media", icon: ImageIcon, permission: "media:manage" },
    ],
  },
  {
    title: "Operations",
    links: [
      { href: "/admin/tickets", label: "Support", icon: LifeBuoy, permission: "tickets:view" },
      { href: "/admin/staff", label: "Staff & roles", icon: ShieldCheck, permission: "staff:manage" },
      { href: "/admin/settings", label: "Site settings", icon: Settings, permission: "settings:manage" },
      { href: "/admin/audit", label: "Audit log", icon: ScrollText, permission: "audit:view" },
    ],
  },
];

export function AdminSidebar({
  permissions,
  brandName,
  roleLabel,
}: {
  permissions: Permission[];
  brandName: string;
  roleLabel: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  // Intentional: close the drawer whenever the route changes underneath it.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setOpen(false), [pathname]);

  const groups = GROUPS.map((g) => ({
    ...g,
    links: g.links.filter((l) => permissions.includes(l.permission)),
  })).filter((g) => g.links.length > 0);

  const nav = (
    <nav className="flex flex-col gap-6 p-4" aria-label="Admin">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="mb-2 px-3 text-[0.625rem] font-bold uppercase tracking-widest text-white/35">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.links.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-white/12 text-white"
                        : "text-white/60 hover:bg-white/[0.06] hover:text-white",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open admin menu"
        className="fixed bottom-5 left-5 z-50 flex size-12 items-center justify-center rounded-full bg-midnight-950 text-white shadow-float lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-100 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-midnight-950/50"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col overflow-y-auto bg-midnight-950">
            <div className="flex items-center justify-between p-4">
              <Logo tone="dark" name={brandName} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex size-9 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            {nav}
          </div>
        </div>
      ) : null}

      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-y-auto bg-midnight-950 lg:flex">
        <div className="p-5">
          <Link href="/admin" aria-label="Admin dashboard">
            <Logo tone="dark" name={brandName} />
          </Link>
          <p className="mt-3 inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-wider text-lagoon-300">
            {roleLabel}
          </p>
        </div>

        {nav}
      </aside>
    </>
  );
}
