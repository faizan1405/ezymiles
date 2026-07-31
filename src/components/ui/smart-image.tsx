"use client";

import * as React from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

/**
 * next/image with a branded fallback.
 *
 * Remote media (Cloudinary, stock photography) can 404, rate-limit or be swapped
 * out by an admin. Rather than showing a broken frame we render a deterministic
 * ocean-gradient plate with the alt text — the layout never shifts and the page
 * still reads correctly.
 */

const GRADIENTS = [
  "linear-gradient(135deg,#0a1628 0%,#123f52 55%,#17a5a3 100%)",
  "linear-gradient(135deg,#101f37 0%,#2f4f83 55%,#6fdbd6 100%)",
  "linear-gradient(135deg,#134648 0%,#0f8484 50%,#dbbf78 100%)",
  "linear-gradient(135deg,#182d4d 0%,#714629 60%,#cfa551 100%)",
];

function pickGradient(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

export interface SmartImageProps extends Omit<ImageProps, "onError" | "src"> {
  src: string | undefined | null;
  /** Wrapper class when using fill. */
  wrapperClassName?: string;
}

export function SmartImage({
  src,
  alt,
  className,
  wrapperClassName,
  fill,
  sizes,
  priority,
  quality = 80,
  loading,
  ...props
}: SmartImageProps) {
  const [failed, setFailed] = React.useState(false);
  const safeAlt = typeof alt === "string" ? alt : "";

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden",
          fill ? "absolute inset-0" : "size-full",
          wrapperClassName,
          className,
        )}
        style={{ backgroundImage: pickGradient(safeAlt || "ezymiles") }}
        role="img"
        aria-label={safeAlt}
      >
        <span className="px-4 text-center font-display text-sm text-white">{safeAlt}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={safeAlt}
      fill={fill}
      sizes={sizes ?? (fill ? "(max-width: 768px) 100vw, 50vw" : undefined)}
      priority={priority}
      quality={quality}
      loading={priority ? undefined : "lazy"}
      onError={() => setFailed(true)}
      className={cn(className)}
      {...props}
    />
  );
}
