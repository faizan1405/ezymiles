import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Destination } from "@/models";
import { AdminPageHeader } from "@/components/admin/ui";
import { DestinationEditor, emptyDestination } from "@/components/admin/destination-editor";
import { serialise } from "@/lib/utils";

export const metadata: Metadata = { title: "New destination", robots: { index: false } };

export default async function NewDestinationPage() {
  await requireAdmin("destinations:manage");

  await connectDB();
  const parentCandidates = await Destination.find({ deletedAt: null })
    .select("name type")
    .sort({ name: 1 })
    .lean();
  const destinationOptions = (
    serialise(parentCandidates) as unknown as { _id: string; name: string; type: string }[]
  ).map((p) => ({ id: p._id, name: p.name, type: p.type }));

  return (
    <div>
      <AdminPageHeader
        title="New destination"
        description="Add the place first; packages hang off it."
      />
      <DestinationEditor initial={emptyDestination} destinations={destinationOptions} />
    </div>
  );
}
