import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { Logo } from "@/components/layout/logo";
import { SmartImage } from "@/components/ui/smart-image";

/**
 * Split auth shell: form on the left, a single quiet image on the right.
 * No header or footer — nothing to distract from the one job on this screen.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-5 py-8 sm:px-10 lg:px-16">
        <Link href="/" className="w-fit" aria-label={`${settings.brand.name} — home`}>
          <Logo name={settings.brand.name} logoUrl={settings.brand.logoUrl} />
        </Link>

        <main id="main" className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </main>

        <p className="text-center text-xs text-muted">
          © {new Date().getFullYear()} {settings.brand.name} ·{" "}
          <Link href="/legal/privacy-policy" className="hover:underline">
            Privacy
          </Link>{" "}
          ·{" "}
          <Link href="/legal/terms-and-conditions" className="hover:underline">
            Terms
          </Link>
        </p>
      </div>

      <aside className="relative hidden lg:block">
        <SmartImage
          src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=80"
          alt="A quiet mountain lake at first light"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight-950/85 via-midnight-950/25 to-transparent" />

        <blockquote className="absolute inset-x-0 bottom-0 p-12">
          <p className="max-w-md font-display text-3xl leading-snug text-white">
            {settings.brand.tagline}
          </p>
          <footer className="mt-4 text-sm text-white/60">
            Sign in to track your trips, keep your wishlist, and pick up where you left off.
          </footer>
        </blockquote>
      </aside>
    </div>
  );
}
