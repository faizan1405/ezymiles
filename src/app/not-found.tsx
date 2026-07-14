import Link from "next/link";
import { Compass, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-20 wash-ivory">
      <div className="w-full max-w-lg text-center">
        <span className="mx-auto flex size-20 items-center justify-center rounded-3xl wash-ocean text-white">
          <Compass className="size-9" aria-hidden />
        </span>

        <p className="mt-8 font-display text-6xl text-midnight-900">404</p>
        <h1 className="mt-3 text-2xl text-midnight-900 sm:text-3xl">
          This route doesn&apos;t go anywhere
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-[0.9375rem] leading-relaxed text-muted">
          The page you were looking for has moved, or never existed. Let&apos;s get you somewhere
          more interesting.
        </p>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" variant="accent">
            <Link href="/">
              Back to home
              <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/packages">Browse packages</Link>
          </Button>
        </div>

        <ul className="mt-10 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
          {[
            { href: "/destinations", label: "Destinations" },
            { href: "/customise-my-trip", label: "Plan a custom trip" },
            { href: "/contact", label: "Contact us" },
          ].map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-lagoon-700 hover:underline">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
