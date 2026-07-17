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
  const [doc, parentCandidates] = await Promise.all([
    Destination.findById(id).lean().catch(() => null),
    Destination.find({ deletedAt: null, _id: { $ne: id } })
      .select("name type")
      .sort({ name: 1 })
      .lean(),
  ]);
  if (!doc) notFound();

  const d = serialise(doc) as unknown as IDestination;

  const initial: DestinationFormValues = {
    id: String(d._id),
    name: d.name,
    slug: d.slug,
    aliases: d.aliases ?? [],
    country: d.country,
    countryCode: d.countryCode ?? "IN",
    region: d.region ?? "",
    type: d.type ?? "country",
    parentDestination: d.parentDestination ? String(d.parentDestination) : "",
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
    hotelFeatured: d.hotelFeatured ?? false,
    packageFeatured: d.packageFeatured ?? false,
    displayOrder: d.displayOrder ?? 0,
    seoTitle: d.seo?.title ?? "",
    seoDescription: d.seo?.description ?? "",
    seoKeywords: d.seo?.keywords ?? [],
    noIndex: d.seo?.noIndex ?? false,
    status: d.status,
  };

  const destinationOptions = (
    serialise(parentCandidates) as unknown as { _id: string; name: string; type: string }[]
  ).map((p) => ({ id: p._id, name: p.name, type: p.type }));

  return (
    <div>
      <AdminPageHeader title={d.name} description={`${d.country} · ${d.viewCount ?? 0} views`} />
      <DestinationEditor initial={initial} destinations={destinationOptions} />
    </div>
  );
}
