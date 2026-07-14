import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Destination } from "@/models";
import { AdminPageHeader } from "@/components/admin/ui";
import { ActivityEditor, emptyActivity } from "@/components/admin/activity-editor";
import { serialise } from "@/lib/utils";

export const metadata: Metadata = { title: "New activity", robots: { index: false } };

export default async function NewActivityPage() {
  await requireAdmin("activities:manage");
  await connectDB();

  const destinations = serialise(
    await Destination.find({ deletedAt: null }).select("name").sort({ name: 1 }).lean(),
  );

  return (
    <div>
      <AdminPageHeader
        title="New activity"
        description="Save as a draft at any point — nothing goes live until you publish."
      />

      <ActivityEditor
        initial={emptyActivity}
        destinations={destinations.map((d) => ({ id: String(d._id), name: d.name }))}
      />
    </div>
  );
}
