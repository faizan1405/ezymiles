import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";

import { requireUser } from "@/lib/session";
import { tryConnectDB } from "@/lib/db";
import { User } from "@/models";
import { getPackagesByIds } from "@/server/catalog";
import { PackageCard } from "@/components/packages/package-card";
import { EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { WishlistSync } from "@/components/account/wishlist-sync";

export const metadata: Metadata = {
  title: "Saved packages",
  robots: { index: false, follow: false },
};

export default async function WishlistPage() {
  const user = await requireUser();

  let ids: string[] = [];

  if (await tryConnectDB()) {
    const doc = await User.findById(user.id).select("wishlist").lean();
    ids = (doc?.wishlist ?? []).map(String);
  }

  const packages = await getPackagesByIds(ids);

  return (
    <div>
      {/* Merges any guest-session wishlist into the account on first visit. */}
      <WishlistSync serverIds={ids} />

      <header className="mb-8">
        <h1 className="text-3xl text-midnight-900 sm:text-4xl">Saved packages</h1>
        <p className="mt-2 text-[0.9375rem] text-muted">
          {packages.length
            ? "Prices update automatically — if one drops, you'll see it here first."
            : "Tap the heart on any package to keep it here."}
        </p>
      </header>

      {packages.length === 0 ? (
        <EmptyState
          icon={<Heart />}
          title="Nothing saved yet"
          description="Save the trips you're weighing up and compare them side by side later."
          action={
            <Button asChild variant="accent">
              <Link href="/packages">Browse packages</Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {packages.map((pkg) => (
            <li key={pkg.id}>
              <PackageCard pkg={pkg} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
