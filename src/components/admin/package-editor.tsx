"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, Eye, ArrowLeft, AlertCircle } from "lucide-react";

import { savePackage } from "@/server/admin/actions";
import { Panel } from "./ui";
import { ImageField, GalleryField, type MediaValue } from "./image-field";
import { ChipSelectField, RepeatableField, StringListField, ToggleField } from "./field-kits";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlays";
import { ACTIVITY_CATEGORIES, PACKAGE_COLLECTIONS, TRIP_TYPES } from "@/config/site";
import { formatPrice, slugify, toDateInput } from "@/lib/utils";

/* -------------------------------------------------------------------------- */

export interface PackageFormValues {
  id?: string;
  title: string;
  slug: string;
  subtitle: string;
  destination: string;
  citiesCovered: string[];
  scope: "domestic" | "international";
  tripTypes: string[];
  collections: string[];
  durationDays: number;
  durationNights: number;
  heroImage: MediaValue;
  gallery: MediaValue[];
  videoUrl: string;
  overview: string;
  highlights: string[];
  itinerary: {
    day: number;
    city: string;
    title: string;
    description: string;
    meals: ("breakfast" | "lunch" | "dinner")[];
    hotel: string;
    transfers: string;
    activities: string[];
    optionalExperiences: string[];
  }[];
  variants: {
    key: string;
    label: string;
    hotelCategory: number;
    durationDays: number;
    durationNights: number;
    pricePerAdultINR: number;
    pricePerChildINR: number;
    singleSupplementINR: number;
    originalPricePerAdultINR?: number;
    isDefault: boolean;
  }[];
  departures: {
    date: string;
    departureCity: string;
    seatsTotal: number;
    seatsBooked: number;
    priceAdjustmentINR: number;
    isFixedDeparture: boolean;
    isGuaranteed: boolean;
  }[];
  departureCities: string[];
  taxPercent: number;
  flightsIncluded: boolean;
  mealsIncluded: boolean;
  activitiesIncluded: boolean;
  visaIncluded: boolean;
  transfersIncluded: boolean;
  hotelCategory: number;
  tripStyle: "group" | "private";
  instantConfirmation: boolean;
  recommendedSeason: string[];
  inclusions: string[];
  exclusions: string[];
  importantInfo: string[];
  visaDetails: string;
  cancellationPolicy: { window: string; charge: string }[];
  paymentPolicy: string[];
  termsAndConditions: string[];
  faqs: { question: string; answer: string }[];
  isFeatured: boolean;
  isTrending: boolean;
  isBestseller: boolean;
  status: "draft" | "scheduled" | "published" | "archived";
  publishAt: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  noIndex: boolean;
}

export const emptyPackage: PackageFormValues = {
  title: "",
  slug: "",
  subtitle: "",
  destination: "",
  citiesCovered: [],
  scope: "international",
  tripTypes: [],
  collections: [],
  durationDays: 6,
  durationNights: 5,
  heroImage: { url: "", alt: "" },
  gallery: [],
  videoUrl: "",
  overview: "",
  highlights: [],
  itinerary: [],
  variants: [
    {
      key: "standard",
      label: "Standard",
      hotelCategory: 4,
      durationDays: 6,
      durationNights: 5,
      pricePerAdultINR: 80000,
      pricePerChildINR: 56000,
      singleSupplementINR: 20000,
      isDefault: true,
    },
  ],
  departures: [],
  departureCities: ["Delhi", "Mumbai"],
  taxPercent: 5,
  flightsIncluded: false,
  mealsIncluded: true,
  activitiesIncluded: true,
  visaIncluded: false,
  transfersIncluded: true,
  hotelCategory: 4,
  tripStyle: "private",
  instantConfirmation: false,
  recommendedSeason: [],
  inclusions: [],
  exclusions: [],
  importantInfo: [],
  visaDetails: "",
  cancellationPolicy: [],
  paymentPolicy: [],
  termsAndConditions: [],
  faqs: [],
  isFeatured: false,
  isTrending: false,
  isBestseller: false,
  status: "draft",
  publishAt: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: [],
  noIndex: false,
};

const SEASONS = ["Spring", "Summer", "Monsoon", "Autumn", "Winter"];
const MEALS = ["breakfast", "lunch", "dinner"] as const;

/* -------------------------------------------------------------------------- */

export function PackageEditor({
  initial,
  destinations,
}: {
  initial: PackageFormValues;
  destinations: { id: string; name: string; scope: string }[];
}) {
  const router = useRouter();
  const [values, setValues] = React.useState<PackageFormValues>(initial);
  const [saving, setSaving] = React.useState(false);

  const set = <K extends keyof PackageFormValues>(key: K, value: PackageFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  // Starting price is derived, never typed — it must always match the variants.
  const startingPrice = values.variants.length
    ? Math.min(...values.variants.map((v) => v.pricePerAdultINR))
    : 0;

  const save = async (status?: PackageFormValues["status"]) => {
    const payload = { ...values, status: status ?? values.status };
    setSaving(true);

    const result = await savePackage({
      ...payload,
      slug: payload.slug || slugify(payload.title),
      seo: {
        title: payload.seoTitle || undefined,
        description: payload.seoDescription || undefined,
        keywords: payload.seoKeywords,
        noIndex: payload.noIndex,
      },
      publishAt: payload.publishAt || undefined,
    });

    if (result.ok) {
      toast.success("Saved", result.message);
      if (!values.id && result.id) {
        router.push(`/admin/packages/${result.id}`);
      } else {
        router.refresh();
      }
    } else {
      toast.error("Could not save", result.message);
    }

    setSaving(false);
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/packages"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-lagoon-700 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          All packages
        </Link>

        <div className="flex flex-wrap gap-2">
          {values.id && values.slug ? (
            <Button asChild size="sm" variant="outline">
              <a href={`/packages/${values.slug}`} target="_blank" rel="noopener noreferrer">
                <Eye aria-hidden />
                Preview
              </a>
            </Button>
          ) : null}

          <Button size="sm" variant="outline" onClick={() => save("draft")} loading={saving}>
            Save draft
          </Button>

          <Button size="sm" variant="accent" onClick={() => save("published")} loading={saving}>
            <Save aria-hidden />
            {values.status === "published" ? "Save & publish" : "Publish"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basics">
        <TabsList className="mb-6 rounded-full bg-white p-1">
          {[
            ["basics", "Basics"],
            ["itinerary", "Itinerary"],
            ["pricing", "Pricing & dates"],
            ["inclusions", "Inclusions"],
            ["policies", "Policies & FAQs"],
            ["publish", "Publish & SEO"],
          ].map(([value, label]) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ================================ BASICS ================================ */}
        <TabsContent value="basics" className="space-y-5">
          <Panel title="The basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" htmlFor="pk-title" required className="sm:col-span-2">
                <Input
                  id="pk-title"
                  value={values.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Ten Days Across the Balkans"
                />
              </Field>

              <Field
                label="URL slug"
                htmlFor="pk-slug"
                hint={`/packages/${values.slug || slugify(values.title) || "…"}`}
              >
                <Input
                  id="pk-slug"
                  value={values.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  placeholder="auto-generated from the title"
                />
              </Field>

              <Field label="Destination" htmlFor="pk-dest" required>
                <Select
                  id="pk-dest"
                  value={values.destination}
                  onChange={(e) => {
                    const dest = destinations.find((d) => d.id === e.target.value);
                    setValues((v) => ({
                      ...v,
                      destination: e.target.value,
                      scope: (dest?.scope as "domestic" | "international") ?? v.scope,
                    }));
                  }}
                >
                  <option value="">Pick a destination</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Subtitle" htmlFor="pk-sub" className="sm:col-span-2">
                <Input
                  id="pk-sub"
                  value={values.subtitle}
                  onChange={(e) => set("subtitle", e.target.value)}
                  placeholder="One line that makes someone want to read on."
                />
              </Field>

              <Field label="Overview" htmlFor="pk-overview" required className="sm:col-span-2">
                <Textarea
                  id="pk-overview"
                  rows={6}
                  value={values.overview}
                  onChange={(e) => set("overview", e.target.value)}
                  placeholder="What this trip is actually like. Write it the way you'd describe it to a friend."
                />
              </Field>

              <Field label="Days" htmlFor="pk-days" required>
                <Input
                  id="pk-days"
                  type="number"
                  min={1}
                  value={values.durationDays}
                  onChange={(e) => set("durationDays", Number(e.target.value))}
                />
              </Field>

              <Field label="Nights" htmlFor="pk-nights" required>
                <Input
                  id="pk-nights"
                  type="number"
                  min={0}
                  value={values.durationNights}
                  onChange={(e) => set("durationNights", Number(e.target.value))}
                />
              </Field>
            </div>

            <div className="mt-5 space-y-5">
              <StringListField
                label="Cities covered"
                value={values.citiesCovered}
                onChange={(v) => set("citiesCovered", v)}
                placeholder="Add a city and press Enter"
              />

              <StringListField
                label="Highlights"
                value={values.highlights}
                onChange={(v) => set("highlights", v)}
                placeholder="One highlight per line"
                hint="Shown as a bullet grid near the top of the package page."
              />

              <ChipSelectField
                label="Travel styles"
                options={TRIP_TYPES.map((t) => ({ value: t.slug, label: t.label }))}
                value={values.tripTypes}
                onChange={(v) => set("tripTypes", v)}
              />

              <ChipSelectField
                label="Homepage collections"
                options={PACKAGE_COLLECTIONS.map((c) => ({ value: c.slug, label: c.label }))}
                value={values.collections}
                onChange={(v) => set("collections", v)}
              />
            </div>
          </Panel>

          <Panel title="Media">
            <ImageField
              label="Hero image"
              required
              value={values.heroImage}
              onChange={(v) => set("heroImage", v)}
              folder="packages"
              hint="Landscape, at least 1600px wide."
            />

            <div className="mt-5">
              <p className="mb-2 text-[0.8125rem] font-semibold text-midnight-800">Gallery</p>
              <GalleryField
                value={values.gallery}
                onChange={(v) => set("gallery", v)}
                folder="packages"
              />
            </div>

            <Field label="Video URL (optional)" htmlFor="pk-video" className="mt-5">
              <Input
                id="pk-video"
                value={values.videoUrl}
                onChange={(e) => set("videoUrl", e.target.value)}
                placeholder="https://…/film.mp4"
              />
            </Field>
          </Panel>
        </TabsContent>

        {/* =============================== ITINERARY ============================== */}
        <TabsContent value="itinerary">
          <Panel title="Day by day">
            <RepeatableField<PackageFormValues["itinerary"][number]>
              label="Days"
              addLabel="Add day"
              hint="Each day becomes one entry on the interactive timeline."
              items={values.itinerary}
              onChange={(v) => set("itinerary", v)}
              createEmpty={() => ({
                day: values.itinerary.length + 1,
                city: "",
                title: "",
                description: "",
                meals: ["breakfast"] as ("breakfast" | "lunch" | "dinner")[],
                hotel: "",
                transfers: "",
                activities: [],
                optionalExperiences: [],
              })}
              renderRow={(day, i, update) => (
                <div className="grid gap-3 sm:grid-cols-4">
                  <Field label="Day" htmlFor={`it-${i}-day`}>
                    <Input
                      id={`it-${i}-day`}
                      type="number"
                      min={1}
                      value={day.day}
                      onChange={(e) => update({ day: Number(e.target.value) })}
                    />
                  </Field>

                  <Field label="City" htmlFor={`it-${i}-city`}>
                    <Input
                      id={`it-${i}-city`}
                      value={day.city}
                      onChange={(e) => update({ city: e.target.value })}
                    />
                  </Field>

                  <Field label="Title" htmlFor={`it-${i}-title`} className="sm:col-span-2">
                    <Input
                      id={`it-${i}-title`}
                      value={day.title}
                      onChange={(e) => update({ title: e.target.value })}
                      placeholder="Arrive, and do nothing at all"
                    />
                  </Field>

                  <Field label="What happens" htmlFor={`it-${i}-desc`} className="sm:col-span-4">
                    <Textarea
                      id={`it-${i}-desc`}
                      rows={3}
                      value={day.description}
                      onChange={(e) => update({ description: e.target.value })}
                    />
                  </Field>

                  <Field label="Hotel" htmlFor={`it-${i}-hotel`} className="sm:col-span-2">
                    <Input
                      id={`it-${i}-hotel`}
                      value={day.hotel}
                      onChange={(e) => update({ hotel: e.target.value })}
                    />
                  </Field>

                  <Field label="Transfers" htmlFor={`it-${i}-transfers`} className="sm:col-span-2">
                    <Input
                      id={`it-${i}-transfers`}
                      value={day.transfers}
                      onChange={(e) => update({ transfers: e.target.value })}
                    />
                  </Field>

                  <div className="sm:col-span-2">
                    <ChipSelectField
                      label="Meals included"
                      options={MEALS.map((m) => ({ value: m, label: m }))}
                      value={day.meals}
                      onChange={(v) =>
                        update({ meals: v as ("breakfast" | "lunch" | "dinner")[] })
                      }
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <StringListField
                      label="Activities today"
                      value={day.activities}
                      onChange={(v) => update({ activities: v })}
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <StringListField
                      label="Optional add-ons"
                      value={day.optionalExperiences}
                      onChange={(v) => update({ optionalExperiences: v })}
                    />
                  </div>
                </div>
              )}
            />
          </Panel>
        </TabsContent>

        {/* ============================ PRICING & DATES =========================== */}
        <TabsContent value="pricing" className="space-y-5">
          <Panel title="Pricing options">
            <p className="mb-4 flex items-start gap-2 rounded-xl bg-lagoon-50 p-3 text-xs leading-relaxed text-lagoon-900">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              The public &ldquo;from&rdquo; price is derived from the cheapest option below — currently{" "}
              <span className="font-bold">{formatPrice(startingPrice)}</span>. It is never entered
              by hand, so it can&apos;t drift out of sync with what the booking engine charges.
            </p>

            <RepeatableField<PackageFormValues["variants"][number]>
              label="Options"
              addLabel="Add option"
              items={values.variants}
              onChange={(v) => set("variants", v)}
              createEmpty={() => ({
                key: `option-${values.variants.length + 1}`,
                label: "",
                hotelCategory: 4,
                durationDays: values.durationDays,
                durationNights: values.durationNights,
                pricePerAdultINR: 0,
                pricePerChildINR: 0,
                singleSupplementINR: 0,
                originalPricePerAdultINR: undefined,
                isDefault: false,
              })}
              renderRow={(variant, i, update) => (
                <div className="grid gap-3 sm:grid-cols-4">
                  <Field label="Key" htmlFor={`vr-${i}-key`}>
                    <Input
                      id={`vr-${i}-key`}
                      value={variant.key}
                      onChange={(e) => update({ key: slugify(e.target.value) })}
                    />
                  </Field>

                  <Field label="Label" htmlFor={`vr-${i}-label`}>
                    <Input
                      id={`vr-${i}-label`}
                      value={variant.label}
                      onChange={(e) => update({ label: e.target.value })}
                      placeholder="Premium — 5★"
                    />
                  </Field>

                  <Field label="Hotel category" htmlFor={`vr-${i}-cat`}>
                    <Select
                      id={`vr-${i}-cat`}
                      value={variant.hotelCategory}
                      onChange={(e) => update({ hotelCategory: Number(e.target.value) })}
                    >
                      {[3, 4, 5].map((c) => (
                        <option key={c} value={c}>
                          {c}★
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Days" htmlFor={`vr-${i}-days`}>
                    <Input
                      id={`vr-${i}-days`}
                      type="number"
                      min={1}
                      value={variant.durationDays}
                      onChange={(e) =>
                        update({
                          durationDays: Number(e.target.value),
                          durationNights: Math.max(0, Number(e.target.value) - 1),
                        })
                      }
                    />
                  </Field>

                  <Field label="Price / adult" htmlFor={`vr-${i}-adult`}>
                    <Input
                      id={`vr-${i}-adult`}
                      type="number"
                      min={0}
                      value={variant.pricePerAdultINR}
                      onChange={(e) => update({ pricePerAdultINR: Number(e.target.value) })}
                    />
                  </Field>

                  <Field label="Price / child" htmlFor={`vr-${i}-child`}>
                    <Input
                      id={`vr-${i}-child`}
                      type="number"
                      min={0}
                      value={variant.pricePerChildINR}
                      onChange={(e) => update({ pricePerChildINR: Number(e.target.value) })}
                    />
                  </Field>

                  <Field label="Single supplement" htmlFor={`vr-${i}-single`}>
                    <Input
                      id={`vr-${i}-single`}
                      type="number"
                      min={0}
                      value={variant.singleSupplementINR}
                      onChange={(e) => update({ singleSupplementINR: Number(e.target.value) })}
                    />
                  </Field>

                  <Field
                    label="Was (strike-through)"
                    htmlFor={`vr-${i}-orig`}
                    hint="Leave blank if there's no genuine discount."
                  >
                    <Input
                      id={`vr-${i}-orig`}
                      type="number"
                      min={0}
                      value={variant.originalPricePerAdultINR ?? ""}
                      onChange={(e) =>
                        update({
                          originalPricePerAdultINR: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                    />
                  </Field>

                  <div className="sm:col-span-4">
                    <ToggleField
                      label="Default option"
                      description="Pre-selected on the booking card."
                      checked={variant.isDefault}
                      onChange={(checked) =>
                        set(
                          "variants",
                          values.variants.map((v, idx) => ({
                            ...v,
                            isDefault: idx === i ? checked : false,
                          })),
                        )
                      }
                    />
                  </div>
                </div>
              )}
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <Field label="Tax %" htmlFor="pk-tax">
                <Input
                  id="pk-tax"
                  type="number"
                  min={0}
                  max={30}
                  value={values.taxPercent}
                  onChange={(e) => set("taxPercent", Number(e.target.value))}
                />
              </Field>

              <Field label="Trip style" htmlFor="pk-style">
                <Select
                  id="pk-style"
                  value={values.tripStyle}
                  onChange={(e) => set("tripStyle", e.target.value as "group" | "private")}
                >
                  <option value="private">Private</option>
                  <option value="group">Group departure</option>
                </Select>
              </Field>

              <Field label="Default hotel category" htmlFor="pk-cat">
                <Select
                  id="pk-cat"
                  value={values.hotelCategory}
                  onChange={(e) => set("hotelCategory", Number(e.target.value))}
                >
                  {[3, 4, 5].map((c) => (
                    <option key={c} value={c}>
                      {c}★
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </Panel>

          <Panel title="Departure dates">
            <RepeatableField
              label="Departures"
              addLabel="Add departure"
              hint="Add fixed departures for group trips. Leave empty for a private trip on any date."
              items={values.departures}
              onChange={(v) => set("departures", v)}
              createEmpty={() => ({
                date: toDateInput(new Date(Date.now() + 45 * 86_400_000)),
                departureCity: "Delhi",
                seatsTotal: 16,
                seatsBooked: 0,
                priceAdjustmentINR: 0,
                isFixedDeparture: true,
                isGuaranteed: false,
              })}
              renderRow={(dep, i, update) => (
                <div className="grid gap-3 sm:grid-cols-4">
                  <Field label="Date" htmlFor={`dp-${i}-date`}>
                    <Input
                      id={`dp-${i}-date`}
                      type="date"
                      value={dep.date}
                      onChange={(e) => update({ date: e.target.value })}
                    />
                  </Field>

                  <Field label="From" htmlFor={`dp-${i}-city`}>
                    <Input
                      id={`dp-${i}-city`}
                      value={dep.departureCity}
                      onChange={(e) => update({ departureCity: e.target.value })}
                    />
                  </Field>

                  <Field label="Seats" htmlFor={`dp-${i}-seats`}>
                    <Input
                      id={`dp-${i}-seats`}
                      type="number"
                      min={1}
                      value={dep.seatsTotal}
                      onChange={(e) => update({ seatsTotal: Number(e.target.value) })}
                    />
                  </Field>

                  <Field
                    label="Price adjustment"
                    htmlFor={`dp-${i}-adj`}
                    hint="Peak-season uplift, or negative for a shoulder discount."
                  >
                    <Input
                      id={`dp-${i}-adj`}
                      type="number"
                      value={dep.priceAdjustmentINR}
                      onChange={(e) => update({ priceAdjustmentINR: Number(e.target.value) })}
                    />
                  </Field>

                  <div className="sm:col-span-2">
                    <ToggleField
                      label="Guaranteed departure"
                      checked={dep.isGuaranteed}
                      onChange={(checked) => update({ isGuaranteed: checked })}
                    />
                  </div>
                </div>
              )}
            />

            <div className="mt-5">
              <StringListField
                label="Departure cities"
                value={values.departureCities}
                onChange={(v) => set("departureCities", v)}
              />
            </div>
          </Panel>
        </TabsContent>

        {/* =============================== INCLUSIONS ============================= */}
        <TabsContent value="inclusions" className="space-y-5">
          <Panel title="What's in the price">
            <div className="grid gap-3 sm:grid-cols-2">
              <ToggleField
                label="Flights included"
                checked={values.flightsIncluded}
                onChange={(v) => set("flightsIncluded", v)}
              />
              <ToggleField
                label="Meals included"
                checked={values.mealsIncluded}
                onChange={(v) => set("mealsIncluded", v)}
              />
              <ToggleField
                label="Activities included"
                checked={values.activitiesIncluded}
                onChange={(v) => set("activitiesIncluded", v)}
              />
              <ToggleField
                label="Transfers included"
                checked={values.transfersIncluded}
                onChange={(v) => set("transfersIncluded", v)}
              />
              <ToggleField
                label="Visa assistance included"
                checked={values.visaIncluded}
                onChange={(v) => set("visaIncluded", v)}
              />
              <ToggleField
                label="Instant confirmation"
                description="Only enable if you can actually confirm immediately."
                checked={values.instantConfirmation}
                onChange={(v) => set("instantConfirmation", v)}
              />
            </div>

            <div className="mt-6 space-y-5">
              <StringListField
                label="Inclusions"
                value={values.inclusions}
                onChange={(v) => set("inclusions", v)}
                placeholder="Return airport transfers in a private car"
              />

              <StringListField
                label="Exclusions"
                value={values.exclusions}
                onChange={(v) => set("exclusions", v)}
                placeholder="Anything not explicitly listed above"
                hint="Be specific. Vague exclusions are how travellers get ambushed."
              />

              <ChipSelectField
                label="Recommended season"
                options={SEASONS.map((s) => ({ value: s, label: s }))}
                value={values.recommendedSeason}
                onChange={(v) => set("recommendedSeason", v)}
              />

              <ChipSelectField
                label="Experience types on this trip"
                options={ACTIVITY_CATEGORIES.map((c) => ({ value: c.slug, label: c.label }))}
                value={values.tripTypes}
                onChange={(v) => set("tripTypes", v)}
              />
            </div>
          </Panel>
        </TabsContent>

        {/* =============================== POLICIES ============================== */}
        <TabsContent value="policies" className="space-y-5">
          <Panel title="Policies">
            <div className="space-y-6">
              <RepeatableField
                label="Cancellation bands"
                addLabel="Add band"
                items={values.cancellationPolicy}
                onChange={(v) => set("cancellationPolicy", v)}
                createEmpty={() => ({ window: "", charge: "" })}
                renderRow={(row, i, update) => (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Window" htmlFor={`cp-${i}-w`}>
                      <Input
                        id={`cp-${i}-w`}
                        value={row.window}
                        onChange={(e) => update({ window: e.target.value })}
                        placeholder="More than 45 days before travel"
                      />
                    </Field>
                    <Field label="Charge" htmlFor={`cp-${i}-c`}>
                      <Input
                        id={`cp-${i}-c`}
                        value={row.charge}
                        onChange={(e) => update({ charge: e.target.value })}
                        placeholder="10% of the trip cost"
                      />
                    </Field>
                  </div>
                )}
              />

              <StringListField
                label="Payment policy"
                value={values.paymentPolicy}
                onChange={(v) => set("paymentPolicy", v)}
              />

              <StringListField
                label="Important information"
                value={values.importantInfo}
                onChange={(v) => set("importantInfo", v)}
                hint="Anything a traveller would be annoyed to discover late."
              />

              <StringListField
                label="Terms and conditions"
                value={values.termsAndConditions}
                onChange={(v) => set("termsAndConditions", v)}
              />

              <Field label="Visa details" htmlFor="pk-visa">
                <Textarea
                  id="pk-visa"
                  rows={3}
                  value={values.visaDetails}
                  onChange={(e) => set("visaDetails", e.target.value)}
                  placeholder="What visa is required, and how long it typically takes."
                />
              </Field>
            </div>
          </Panel>

          <Panel title="FAQs">
            <RepeatableField
              label="FAQs"
              addLabel="Add FAQ"
              items={values.faqs}
              onChange={(v) => set("faqs", v)}
              createEmpty={() => ({ question: "", answer: "" })}
              renderRow={(faq, i, update) => (
                <div className="space-y-3">
                  <Field label="Question" htmlFor={`fq-${i}-q`}>
                    <Input
                      id={`fq-${i}-q`}
                      value={faq.question}
                      onChange={(e) => update({ question: e.target.value })}
                    />
                  </Field>
                  <Field label="Answer" htmlFor={`fq-${i}-a`}>
                    <Textarea
                      id={`fq-${i}-a`}
                      rows={3}
                      value={faq.answer}
                      onChange={(e) => update({ answer: e.target.value })}
                    />
                  </Field>
                </div>
              )}
            />
          </Panel>
        </TabsContent>

        {/* ============================ PUBLISH & SEO ============================ */}
        <TabsContent value="publish" className="space-y-5">
          <Panel title="Publication">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Status" htmlFor="pk-status">
                <Select
                  id="pk-status"
                  value={values.status}
                  onChange={(e) => set("status", e.target.value as PackageFormValues["status"])}
                >
                  <option value="draft">Draft — not visible</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published — live</option>
                  <option value="archived">Archived</option>
                </Select>
              </Field>

              {values.status === "scheduled" ? (
                <Field label="Publish at" htmlFor="pk-publishat">
                  <Input
                    id="pk-publishat"
                    type="datetime-local"
                    value={values.publishAt}
                    onChange={(e) => set("publishAt", e.target.value)}
                  />
                </Field>
              ) : null}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ToggleField
                label="Featured"
                description="Boosted in recommended sorting."
                checked={values.isFeatured}
                onChange={(v) => set("isFeatured", v)}
              />
              <ToggleField
                label="Trending"
                checked={values.isTrending}
                onChange={(v) => set("isTrending", v)}
              />
              <ToggleField
                label="Bestseller"
                checked={values.isBestseller}
                onChange={(v) => set("isBestseller", v)}
              />
            </div>
          </Panel>

          <Panel title="SEO">
            <div className="space-y-4">
              <Field
                label="Meta title"
                htmlFor="pk-seotitle"
                hint={`${(values.seoTitle || values.title).length}/60 characters`}
              >
                <Input
                  id="pk-seotitle"
                  value={values.seoTitle}
                  onChange={(e) => set("seoTitle", e.target.value)}
                  placeholder={values.title}
                />
              </Field>

              <Field
                label="Meta description"
                htmlFor="pk-seodesc"
                hint={`${values.seoDescription.length}/160 characters`}
              >
                <Textarea
                  id="pk-seodesc"
                  rows={3}
                  value={values.seoDescription}
                  onChange={(e) => set("seoDescription", e.target.value)}
                />
              </Field>

              <StringListField
                label="Keywords"
                value={values.seoKeywords}
                onChange={(v) => set("seoKeywords", v)}
              />

              <ToggleField
                label="Hide from search engines"
                description="Adds noindex. Use for private or unlisted packages."
                checked={values.noIndex}
                onChange={(v) => set("noIndex", v)}
              />
            </div>
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
