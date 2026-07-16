"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Booking, Notification, SupportTicket, User } from "@/models";
import { requireUser } from "@/lib/session";
import { guard } from "@/lib/rate-limit";
import { generateReference } from "@/lib/utils";
import { supportTicketSchema, nameField, phoneField } from "@/lib/validation";

export interface AccountActionResult {
  ok: boolean;
  message: string;
  reference?: string;
}

/* ------------------------------ Support tickets ---------------------------- */

export async function createSupportTicket(raw: unknown): Promise<AccountActionResult> {
  const user = await requireUser();

  const limit = await guard("support-ticket", { limit: 5, windowSeconds: 600 });
  if (!limit.success) {
    return { ok: false, message: "Too many tickets in a short time. Please wait a few minutes." };
  }

  const parsed = supportTicketSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const d = parsed.data;

  try {
    await connectDB();

    // Attach the ticket to a booking only if it actually belongs to this user.
    let booking = null;
    if (d.bookingReference) {
      booking = await Booking.findOne({
        reference: d.bookingReference.trim().toUpperCase(),
        user: user.id,
        deletedAt: null,
      }).select("_id");
    }

    const reference = generateReference("TKT");

    await SupportTicket.create({
      reference,
      user: user.id,
      booking: booking?._id,
      name: user.name ?? "Traveller",
      email: user.email ?? "",
      subject: d.subject,
      category: d.category,
      priority: d.priority,
      status: "open",
      messages: [
        {
          author: "customer",
          authorName: user.name ?? "Traveller",
          body: d.message,
          at: new Date(),
        },
      ],
    });

    await Notification.create({
      audience: "admin",
      kind: "ticket",
      title: `New support ticket — ${d.category}`,
      body: `${user.name}: ${d.subject}`,
      href: "/admin/tickets",
    });

    revalidatePath("/account/support");

    return {
      ok: true,
      reference,
      message: "Ticket opened. We usually reply within a few hours during business hours.",
    };
  } catch (error) {
    console.error("[createSupportTicket]", error);
    return { ok: false, message: "We couldn't open that ticket. Please try again." };
  }
}

export async function replyToTicket(
  ticketId: string,
  body: string,
): Promise<AccountActionResult> {
  const user = await requireUser();

  if (!body?.trim() || body.trim().length < 2) {
    return { ok: false, message: "Write a message before sending." };
  }

  try {
    await connectDB();

    const ticket = await SupportTicket.findOne({ _id: ticketId, user: user.id });
    if (!ticket) return { ok: false, message: "Ticket not found." };

    ticket.messages.push({
      author: "customer",
      authorName: user.name ?? "Traveller",
      body: body.trim(),
      at: new Date(),
    });

    if (ticket.status === "waiting_on_customer") ticket.status = "in_progress";
    await ticket.save();

    revalidatePath("/account/support");
    return { ok: true, message: "Reply sent." };
  } catch (error) {
    console.error("[replyToTicket]", error);
    return { ok: false, message: "We couldn't send that reply. Please try again." };
  }
}

/* --------------------------------- Profile --------------------------------- */

const profileSchema = z.object({
  name: nameField,
  phone: phoneField,
  nationality: z.string().max(60).optional(),
  dateOfBirth: z.string().optional(),
  preferredCurrency: z.enum(["INR", "USD", "AED", "EUR", "GBP"]).default("INR"),
  marketingOptIn: z.boolean().default(false),
  whatsappOptIn: z.boolean().default(false),
});

export async function updateProfile(raw: unknown): Promise<AccountActionResult> {
  const user = await requireUser();

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const d = parsed.data;

  try {
    await connectDB();

    await User.updateOne(
      { _id: user.id },
      {
        $set: {
          name: d.name,
          phone: d.phone,
          nationality: d.nationality,
          dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth) : undefined,
          preferredCurrency: d.preferredCurrency,
          marketingOptIn: d.marketingOptIn,
          whatsappOptIn: d.whatsappOptIn,
        },
      },
    );

    revalidatePath("/account/profile");
    return { ok: true, message: "Profile updated." };
  } catch (error) {
    console.error("[updateProfile]", error);
    return { ok: false, message: "We couldn't save those changes. Please try again." };
  }
}

/* ------------------------------- Notifications ----------------------------- */

export async function markNotificationsRead(): Promise<AccountActionResult> {
  const user = await requireUser();

  try {
    await connectDB();
    await Notification.updateMany(
      { audience: "customer", user: user.id, isRead: false },
      { $set: { isRead: true } },
    );

    revalidatePath("/account/notifications");
    revalidatePath("/account");
    return { ok: true, message: "All caught up." };
  } catch (error) {
    console.error("[markNotificationsRead]", error);
    return { ok: false, message: "Could not update notifications." };
  }
}
