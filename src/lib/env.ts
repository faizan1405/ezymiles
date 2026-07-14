import "server-only";
import { z } from "zod";

/**
 * Environment validation.
 *
 * Required vars fail loudly at first access. Optional integrations (Razorpay,
 * Cloudinary, Google OAuth, SMTP) are allowed to be absent — the app degrades
 * gracefully and the corresponding feature reports itself as "not configured"
 * rather than crashing the whole site.
 */

const serverSchema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  MONGODB_DB: z.string().default("ezymiles"),

  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 characters"),
  AUTH_URL: z.url().optional(),

  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),

  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().default("EzyMiles <no-reply@ezymiles.example>"),

  FLIGHT_PROVIDER: z.enum(["demo", "amadeus"]).default("demo"),
  AMADEUS_CLIENT_ID: z.string().optional(),
  AMADEUS_CLIENT_SECRET: z.string().optional(),

  SEED_ADMIN_EMAIL: z.string().default("admin@ezymiles.example"),
  SEED_ADMIN_PASSWORD: z.string().default("EzyMiles@2026"),

  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

export function getEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration.\n${issues}\n\nCopy .env.example to .env.local and fill in the required values.`,
    );
  }

  cached = parsed.data;
  return cached;
}

/** Feature availability, derived from which credentials are actually present. */
export const integrations = {
  get razorpay() {
    return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  },
  get stripe() {
    return Boolean(process.env.STRIPE_SECRET_KEY);
  },
  get cloudinary() {
    return Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET,
    );
  },
  get google() {
    return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  },
  get smtp() {
    return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
  },
  get liveFlights() {
    return (
      process.env.FLIGHT_PROVIDER === "amadeus" &&
      Boolean(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET)
    );
  },
} as const;
