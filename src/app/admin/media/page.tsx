import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { tryConnectDB } from "@/lib/db";
import { MediaItem } from "@/models";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { AdminPageHeader } from "@/components/admin/ui";
import { MediaLibrary } from "@/components/admin/media-library";
import { serialise } from "@/lib/utils";
import type { IMediaItem } from "@/models";

export const metadata: Metadata = { title: "Media", robots: { index: false } };

export default async function AdminMediaPage() {
  await requireAdmin("media:manage");

  const cloudinary = isCloudinaryConfigured();

  if (!(await tryConnectDB())) {
    return (
      <div>
        <AdminPageHeader title="Media" />
        <p className="rounded-2xl border border-hairline bg-white p-8 text-center text-sm text-muted">
          The database is unreachable.
        </p>
      </div>
    );
  }

  const rows = await MediaItem.find({}).sort({ createdAt: -1 }).limit(120).lean();
  const items = serialise(rows) as unknown as IMediaItem[];

  return (
    <div>
      <AdminPageHeader
        title="Media library"
        description="Everything uploaded through the panel. Uploads go straight to Cloudinary — they never pass through our server."
      />

      {!cloudinary ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-bold text-amber-900">Cloudinary isn&apos;t configured</p>
          <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-amber-900">
            Uploads are disabled until you add <code className="font-mono">CLOUDINARY_CLOUD_NAME</code>,{" "}
            <code className="font-mono">CLOUDINARY_API_KEY</code> and{" "}
            <code className="font-mono">CLOUDINARY_API_SECRET</code>. Everything still works — you can
            paste image URLs directly into any image field.
          </p>
        </div>
      ) : null}

      <MediaLibrary
        items={items.map((m) => ({
          id: String(m._id),
          url: m.url,
          alt: m.alt,
          folder: m.folder,
          width: m.width,
          height: m.height,
          bytes: m.bytes,
          createdAt: String(m.createdAt),
        }))}
        uploadEnabled={cloudinary}
      />
    </div>
  );
}
