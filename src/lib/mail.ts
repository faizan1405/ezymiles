import "server-only";
import nodemailer from "nodemailer";
import { integrations } from "@/lib/env";

/**
 * Delivery layer.
 *
 * Email goes out over SMTP when credentials exist. WhatsApp and SMS are stubbed
 * behind the same interface so a provider (Gupshup / Twilio / Meta Cloud API)
 * can be dropped in later without touching any call site.
 */

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface DeliveryResult {
  delivered: boolean;
  channel: "email" | "whatsapp" | "sms";
  reason?: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return transporter;
}

export async function sendMail(message: MailMessage): Promise<DeliveryResult> {
  if (!integrations.smtp) {
    // Not an error: local dev and preview deploys run without SMTP on purpose.
    console.info(
      `[mail] SMTP not configured — would have sent "${message.subject}" to ${message.to}`,
    );
    return { delivered: false, channel: "email", reason: "smtp_not_configured" };
  }

  try {
    await getTransporter().sendMail({
      from: process.env.MAIL_FROM ?? "Voyara <no-reply@voyara.example>",
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text ?? stripHtml(message.html),
      replyTo: message.replyTo,
    });
    return { delivered: true, channel: "email" };
  } catch (error) {
    console.error("[mail] send failed:", (error as Error).message);
    return { delivered: false, channel: "email", reason: (error as Error).message };
  }
}

/** Placeholder for a future WhatsApp Business API integration. */
export async function sendWhatsApp(to: string, body: string): Promise<DeliveryResult> {
  console.info(`[whatsapp] not configured — would have sent to ${to}: ${body.slice(0, 60)}…`);
  return { delivered: false, channel: "whatsapp", reason: "provider_not_configured" };
}

/** Placeholder for a future SMS gateway integration. */
export async function sendSMS(to: string, body: string): Promise<DeliveryResult> {
  console.info(`[sms] not configured — would have sent to ${to}: ${body.slice(0, 60)}…`);
  return { delivered: false, channel: "sms", reason: "provider_not_configured" };
}

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
