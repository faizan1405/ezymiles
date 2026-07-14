import { BadgeCheck, MessageSquare } from "lucide-react";
import type { ReviewDTO } from "@/types";
import { Rating, EmptyState } from "@/components/ui/primitives";
import { SmartImage } from "@/components/ui/smart-image";
import { formatDate, initials } from "@/lib/utils";

export function ReviewList({
  reviews,
  averageRating,
  totalCount,
}: {
  reviews: ReviewDTO[];
  averageRating: number;
  totalCount: number;
}) {
  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare />}
        title="No reviews yet"
        description="Reviews appear here once travellers who booked this trip have returned and written one. We don't publish anything else."
      />
    );
  }

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));
  const shown = reviews.length;

  return (
    <div>
      {/* Summary */}
      <div className="grid gap-6 rounded-2xl border border-hairline bg-white p-6 sm:grid-cols-[auto_1fr] sm:gap-10">
        <div className="text-center sm:text-left">
          <p className="font-display text-5xl text-midnight-900">{averageRating.toFixed(1)}</p>
          <div className="mt-2 flex justify-center sm:justify-start">
            <Rating value={averageRating} size="md" />
          </div>
          <p className="mt-1.5 text-xs text-muted">
            {totalCount} {totalCount === 1 ? "review" : "reviews"}
          </p>
        </div>

        <dl className="space-y-1.5">
          {distribution.map(({ star, count }) => {
            const pct = shown ? Math.round((count / shown) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-3">
                <dt className="w-8 shrink-0 text-xs font-semibold text-midnight-700">{star}★</dt>
                <dd className="flex flex-1 items-center gap-3">
                  <div
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand-100"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${star} star reviews`}
                  >
                    <div className="h-full rounded-full bg-gild-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs text-muted">{count}</span>
                </dd>
              </div>
            );
          })}
        </dl>
      </div>

      {/* Reviews */}
      <ul className="mt-6 space-y-4">
        {reviews.map((r) => (
          <li key={r.id}>
            <article className="rounded-2xl border border-hairline bg-white p-5">
              <div className="flex items-start gap-3">
                <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-lagoon-100">
                  {r.authorPhoto ? (
                    <SmartImage src={r.authorPhoto} alt={r.authorName} fill sizes="44px" className="object-cover" />
                  ) : (
                    <span className="flex size-full items-center justify-center text-sm font-bold text-lagoon-800">
                      {initials(r.authorName)}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-sm font-semibold text-midnight-900">{r.authorName}</p>
                    {r.isVerifiedBooking ? (
                      <span className="flex items-center gap-1 rounded-full bg-lagoon-50 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-lagoon-800">
                        <BadgeCheck className="size-3" aria-hidden />
                        Verified booking
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-0.5 text-xs text-muted">
                    {[r.authorLocation, r.travelledOn ? `Travelled ${formatDate(r.travelledOn, { month: "long", year: "numeric" })}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>

                <Rating value={r.rating} />
              </div>

              {r.title ? (
                <h3 className="mt-4 font-display text-base text-midnight-900">{r.title}</h3>
              ) : null}
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{r.body}</p>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
