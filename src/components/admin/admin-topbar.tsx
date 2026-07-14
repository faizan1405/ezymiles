"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Bell, ExternalLink, LogOut, ChevronDown } from "lucide-react";
import { initials } from "@/lib/utils";

export function AdminTopbar({
  name,
  email,
  roleLabel,
  unreadCount,
}: {
  name: string;
  email: string;
  roleLabel: string;
  unreadCount: number;
}) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-end gap-2 border-b border-hairline bg-white/90 px-5 backdrop-blur-lg lg:px-8">
      <Link
        href="/"
        target="_blank"
        className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-midnight-600 transition-colors hover:bg-sand-100 hover:text-midnight-900"
      >
        <ExternalLink className="size-4" aria-hidden />
        <span className="hidden sm:inline">View site</span>
      </Link>

      <Link
        href="/admin/notifications"
        className="relative flex size-10 items-center justify-center rounded-full text-midnight-600 transition-colors hover:bg-sand-100 hover:text-midnight-900"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
      >
        <Bell className="size-[1.15rem]" aria-hidden />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex size-[1.1rem] items-center justify-center rounded-full bg-sunset-500 text-[0.625rem] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </Link>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 transition-colors hover:bg-sand-100">
          <span className="flex size-9 items-center justify-center rounded-full bg-midnight-900 text-xs font-bold text-white">
            {initials(name)}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-[0.8125rem] font-semibold leading-tight text-midnight-900">
              {name}
            </span>
            <span className="block text-[0.6875rem] leading-tight text-muted">{roleLabel}</span>
          </span>
          <ChevronDown className="size-3.5 text-midnight-400" aria-hidden />
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className="z-150 w-60 rounded-2xl border border-hairline bg-white p-1.5 shadow-float"
          >
            <div className="border-b border-hairline px-3 pb-3 pt-2">
              <p className="truncate text-sm font-semibold text-midnight-900">{name}</p>
              <p className="truncate text-xs text-muted">{email}</p>
            </div>

            <DropdownMenu.Item
              onSelect={() => signOut({ redirectTo: "/login" })}
              className="mt-1.5 flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-red-600 outline-none transition-colors data-[highlighted]:bg-red-50"
            >
              <LogOut className="size-4" aria-hidden />
              Sign out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </header>
  );
}
