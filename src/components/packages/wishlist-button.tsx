"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";
import { useWishlist } from "@/store/preferences";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/**
 * Wishlist toggle.
 *
 * Guests get an optimistic localStorage wishlist that survives reloads. Signed-in
 * travellers additionally persist to their account, so the list follows them
 * across devices. A failed sync rolls the local state back.
 */
export function WishlistButton({
  packageId,
  title,
  variant = "floating",
  className,
}: {
  packageId: string;
  title: string;
  variant?: "floating" | "inline";
  className?: string;
}) {
  const { status } = useSession();
  const ids = useWishlist((s) => s.ids);
  const toggle = useWishlist((s) => s.toggle);
  const hydrated = useWishlist((s) => s.hydrated);
  const [pending, setPending] = React.useState(false);

  const saved = hydrated && ids.includes(packageId);

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;

    const nowSaved = toggle(packageId);
    setPending(true);

    if (status === "authenticated") {
      try {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packageId, action: nowSaved ? "add" : "remove" }),
        });
        if (!res.ok) throw new Error("Sync failed");
      } catch {
        toggle(packageId); // roll back
        toast.error("Could not update your wishlist", "Please try again in a moment.");
        setPending(false);
        return;
      }
    }

    setPending(false);
    toast.success(
      nowSaved ? "Saved to wishlist" : "Removed from wishlist",
      nowSaved ? title : undefined,
    );
  };

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        className={cn(
          "flex items-center gap-2 rounded-full border border-hairline px-4 py-2.5 text-sm font-semibold transition-colors",
          saved
            ? "border-sunset-200 bg-sunset-50 text-sunset-700"
            : "text-midnight-800 hover:border-midnight-300 hover:bg-sand-50",
          className,
        )}
      >
        <Heart className={cn("size-4", saved && "fill-sunset-500 text-sunset-500")} aria-hidden />
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from wishlist` : `Save ${title} to wishlist`}
      className={cn(
        "flex size-9 items-center justify-center rounded-full glass text-midnight-900 transition-transform hover:scale-110 motion-reduce:hover:scale-100",
        className,
      )}
    >
      <Heart
        className={cn("size-4 transition-colors", saved && "fill-sunset-500 text-sunset-500")}
        aria-hidden
      />
    </button>
  );
}
