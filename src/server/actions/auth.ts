"use server";

import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { AdminUser, User } from "@/models";
import { guard } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";
import { sendMail } from "@/lib/mail";
import { renderTemplate } from "@/lib/email-templates";
import { SITE_URL } from "@/config/site";
import {
  forgotPasswordSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation";

export interface AuthResult {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
}

function fieldErrors(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Tokens are stored hashed — a database leak must not hand out working links. */
function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/* -------------------------------------------------------------------------- */
/*                                  Register                                   */
/* -------------------------------------------------------------------------- */

export async function registerUser(raw: unknown): Promise<AuthResult> {
  const limit = await guard("register", { limit: 5, windowSeconds: 600 });
  if (!limit.success) {
    return { ok: false, message: "Too many attempts. Please wait a few minutes." };
  }

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const { name, email, phone, password, marketingOptIn } = parsed.data;

  try {
    await connectDB();

    // Staff accounts live in a separate collection; an email may only be one thing.
    const [existingUser, existingAdmin] = await Promise.all([
      User.findOne({ email }),
      AdminUser.findOne({ email }),
    ]);

    if (existingUser || existingAdmin) {
      return {
        ok: false,
        message: "An account with that email already exists. Try signing in instead.",
        fieldErrors: { email: "This email is already registered" },
      };
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const token = randomBytes(32).toString("hex");

    const user = await User.create({
      name,
      email,
      phone,
      passwordHash,
      marketingOptIn,
      verificationToken: hashToken(token),
      verificationTokenExpiry: new Date(Date.now() + 24 * 3600 * 1000),
    });

    const settings = await getSettings();

    const verifyTpl = await renderTemplate("verifyEmail", {
      brandName: settings.brand.name,
      name: user.name,
      url: `${SITE_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`,
    });
    await sendMail({ to: email, subject: verifyTpl.subject, html: verifyTpl.html });

    const welcomeTpl = await renderTemplate("welcome", { brandName: settings.brand.name, name: user.name });
    await sendMail({ to: email, subject: welcomeTpl.subject, html: welcomeTpl.html });

    return {
      ok: true,
      message: "Account created. Check your inbox to verify your email — then sign in.",
    };
  } catch (error) {
    console.error("[registerUser]", error);
    return { ok: false, message: "We couldn't create your account. Please try again." };
  }
}

/* -------------------------------------------------------------------------- */
/*                              Email verification                             */
/* -------------------------------------------------------------------------- */

export async function verifyEmail(token: string, email: string): Promise<AuthResult> {
  const limit = await guard("verify-email", { limit: 10, windowSeconds: 600 });
  if (!limit.success) return { ok: false, message: "Too many attempts. Please wait." };

  if (!token || !email) return { ok: false, message: "That verification link is incomplete." };

  try {
    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+verificationToken +verificationTokenExpiry",
    );

    if (!user || !user.verificationToken) {
      return { ok: false, message: "That verification link is no longer valid." };
    }

    if (user.emailVerified) {
      return { ok: true, message: "Your email is already verified. You can sign in." };
    }

    if (user.verificationToken !== hashToken(token)) {
      return { ok: false, message: "That verification link is not valid." };
    }

    if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
      return { ok: false, message: "That link has expired. Request a new one from the sign-in page." };
    }

    user.emailVerified = new Date();
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    return { ok: true, message: "Email verified. You can sign in now." };
  } catch (error) {
    console.error("[verifyEmail]", error);
    return { ok: false, message: "We couldn't verify that link. Please try again." };
  }
}

/* -------------------------------------------------------------------------- */
/*                               Password reset                                */
/* -------------------------------------------------------------------------- */

export async function requestPasswordReset(raw: unknown): Promise<AuthResult> {
  const limit = await guard("forgot-password", { limit: 5, windowSeconds: 900 });
  if (!limit.success) {
    return { ok: false, message: "Too many requests. Please wait a few minutes." };
  }

  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Enter a valid email address.", fieldErrors: fieldErrors(parsed.error) };
  }

  // Always the same answer, whether or not the account exists — otherwise this
  // endpoint becomes an account-enumeration oracle.
  const SAFE_RESPONSE: AuthResult = {
    ok: true,
    message: "If an account exists for that email, a reset link is on its way.",
  };

  try {
    await connectDB();

    const user = await User.findOne({ email: parsed.data.email, deletedAt: null });
    if (!user) return SAFE_RESPONSE;

    const token = randomBytes(32).toString("hex");
    user.resetToken = hashToken(token);
    user.resetTokenExpiry = new Date(Date.now() + 3600 * 1000);
    await user.save();

    const settings = await getSettings();
    const tpl = await renderTemplate("resetPassword", {
      brandName: settings.brand.name,
      name: user.name,
      url: `${SITE_URL}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`,
    });
    await sendMail({ to: user.email, subject: tpl.subject, html: tpl.html });

    return SAFE_RESPONSE;
  } catch (error) {
    console.error("[requestPasswordReset]", error);
    return SAFE_RESPONSE;
  }
}

export async function resetPassword(raw: unknown, email: string): Promise<AuthResult> {
  const limit = await guard("reset-password", { limit: 6, windowSeconds: 900 });
  if (!limit.success) return { ok: false, message: "Too many attempts. Please wait." };

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  try {
    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase(), deletedAt: null }).select(
      "+resetToken +resetTokenExpiry",
    );

    if (!user?.resetToken || user.resetToken !== hashToken(parsed.data.token)) {
      return { ok: false, message: "That reset link is not valid. Request a new one." };
    }

    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return { ok: false, message: "That reset link has expired. Request a new one." };
    }

    user.passwordHash = await bcrypt.hash(parsed.data.password, 12);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return { ok: true, message: "Password updated. You can sign in with your new password." };
  } catch (error) {
    console.error("[resetPassword]", error);
    return { ok: false, message: "We couldn't reset your password. Please try again." };
  }
}
