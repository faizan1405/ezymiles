import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { AdminPageHeader } from "@/components/admin/ui";
import { DestinationEditor, emptyDestination } from "@/components/admin/destination-editor";

export const metadata: Metadata = { title: "New destination", robots: { index: false } };

export default async function NewDestinationPage() {
  await requireAdmin("destinations:manage");

  return (
    <div>
      <AdminPageHeader
        title="New destination"
        description="Add the place first; packages hang off it."
      />
      <DestinationEditor initial={emptyDestination} />
    </div>
  );
}
