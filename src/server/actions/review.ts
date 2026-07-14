"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { Booking, Review, Notification } from "@/models";
import { getCurrentUser } from "@/lib/session";
import { guard } from "@/lib/rate-limit";

export interface ReviewResult {
  ok: boolean;
  message: string;
}

const reviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(20).max(2000),
});

/** Maps a booking type onto the review subject kinds the schema supports. */
function subjectKind(type: string): "package" | "hotel" | "activity" | "company" {
  if (type === "package" || type === "hotel" || type === "activity") return type;
  return "company";
}

/**
 * The only way a Review document is ever created outside the seed script —
 * gated to the traveller who actually holds the booking, one review per
 * booking, and always starts `pending` so admin moderation has real input.
 */
export async function submitReview(raw: unknown): Promise<ReviewResult> {
  const user = await getCurrentUser();
  if (!user || user.isAdmin) {
    return { ok: false, message: "Sign in as a traveller to leave a review." };
  }

  const limit = await guard(`review:${user.id}`, { limit: 5, windowSeconds: 3600 });
  if (!limit.success) return { ok: false, message: "Too many attempts. Please wait a while." };

  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const { bookingId, rating, title, body } = parsed.data;

  try {
    await connectDB();

    const booking = await Booking.findOne({ _id: bookingId, user: user.id, deletedAt: null });
    if (!booking) return { ok: false, message: "We couldn't find that booking." };

    if (booking.status !== "completed" && booking.status !== "confirmed") {
      return { ok: false, message: "You can review a trip once it's confirmed." };
    }

    const existing = await Review.findOne({ booking: booking._id, user: user.id });
    if (existing) return { ok: false, message: "You've already reviewed this trip." };

    const review = await Review.create({
      user: user.id,
      booking: booking._id,
      authorName: user.name ?? "Traveller",
      subject: {
        kind: subjectKind(booking.type),
        refId: booking.item.refId,
        title: booking.item.title,
      },
      rating,
      title,
      body,
      travelledOn: booking.travelDate,
      isVerifiedBooking: true,
      status: "pending",
    });

    await Notification.create({
      audience: "admin",
      kind: "system",
      title: "New review submitted",
      body: `${review.authorName} rated "${booking.item.title}" ${rating}/5 — awaiting moderation.`,
      href: "/admin/reviews",
    });

    revalidatePath("/account/trips");

    return {
      ok: true,
      message: "Thanks! Your review is awaiting moderation and will appear once approved.",
    };
  } catch (error) {
    console.error("[submitReview]", error);
    return { ok: false, message: "We couldn't submit your review. Please try again." };
  }
}
