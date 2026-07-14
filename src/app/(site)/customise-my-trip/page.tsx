import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PenLine, Clock, IndianRupee, RefreshCw } from "lucide-react";

import { getDestinations } from "@/server/catalog";
import { TripBuilder } from "@/components/forms/trip-builder";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Skeleton } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Customise my trip",
  description:
    "Tell us the shape of the trip you want and a travel designer builds a costed, first-draft itinerary within 24 hours. No payment, no obligation.",
  alternates: { canonical: "/customise-my-trip" },
};

export default async function CustomiseTripPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const destinations = await getDestinations({ limit: 60 });

  const preset = typeof sp.destination === "string" ? sp.destination : undefined;

  return (
    <>
      <header className="border-b border-hairline wash-ivory pb-12 pt-8">
        <div className="container-page">
          <Breadcrumbs items={[{ name: "Customise my trip", href: "/customise-my-trip" }]} />

          <div className="mt-6 max-w-3xl">
            <h1 className="text-3xl leading-tight text-midnight-900 sm:text-4xl lg:text-5xl">
              Start from a blank page
            </h1>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
              Packages are a starting point, not a straitjacket. Tell us what a good day looks like to
              you and we&apos;ll build the trip around it — properly costed, line by line, with nothing
              hidden until checkout.
            </p>
          </div>

          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { Icon: PenLine, title: "A real itinerary", body: "Not a brochure. Day by day, costed." },
              { Icon: Clock, title: "Within 24 hours", body: "A named designer, not a call centre." },
              { Icon: IndianRupee, title: "Line-by-line pricing", body: "You see what each night costs." },
              { Icon: RefreshCw, title: "Revise freely", body: "Change it as often as you like." },
            ].map(({ Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-lagoon-700 shadow-tile">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-midnight-900">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </header>

      <div className="container-page section-y">
        <Reveal className="mx-auto max-w-3xl">
          <Suspense fallback={<Skeleton className="h-[36rem] rounded-3xl" />}>
            <TripBuilder
              destinations={destinations.map((d) => ({ name: d.name, slug: d.slug }))}
              defaultDestination={preset}
            />
          </Suspense>
        </Reveal>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-muted">
          Submitting a brief costs nothing and commits you to nothing. We&apos;ll use your details only
          to plan and quote this trip — see our{" "}
          <Link href="/legal/privacy-policy" className="underline hover:no-underline">
            privacy policy
          </Link>
          .
        </p>
      </div>
    </>
  );
}
