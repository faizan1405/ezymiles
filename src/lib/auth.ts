import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { AdminUser, User } from "@/models";
import { resolvePermissions } from "@/lib/permissions";
import { loginSchema } from "@/lib/validation";
import { integrations } from "@/lib/env";
import type { AdminRole, Permission } from "@/models/types";

/**
 * Auth.js v5.
 *
 * Two credential audiences share one session: travellers (User) and staff
 * (AdminUser). Staff are resolved first, and an admin session additionally
 * carries the effective permission set used to gate every admin route.
 *
 * JWT sessions (not database sessions) so that middleware can authorise an
 * admin route without a database round-trip on every request.
 */

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "Email and password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(raw) {
      const parsed = loginSchema.safeParse(raw);
      if (!parsed.success) return null;

      const { email, password } = parsed.data;
      await connectDB();

      // Staff first — an email may only ever belong to one audience.
      const admin = await AdminUser.findOne({ email, isActive: true, deletedAt: null }).select(
        "+passwordHash",
      );

      if (admin?.passwordHash) {
        const ok = await bcrypt.compare(password, admin.passwordHash);
        if (!ok) return null;

        admin.lastLoginAt = new Date();
        await admin.save();

        return {
          id: admin._id.toString(),
          name: admin.name,
          email: admin.email,
          isVerified: true,
          isAdmin: true,
          adminRole: admin.role,
          permissions: resolvePermissions(
            admin.role,
            admin.extraPermissions,
            admin.revokedPermissions,
          ),
        };
      }

      const user = await User.findOne({ email, deletedAt: null }).select("+passwordHash");
      if (!user?.passwordHash) return null;

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return null;

      user.lastLoginAt = new Date();
      await user.save();

      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        isVerified: Boolean(user.emailVerified),
        isAdmin: false,
      };
    },
  }),
];

if (integrations.google) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export const authConfig: NextAuthConfig = {
  providers,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  trustHost: true,

  callbacks: {
    async signIn({ user, account }) {
      // Google sign-in: upsert a traveller record so the account page works.
      if (account?.provider === "google" && user.email) {
        await connectDB();
        const existing = await User.findOne({ email: user.email });

        if (!existing) {
          const created = await User.create({
            name: user.name ?? "Traveller",
            email: user.email,
            image: user.image ?? undefined,
            emailVerified: new Date(),
          });
          user.id = created._id.toString();
        } else {
          if (!existing.emailVerified) existing.emailVerified = new Date();
          existing.lastLoginAt = new Date();
          if (user.image && !existing.image) existing.image = user.image;
          await existing.save();
          user.id = existing._id.toString();
        }
      }
      return true;
    },

    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id ?? token.sub ?? "";
        token.isVerified = Boolean(user.isVerified);
        token.isAdmin = Boolean(user.isAdmin);
        token.adminRole = user.adminRole as AdminRole | undefined;
        token.permissions = user.permissions as Permission[] | undefined;
      }

      // Re-read staff permissions when the session is explicitly refreshed, so a
      // role change takes effect without forcing a sign-out.
      if (trigger === "update" && token.isAdmin && token.id) {
        await connectDB();
        const admin = await AdminUser.findById(token.id);
        if (!admin || !admin.isActive) {
          token.isAdmin = false;
          token.permissions = [];
        } else {
          token.adminRole = admin.role;
          token.permissions = resolvePermissions(
            admin.role,
            admin.extraPermissions,
            admin.revokedPermissions,
          );
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.isVerified = token.isVerified;
      session.user.isAdmin = token.isAdmin;
      session.user.adminRole = token.adminRole;
      session.user.permissions = token.permissions;
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
