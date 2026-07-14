import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Destination } from "@/models";
import { AdminPageHeader } from "@/components/admin/ui";
import { HotelEditor, emptyHotel } from "@/components/admin/hotel-editor";
import { serialise } from "@/lib/utils";

export const metadata: Metadata = { title: "New hotel", robots: { index: false } };

export default async function NewHotelPage() {
  await requireAdmin("hotels:manage");
  await connectDB();

  const destinations = serialise(
    await Destination.find({ deletedAt: null }).select("name").sort({ name: 1 }).lean(),
  );

  return (
    <div>
      <AdminPageHeader
        title="New hotel"
        description="Save as a draft at any point — nothing goes live until you publish."
      />

      <HotelEditor
        initial={emptyHotel}
        destinations={destinations.map((d) => ({ id: String(d._id), name: d.name }))}
      />
    </div>
  );
}
