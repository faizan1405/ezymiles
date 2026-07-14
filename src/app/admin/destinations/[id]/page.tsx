import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Destination } from "@/models";
import { AdminPageHeader } from "@/components/admin/ui";
import { DestinationEditor, type DestinationFormValues } from "@/components/admin/destination-editor";
import { serialise } from "@/lib/utils";
import type { IDestination } from "@/models";

export const metadata: Metadata = { title: "Edit destination", robots: { index: false } };

export default async function EditDestinationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("destinations:manage");
  const { id } = await params;

  await connectDB();
  const doc = await Destination.findById(id).lean().catch(() => null);
  if (!doc) notFound();

  const d = serialise(doc) as unknown as IDestination;

  const initial: DestinationFormValues = {
    id: String(d._id),
    name: d.name,
    slug: d.slug,
    country: d.country,
    countryCode: d.countryCode ?? "IN",
    region: d.region ?? "",
    scope: d.scope,
    themes: d.themes ?? [],
    summary: d.summary ?? "",
    description: d.description ?? "",
    heroImage: { url: d.heroImage?.url ?? "", alt: d.heroImage?.alt ?? "" },
    gallery: (d.gallery ?? []).map((g) => ({ url: g.url, alt: g.alt ?? "" })),
    startingPriceINR: d.startingPriceINR,
    recommendedDurationDays: d.recommendedDurationDays,
    bestMonths: d.bestMonths ?? [],
    currencyUsed: d.currencyUsed ?? "",
    languages: d.languages ?? [],
    timezone: d.timezone ?? "",
    visaNote: d.visaNote ?? "",
    lat: d.coordinates?.lat ?? 0,
    lng: d.coordinates?.lng ?? 0,
    highlights: d.highlights ?? [],
    faqs: d.faqs ?? [],
    isFeatured: d.isFeatured,
    isTrending: d.isTrending,
    status: d.status,
  };

  return (
    <div>
      <AdminPageHeader title={d.name} description={`${d.country} · ${d.viewCount ?? 0} views`} />
      <DestinationEditor initial={initial} />
    </div>
  );
}
