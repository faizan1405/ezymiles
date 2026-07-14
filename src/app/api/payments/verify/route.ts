import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Booking, Payment, Notification } from "@/models";
import { getGateway } from "@/server/payments/gateway";
import { confirmBookingAfterPayment } from "@/server/bookings";
import { getSettings } from "@/lib/settings";
import { sendMail } from "@/lib/mail";
import { renderTemplate } from "@/lib/email-templates";
import { guard } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  bookingId: z.string().min(1),
  paymentId: z.string().min(1),
  gatewayOrderId: z.string().min(1),
  gatewayPaymentId: z.string().min(1),
  signature: z.string().min(1),
});

/**
 * Server-side payment verification.
 *
 * The browser telling us "payment succeeded" is not evidence. We recompute the
 * HMAC signature with our secret, then ask the gateway directly whether the
 * payment was actually captured, and only then confirm the booking.
 */
export async function POST(request: Request) {
  const limit = await guard("payment-verify", { limit: 20, windowSeconds: 60 });
  if (!limit.success) {
    return NextResponse.json({ ok: false, error: "Too many attempts." }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
  }

  const { bookingId, paymentId, gatewayOrderId, gatewayPaymentId, signature } = parsed.data;

  try {
    await connectDB();

    const [booking, payment] = await Promise.all([
      Booking.findById(bookingId),
      Payment.findById(paymentId),
    ]);

    if (!booking || !payment) {
      return NextResponse.json({ ok: false, error: "Booking not found." }, { status: 404 });
    }

    // Replay guard: this payment was already captured.
    if (payment.status === "paid") {
      return NextResponse.json({ ok: true, reference: booking.reference, alreadyProcessed: true });
    }

    if (payment.gatewayOrderId !== gatewayOrderId) {
      return NextResponse.json({ ok: false, error: "Order mismatch." }, { status: 400 });
    }

    const gateway = getGateway(payment.gateway);
    const result = await gateway.verifyPayment({
      orderId: gatewayOrderId,
      paymentId: gatewayPaymentId,
      signature,
    });

    if (!result.verified) {
      const alreadyFailed = payment.status === "failed";

      payment.status = "failed";
      payment.failureReason = "Signature or capture verification failed";
      await payment.save();

      booking.payment.status = "failed";
      booking.status = "failed";
      await booking.save();

      if (!alreadyFailed) {
        await Notification.create({
          audience: "admin",
          kind: "payment",
          title: `Payment failed — ${booking.reference}`,
          body: `${booking.guestName ?? "Guest"} · signature/capture verification failed`,
          href: "/admin/payments",
        });
      }

      const settings = await getSettings();
      if (booking.guestEmail) {
        const tpl = await renderTemplate("paymentFailed", {
          brandName: settings.brand.name,
          name: booking.guestName ?? "there",
          reference: booking.reference,
        });
        await sendMail({ to: booking.guestEmail, subject: tpl.subject, html: tpl.html });
      }

      return NextResponse.json(
        { ok: false, error: "We could not verify that payment. Nothing has been charged." },
        { status: 402 },
      );
    }

    payment.status = "paid";
    payment.gatewayPaymentId = gatewayPaymentId;
    payment.gatewaySignature = signature;
    payment.method = result.method;
    payment.paidAt = new Date();
    payment.invoiceNumber = `INV-${booking.reference}-${payment.instalment}`;
    await payment.save();

    const confirmed = await confirmBookingAfterPayment(bookingId, paymentId);

    const settings = await getSettings();
    if (confirmed.guestEmail) {
      const tpl = await renderTemplate("paymentConfirmation", {
        brandName: settings.brand.name,
        name: confirmed.guestName ?? "there",
        reference: confirmed.reference,
        amountINR: payment.amountINR,
        balanceINR: confirmed.payment.balanceINR,
      });
      await sendMail({ to: confirmed.guestEmail, subject: tpl.subject, html: tpl.html });
    }

    return NextResponse.json({ ok: true, reference: confirmed.reference });
  } catch (error) {
    console.error("[api/payments/verify]", error);
    return NextResponse.json(
      { ok: false, error: "Verification failed. If you were charged, contact us with your reference." },
      { status: 500 },
    );
  }
}
