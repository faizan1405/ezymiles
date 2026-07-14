"use client";

import * as React from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export interface MediaValue {
  url: string;
  alt: string;
}

/**
 * Image input with two paths: upload straight to Cloudinary (signed server-side),
 * or paste a URL. The paste route exists deliberately — a client without a
 * Cloudinary account can still run the whole CMS.
 */
export function ImageField({
  label,
  value,
  onChange,
  folder = "general",
  required,
  hint,
}: {
  label: string;
  value: MediaValue;
  onChange: (value: MediaValue) => void;
  folder?: string;
  required?: boolean;
  hint?: string;
}) {
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Not an image", "Choose a JPG, PNG, WebP or AVIF file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large", "Keep uploads under 10 MB.");
      return;
    }

    setUploading(true);

    try {
      const signRes = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder }),
      });

      if (!signRes.ok) {
        const { error } = (await signRes.json()) as { error?: string };
        toast.error("Upload unavailable", error ?? "Paste an image URL instead.");
        setUploading(false);
        return;
      }

      const sig = (await signRes.json()) as {
        signature: string;
        timestamp: number;
        apiKey: string;
        cloudName: string;
        folder: string;
      };

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", String(sig.timestamp));
      form.append("signature", sig.signature);
      form.append("folder", sig.folder);
      form.append("transformation", "c_limit,w_2400,q_auto:good");

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
        { method: "POST", body: form },
      );

      if (!uploadRes.ok) throw new Error("Cloudinary rejected the upload");

      const result = (await uploadRes.json()) as {
        secure_url: string;
        public_id: string;
        width: number;
        height: number;
        bytes: number;
        format: string;
      };

      // Record it in the media library so it's reusable elsewhere.
      await fetch("/api/admin/upload", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: result.secure_url,
          publicId: result.public_id,
          alt: value.alt || file.name.replace(/\.[^.]+$/, ""),
          folder,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          format: result.format,
        }),
      }).catch(() => null);

      onChange({ url: result.secure_url, alt: value.alt || "" });
      toast.success("Image uploaded");
    } catch (error) {
      console.error(error);
      toast.error("Upload failed", "Paste an image URL instead.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <fieldset className="rounded-2xl border border-hairline p-4">
      <legend className="px-2 text-[0.8125rem] font-semibold text-midnight-800">
        {label}
        {required ? <span className="ml-0.5 text-sunset-600">*</span> : null}
      </legend>

      <div className="flex gap-4">
        <div
          className={cn(
            "relative flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed",
            value.url ? "border-transparent" : "border-hairline bg-sand-50",
          )}
        >
          {value.url ? (
            <SmartImage src={value.url} alt={value.alt || label} fill sizes="112px" className="object-cover" />
          ) : (
            <ImageIcon className="size-6 text-midnight-300" aria-hidden />
          )}

          {value.url ? (
            <button
              type="button"
              onClick={() => onChange({ url: "", alt: "" })}
              aria-label="Remove image"
              className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-midnight-950/70 text-white"
            >
              <X className="size-3" aria-hidden />
            </button>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-2.5">
          <Input
            value={value.url}
            onChange={(e) => onChange({ ...value, url: e.target.value })}
            placeholder="Paste an image URL, or upload →"
            aria-label={`${label} URL`}
          />

          <Input
            value={value.alt}
            onChange={(e) => onChange({ ...value, alt: e.target.value })}
            placeholder="Alt text — describe the image for screen readers"
            aria-label={`${label} alt text`}
          />

          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="animate-spin" aria-hidden /> : <Upload aria-hidden />}
              {uploading ? "Uploading…" : "Upload"}
            </Button>

            {hint ? <span className="text-xs text-muted">{hint}</span> : null}
          </div>
        </div>
      </div>
    </fieldset>
  );
}

/* -------------------------------------------------------------------------- */

/** Repeatable gallery of images. */
export function GalleryField({
  value,
  onChange,
  folder = "general",
}: {
  value: MediaValue[];
  onChange: (value: MediaValue[]) => void;
  folder?: string;
}) {
  const [draft, setDraft] = React.useState<MediaValue>({ url: "", alt: "" });

  const add = () => {
    if (!draft.url.trim()) return;
    onChange([...value, draft]);
    setDraft({ url: "", alt: "" });
  };

  return (
    <div className="space-y-3">
      {value.length ? (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {value.map((img, i) => (
            <li key={`${img.url}-${i}`} className="relative aspect-4/3 overflow-hidden rounded-xl">
              <SmartImage src={img.url} alt={img.alt} fill sizes="120px" className="object-cover" />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                aria-label={`Remove image ${i + 1}`}
                className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-midnight-950/70 text-white"
              >
                <X className="size-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="rounded-2xl border border-dashed border-hairline p-4">
        <ImageField label="Add to gallery" value={draft} onChange={setDraft} folder={folder} />
        <Button type="button" size="sm" variant="subtle" className="mt-3" onClick={add} disabled={!draft.url}>
          Add image
        </Button>
      </div>
    </div>
  );
}

export { Field };
