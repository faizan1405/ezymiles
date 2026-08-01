import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Users, Train } from "lucide-react";

import { searchTrainRoutes } from "@/server/transit";
import { TrainResults } from "@/components/transit/train-results";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Skeleton } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { formatDate, futureDateInput } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Train search results",
  robots: { index: false, follow: false },
};

type SearchParams = Record<string, string | string[] | undefined>;

function one(sp: SearchParams, key: string, fallback = "") {
  const v = sp[key];
  return typeof v === "string" && v ? v : fallback;
}

export default async function TrainSearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const from = one(sp, "from");
  const to = one(sp, "to");

  if (!from || !to) {
    return (
      <div className="container-page section-y text-center">
        <Train className="mx-auto size-10 text-midnight-300" aria-hidden />
        <h1 className="mt-5 text-3xl text-midnight-900">Tell us where you&apos;re going</h1>
        <p className="mt-3 text-muted">We need a departure city and destination to search.</p>
        <Button asChild variant="accent" className="mt-7">
          <Link href="/train">Back to train search</Link>
        </Button>
      </div>
    );
  }

  const date = one(sp, "date", futureDateInput(7));
  const passengers = Math.max(1, Number(one(sp, "passengers", "1")) || 1);

  const passthrough: Record<string, string> = {
    from,
    to,
    date,
    passengers: String(passengers),
  };

  return (
    <>
      <header className="border-b border-hairline bg-white pb-6 pt-6">
        <div className="container-page">
          <Breadcrumbs
            items={[
              { name: "Train booking", href: "/train" },
              { name: `${from} → ${to}`, href: "#" },
            ]}
          />

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-2.5 text-2xl text-midnight-900 sm:text-3xl">
                {from}
                <ArrowRight className="size-5 text-lagoon-600" aria-hidden />
                {to}
              </h1>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                <span>{formatDate(date)}</span>
                <span aria-hidden>·</span>
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" aria-hidden />
                  {passengers} {passengers === 1 ? "passenger" : "passengers"}
                </span>
              </p>
            </div>

            <Button asChild variant="outline">
              <Link href="/train">Change search</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container-page section-y !pt-10">
        <Suspense fallback={<ResultsSkeleton />}>
          <Results from={from} to={to} passthrough={passthrough} />
        </Suspense>
      </div>
    </>
  );
}

async function Results({
  from,
  to,
  passthrough,
}: {
  from: string;
  to: string;
  passthrough: Record<string, string>;
}) {
  const routes = searchTrainRoutes({ from, to });
  return <TrainResults routes={routes} query={passthrough} />;
}

function ResultsSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
      <Skeleton className="hidden h-96 lg:block" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    </div>
  );
}