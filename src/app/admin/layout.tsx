import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { tryConnectDB } from "@/lib/db";
import { Notification } from "@/models";
import { ROLE_LABELS } from "@/models/types";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // First gate. Every page and action re-checks its own permission on the server.
  const user = await requireAdmin();
  const settings = await getSettings();

  let unread = 0;
  if (await tryConnectDB()) {
    unread = await Notification.countDocuments({ audience: "admin", isRead: false }).catch(() => 0);
  }

  return (
    <div className="min-h-dvh bg-sand-50">
      <div className="flex">
        <AdminSidebar
          permissions={user.permissions ?? []}
          brandName={settings.brand.name}
          roleLabel={user.adminRole ? ROLE_LABELS[user.adminRole] : "Staff"}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar
            name={user.name ?? "Staff"}
            email={user.email ?? ""}
            roleLabel={user.adminRole ? ROLE_LABELS[user.adminRole] : "Staff"}
            unreadCount={unread}
          />

          <main id="main" className="flex-1 p-5 lg:p-8">
            {children}
          </main>

          <footer className="border-t border-hairline px-5 py-4 lg:px-8">
            <p className="text-xs text-muted">
              {settings.brand.name} admin ·{" "}
              <Link href="/" className="hover:underline">
                View the live site
              </Link>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
