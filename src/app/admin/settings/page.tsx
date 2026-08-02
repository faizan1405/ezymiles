import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { integrations } from "@/lib/env";
import { connectDB } from "@/lib/db";
import { EmailTemplate } from "@/models";
import { EMAIL_TEMPLATE_CATALOG } from "@/lib/email-templates";
import { AdminPageHeader } from "@/components/admin/ui";
import { SettingsEditor } from "@/components/admin/settings-editor";
import type { EmailTemplateRow } from "@/components/admin/email-template-manager";

export const metadata: Metadata = { title: "Site settings", robots: { index: false } };

export default async function AdminSettingsPage() {
  await requireAdmin("settings:manage");
  const settings = await getSettings();

  await connectDB();
  const overrides = await EmailTemplate.find({}).lean();
  const overrideByKey = new Map(overrides.map((o) => [o.key, o]));

  const emailTemplates: EmailTemplateRow[] = EMAIL_TEMPLATE_CATALOG.map((t) => {
    const override = overrideByKey.get(t.key);
    return {
      key: t.key,
      label: t.label,
      variables: t.variables,
      name: override?.name ?? t.label,
      subject: override?.subject ?? "",
      body: override?.body ?? "",
      isActive: override?.isActive ?? true,
      hasOverride: Boolean(override),
    };
  });

  return (
    <div>
      <AdminPageHeader
        title="Site settings"
        description="Brand, contact details, payments and feature toggles. Changes go live immediately."
      />

      <SettingsEditor
        settings={settings}
        emailTemplates={emailTemplates}
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
