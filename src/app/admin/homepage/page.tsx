import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { AdminPageHeader } from "@/components/admin/ui";
import { HomepageEditor } from "@/components/admin/homepage-editor";

export const metadata: Metadata = { title: "Homepage", robots: { index: false } };

export default async function AdminHomepagePage() {
  await requireAdmin("homepage:manage");
  const settings = await getSettings();

  return (
    <div>
      <AdminPageHeader
        title="Homepage"
        description="Hero copy, hero media, and which sections appear. Changes are live as soon as you save."
      />

      <HomepageEditor homepage={settings.homepage} />
    </div>
  );
}
