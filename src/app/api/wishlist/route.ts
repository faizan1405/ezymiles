import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { getCurrentUser } from "@/lib/session";
import { guard } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  packageId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid package id"),
  action: z.enum(["add", "remove"]),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ids: [] });

  await connectDB();
  const doc = await User.findById(user.id).select("wishlist").lean();
  return NextResponse.json({ ids: (doc?.wishlist ?? []).map(String) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to sync your wishlist." }, { status: 401 });
  }

  const limit = await guard("wishlist", { limit: 60, windowSeconds: 60 });
  if (!limit.success) {
    return NextResponse.json({ error: "Too many updates." }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { packageId, action } = parsed.data;

  try {
    await connectDB();
    await User.updateOne(
      { _id: user.id },
      action === "add"
        ? { $addToSet: { wishlist: packageId } }
        : { $pull: { wishlist: packageId } },
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/wishlist]", error);
    return NextResponse.json({ error: "Could not update wishlist." }, { status: 500 });
  }
}
