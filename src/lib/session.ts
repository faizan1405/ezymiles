import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can, canAny } from "@/lib/permissions";
import type { Permission } from "@/models/types";

/**
 * Server-side guards. Every protected page and mutation goes through one of
 * these — the middleware is a fast first pass, not the security boundary.
 */

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/account");
  // Staff have no traveller data behind their session — the middleware redirect
  // is a fast first pass, not the security boundary, so this must hold too.
  if (user.isAdmin) redirect("/admin");
  return user;
}

export async function requireAdmin(permission?: Permission) {
  const user = await getCurrentUser();

  if (!user?.isAdmin) redirect("/login?callbackUrl=/admin");
  if (permission && !can(user.permissions, permission)) redirect("/admin/forbidden");

  return user;
}

export async function requireAnyPermission(permissions: Permission[]) {
  const user = await getCurrentUser();

  if (!user?.isAdmin) redirect("/login?callbackUrl=/admin");
  if (!canAny(user.permissions, permissions)) redirect("/admin/forbidden");

  return user;
}

/** For API routes and server actions, where redirecting is the wrong answer. */
export async function assertAdmin(permission?: Permission) {
  const user = await getCurrentUser();

  if (!user?.isAdmin) {
    return { ok: false as const, status: 401, message: "Sign in as a staff member to continue." };
  }
  if (permission && !can(user.permissions, permission)) {
    return { ok: false as const, status: 403, message: "You do not have permission to do that." };
  }

  return { ok: true as const, user };
}
