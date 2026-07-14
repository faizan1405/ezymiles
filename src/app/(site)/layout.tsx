import { getSettings } from "@/lib/settings";
import { getNavData } from "@/server/nav";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { FloatingContact } from "@/components/layout/floating-contact";
import { OrganisationJsonLd } from "@/components/seo/json-ld";

/**
 * Public site shell. Settings and nav are fetched once here as Server
 * Components — the interactive chrome below receives them as plain props, so
 * only the header/footer interactivity ships JavaScript.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, nav] = await Promise.all([getSettings(), getNavData()]);

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
