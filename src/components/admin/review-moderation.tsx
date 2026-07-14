"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X, Star, BadgeCheck, MessageSquare } from "lucide-react";

import { setReviewStatus, toggleReviewFeatured } from "@/server/admin/actions";
import { StatusPill, STATUS_TONE } from "./ui";
import { Button } from "@/components/ui/button";
import { Rating, EmptyState } from "@/components/ui/primitives";
import { SmartImage } from "@/components/ui/smart-image";
import { toast } from "@/components/ui/toast";
import { formatDate, initials, cn } from "@/lib/utils";

export interface ReviewRow {
  id: string;
  authorName: string;
  authorPhoto?: string;
  authorLocation?: string;
  rating: number;
  title: string;
  body: string;
  destination?: string;
  subjectTitle?: string;
  isVerifiedBooking: boolean;
  isFeatured: boolean;
  status: string;
  createdAt: string;
}

export function ReviewModeration({ reviews }: { reviews: ReviewRow[] }) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);

  const moderate = async (id: string, status: "approved" | "rejected") => {
    setPending(id);
    const result = await setReviewStatus(id, status);

    if (result.ok) {
      toast.success(`Review ${status}`, result.message);
      router.refresh();
    } else {
      toast.error("Could not update", result.message);
    }

    setPending(null);
  };

  const feature = async (id: string) => {
    setPending(id);
    const result = await toggleReviewFeatured(id);

    if (result.ok) {
      toast.success("Updated", result.message);
      router.refresh();
    } else {
      toast.error("Could not update", result.message);
    }

    setPending(null);
  };

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare />}
        title="No reviews here"
        description="Reviews appear once travellers submit them. Only approved ones show on the site."
      />
    );
  }

  return (
    <ul className="space-y-4">
      {reviews.map((r) => (
        <li key={r.id}>
          <article
            className={cn(
              "rounded-2xl border bg-white p-5 transition-opacity",
              r.status === "pending" ? "border-amber-200" : "border-hairline",
              pending === r.id && "opacity-50",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-lagoon-100">
                  {r.authorPhoto ? (
                    <SmartImage
                      src={r.authorPhoto}
                      alt={r.authorName}
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center text-xs font-bold text-lagoon-800">
                      {initials(r.authorName)}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-midnight-900">{r.authorName}</span>
                    {r.isVerifiedBooking ? (
                      <span className="flex items-center gap-1 rounded-full bg-lagoon-50 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-lagoon-800">
                        <BadgeCheck className="size-3" aria-hidden />
                        Verified booking
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-amber-800">
                        Unverified
                      </span>
                    )}
                  </p>

                  <p className="mt-0.5 text-xs text-muted">
                    {[r.subjectTitle ?? r.destination, formatDate(r.createdAt)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Rating value={r.rating} />
                <StatusPill status={r.status} tone={STATUS_TONE[r.status] ?? "neutral"} />
              </div>
            </div>

            {r.title ? (
              <h3 className="mt-4 font-display text-base text-midnight-900">{r.title}</h3>
            ) : null}
            <p className="mt-2 whitespace-pre-line text-[0.875rem] leading-relaxed text-muted">
              {r.body}
            </p>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-hairline pt-4">
              {r.status !== "approved" ? (
                <Button
                  size="sm"
                  variant="accent"
                  onClick={() => moderate(r.id, "approved")}
                  disabled={pending !== null}
                >
                  <Check aria-hidden />
                  Approve
                </Button>
              ) : null}

              {r.status !== "rejected" ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => moderate(r.id, "rejected")}
                  disabled={pending !== null}
                >
                  <X aria-hidden />
                  Reject
                </Button>
              ) : null}

              {r.status === "approved" ? (
                <Button
                  size="sm"
                  variant={r.isFeatured ? "gold" : "outline"}
                  onClick={() => feature(r.id)}
                  disabled={pending !== null}
                >
                  <Star aria-hidden />
                  {r.isFeatured ? "Featured on homepage" : "Feature on homepage"}
                </Button>
              ) : null}
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
