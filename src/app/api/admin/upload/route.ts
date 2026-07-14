import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { MediaItem } from "@/models";
import { ALLOWED_FOLDERS, signUpload, isCloudinaryConfigured, type MediaFolder } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

/** Issue a short-lived, folder-scoped upload signature. Admins only. */
export async function POST(request: Request) {
  const check = await assertAdmin("media:manage");
  if (!check.ok) {
    return NextResponse.json({ error: check.message }, { status: check.status });
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      {
        error:
          "Cloudinary isn't configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET, or paste an image URL directly.",
      },
      { status: 501 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = z
    .object({ folder: z.enum(ALLOWED_FOLDERS).default("general") })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Unknown upload folder." }, { status: 400 });
  }

  const signature = signUpload(parsed.data.folder as MediaFolder);
  if (!signature) {
    return NextResponse.json({ error: "Could not sign the upload." }, { status: 500 });
  }

  return NextResponse.json(signature);
}

/** Record an upload that Cloudinary has already accepted. */
export async function PUT(request: Request) {
  const check = await assertAdmin("media:manage");
  if (!check.ok) {
    return NextResponse.json({ error: check.message }, { status: check.status });
  }

  const parsed = z
    .object({
      url: z.string().url(),
      publicId: z.string().optional(),
      alt: z.string().max(200).default(""),
      folder: z.enum(ALLOWED_FOLDERS).default("general"),
      width: z.number().optional(),
      height: z.number().optional(),
      bytes: z.number().optional(),
      format: z.string().optional(),
      type: z.enum(["image", "video"]).default("image"),
    })
    .safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid media payload." }, { status: 400 });
  }

  try {
    await connectDB();

    const item = await MediaItem.create({
      ...parsed.data,
      uploadedBy: check.user.id,
    });

    return NextResponse.json({ ok: true, id: String(item._id), url: item.url });
  } catch (error) {
    console.error("[api/admin/upload]", error);
    return NextResponse.json({ error: "Could not record that upload." }, { status: 500 });
  }
}
