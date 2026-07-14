import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Destination, Hotel } from "@/models";
import { AdminPageHeader } from "@/components/admin/ui";
import { HotelEditor, type HotelFormValues } from "@/components/admin/hotel-editor";
import { serialise } from "@/lib/utils";
import type { IHotel } from "@/models";

export const metadata: Metadata = { title: "Edit hotel", robots: { index: false } };

export default async function EditHotelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("hotels:manage");
  const { id } = await params;

  await connectDB();

  const [doc, destinationDocs] = await Promise.all([
    Hotel.findById(id).lean().catch(() => null),
    Destination.find({ deletedAt: null }).select("name").sort({ name: 1 }).lean(),
  ]);

  if (!doc) notFound();

  const h = serialise(doc) as unknown as IHotel;

  const initial: HotelFormValues = {
    id: String(h._id),
    name: h.name,
    slug: h.slug,
    destination: String(h.destination),
    city: h.city,
    country: h.country,
    address: h.address ?? "",
    starCategory: h.starCategory,
    propertyType: h.propertyType,
    summary: h.summary ?? "",
    description: h.description ?? "",
    heroImage: { url: h.heroImage?.url ?? "", alt: h.heroImage?.alt ?? "" },
    gallery: (h.gallery ?? []).map((g) => ({ url: g.url, alt: g.alt ?? "" })),
    amenities: h.amenities ?? [],
    rooms: (h.rooms ?? []).map((r) => ({
      key: r.key,
      name: r.name,
      description: r.description ?? "",
      images: (r.images ?? []).map((i) => ({ url: i.url, alt: i.alt ?? "" })),
      maxAdults: r.maxAdults,
      maxChildren: r.maxChildren,
      maxOccupancy: r.maxOccupancy,
      bedType: r.bedType,
      sizeSqft: r.sizeSqft,
      amenities: r.amenities ?? [],
      mealPlan: r.mealPlan,
      pricePerNightINR: r.pricePerNightINR,
      originalPricePerNightINR: r.originalPricePerNightINR,
      taxPercent: r.taxPercent,
      refundable: r.refundable,
      cancellationRule: r.cancellationRule,
      roomsAvailable: r.roomsAvailable,
    })),
    lat: h.coordinates?.lat ?? 0,
    lng: h.coordinates?.lng ?? 0,
    checkInTime: h.checkInTime ?? "14:00",
    checkOutTime: h.checkOutTime ?? "11:00",
    policies: h.policies ?? [],
    startingPriceINR: h.startingPriceINR,
    isFeatured: h.isFeatured,
    status: h.status,
    seoTitle: h.seo?.title ?? "",
    seoDescription: h.seo?.description ?? "",
    noIndex: h.seo?.noIndex ?? false,
  };

  return (
    <div>
      <AdminPageHeader title={h.name} description={`${h.city} · ${h.ratingCount ?? 0} reviews`} />

      <HotelEditor
        initial={initial}
        destinations={serialise(destinationDocs).map((d) => ({ id: String(d._id), name: d.name }))}
      />
    </div>
  );
}
