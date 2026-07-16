import type { Metadata } from "next";
import Link from "next/link";
import { Bell, CreditCard, Plane, Stamp, LifeBuoy, Info } from "lucide-react";

import { requireUser } from "@/lib/session";
import { tryConnectDB } from "@/lib/db";
import { Notification } from "@/models";
import { EmptyState } from "@/components/ui/primitives";
import { MarkAllRead } from "@/components/account/mark-all-read";
import { formatDateTime, serialise, cn } from "@/lib/utils";
import type { INotification } from "@/models";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

const ICONS = {
  booking: Plane,
  payment: CreditCard,
  visa: Stamp,
  ticket: LifeBuoy,
  lead: Info,
  system: Info,
} as const;

export default async function NotificationsPage() {
  const user = await requireUser();

  if (!(await tryConnectDB())) {
    return <EmptyState icon={<Bell />} title="Unavailable" description="Please refresh in a moment." />;
  }

  const notifications = serialise(
    await Notification.find({ audience: "customer", user: user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
  ) as unknown as INotification[];

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl text-midnight-900 sm:text-4xl">Notifications</h1>
          <p className="mt-2 text-[0.9375rem] text-muted">
            {unread > 0 ? `${unread} unread` : "You're all caught up."}
          </p>
        </div>

        {unread > 0 ? <MarkAllRead /> : null}
      </header>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell />}
          title="Nothing here yet"
          description="Booking confirmations, payment receipts and visa updates land here."
        />
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => {
            const Icon = ICONS[n.kind] ?? Info;
            const body = (
              <>
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl",
                    n.isRead ? "bg-sand-100 text-midnight-500" : "bg-lagoon-50 text-lagoon-700",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "truncate text-sm",
                        n.isRead ? "font-medium text-midnight-700" : "font-semibold text-midnight-900",
                      )}
                    >
                      {n.title}
                    </span>
                    {!n.isRead ? (
                      <span className="size-1.5 shrink-0 rounded-full bg-sunset-500" aria-label="Unread" />
                    ) : null}
                  </span>
                  {n.body ? (
                    <span className="mt-0.5 block truncate text-xs text-muted">{n.body}</span>
                  ) : null}
                  <span className="mt-1 block text-[0.6875rem] text-muted">
                    {formatDateTime(n.createdAt)}
                  </span>
                </span>
              </>
            );

            return (
              <li key={String(n._id)}>
                {n.href ? (
                  <Link
                    href={n.href}
                    className={cn(
                      "flex items-start gap-3 rounded-2xl border p-4 transition-colors hover:bg-sand-50",
                      n.isRead ? "border-hairline bg-white" : "border-lagoon-100 bg-lagoon-50",
                    )}
                  >
                    {body}
                  </Link>
                ) : (
                  <div
                    className={cn(
                      "flex items-start gap-3 rounded-2xl border p-4",
                      n.isRead ? "border-hairline bg-white" : "border-lagoon-100 bg-lagoon-50",
                    )}
                  >
                    {body}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
