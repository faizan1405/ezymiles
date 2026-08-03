"use client";

import * as React from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

/**
 * Brand-gradient fallback plates (deterministic, hashed from alt text).
 */
const GRADIENTS = [
  "linear-gradient(135deg,#0a1628 0%,#123f52 55%,#17a5a3 100%)",
  "linear-gradient(135deg,#101f37 0%,#2f4f83 55%,#6fdbd6 100%)",
  "linear-gradient(135deg,#134648 0%,#0f8484 50%,#dbbf78 100%)",
  "linear-gradient(135deg,#182d4d 0%,#714629 60%,#cfa551 100%)",
];

/**
 * High-quality travel fallback image used as a last resort before the
 * gradient plate. A beach scene that fits most travel contexts.
 */
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80";

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
  quality = 75,
  ...props
}: SmartImageProps) {
  const [attempt, setAttempt] = React.useState(0); // 0 = primary, 1 = fallback
  const [loading, setLoading] = React.useState(true);
  const safeAlt = typeof alt === "string" ? alt : "";

  const currentSrc = attempt === 0 ? src : FALLBACK_IMAGE;
  const showGradient = !currentSrc || attempt >= 2;
  const shouldSkeleton = loading && !showGradient && !priority;

  const onError = React.useCallback(() => {
    setLoading(false);
    setAttempt((a) => a + 1);
  }, []);

  const onLoad = React.useCallback(() => setLoading(false), []);

  if (showGradient) {
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
    <>
      {/* Shimmer skeleton while image loads — prevents layout shift */}
      {shouldSkeleton && (
        <div
          className={cn(
            "absolute inset-0 animate-pulse bg-sand-100",
            fill ? "" : "size-full",
          )}
          aria-hidden
        />
      )}
      <Image
        src={currentSrc!}
        alt={safeAlt}
        fill={fill}
        sizes={sizes ?? (fill ? "(max-width: 768px) 100vw, 50vw" : undefined)}
        priority={priority}
        quality={quality}
        loading={priority ? undefined : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        onLoad={onLoad}
        onError={onError}
        className={cn(
          "transition-opacity duration-300",
          loading ? "opacity-0" : "opacity-100",
          className,
        )}
        {...props}
      />
    </>
  );
}
