"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Plane,
  Heart,
  Receipt,
  Stamp,
  LifeBuoy,
  Bell,
  UserRound,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Defined here, inside the client component, rather than passed down from the
 * server layout — a live icon component reference (a forwardRef object) can't
 * cross the server → client serialisation boundary as a prop.
 */
const LINKS: { href: string; label: string; icon: LucideIcon; exact?: boolean }[] = [
  { href: "/account", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/account/trips", label: "My trips", icon: Plane },
  { href: "/account/wishlist", label: "Saved packages", icon: Heart },
  { href: "/account/payments", label: "Payments", icon: Receipt },
  { href: "/account/visa", label: "Visa applications", icon: Stamp },
  { href: "/account/support", label: "Support", icon: LifeBuoy },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
  { href: "/account/profile", label: "Profile", icon: UserRound },
];

export function AccountNav({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Account">
      {/* Horizontal rail on mobile, vertical list on desktop. */}
      <ul className="no-scrollbar -mx-5 flex gap-1 overflow-x-auto px-5 lg:mx-0 lg:flex-col lg:px-0">
        {LINKS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          const showBadge = href === "/account/notifications" && unreadCount > 0;

          return (
            <li key={href} className="shrink-0 lg:shrink">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-midnight-900 text-white"
                    : "text-midnight-700 hover:bg-sand-100",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {label}
                {showBadge ? (
                  <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-sunset-500 text-[0.625rem] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}

        <li className="shrink-0 lg:mt-2 lg:shrink lg:border-t lg:border-hairline lg:pt-2">
          <button
            type="button"
            onClick={() => signOut({ redirectTo: "/" })}
            className="flex w-full items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="size-4 shrink-0" aria-hidden />
            Sign out
          </button>
        </li>
      </ul>
    </nav>
  );
}
