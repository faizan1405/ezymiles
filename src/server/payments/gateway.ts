import "server-only";
import crypto from "node:crypto";
import Razorpay from "razorpay";
import { integrations } from "@/lib/env";
import type { PaymentGateway as GatewayName } from "@/models/types";

/**
 * Payment abstraction.
 *
 * The booking flow only ever talks to this interface. Razorpay is implemented
 * today; Stripe implements the same three methods and can be switched on from
 * Admin → Site Settings without touching a single line of the booking system.
 */

export interface CreateOrderArgs {
  amountINR: number;
  receipt: string;
  notes?: Record<string, string>;
}

export interface CreatedOrder {
  gateway: GatewayName;
  orderId: string;
  amountINR: number;
  currency: string;
  /** Public key for the browser SDK. Never a secret. */
  publicKey: string;
}

export interface VerifyArgs {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface RefundArgs {
  paymentId: string;
  amountINR: number;
  notes?: Record<string, string>;
}

export interface PaymentProvider {
  readonly name: GatewayName;
  readonly configured: boolean;
  createOrder(args: CreateOrderArgs): Promise<CreatedOrder>;
  /** Must be done server-side. A client-reported "success" means nothing. */
  verifyPayment(args: VerifyArgs): Promise<{ verified: boolean; method?: string }>;
  verifyWebhook(rawBody: string, signature: string): boolean;
  refund(args: RefundArgs): Promise<{ refundId: string; status: string }>;
}

/* -------------------------------------------------------------------------- */
/*                                  Razorpay                                   */
/* -------------------------------------------------------------------------- */

class RazorpayProvider implements PaymentProvider {
  readonly name = "razorpay" as const;

  get configured() {
    return integrations.razorpay;
  }

  private client() {
    if (!this.configured) {
      throw new Error("Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
    }
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }

  async createOrder({ amountINR, receipt, notes }: CreateOrderArgs): Promise<CreatedOrder> {
    const order = await this.client().orders.create({
      // Razorpay works in the smallest currency unit.
      amount: Math.round(amountINR * 100),
      currency: "INR",
      receipt,
      notes,
    });

    return {
      gateway: "razorpay",
      orderId: order.id,
      amountINR,
      currency: "INR",
      publicKey: process.env.RAZORPAY_KEY_ID!,
    };
  }

  async verifyPayment({ orderId, paymentId, signature }: VerifyArgs) {
    if (!this.configured) return { verified: false };

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    // Constant-time compare — a plain === leaks timing information.
    const verified = timingSafeEqual(expected, signature);
    if (!verified) return { verified: false };

    // Cross-check with the gateway: a valid signature on a failed payment is
    // still a failed payment.
    try {
      const payment = await this.client().payments.fetch(paymentId);
      const captured = payment.status === "captured" || payment.status === "authorized";
      return { verified: captured, method: payment.method };
    } catch (error) {
      console.error("[razorpay] fetch payment failed:", error);
      return { verified: false };
    }
  }

  verifyWebhook(rawBody: string, signature: string) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return false;

    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    return timingSafeEqual(expected, signature);
  }

  async refund({ paymentId, amountINR, notes }: RefundArgs) {
    const refund = await this.client().payments.refund(paymentId, {
      amount: Math.round(amountINR * 100),
      notes,
    });
    return { refundId: refund.id, status: refund.status };
  }
}

/* -------------------------------------------------------------------------- */
/*                            Stripe (ready, not wired)                        */
/* -------------------------------------------------------------------------- */

/**
 * Stripe placeholder.
 *
 * Deliberately throws rather than silently pretending to work. To enable
 * international card payments: `npm i stripe`, fill in these three methods
 * against the Stripe SDK, and flip `payments.stripeEnabled` in Site Settings.
 * The booking, refund and webhook flows already speak this interface.
 */
class StripeProvider implements PaymentProvider {
  readonly name = "stripe" as const;

  get configured() {
    return integrations.stripe;
  }

  async createOrder(): Promise<CreatedOrder> {
    throw new Error(
      "Stripe is not implemented yet. Install the Stripe SDK and complete StripeProvider.",
    );
  }

  async verifyPayment() {
    return { verified: false };
  }

  verifyWebhook() {
    return false;
  }

  async refund(): Promise<{ refundId: string; status: string }> {
    throw new Error("Stripe refunds are not implemented yet.");
  }
}

/* -------------------------------------------------------------------------- */

const razorpay = new RazorpayProvider();
const stripe = new StripeProvider();

export function getGateway(name: GatewayName = "razorpay"): PaymentProvider {
  if (name === "stripe") return stripe;
  return razorpay;
}

export function timingSafeEqual(a: string, b: string) {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
