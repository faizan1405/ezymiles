import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Activity, Destination } from "@/models";
import { AdminPageHeader } from "@/components/admin/ui";
import { ActivityEditor, type ActivityFormValues } from "@/components/admin/activity-editor";
import { serialise } from "@/lib/utils";
import type { IActivity } from "@/models";

export const metadata: Metadata = { title: "Edit activity", robots: { index: false } };

export default async function EditActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("activities:manage");
  const { id } = await params;

  await connectDB();

  const [doc, destinationDocs] = await Promise.all([
    Activity.findById(id).lean().catch(() => null),
    Destination.find({ deletedAt: null }).select("name").sort({ name: 1 }).lean(),
  ]);

  if (!doc) notFound();

  const a = serialise(doc) as unknown as IActivity;

  const initial: ActivityFormValues = {
    id: String(a._id),
    title: a.title,
    slug: a.slug,
    destination: String(a.destination),
    city: a.city,
    category: a.category,
    summary: a.summary ?? "",
    description: a.description ?? "",
    heroImage: { url: a.heroImage?.url ?? "", alt: a.heroImage?.alt ?? "" },
    gallery: (a.gallery ?? []).map((g) => ({ url: g.url, alt: g.alt ?? "" })),
    durationMinutes: a.durationMinutes,
    pricePerAdultINR: a.pricePerAdultINR,
    pricePerChildINR: a.pricePerChildINR,
    originalPriceINR: a.originalPriceINR,
    taxPercent: a.taxPercent,
    minParticipants: a.minParticipants,
    maxParticipants: a.maxParticipants,
    minAge: a.minAge,
    slots: (a.slots ?? []).map((s) => ({
      time: s.time,
      label: s.label ?? "",
      capacity: s.capacity,
      booked: s.booked,
    })),
    addOns: (a.addOns ?? []).map((o) => ({ key: o.key, label: o.label, priceINR: o.priceINR })),
    pickupAvailable: a.pickupAvailable,
    pickupNote: a.pickupNote ?? "",
    inclusions: a.inclusions ?? [],
    exclusions: a.exclusions ?? [],
    safetyInfo: a.safetyInfo ?? [],
    cancellationPolicy: a.cancellationPolicy ?? "",
    instantConfirmation: a.instantConfirmation,
    isFeatured: a.isFeatured,
    status: a.status,
  };

  return (
    <div>
      <AdminPageHeader title={a.title} description={`${a.city} · ${a.ratingCount ?? 0} reviews`} />

      <ActivityEditor
        initial={initial}
        destinations={serialise(destinationDocs).map((d) => ({ id: String(d._id), name: d.name }))}
      />
    </div>
  );
}
