"use client";

import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useSession, signOut } from "next-auth/react";
import {
  User as UserIcon,
  LayoutDashboard,
  Plane,
  Heart,
  Receipt,
  LifeBuoy,
  LogOut,
  Sparkles,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";

const LINKS = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/trips", label: "My trips", icon: Plane },
  { href: "/account/wishlist", label: "Saved packages", icon: Heart },
  { href: "/account/payments", label: "Payments & invoices", icon: Receipt },
  { href: "/account/support", label: "Support", icon: LifeBuoy },
];

export function UserMenu({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { data: session, status } = useSession();

  const triggerClass = cn(
    "flex size-10 items-center justify-center rounded-full transition-colors",
    tone === "dark"
      ? "text-white hover:bg-white/12 hover:text-white"
      : "text-midnight-700 hover:bg-midnight-900/[0.06] hover:text-midnight-900",
  );

  if (status === "loading") {
    return <div className={cn(triggerClass, "skeleton")} aria-hidden />;
  }

  if (!session?.user) {
    return (
      <Link href="/login" className={triggerClass} aria-label="Sign in to your account">
        <UserIcon className="size-[1.15rem]" aria-hidden />
      </Link>
    );
  }

  const name = session.user.name ?? "Traveller";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={cn(
          "flex size-10 items-center justify-center rounded-full text-[0.8125rem] font-bold transition-transform hover:scale-105",
          tone === "dark" ? "bg-midnight-700 text-white" : "bg-midnight-900 text-white",
        )}
        aria-label={`Account menu for ${name}`}
      >
        {initials(name)}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          className="z-150 w-64 rounded-2xl border border-hairline bg-surface p-1.5 shadow-float data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <div className="border-b border-hairline px-3 pb-3 pt-2">
            <p className="truncate text-sm font-semibold text-midnight-900">{name}</p>
            <p className="truncate text-xs text-muted">{session.user.email}</p>
          </div>

          {session.user.isAdmin ? (
            <DropdownMenu.Item asChild>
              <Link
                href="/admin"
                className="mt-1.5 flex cursor-pointer items-center gap-2.5 rounded-xl bg-gild-50 px-3 py-2.5 text-sm font-semibold text-gild-800 outline-none data-[highlighted]:bg-gild-100"
              >
                <Sparkles className="size-4" aria-hidden />
                Admin panel
              </Link>
            </DropdownMenu.Item>
          ) : null}

          <div className="py-1.5">
            {LINKS.map(({ href, label, icon: Icon }) => (
              <DropdownMenu.Item key={href} asChild>
                <Link
                  href={href}
                  className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-midnight-800 outline-none transition-colors data-[highlighted]:bg-sand-100"
                >
                  <Icon className="size-4 text-midnight-500" aria-hidden />
                  {label}
                </Link>
              </DropdownMenu.Item>
            ))}
          </div>

          <DropdownMenu.Separator className="my-1 h-px bg-hairline" />

          <DropdownMenu.Item
            onSelect={() => signOut({ redirectTo: "/" })}
            className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-red-600 outline-none transition-colors data-[highlighted]:bg-red-50"
          >
            <LogOut className="size-4" aria-hidden />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
