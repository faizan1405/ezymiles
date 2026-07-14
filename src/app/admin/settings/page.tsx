import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { integrations } from "@/lib/env";
import { AdminPageHeader } from "@/components/admin/ui";
import { SettingsEditor } from "@/components/admin/settings-editor";

export const metadata: Metadata = { title: "Site settings", robots: { index: false } };

export default async function AdminSettingsPage() {
  await requireAdmin("settings:manage");
  const settings = await getSettings();

  return (
    <div>
      <AdminPageHeader
        title="Site settings"
        description="Brand, contact details, announcement bar, payments and feature toggles. Changes go live immediately."
      />

      <SettingsEditor
        settings={settings}
        integrationStatus={{
          razorpay: integrations.razorpay,
          stripe: integrations.stripe,
          cloudinary: integrations.cloudinary,
          google: integrations.google,
          smtp: integrations.smtp,
          liveFlights: integrations.liveFlights,
        }}
      />
    </div>
  );
}
