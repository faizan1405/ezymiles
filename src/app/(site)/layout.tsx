import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { getNavData } from "@/server/nav";
import { getCurrentUser } from "@/lib/session";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { FloatingContact } from "@/components/layout/floating-contact";
import { OrganisationJsonLd } from "@/components/seo/json-ld";
import { Logo } from "@/components/layout/logo";

/**
 * Public site shell. Settings and nav are fetched once here as Server
 * Components — the interactive chrome below receives them as plain props, so
 * only the header/footer interactivity ships JavaScript.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, nav] = await Promise.all([getSettings(), getNavData()]);

  if (settings.maintenance.enabled) {
    const user = await getCurrentUser();
    // Staff can still preview the live site while it's down for everyone else.
    if (!user?.isAdmin) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-sand-50 px-6 text-center">
          <Link href="/" aria-label={`${settings.brand.name} — home`}>
            <Logo name={settings.brand.name} logoUrl={settings.brand.logoUrl} />
          </Link>
          <p className="max-w-md text-balance text-[0.9375rem] leading-relaxed text-muted">
            {settings.maintenance.message}
          </p>
        </div>
      );
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <AnnouncementBar announcement={settings.announcement} />
      <SiteHeader nav={nav} settings={settings} />

      <main id="main" className="flex-1">
        {children}
      </main>

      <SiteFooter settings={settings} nav={nav} />
      <FloatingContact settings={settings} />
      <OrganisationJsonLd settings={settings} />
    </div>
  );
}
