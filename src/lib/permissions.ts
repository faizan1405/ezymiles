import "server-only";
import { connectDB } from "@/lib/db";
import { RolePermission } from "@/models";
import {
  ADMIN_ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  type AdminRole,
  type Permission,
} from "@/models/types";

/**
 * The base permission set for a role: a Super-Admin-editable override from the
 * database if one exists for this role, otherwise the built-in default.
 *
 * `super_admin` is always the full permission list, unconditionally — it is
 * the one role a Super Admin can never accidentally lock themselves out of by
 * misconfiguring the matrix.
 */
export async function getRoleBasePermissions(role: AdminRole): Promise<Permission[]> {
  if (role === "super_admin") return [...PERMISSIONS];

  await connectDB();
  const override = await RolePermission.findOne({ role }).lean();
  if (override) return override.permissions as Permission[];

  return [...(ROLE_PERMISSIONS[role] ?? [])];
}

/**
 * Effective permissions = role base (built-in or admin-customised) + explicit
 * per-user grants − explicit per-user revokes. Resolved at sign-in and carried
 * on the JWT, then re-checked on every server action and admin route — the
 * client copy is only used to hide UI.
 */
export async function resolvePermissions(
  role: AdminRole,
  extra: Permission[] = [],
  revoked: Permission[] = [],
): Promise<Permission[]> {
  const base = new Set<Permission>(await getRoleBasePermissions(role));
  extra.forEach((p) => base.add(p));
  if (role !== "super_admin") revoked.forEach((p) => base.delete(p));
  return [...base];
}

/** For the Staff & roles admin page: every role's *current* base permissions, overrides included. */
export async function getAllRoleBasePermissions(): Promise<Record<AdminRole, Permission[]>> {
  await connectDB();
  const overrides = await RolePermission.find({}).lean();
  const overrideByRole = new Map(overrides.map((o) => [o.role, o.permissions as Permission[]]));

  const out = {} as Record<AdminRole, Permission[]>;
  for (const role of ADMIN_ROLES) {
    out[role] = role === "super_admin" ? [...PERMISSIONS] : (overrideByRole.get(role) ?? [...ROLE_PERMISSIONS[role]]);
  }
  return out;
}

export function can(permissions: Permission[] | undefined, permission: Permission): boolean {
  return Boolean(permissions?.includes(permission));
}

export function canAny(permissions: Permission[] | undefined, required: Permission[]): boolean {
  return required.some((p) => can(permissions, p));
}
