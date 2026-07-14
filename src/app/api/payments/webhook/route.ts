import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Booking, Payment, Notification } from "@/models";
import { getGateway } from "@/server/payments/gateway";
import { confirmBookingAfterPayment } from "@/server/bookings";

export const dynamic = "force-dynamic";

/**
 * Gateway webhook.
 *
 * The browser can close mid-redirect, so this is the authoritative path: the
 * gateway tells us what happened, we verify the signature over the *raw* body,
 * and reconcile. Confirmation is idempotent, so a webhook racing the browser
 * callback is harmless.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  const gateway = getGateway("razorpay");

  if (!gateway.verifyWebhook(raw, signature)) {
    // A webhook we cannot verify is a webhook we do not act on.
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: {
        entity?: { id?: string; order_id?: string; method?: string; error_description?: string };
      };
    };
  };

  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed payload" }, { status: 400 });
  }

  const entity = event.payload?.payment?.entity;
  if (!entity?.order_id) return NextResponse.json({ ok: true, ignored: true });

  try {
    await connectDB();

    const payment = await Payment.findOne({ gatewayOrderId: entity.order_id });
    if (!payment) return NextResponse.json({ ok: true, ignored: true });

    if (event.event === "payment.captured") {
      if (payment.status === "paid") return NextResponse.json({ ok: true, alreadyProcessed: true });

      payment.status = "paid";
      payment.gatewayPaymentId = entity.id;
      payment.method = entity.method;
      payment.paidAt = new Date();
      payment.rawResponse = event as unknown as Record<string, unknown>;
      await payment.save();

      await confirmBookingAfterPayment(payment.booking.toString(), payment._id.toString());
      return NextResponse.json({ ok: true });
    }

    if (event.event === "payment.failed") {
      if (payment.status === "failed") return NextResponse.json({ ok: true, alreadyProcessed: true });

      payment.status = "failed";
      payment.failureReason = entity.error_description ?? "Payment failed at gateway";
      await payment.save();

      const booking = await Booking.findOneAndUpdate(
        { _id: payment.booking, status: { $in: ["pending_payment", "draft"] } },
        { $set: { status: "failed", "payment.status": "failed" } },
      );

      await Notification.create({
        audience: "admin",
        kind: "payment",
        title: `Payment failed — ${booking?.reference ?? payment.booking}`,
        body: entity.error_description ?? "Payment failed at gateway",
        href: "/admin/payments",
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true, ignored: true });
  } catch (error) {
    console.error("[api/payments/webhook]", error);
    // 500 makes the gateway retry, which is what we want.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
