import type { AdminRole, Permission } from "@/models/types";

/**
 * `isVerified` rather than `emailVerified`: the adapter already declares
 * `emailVerified` as a Date on its own user type, and re-declaring it as a
 * boolean here would produce an impossible intersection.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isVerified: boolean;
      isAdmin: boolean;
      adminRole?: AdminRole;
      permissions?: Permission[];
    };
  }

  interface User {
    isVerified?: boolean;
    isAdmin?: boolean;
    adminRole?: AdminRole;
    permissions?: Permission[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isVerified: boolean;
    isAdmin: boolean;
    adminRole?: AdminRole;
    permissions?: Permission[];
  }
}

export {};
