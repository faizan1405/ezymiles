import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { tryConnectDB } from "@/lib/db";
import { Review } from "@/models";
import { AdminPageHeader } from "@/components/admin/ui";
import { FilterBar } from "@/components/admin/filter-bar";
import { ReviewModeration } from "@/components/admin/review-moderation";
import { serialise } from "@/lib/utils";
import type { QueryFilter } from "mongoose";
import type { IReview } from "@/models";

export const metadata: Metadata = { title: "Reviews", robots: { index: false } };

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("reviews:manage");
  const sp = await searchParams;

  if (!(await tryConnectDB())) {
    return (
      <div>
        <AdminPageHeader title="Reviews" />
        <p className="rounded-2xl border border-hairline bg-white p-8 text-center text-sm text-muted">
          The database is unreachable.
        </p>
      </div>
    );
  }

  const query: QueryFilter<IReview> = {};
  const status = typeof sp.status === "string" ? sp.status : undefined;
  if (status) query.status = status as IReview["status"];

  const [rows, counts] = await Promise.all([
    Review.find(query).sort({ createdAt: -1 }).limit(100).lean(),
    Review.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  const byStatus = Object.fromEntries(
    (counts as { _id: string; count: number }[]).map((c) => [c._id, c.count]),
  );

  const reviews = serialise(rows) as unknown as IReview[];

  return (
    <div>
      <AdminPageHeader
        title="Reviews"
        description="Approving a review recalculates the public rating from the approved set — no invented averages."
      />

      <FilterBar
        tabs={[
          { key: "", label: "All" },
          { key: "pending", label: "Pending", count: byStatus.pending ?? 0 },
          { key: "approved", label: "Approved", count: byStatus.approved ?? 0 },
          { key: "rejected", label: "Rejected", count: byStatus.rejected ?? 0 },
        ]}
      />

      <ReviewModeration
        reviews={reviews.map((r) => ({
          id: String(r._id),
          authorName: r.authorName,
          authorPhoto: r.authorPhoto,
          authorLocation: r.authorLocation,
          rating: r.rating,
          title: r.title,
          body: r.body,
          destination: r.destination,
          subjectTitle: r.subject?.title,
          isVerifiedBooking: r.isVerifiedBooking,
          isFeatured: r.isFeatured,
          status: r.status,
          createdAt: String(r.createdAt),
        }))}
      />
    </div>
  );
}
