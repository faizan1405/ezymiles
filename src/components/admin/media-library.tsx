"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Copy, Trash2, ImageIcon, Check } from "lucide-react";

import { deleteMedia } from "@/server/admin/actions";
import { ImageField, type MediaValue } from "./image-field";
import { Panel } from "./ui";
import { SmartImage } from "@/components/ui/smart-image";
import { EmptyState } from "@/components/ui/primitives";
import { toast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

interface MediaRow {
  id: string;
  url: string;
  alt: string;
  folder: string;
  width?: number;
  height?: number;
  bytes?: number;
  createdAt: string;
}

export function MediaLibrary({
  items,
  uploadEnabled,
}: {
  items: MediaRow[];
  uploadEnabled: boolean;
}) {
  const router = useRouter();
  const [copied, setCopied] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<MediaValue>({ url: "", alt: "" });

  const copy = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
      toast.success("URL copied");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Could not copy", "Select the URL and copy it manually.");
    }
  };

  const remove = async (id: string) => {
    const result = await deleteMedia(id);

    if (result.ok) {
      toast.success("Deleted", result.message);
      router.refresh();
    } else {
      toast.error("Could not delete", result.message);
    }
  };

  return (
    <div className="space-y-6">
      {uploadEnabled ? (
        <Panel title="Upload">
          <ImageField
            label="New image"
            value={draft}
            onChange={(v) => {
              setDraft(v);
              // A successful upload records itself, so just refresh the grid.
              if (v.url && v.url !== draft.url) {
                setTimeout(() => {
                  setDraft({ url: "", alt: "" });
                  router.refresh();
                }, 400);
              }
            }}
            folder="general"
            hint="Uploads are recorded here and reusable from any image field."
          />
        </Panel>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          icon={<ImageIcon />}
          title="No media yet"
          description={
            uploadEnabled
              ? "Upload an image above, or upload from any image field in the editors."
              : "Add Cloudinary credentials to enable uploads, or paste image URLs directly into editors."
          }
        />
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((m) => (
            <li key={m.id}>
              <figure className="group overflow-hidden rounded-2xl border border-hairline bg-white">
                <div className="relative aspect-4/3">
                  <SmartImage
                    src={m.url}
                    alt={m.alt || "Uploaded media"}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />

                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-midnight-950/0 opacity-0 transition-all group-hover:bg-midnight-950/50 group-hover:opacity-100 focus-within:bg-midnight-950/50 focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={() => copy(m.url, m.id)}
                      aria-label="Copy image URL"
                      className="flex size-9 items-center justify-center rounded-full bg-white text-midnight-900 hover:bg-sand-100"
                    >
                      {copied === m.id ? (
                        <Check className="size-4 text-lagoon-600" aria-hidden />
                      ) : (
                        <Copy className="size-4" aria-hidden />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => remove(m.id)}
                      aria-label="Delete image"
                      className="flex size-9 items-center justify-center rounded-full bg-white text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                </div>

                <figcaption className="p-3">
                  <p className="truncate text-xs font-medium text-midnight-900">
                    {m.alt || "Untitled"}
                  </p>
                  <p className="mt-0.5 text-[0.625rem] text-muted">
                    {m.folder}
                    {m.width && m.height ? ` · ${m.width}×${m.height}` : ""}
                    {m.bytes ? ` · ${Math.round(m.bytes / 1024)} KB` : ""}
                  </p>
                  <p className="text-[0.625rem] text-muted">{formatDate(m.createdAt)}</p>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
