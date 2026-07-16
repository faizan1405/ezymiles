import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Target, CalendarCheck, CreditCard, Stamp, LifeBuoy, Info } from "lucide-react";

import { requireAdmin } from "@/lib/session";
import { tryConnectDB } from "@/lib/db";
import { Notification } from "@/models";
import { syncFollowUpNotifications } from "@/server/leads";
import { AdminPageHeader } from "@/components/admin/ui";
import { AdminMarkAllRead } from "@/components/admin/mark-all-read";
import { EmptyState } from "@/components/ui/primitives";
import { formatDateTime, serialise, cn } from "@/lib/utils";
import type { INotification } from "@/models";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

const ICONS = {
  lead: Target,
  booking: CalendarCheck,
  payment: CreditCard,
  visa: Stamp,
  ticket: LifeBuoy,
  system: Info,
} as const;

export default async function AdminNotificationsPage() {
  await requireAdmin("dashboard:view");

  if (!(await tryConnectDB())) {
    return (
      <div>
        <AdminPageHeader title="Notifications" />
        <p className="rounded-2xl border border-hairline bg-white p-8 text-center text-sm text-muted">
          The database is unreachable.
        </p>
      </div>
    );
  }

  await syncFollowUpNotifications().catch((error) => console.error("[syncFollowUpNotifications]", error));

  const rows = await Notification.find({ audience: "admin" })
    .sort({ createdAt: -1 })
    .limit(80)
    .lean();

  const notifications = serialise(rows) as unknown as INotification[];
  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <AdminPageHeader
        title="Notifications"
        description={unread > 0 ? `${unread} unread` : "You're all caught up."}
        action={unread > 0 ? <AdminMarkAllRead /> : null}
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell />}
          title="Nothing yet"
          description="New enquiries, bookings, visa requests and support tickets show up here."
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
