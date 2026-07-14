import { Skeleton } from "@/components/ui/primitives";

/**
 * Route-level skeleton. Mirrors the common page shape (header block + a grid of
 * cards) so the layout doesn't jump when the real content lands.
 */
export default function Loading() {
  return (
    <div className="container-page section-y">
      <div className="max-w-3xl">
        <Skeleton className="h-3 w-40 rounded-full" />
        <Skeleton className="mt-6 h-12 w-3/4" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-2/3" />
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-hairline">
            <Skeleton className="aspect-4/3 rounded-none" />
            <div className="space-y-3 p-5">
              <Skeleton className="h-3 w-24 rounded-full" />
              <Skeleton className="h-5 w-3/4 rounded-full" />
              <Skeleton className="h-3 w-1/2 rounded-full" />
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
