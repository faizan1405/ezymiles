import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Destination, Package } from "@/models";
import { AdminPageHeader } from "@/components/admin/ui";
import { PackageEditor, type PackageFormValues } from "@/components/admin/package-editor";
import { serialise, toDateInput } from "@/lib/utils";
import type { IPackage } from "@/models";

export const metadata: Metadata = { title: "Edit package", robots: { index: false } };

export default async function EditPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("packages:manage");
  const { id } = await params;

  await connectDB();

  const [doc, destinationDocs] = await Promise.all([
    Package.findById(id).lean().catch(() => null),
    Destination.find({ deletedAt: null }).select("name scope").sort({ name: 1 }).lean(),
  ]);

  if (!doc) notFound();

  const pkg = serialise(doc) as unknown as IPackage;

  const initial: PackageFormValues = {
    id: String(pkg._id),
    title: pkg.title,
    slug: pkg.slug,
    subtitle: pkg.subtitle ?? "",
    destination: String(pkg.destination),
    citiesCovered: pkg.citiesCovered ?? [],
    scope: pkg.scope,
    tripTypes: pkg.tripTypes ?? [],
    collections: pkg.collections ?? [],
    durationDays: pkg.durationDays,
    durationNights: pkg.durationNights,
    heroImage: { url: pkg.heroImage?.url ?? "", alt: pkg.heroImage?.alt ?? "" },
    gallery: (pkg.gallery ?? []).map((g) => ({ url: g.url, alt: g.alt ?? "" })),
    videoUrl: pkg.videoUrl ?? "",
    overview: pkg.overview ?? "",
    highlights: pkg.highlights ?? [],
    itinerary: (pkg.itinerary ?? []).map((d) => ({
      day: d.day,
      city: d.city ?? "",
      title: d.title,
      description: d.description ?? "",
      meals: d.meals ?? [],
      hotel: d.hotel ?? "",
      transfers: d.transfers ?? "",
      activities: d.activities ?? [],
      optionalExperiences: d.optionalExperiences ?? [],
    })),
    variants: (pkg.variants ?? []).map((v) => ({
      key: v.key,
      label: v.label,
      hotelCategory: v.hotelCategory,
      durationDays: v.durationDays,
      durationNights: v.durationNights,
      pricePerAdultINR: v.pricePerAdultINR,
      pricePerChildINR: v.pricePerChildINR,
      singleSupplementINR: v.singleSupplementINR,
      originalPricePerAdultINR: v.originalPricePerAdultINR,
      isDefault: v.isDefault,
    })),
    departures: (pkg.departures ?? []).map((d) => ({
      date: toDateInput(d.date),
      departureCity: d.departureCity,
      seatsTotal: d.seatsTotal,
      seatsBooked: d.seatsBooked,
      priceAdjustmentINR: d.priceAdjustmentINR,
      isFixedDeparture: d.isFixedDeparture,
      isGuaranteed: d.isGuaranteed,
    })),
    departureCities: pkg.departureCities ?? [],
    taxPercent: pkg.taxPercent ?? 5,
    flightsIncluded: pkg.flightsIncluded,
    mealsIncluded: pkg.mealsIncluded,
    activitiesIncluded: pkg.activitiesIncluded,
    visaIncluded: pkg.visaIncluded,
    transfersIncluded: pkg.transfersIncluded,
    hotelCategory: pkg.hotelCategory,
    tripStyle: pkg.tripStyle,
    instantConfirmation: pkg.instantConfirmation,
    recommendedSeason: pkg.recommendedSeason ?? [],
    inclusions: pkg.inclusions ?? [],
    exclusions: pkg.exclusions ?? [],
    importantInfo: pkg.importantInfo ?? [],
    visaDetails: pkg.visaDetails ?? "",
    cancellationPolicy: pkg.cancellationPolicy ?? [],
    paymentPolicy: pkg.paymentPolicy ?? [],
    termsAndConditions: pkg.termsAndConditions ?? [],
    faqs: pkg.faqs ?? [],
    isFeatured: pkg.isFeatured,
    isTrending: pkg.isTrending,
    isBestseller: pkg.isBestseller,
    status: pkg.status,
    publishAt: pkg.publishAt ? String(pkg.publishAt).slice(0, 16) : "",
    seoTitle: pkg.seo?.title ?? "",
    seoDescription: pkg.seo?.description ?? "",
    seoKeywords: pkg.seo?.keywords ?? [],
    noIndex: pkg.seo?.noIndex ?? false,
  };

  return (
    <div>
      <AdminPageHeader
        title={pkg.title}
        description={`${pkg.viewCount ?? 0} views · ${pkg.bookingCount ?? 0} bookings · ${pkg.enquiryCount ?? 0} enquiries`}
      />

      <PackageEditor
        initial={initial}
        destinations={serialise(destinationDocs).map((d) => ({
          id: String(d._id),
          name: d.name,
          scope: d.scope,
        }))}
      />
    </div>
  );
}
