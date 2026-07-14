import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Destination } from "@/models";
import { AdminPageHeader } from "@/components/admin/ui";
import { PackageEditor, emptyPackage } from "@/components/admin/package-editor";
import { serialise } from "@/lib/utils";

export const metadata: Metadata = { title: "New package", robots: { index: false } };

export default async function NewPackagePage() {
  await requireAdmin("packages:manage");
  await connectDB();

  const destinations = serialise(
    await Destination.find({ deletedAt: null }).select("name scope").sort({ name: 1 }).lean(),
  );

  return (
    <div>
      <AdminPageHeader
        title="New package"
        description="Save as a draft at any point — nothing goes live until you publish."
      />

      <PackageEditor
        initial={emptyPackage}
        destinations={destinations.map((d) => ({
          id: String(d._id),
          name: d.name,
          scope: d.scope,
        }))}
      />
    </div>
  );
}
