import {
  ROLE_PERMISSIONS,
  type AdminRole,
  type Permission,
} from "@/models/types";

/**
 * Effective permissions = role defaults + explicit grants − explicit revokes.
 * Resolved once at sign-in and carried on the JWT, then re-checked on every
 * server action and admin route — the client copy is only used to hide UI.
 */
export function resolvePermissions(
  role: AdminRole,
  extra: Permission[] = [],
  revoked: Permission[] = [],
): Permission[] {
  const base = new Set<Permission>(ROLE_PERMISSIONS[role] ?? []);
  extra.forEach((p) => base.add(p));
  revoked.forEach((p) => base.delete(p));
  return [...base];
}

export function can(permissions: Permission[] | undefined, permission: Permission): boolean {
  return Boolean(permissions?.includes(permission));
}

export function canAny(permissions: Permission[] | undefined, required: Permission[]): boolean {
  return required.some((p) => can(permissions, p));
}
