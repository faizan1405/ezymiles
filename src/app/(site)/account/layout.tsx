import Link from "next/link";

import { requireUser } from "@/lib/session";
import { AccountNav } from "@/components/account/account-nav";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { initials } from "@/lib/utils";
import { tryConnectDB } from "@/lib/db";
import { Notification } from "@/models";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  let unread = 0;
  if (await tryConnectDB()) {
    unread = await Notification.countDocuments({
      audience: "customer",
      user: user.id,
      isRead: false,
    }).catch(() => 0);
  }

  return (
    <div className="container-page section-y !pt-8">
      <Breadcrumbs items={[{ name: "My account", href: "/account" }]} />

      <div className="mt-8 grid gap-6 xl:grid-cols-[16rem_1fr] xl:gap-10">
        <aside className="hidden xl:sticky xl:top-28 xl:block xl:h-fit">
          {/* Identity card — desktop sidebar only. */}
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-hairline bg-white p-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-midnight-900 text-sm font-bold text-white">
              {initials(user.name ?? "Traveller")}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-midnight-900">
                {user.name ?? "Traveller"}
              </p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
          </div>

          {/* Verification notice — desktop only. */}
          {!user.isVerified ? (
            <p className="mb-4 hidden rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 xl:block xl:mb-6">
              Your email isn&apos;t verified yet. Check your inbox for the link — some features stay
              limited until it is.
            </p>
          ) : null}

          <AccountNav unreadCount={unread} />

          {/* Support link — desktop only on lg+; hidden on mobile where space is tight. */}
          <p className="mt-6 hidden px-3 text-xs leading-relaxed text-muted xl:block">
            Need something changed on a booking?{" "}
            <Link href="/account/support" className="font-semibold text-lagoon-700 hover:underline">
              Open a support ticket
            </Link>
            .
          </p>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
