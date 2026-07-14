"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // In production this is where you'd forward to your error tracker.
    console.error("[app] unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-20 wash-ivory">
      <div className="w-full max-w-lg text-center">
        <span className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-amber-100 text-amber-700">
          <AlertTriangle className="size-9" aria-hidden />
        </span>

        <h1 className="mt-8 text-2xl text-midnight-900 sm:text-3xl">Something went wrong</h1>
        <p className="mx-auto mt-4 max-w-sm text-[0.9375rem] leading-relaxed text-muted">
          That&apos;s on us, not you. Nothing has been charged. Try again — and if it keeps happening,
          call us and we&apos;ll sort it out directly.
        </p>

        {error.digest ? (
          <p className="mt-4 text-xs text-muted">
            Reference: <code className="font-mono">{error.digest}</code>
          </p>
        ) : null}

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" variant="accent" onClick={reset}>
            <RotateCcw aria-hidden />
            Try again
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link href="/contact">Contact support</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
