"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useWishlist } from "@/store/preferences";

/**
 * Reconciles the guest (localStorage) wishlist with the account one.
 *
 * Anything saved before signing in is pushed up to the account, and the local
 * store is then replaced by the union. Runs once per mount and only when the two
 * actually differ, so it doesn't loop.
 */
export function WishlistSync({ serverIds }: { serverIds: string[] }) {
  const router = useRouter();
  const localIds = useWishlist((s) => s.ids);
  const hydrated = useWishlist((s) => s.hydrated);
  const setIds = useWishlist((s) => s.set);
  const done = React.useRef(false);

  React.useEffect(() => {
    if (!hydrated || done.current) return;

    const missingOnServer = localIds.filter((id) => !serverIds.includes(id));
    const union = [...new Set([...serverIds, ...localIds])];

    if (missingOnServer.length === 0) {
      // Server is authoritative when there's nothing new locally.
      if (union.length !== localIds.length) setIds(serverIds);
      done.current = true;
      return;
    }

    done.current = true;

    (async () => {
      await Promise.all(
        missingOnServer.map((packageId) =>
          fetch("/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ packageId, action: "add" }),
          }).catch(() => null),
        ),
      );

      setIds(union);
      router.refresh();
    })();
  }, [hydrated, localIds, serverIds, setIds, router]);

  return null;
}
