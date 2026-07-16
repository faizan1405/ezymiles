import NextAuth, { type NextAuthConfig } from "next-auth";
import { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { Account, AdminUser, User } from "@/models";
import { resolvePermissions } from "@/lib/permissions";
import { loginSchema } from "@/lib/validation";
import { integrations } from "@/lib/env";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import type { AdminRole, Permission } from "@/models/types";

/**
 * Thrown instead of returning `null` when a sign-in attempt is throttled, so
 * the client can tell "wrong password" apart from "slow down" — `code` is the
 * only part of an AuthError that reaches the browser, so it must stay generic.
 */
class RateLimitedSignin extends CredentialsSignin {
  code = "rate-limited";
}

/**
 * Auth.js v5.
 *
 * Two audiences share one session, but no longer one provider:
 *
 *   • Travellers (User)     — Google only. No password is ever checked.
 *   • Staff (AdminUser)     — email + password, via the Credentials provider.
 *
 * The split is the security boundary. The Credentials provider resolves staff
 * and *only* staff, so no Google sign-in can reach an admin role; and the
 * Google branch refuses any email that belongs to a staff account, so no
 * traveller can arrive at staff permissions through OAuth.
 *
 * JWT sessions (not database sessions) so that middleware can authorise an
 * admin route without a database round-trip on every request.
 */

/** Codes read back by the login page. Kept stable — the UI maps them to copy. */
export const AUTH_ERROR = {
  noEmail: "NoEmail",
  emailUnverified: "EmailUnverified",
  staffAccount: "StaffAccount",
  accountDisabled: "AccountDisabled",
  database: "DatabaseUnavailable",
} as const;

const deny = (code: string) => `/login?error=${code}`;

/* -------------------------------------------------------------------------- */
/*                                  Providers                                  */
/* -------------------------------------------------------------------------- */

const providers: NextAuthConfig["providers"] = [
  Credentials({
    id: "credentials",
    name: "Staff email and password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(raw) {
      const parsed = loginSchema.safeParse(raw);
      if (!parsed.success) return null;

      const { email, password } = parsed.data;

      // Throttle both per-IP (stop distributed brute force) and per-account
      // (stop credential stuffing against one victim from many IPs).
      const ip = await getClientIp();
      const ipLimit = rateLimit(`login-ip:${ip}`, { limit: 15, windowSeconds: 15 * 60 });
      const emailLimit = rateLimit(`login-email:${email}`, { limit: 6, windowSeconds: 15 * 60 });
      if (!ipLimit.success || !emailLimit.success) {
        throw new RateLimitedSignin();
      }

      await connectDB();

      // Staff only. Travellers used to fall through to a User password check
      // here; they now sign in with Google, and a traveller who somehow reaches
      // this provider must get the same answer as an unknown email.
      const admin = await AdminUser.findOne({ email, isActive: true, deletedAt: null }).select(
        "+passwordHash",
      );

      if (!admin?.passwordHash) return null;

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
        permissions: await resolvePermissions(
          admin.role,
          admin.extraPermissions,
          admin.revokedPermissions,
        ),
      };
    },
  }),
];

if (integrations.google) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      // Linking is done explicitly in the signIn callback below, where the
      // email can be checked for verification first. The "dangerous" flag would
      // link on an unverified email, which is an account-takeover route.
      allowDangerousEmailAccountLinking: false,
    }),
  );
} else {
  // Loud on the server, silent to the browser: the login page disables the
  // button on its own, and this must never print the values themselves.
  console.warn(
    "[auth] Google sign-in is disabled: AUTH_GOOGLE_ID and/or AUTH_GOOGLE_SECRET are not set. " +
      "Travellers cannot sign in until these are configured.",
  );
}

/* -------------------------------------------------------------------------- */
/*                              Google sign-in                                 */
/* -------------------------------------------------------------------------- */

/** Mongo's duplicate-key error, i.e. a unique index did its job under a race. */
function isDuplicateKey(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

type GoogleUser = { id?: string; name?: string | null; email?: string | null; image?: string | null };

/**
 * Resolve a Google identity to exactly one traveller, creating or linking as
 * needed. Returns `true` to continue, or a URL to bounce back to the login page
 * with a code the UI can explain.
 */
async function signInWithGoogle(
  user: GoogleUser & { isVerified?: boolean; isAdmin?: boolean },
  providerAccountId: string,
  profile:
    | { email?: string | null; email_verified?: boolean | null; name?: string | null; picture?: string | null }
    | undefined,
): Promise<true | string> {
  const email = (profile?.email ?? user.email)?.toLowerCase();
  if (!email) return deny(AUTH_ERROR.noEmail);

  // The whole linking model rests on Google having verified this address: an
  // unverified one could be anybody's, and matching it to an existing traveller
  // would hand over their bookings. This is exactly the check that
  // `allowDangerousEmailAccountLinking` skips, hence the name.
  //
  // Explicitly `true` — not merely "not false". Google always sends this claim,
  // so anything else means we can't prove the address, and unproven is refused.
  if (profile?.email_verified !== true) return deny(AUTH_ERROR.emailUnverified);

  try {
    await connectDB();
  } catch (error) {
    console.error("[auth] database unavailable during Google sign-in", error);
    return deny(AUTH_ERROR.database);
  }

  try {
    // Staff sign in with a password, never with Google. Handing a staff email a
    // traveller session would be confusing; handing it anything else would be
    // dangerous. Refuse outright.
    const staff = await AdminUser.findOne({ email, deletedAt: null }).select("_id");
    if (staff) return deny(AUTH_ERROR.staffAccount);

    const name = profile?.name ?? user.name ?? "Traveller";
    const image = profile?.picture ?? user.image ?? undefined;

    // 1. Known Google identity → the traveller it was linked to. This is the
    //    returning-login path, and it never writes a new User or Account.
    const link = await Account.findOne({ provider: "google", providerAccountId });

    let doc = link ? await User.findById(link.user) : await User.findOne({ email });

    // 2. Unknown identity, unknown email → a brand new traveller. Nothing here
    //    grants a role: travellers have no role field, and `isAdmin` is pinned
    //    to false below.
    if (!doc) {
      try {
        doc = await User.create({ name, email, image, emailVerified: new Date() });
      } catch (error) {
        if (!isDuplicateKey(error)) throw error;
        // Two first sign-ins raced; the unique email index picked a winner.
        doc = await User.findOne({ email });
        if (!doc) throw error;
      }
    }

    // A soft-deleted traveller must not be resurrected by signing in again.
    if (doc.deletedAt) return deny(AUTH_ERROR.accountDisabled);

    // 3. Link the identity. Upsert rather than create: the unique index on
    //    (provider, providerAccountId) makes this idempotent, so a returning
    //    login and a racing first login both settle on one Account record.
    const account = await Account.findOneAndUpdate(
      { provider: "google", providerAccountId },
      { $setOnInsert: { provider: "google", providerAccountId, type: "oidc", user: doc._id } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // If a race linked this identity to a different traveller first, that one
    // wins — otherwise the two sessions would disagree about who this is.
    if (account.user.toString() !== doc._id.toString()) {
      const winner = await User.findById(account.user);
      if (!winner || winner.deletedAt) return deny(AUTH_ERROR.accountDisabled);
      doc = winner;
    }

    // 4. Refresh the profile, preserving everything the traveller already has:
    //    wishlist, bookings, enquiries, phone, currency and consent are all
    //    untouched. Their own name survives too — Google does not overwrite it.
    doc.emailVerified ??= new Date();
    doc.image ??= image;
    doc.lastLoginAt = new Date();
    await doc.save();

    user.id = doc._id.toString();
    user.image = doc.image ?? image ?? null;
    user.isVerified = true;
    user.isAdmin = false;

    return true;
  } catch (error) {
    console.error("[auth] Google sign-in failed", error);
    return deny(AUTH_ERROR.database);
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Config                                    */
/* -------------------------------------------------------------------------- */

export const authConfig: NextAuthConfig = {
  providers,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  trustHost: true,

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;
      return signInWithGoogle(user, account.providerAccountId, profile);
    },

    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id ?? token.sub ?? "";
        token.isVerified = Boolean(user.isVerified);
        // Only the Credentials provider can ever set this, and it only sets it
        // for an AdminUser. A Google sign-in lands here with isAdmin false.
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
          token.permissions = await resolvePermissions(
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
