import "server-only";
import { BRAND, SITE_URL } from "@/config/site";
import { formatDate, formatPrice } from "@/lib/utils";
import { connectDB } from "@/lib/db";
import { EmailTemplate } from "@/models";

/**
 * Transactional email templates.
 *
 * Deliberately plain HTML with inline styles — that is what survives Gmail,
 * Outlook and Apple Mail. Every template shares one shell so the brand only has
 * to be changed in a single place.
 */

interface ShellOptions {
  brandName: string;
  preheader: string;
  heading: string;
  body: string;
  cta?: { label: string; href: string };
  footerNote?: string;
}

function shell({ brandName, preheader, heading, body, cta, footerNote }: ShellOptions) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4efe6;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#10192b;">
  <span style="display:none;font-size:1px;color:#f4efe6;">${preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe6;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px -20px rgba(10,22,40,.35);">
        <tr>
          <td style="background:linear-gradient(135deg,#0a1628 0%,#123f52 55%,#17a5a3 100%);padding:28px 32px;">
            <p style="margin:0;font-size:18px;font-weight:600;color:#ffffff;letter-spacing:-.01em;">${brandName}</p>
            <p style="margin:4px 0 0;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.65);">${BRAND.tagline}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0a1628;">${heading}</h1>
            <div style="font-size:15px;line-height:1.65;color:#5b6577;">${body}</div>
            ${
              cta
                ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
                     <tr><td style="border-radius:999px;background:#0f8484;">
                       <a href="${cta.href}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;">${cta.label}</a>
                     </td></tr>
                   </table>`
                : ""
            }
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 28px;border-top:1px solid #e8e3da;">
            <p style="margin:0;font-size:12px;line-height:1.6;color:#8b95a5;">
              ${footerNote ?? `Questions? Just reply to this email — a human reads it.`}
            </p>
          </td>
        </tr>
      </table>
      <p style="margin:20px 0 0;font-size:11px;color:#9aa3b2;">© ${new Date().getFullYear()} ${brandName}</p>
    </td></tr>
  </table>
</body>
</html>`;
}

interface TemplateContext {
  brandName: string;
}

export const emailTemplates = {
  welcome: (ctx: TemplateContext & { name: string }) => ({
    subject: `Welcome to ${ctx.brandName}`,
    html: shell({
      brandName: ctx.brandName,
      preheader: "Your account is ready.",
      heading: `Welcome aboard, ${ctx.name}.`,
      body: `<p>Your account is ready. You can now save packages you like, track enquiries, and manage every booking in one place.</p>
             <p>When you're ready to plan something, tell us what a good day looks like for you — we'll build the trip around it.</p>`,
      cta: { label: "Explore packages", href: `${SITE_URL}/packages` },
    }),
  }),

  verifyEmail: (ctx: TemplateContext & { name: string; url: string }) => ({
    subject: "Confirm your email address",
    html: shell({
      brandName: ctx.brandName,
      preheader: "One click to verify your email.",
      heading: `Confirm your email, ${ctx.name}`,
      body: `<p>Tap the button below to verify this address. The link is valid for 24 hours.</p>
             <p style="font-size:13px;color:#8b95a5;">If you didn't create an account, you can safely ignore this email.</p>`,
      cta: { label: "Verify email", href: ctx.url },
    }),
  }),

  resetPassword: (ctx: TemplateContext & { name: string; url: string }) => ({
    subject: "Reset your password",
    html: shell({
      brandName: ctx.brandName,
      preheader: "Reset your password.",
      heading: "Reset your password",
      body: `<p>Hi ${ctx.name}, we received a request to reset your password. The link below expires in one hour.</p>
             <p style="font-size:13px;color:#8b95a5;">If this wasn't you, ignore this email — your password will not change.</p>`,
      cta: { label: "Choose a new password", href: ctx.url },
    }),
  }),

  enquiryReceived: (ctx: TemplateContext & { name: string; reference: string; subject?: string }) => ({
    subject: `We've got your enquiry (${ctx.reference})`,
    html: shell({
      brandName: ctx.brandName,
      preheader: "A travel designer will be in touch shortly.",
      heading: `Thanks, ${ctx.name} — we're on it.`,
      body: `<p>Your enquiry reference is <strong>${ctx.reference}</strong>${
        ctx.subject ? ` for <strong>${ctx.subject}</strong>` : ""
      }.</p>
             <p>A destination specialist will reach out within one business day with options, honest pricing, and anything you should know before you commit.</p>`,
      cta: { label: "Browse packages while you wait", href: `${SITE_URL}/packages` },
    }),
  }),

  callbackReceived: (ctx: TemplateContext & { name: string; phone: string }) => ({
    subject: "Your callback is scheduled",
    html: shell({
      brandName: ctx.brandName,
      preheader: "We'll call you shortly.",
      heading: `We'll call you, ${ctx.name}.`,
      body: `<p>We have your number (<strong>${ctx.phone}</strong>) and a specialist will call during business hours.</p>
             <p>If you'd rather talk sooner, reply to this email with a better time.</p>`,
    }),
  }),

  bookingConfirmation: (
    ctx: TemplateContext & {
      name: string;
      reference: string;
      title: string;
      travelDate?: Date | string;
      totalINR: number;
      paidINR: number;
      balanceINR: number;
    },
  ) => ({
    subject: `Booking confirmed — ${ctx.reference}`,
    html: shell({
      brandName: ctx.brandName,
      preheader: `Your booking ${ctx.reference} is confirmed.`,
      heading: "You're going.",
      body: `<p>Hi ${ctx.name}, your booking is confirmed.</p>
             <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;border:1px solid #e8e3da;border-radius:14px;">
               ${row("Reference", ctx.reference)}
               ${row("Trip", ctx.title)}
               ${ctx.travelDate ? row("Travel date", formatDate(ctx.travelDate)) : ""}
               ${row("Total", formatPrice(ctx.totalINR))}
               ${row("Paid", formatPrice(ctx.paidINR))}
               ${ctx.balanceINR > 0 ? row("Balance due", formatPrice(ctx.balanceINR)) : ""}
             </table>
             <p>Your invoice and voucher are available in your account.</p>`,
      cta: { label: "View booking", href: `${SITE_URL}/account/trips` },
    }),
  }),

  paymentConfirmation: (
    ctx: TemplateContext & { name: string; reference: string; amountINR: number; balanceINR: number },
  ) => ({
    subject: `Payment received — ${ctx.reference}`,
    html: shell({
      brandName: ctx.brandName,
      preheader: "Payment received.",
      heading: "Payment received",
      body: `<p>Thanks ${ctx.name} — we've received <strong>${formatPrice(ctx.amountINR)}</strong> against booking <strong>${ctx.reference}</strong>.</p>
             ${
               ctx.balanceINR > 0
                 ? `<p>A balance of <strong>${formatPrice(ctx.balanceINR)}</strong> remains. We'll remind you before it's due.</p>`
                 : `<p>Your booking is now paid in full.</p>`
             }`,
      cta: { label: "Download invoice", href: `${SITE_URL}/account/payments` },
    }),
  }),

  paymentFailed: (ctx: TemplateContext & { name: string; reference: string }) => ({
    subject: `Payment didn't go through — ${ctx.reference}`,
    html: shell({
      brandName: ctx.brandName,
      preheader: "Your payment failed. Your booking is still held.",
      heading: "That payment didn't go through",
      body: `<p>Hi ${ctx.name}, the payment for booking <strong>${ctx.reference}</strong> failed. Nothing has been charged.</p>
             <p>Your booking is held as pending — you can retry with the same or a different method.</p>`,
      cta: { label: "Retry payment", href: `${SITE_URL}/account/trips` },
    }),
  }),

  tripReminder: (
    ctx: TemplateContext & { name: string; reference: string; title: string; travelDate: Date | string; days: number },
  ) => ({
    subject: `${ctx.days} days to go — ${ctx.title}`,
    html: shell({
      brandName: ctx.brandName,
      preheader: `Your trip departs on ${formatDate(ctx.travelDate)}.`,
      heading: `${ctx.days} days to go`,
      body: `<p>Hi ${ctx.name}, your trip <strong>${ctx.title}</strong> departs on <strong>${formatDate(ctx.travelDate)}</strong>.</p>
             <p>Now is a good moment to check your documents, confirm your transfers, and pack for the weather rather than the photos.</p>`,
      cta: { label: "View your itinerary", href: `${SITE_URL}/account/trips` },
    }),
  }),

  visaUpdate: (
    ctx: TemplateContext & { name: string; reference: string; country: string; status: string; note?: string },
  ) => ({
    subject: `Visa update — ${ctx.country} (${ctx.reference})`,
    html: shell({
      brandName: ctx.brandName,
      preheader: `Your ${ctx.country} visa application has an update.`,
      heading: "Visa application update",
      body: `<p>Hi ${ctx.name}, your ${ctx.country} application (<strong>${ctx.reference}</strong>) is now: <strong>${ctx.status}</strong>.</p>
             ${ctx.note ? `<p>${ctx.note}</p>` : ""}
             <p style="font-size:13px;color:#8b95a5;">We assist with preparation and lodgement. The final decision rests entirely with the relevant embassy or immigration authority.</p>`,
      cta: { label: "Track application", href: `${SITE_URL}/account/visa` },
    }),
  }),

  cancellationUpdate: (
    ctx: TemplateContext & { name: string; reference: string; status: string; chargeINR?: number },
  ) => ({
    subject: `Cancellation update — ${ctx.reference}`,
    html: shell({
      brandName: ctx.brandName,
      preheader: "Your cancellation request has an update.",
      heading: "Cancellation update",
      body: `<p>Hi ${ctx.name}, your cancellation request for <strong>${ctx.reference}</strong> is now <strong>${ctx.status}</strong>.</p>
             ${ctx.chargeINR ? `<p>Cancellation charges applied: <strong>${formatPrice(ctx.chargeINR)}</strong>.</p>` : ""}`,
      cta: { label: "View booking", href: `${SITE_URL}/account/trips` },
    }),
  }),

  refundUpdate: (
    ctx: TemplateContext & { name: string; reference: string; amountINR: number; status: string },
  ) => ({
    subject: `Refund ${ctx.status} — ${ctx.reference}`,
    html: shell({
      brandName: ctx.brandName,
      preheader: "Refund update.",
      heading: "Refund update",
      body: `<p>Hi ${ctx.name}, the refund of <strong>${formatPrice(ctx.amountINR)}</strong> for booking <strong>${ctx.reference}</strong> is <strong>${ctx.status}</strong>.</p>
             <p>Bank settlement usually takes 5–7 working days once processed.</p>`,
    }),
  }),

  ticketUpdate: (
    ctx: TemplateContext & { name: string; reference: string; subject: string; status: string },
  ) => ({
    subject: `Support ticket ${ctx.reference} — ${ctx.status}`,
    html: shell({
      brandName: ctx.brandName,
      preheader: "Your support ticket has an update.",
      heading: "Support ticket update",
      body: `<p>Hi ${ctx.name}, your ticket "<strong>${ctx.subject}</strong>" (${ctx.reference}) is now <strong>${ctx.status}</strong>.</p>`,
      cta: { label: "Open ticket", href: `${SITE_URL}/account/support` },
    }),
  }),
};

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:12px 16px;font-size:13px;color:#8b95a5;border-bottom:1px solid #f4efe6;">${label}</td>
    <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#10192b;text-align:right;border-bottom:1px solid #f4efe6;">${value}</td>
  </tr>`;
}

export type EmailTemplateKey = keyof typeof emailTemplates;

/** Reference for the admin editor: every overridable template and the `{{tokens}}` it receives. */
export const EMAIL_TEMPLATE_CATALOG: { key: EmailTemplateKey; label: string; variables: string[] }[] = [
  { key: "welcome", label: "Welcome email", variables: ["brandName", "name"] },
  { key: "verifyEmail", label: "Verify email address", variables: ["brandName", "name", "url"] },
  { key: "resetPassword", label: "Reset password", variables: ["brandName", "name", "url"] },
  {
    key: "enquiryReceived",
    label: "Enquiry received",
    variables: ["brandName", "name", "reference", "subject"],
  },
  { key: "callbackReceived", label: "Callback scheduled", variables: ["brandName", "name", "phone"] },
  {
    key: "bookingConfirmation",
    label: "Booking confirmed",
    variables: ["brandName", "name", "reference", "title", "travelDate", "totalINR", "paidINR", "balanceINR"],
  },
  {
    key: "paymentConfirmation",
    label: "Payment received",
    variables: ["brandName", "name", "reference", "amountINR", "balanceINR"],
  },
  { key: "paymentFailed", label: "Payment failed", variables: ["brandName", "name", "reference"] },
  {
    key: "tripReminder",
    label: "Trip reminder",
    variables: ["brandName", "name", "reference", "title", "travelDate", "days"],
  },
  {
    key: "visaUpdate",
    label: "Visa application update",
    variables: ["brandName", "name", "reference", "country", "status", "note"],
  },
  {
    key: "cancellationUpdate",
    label: "Cancellation update",
    variables: ["brandName", "name", "reference", "status", "chargeINR"],
  },
  {
    key: "refundUpdate",
    label: "Refund update",
    variables: ["brandName", "name", "reference", "amountINR", "status"],
  },
  {
    key: "ticketUpdate",
    label: "Support ticket update",
    variables: ["brandName", "name", "reference", "subject", "status"],
  },
];

/**
 * Renders an email, preferring a Super-Admin-edited override from
 * Admin → Site Settings → Email templates (matched by `key`) over the
 * hardcoded template. `{{placeholder}}` tokens in the override's subject/body
 * are substituted from `ctx` — anything not found is left blank rather than
 * throwing, since an admin typo shouldn't block a transactional email.
 */
export async function renderTemplate<K extends EmailTemplateKey>(
  key: K,
  ctx: Parameters<(typeof emailTemplates)[K]>[0],
): Promise<{ subject: string; html: string }> {
  const fallback = (emailTemplates[key] as (c: typeof ctx) => { subject: string; html: string })(ctx);

  try {
    await connectDB();
    const override = await EmailTemplate.findOne({ key, isActive: true }).lean();
    if (!override) return fallback;

    const vars = ctx as unknown as Record<string, unknown>;
    const substitute = (text: string) =>
      text.replace(/\{\{(\w+)\}\}/g, (_, token: string) =>
        vars[token] != null ? String(vars[token]) : "",
      );

    const subject = substitute(override.subject);

    return {
      subject,
      html: shell({
        brandName: (ctx as { brandName: string }).brandName,
        preheader: subject,
        heading: subject,
        body: substitute(override.body),
      }),
    };
  } catch (error) {
    console.error("[renderTemplate]", error);
    return fallback;
  }
}
