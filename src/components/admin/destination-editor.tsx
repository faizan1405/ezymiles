"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, ArrowLeft, Eye } from "lucide-react";

import { saveDestination } from "@/server/admin/actions";
import { Panel } from "./ui";
import { ImageField, GalleryField, type MediaValue } from "./image-field";
import { ChipSelectField, RepeatableField, StringListField, ToggleField } from "./field-kits";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { TRIP_TYPES } from "@/config/site";
import { slugify } from "@/lib/utils";

export interface DestinationFormValues {
  id?: string;
  name: string;
  slug: string;
  country: string;
  countryCode: string;
  region: string;
  scope: "domestic" | "international";
  themes: string[];
  summary: string;
  description: string;
  heroImage: MediaValue;
  gallery: MediaValue[];
  startingPriceINR: number;
  recommendedDurationDays: number;
  bestMonths: string[];
  currencyUsed: string;
  languages: string[];
  timezone: string;
  visaNote: string;
  lat: number;
  lng: number;
  highlights: string[];
  faqs: { question: string; answer: string }[];
  isFeatured: boolean;
  isTrending: boolean;
  status: "draft" | "scheduled" | "published" | "archived";
}

export const emptyDestination: DestinationFormValues = {
  name: "",
  slug: "",
  country: "",
  countryCode: "IN",
  region: "",
  scope: "international",
  themes: [],
  summary: "",
  description: "",
  heroImage: { url: "", alt: "" },
  gallery: [],
  startingPriceINR: 0,
  recommendedDurationDays: 5,
  bestMonths: [],
  currencyUsed: "",
  languages: [],
  timezone: "",
  visaNote: "",
  lat: 0,
  lng: 0,
  highlights: [],
  faqs: [],
  isFeatured: false,
  isTrending: false,
  status: "draft",
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function DestinationEditor({ initial }: { initial: DestinationFormValues }) {
  const router = useRouter();
  const [values, setValues] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);

  const set = <K extends keyof DestinationFormValues>(key: K, value: DestinationFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const save = async (status?: DestinationFormValues["status"]) => {
    setSaving(true);

    const result = await saveDestination({
      ...values,
      status: status ?? values.status,
      slug: values.slug || slugify(values.name),
      coordinates: { lat: values.lat, lng: values.lng },
    });

    if (result.ok) {
      toast.success("Saved", result.message);
      if (!values.id && result.id) router.push(`/admin/destinations/${result.id}`);
      else router.refresh();
    } else {
      toast.error("Could not save", result.message);
    }

    setSaving(false);
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/destinations"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-lagoon-700 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          All destinations
        </Link>

        <div className="flex gap-2">
          {values.id && values.slug ? (
            <Button asChild size="sm" variant="outline">
              <a href={`/destinations/${values.slug}`} target="_blank" rel="noopener noreferrer">
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
            Publish
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-5">
          <Panel title="Destination">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor="d-name" required>
                <Input
                  id="d-name"
                  value={values.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Bali"
                />
              </Field>

              <Field
                label="URL slug"
                htmlFor="d-slug"
                hint={`/destinations/${values.slug || slugify(values.name) || "…"}`}
              >
                <Input
                  id="d-slug"
                  value={values.slug}
                  onChange={(e) => set("slug", e.target.value)}
                />
              </Field>

              <Field label="Country" htmlFor="d-country" required>
                <Input
                  id="d-country"
                  value={values.country}
                  onChange={(e) => set("country", e.target.value)}
                  placeholder="Indonesia"
                />
              </Field>

              <Field label="Region" htmlFor="d-region">
                <Input
                  id="d-region"
                  value={values.region}
                  onChange={(e) => set("region", e.target.value)}
                  placeholder="Southeast Asia"
                />
              </Field>

              <Field label="Scope" htmlFor="d-scope" required>
                <Select
                  id="d-scope"
                  value={values.scope}
                  onChange={(e) => set("scope", e.target.value as "domestic" | "international")}
                >
                  <option value="domestic">India (domestic)</option>
                  <option value="international">International</option>
                </Select>
              </Field>

              <Field label="Country code" htmlFor="d-cc">
                <Input
                  id="d-cc"
                  value={values.countryCode}
                  onChange={(e) => set("countryCode", e.target.value.toUpperCase())}
                  maxLength={2}
                />
              </Field>

              <Field label="Summary" htmlFor="d-summary" className="sm:col-span-2">
                <Textarea
                  id="d-summary"
                  rows={2}
                  value={values.summary}
                  onChange={(e) => set("summary", e.target.value)}
                  placeholder="One or two honest lines. Shown on cards and in search results."
                />
              </Field>

              <Field label="Full description" htmlFor="d-desc" className="sm:col-span-2">
                <Textarea
                  id="d-desc"
                  rows={7}
                  value={values.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="What the place is actually like — including what it isn't."
                />
              </Field>
            </div>

            <div className="mt-5 space-y-5">
              <StringListField
                label="Highlights"
                value={values.highlights}
                onChange={(v) => set("highlights", v)}
              />

              <ChipSelectField
                label="Themes"
                options={TRIP_TYPES.map((t) => ({ value: t.slug, label: t.label }))}
                value={values.themes}
                onChange={(v) => set("themes", v)}
              />
            </div>
          </Panel>

          <Panel title="Media">
            <ImageField
              label="Hero image"
              required
              value={values.heroImage}
              onChange={(v) => set("heroImage", v)}
              folder="destinations"
            />

            <div className="mt-5">
              <p className="mb-2 text-[0.8125rem] font-semibold text-midnight-800">Gallery</p>
              <GalleryField
                value={values.gallery}
                onChange={(v) => set("gallery", v)}
                folder="destinations"
              />
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
                  <Field label="Question" htmlFor={`df-${i}-q`}>
                    <Input
                      id={`df-${i}-q`}
                      value={faq.question}
                      onChange={(e) => update({ question: e.target.value })}
                    />
                  </Field>
                  <Field label="Answer" htmlFor={`df-${i}-a`}>
                    <Textarea
                      id={`df-${i}-a`}
                      rows={3}
                      value={faq.answer}
                      onChange={(e) => update({ answer: e.target.value })}
                    />
                  </Field>
                </div>
              )}
            />
          </Panel>
        </div>

        {/* --------------------------------- Sidebar -------------------------------- */}
        <aside className="space-y-5">
          <Panel title="Trip facts">
            <div className="space-y-4">
              <Field
                label="Starting price (INR)"
                htmlFor="d-price"
                hint="Shown on cards. Keep it aligned with your cheapest package."
              >
                <Input
                  id="d-price"
                  type="number"
                  min={0}
                  value={values.startingPriceINR}
                  onChange={(e) => set("startingPriceINR", Number(e.target.value))}
                />
              </Field>

              <Field label="Ideal trip length (days)" htmlFor="d-days">
                <Input
                  id="d-days"
                  type="number"
                  min={1}
                  value={values.recommendedDurationDays}
                  onChange={(e) => set("recommendedDurationDays", Number(e.target.value))}
                />
              </Field>

              <ChipSelectField
                label="Best months"
                options={MONTHS.map((m) => ({ value: m, label: m }))}
                value={values.bestMonths}
                onChange={(v) => set("bestMonths", v)}
              />

              <Field label="Currency used" htmlFor="d-cur">
                <Input
                  id="d-cur"
                  value={values.currencyUsed}
                  onChange={(e) => set("currencyUsed", e.target.value)}
                  placeholder="Indonesian Rupiah (IDR)"
                />
              </Field>

              <StringListField
                label="Languages"
                value={values.languages}
                onChange={(v) => set("languages", v)}
              />

              <Field label="Timezone" htmlFor="d-tz">
                <Input
                  id="d-tz"
                  value={values.timezone}
                  onChange={(e) => set("timezone", e.target.value)}
                  placeholder="GMT+8"
                />
              </Field>

              <Field label="Visa note" htmlFor="d-visa">
                <Textarea
                  id="d-visa"
                  rows={2}
                  value={values.visaNote}
                  onChange={(e) => set("visaNote", e.target.value)}
                  placeholder="Visa on arrival for Indian passport holders, 30 days."
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Map position">
            <p className="mb-3 text-xs leading-relaxed text-muted">
              Used to place the marker on the homepage atlas. Copy the coordinates from any map
              service.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Latitude" htmlFor="d-lat">
                <Input
                  id="d-lat"
                  type="number"
                  step="0.0001"
                  value={values.lat}
                  onChange={(e) => set("lat", Number(e.target.value))}
                />
              </Field>
              <Field label="Longitude" htmlFor="d-lng">
                <Input
                  id="d-lng"
                  type="number"
                  step="0.0001"
                  value={values.lng}
                  onChange={(e) => set("lng", Number(e.target.value))}
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Visibility">
            <div className="space-y-3">
              <Field label="Status" htmlFor="d-status">
                <Select
                  id="d-status"
                  value={values.status}
                  onChange={(e) => set("status", e.target.value as DestinationFormValues["status"])}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </Select>
              </Field>

              <ToggleField
                label="Featured"
                checked={values.isFeatured}
                onChange={(v) => set("isFeatured", v)}
              />
              <ToggleField
                label="Trending"
                description="Appears under the Trending tab on the homepage."
                checked={values.isTrending}
                onChange={(v) => set("isTrending", v)}
              />
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
