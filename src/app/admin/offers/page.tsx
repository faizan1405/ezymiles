import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { tryConnectDB } from "@/lib/db";
import { Offer } from "@/models";
import { AdminPageHeader } from "@/components/admin/ui";
import { OfferManager } from "@/components/admin/offer-manager";
import { serialise } from "@/lib/utils";
import type { IOffer } from "@/models";

export const metadata: Metadata = { title: "Offers", robots: { index: false } };

export default async function AdminOffersPage() {
  await requireAdmin("offers:manage");

  if (!(await tryConnectDB())) {
    return (
      <div>
        <AdminPageHeader title="Offers" />
        <p className="rounded-2xl border border-hairline bg-white p-8 text-center text-sm text-muted">
          The database is unreachable.
        </p>
      </div>
    );
  }

  const rows = await Offer.find({}).sort({ order: 1, createdAt: -1 }).limit(500).lean();
  const offers = serialise(rows) as unknown as IOffer[];

  return (
    <div>
      <AdminPageHeader
        title="Offers"
        description="Offers disappear from the site automatically the moment they expire — no stale banners."
      />

      <OfferManager
        offers={offers.map((o) => ({
          id: String(o._id),
          title: o.title,
          slug: o.slug,
          kind: o.kind,
          headline: o.headline,
          description: o.description,
          image: { url: o.image?.url ?? "", alt: o.image?.alt ?? "" },
          couponCode: o.couponCode ?? "",
          discountLabel: o.discountLabel,
          ctaLabel: o.ctaLabel,
          ctaHref: o.ctaHref,
          startsAt: String(o.startsAt).slice(0, 10),
          endsAt: String(o.endsAt).slice(0, 10),
          isActive: o.isActive,
          order: o.order,
        }))}
      />
    </div>
  );
}
