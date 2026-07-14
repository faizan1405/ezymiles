import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { tryConnectDB } from "@/lib/db";
import { AdminUser } from "@/models";
import { ROLE_LABELS, ADMIN_ROLES } from "@/models/types";
import { getAllRoleBasePermissions } from "@/lib/permissions";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { StaffManager } from "@/components/admin/staff-manager";
import { RolePermissionsEditor } from "@/components/admin/role-permissions-editor";
import { serialise } from "@/lib/utils";
import type { IAdminUser } from "@/models";

export const metadata: Metadata = { title: "Staff & roles", robots: { index: false } };

export default async function AdminStaffPage() {
  const me = await requireAdmin("staff:manage");

  if (!(await tryConnectDB())) {
    return (
      <div>
        <AdminPageHeader title="Staff & roles" />
        <p className="rounded-2xl border border-hairline bg-white p-8 text-center text-sm text-muted">
          The database is unreachable.
        </p>
      </div>
    );
  }

  const rows = await AdminUser.find({ deletedAt: null }).sort({ role: 1, name: 1 }).lean();
  const staff = serialise(rows) as unknown as IAdminUser[];
  const rolePermissions = await getAllRoleBasePermissions();

  return (
    <div>
      <AdminPageHeader
        title="Staff & roles"
        description="Permissions are enforced on the server for every page and every action — hiding a menu item is not the security boundary."
      />

      <StaffManager
        currentUserId={me.id}
        rolePermissions={rolePermissions}
        staff={staff.map((s) => ({
          id: String(s._id),
          name: s.name,
          email: s.email,
          role: s.role,
          extraPermissions: s.extraPermissions ?? [],
          revokedPermissions: s.revokedPermissions ?? [],
          isActive: s.isActive,
          lastLoginAt: s.lastLoginAt ? String(s.lastLoginAt) : undefined,
        }))}
      />

      {/* ---------------------------- Permission matrix --------------------------- */}
      <div className="mt-8 space-y-6">
        {me.adminRole === "super_admin" ? (
          <RolePermissionsEditor rolePermissions={rolePermissions} />
        ) : null}

        <Panel title="What each role can do">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <caption className="sr-only">Role permission matrix</caption>
              <thead>
                <tr className="border-b border-hairline">
                  <th scope="col" className="py-2 text-left text-[0.625rem] font-bold uppercase tracking-wider text-muted">
                    Role
                  </th>
                  <th scope="col" className="py-2 text-left text-[0.625rem] font-bold uppercase tracking-wider text-muted">
                    Permissions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {ADMIN_ROLES.map((role) => (
                  <tr key={role}>
                    <th scope="row" className="py-3 pr-4 text-left align-top">
                      <span className="whitespace-nowrap text-sm font-semibold text-midnight-900">
                        {ROLE_LABELS[role]}
                      </span>
                    </th>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {rolePermissions[role].length === 0 ? (
                          <span className="text-xs text-muted">None</span>
                        ) : (
                          rolePermissions[role].map((p) => (
                            <span
                              key={p}
                              className="rounded bg-sand-100 px-1.5 py-0.5 font-mono text-[0.625rem] text-midnight-700"
                            >
                              {p}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
