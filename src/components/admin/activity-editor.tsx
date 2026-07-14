"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, ArrowLeft, Eye } from "lucide-react";

import { saveActivity } from "@/server/admin/actions";
import { Panel } from "./ui";
import { ImageField, GalleryField, type MediaValue } from "./image-field";
import { RepeatableField, StringListField, ToggleField } from "./field-kits";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { ACTIVITY_CATEGORIES } from "@/config/site";
import { slugify } from "@/lib/utils";

export interface ActivitySlotFormValues {
  time: string;
  label: string;
  capacity: number;
  booked: number;
}

export interface ActivityAddOnFormValues {
  key: string;
  label: string;
  priceINR: number;
}

export interface ActivityFormValues {
  id?: string;
  title: string;
  slug: string;
  destination: string;
  city: string;
  category: string;
  summary: string;
  description: string;
  heroImage: MediaValue;
  gallery: MediaValue[];
  durationMinutes: number;
  pricePerAdultINR: number;
  pricePerChildINR: number;
  originalPriceINR?: number;
  taxPercent: number;
  minParticipants: number;
  maxParticipants: number;
  minAge?: number;
  slots: ActivitySlotFormValues[];
  addOns: ActivityAddOnFormValues[];
  pickupAvailable: boolean;
  pickupNote: string;
  inclusions: string[];
  exclusions: string[];
  safetyInfo: string[];
  cancellationPolicy: string;
  instantConfirmation: boolean;
  isFeatured: boolean;
  status: "draft" | "scheduled" | "published" | "archived";
}

export const emptyActivity: ActivityFormValues = {
  title: "",
  slug: "",
  destination: "",
  city: "",
  category: ACTIVITY_CATEGORIES[0].slug,
  summary: "",
  description: "",
  heroImage: { url: "", alt: "" },
  gallery: [],
  durationMinutes: 120,
  pricePerAdultINR: 0,
  pricePerChildINR: 0,
  originalPriceINR: undefined,
  taxPercent: 5,
  minParticipants: 1,
  maxParticipants: 20,
  minAge: undefined,
  slots: [],
  addOns: [],
  pickupAvailable: false,
  pickupNote: "",
  inclusions: [],
  exclusions: [],
  safetyInfo: [],
  cancellationPolicy: "Free cancellation up to 24 hours before the experience starts.",
  instantConfirmation: true,
  isFeatured: false,
  status: "draft",
};

export function ActivityEditor({
  initial,
  destinations,
}: {
  initial: ActivityFormValues;
  destinations: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [values, setValues] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);

  const set = <K extends keyof ActivityFormValues>(key: K, value: ActivityFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const save = async (status?: ActivityFormValues["status"]) => {
    setSaving(true);

    const result = await saveActivity({
      ...values,
      status: status ?? values.status,
      slug: values.slug || slugify(values.title),
    });

    if (result.ok) {
      toast.success("Saved", result.message);
      if (!values.id && result.id) router.push(`/admin/activities/${result.id}`);
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
          href="/admin/activities"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-lagoon-700 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          All activities
        </Link>

        <div className="flex gap-2">
          {values.id && values.slug ? (
            <Button asChild size="sm" variant="outline">
              <a href={`/activities/${values.slug}`} target="_blank" rel="noopener noreferrer">
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
          <Panel title="Experience">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" htmlFor="a-title" required>
                <Input
                  id="a-title"
                  value={values.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Sunset Catamaran Cruise"
                />
              </Field>

              <Field
                label="URL slug"
                htmlFor="a-slug"
                hint={`/activities/${values.slug || slugify(values.title) || "…"}`}
              >
                <Input id="a-slug" value={values.slug} onChange={(e) => set("slug", e.target.value)} />
              </Field>

              <Field label="Destination" htmlFor="a-dest" required>
                <Select
                  id="a-dest"
                  value={values.destination}
                  onChange={(e) => set("destination", e.target.value)}
                >
                  <option value="">Pick a destination</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="City" htmlFor="a-city" required>
                <Input id="a-city" value={values.city} onChange={(e) => set("city", e.target.value)} />
              </Field>

              <Field label="Category" htmlFor="a-category" required>
                <Select
                  id="a-category"
                  value={values.category}
                  onChange={(e) => set("category", e.target.value)}
                >
                  {ACTIVITY_CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Duration (minutes)" htmlFor="a-duration">
                <Input
                  id="a-duration"
                  type="number"
                  min={1}
                  value={values.durationMinutes}
                  onChange={(e) => set("durationMinutes", Number(e.target.value))}
                />
              </Field>

              <Field label="Summary" htmlFor="a-summary" className="sm:col-span-2">
                <Textarea
                  id="a-summary"
                  rows={2}
                  value={values.summary}
                  onChange={(e) => set("summary", e.target.value)}
                  placeholder="One or two honest lines. Shown on cards and in search results."
                />
              </Field>

              <Field label="Full description" htmlFor="a-desc" className="sm:col-span-2">
                <Textarea
                  id="a-desc"
                  rows={7}
                  value={values.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Media">
            <ImageField
              label="Hero image"
              required
              value={values.heroImage}
              onChange={(v) => set("heroImage", v)}
              folder="activities"
            />

            <div className="mt-5">
              <p className="mb-2 text-[0.8125rem] font-semibold text-midnight-800">Gallery</p>
              <GalleryField
                value={values.gallery}
                onChange={(v) => set("gallery", v)}
                folder="activities"
              />
            </div>
          </Panel>

          <Panel title="Slots">
            <RepeatableField<ActivitySlotFormValues>
              label="Slots"
              addLabel="Add slot"
              hint="Each slot is a bookable time of day, with its own capacity."
              items={values.slots}
              onChange={(v) => set("slots", v)}
              createEmpty={() => ({ time: "", label: "", capacity: 20, booked: 0 })}
              renderRow={(slot, i, update) => (
                <div className="grid gap-3 sm:grid-cols-4">
                  <Field label="Time" htmlFor={`sl-${i}-time`}>
                    <Input
                      id={`sl-${i}-time`}
                      value={slot.time}
                      onChange={(e) => update({ time: e.target.value })}
                      placeholder="09:00"
                    />
                  </Field>

                  <Field label="Label" htmlFor={`sl-${i}-label`}>
                    <Input
                      id={`sl-${i}-label`}
                      value={slot.label}
                      onChange={(e) => update({ label: e.target.value })}
                      placeholder="Morning batch"
                    />
                  </Field>

                  <Field label="Capacity" htmlFor={`sl-${i}-cap`}>
                    <Input
                      id={`sl-${i}-cap`}
                      type="number"
                      min={0}
                      value={slot.capacity}
                      onChange={(e) => update({ capacity: Number(e.target.value) })}
                    />
                  </Field>

                  <Field
                    label="Booked"
                    htmlFor={`sl-${i}-booked`}
                    hint="Only changes when a real booking is made."
                  >
                    <Input id={`sl-${i}-booked`} type="number" value={slot.booked} disabled readOnly />
                  </Field>
                </div>
              )}
            />
          </Panel>

          <Panel title="Add-ons">
            <RepeatableField<ActivityAddOnFormValues>
              label="Add-ons"
              addLabel="Add add-on"
              items={values.addOns}
              onChange={(v) => set("addOns", v)}
              createEmpty={() => ({ key: "", label: "", priceINR: 0 })}
              renderRow={(addOn, i, update) => (
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Key" htmlFor={`ao-${i}-key`}>
                    <Input
                      id={`ao-${i}-key`}
                      value={addOn.key}
                      onChange={(e) => update({ key: slugify(e.target.value) })}
                    />
                  </Field>

                  <Field label="Label" htmlFor={`ao-${i}-label`}>
                    <Input
                      id={`ao-${i}-label`}
                      value={addOn.label}
                      onChange={(e) => update({ label: e.target.value })}
                      placeholder="GoPro rental"
                    />
                  </Field>

                  <Field label="Price (INR)" htmlFor={`ao-${i}-price`}>
                    <Input
                      id={`ao-${i}-price`}
                      type="number"
                      min={0}
                      value={addOn.priceINR}
                      onChange={(e) => update({ priceINR: Number(e.target.value) })}
                    />
                  </Field>
                </div>
              )}
            />
          </Panel>

          <Panel title="What's included">
            <div className="space-y-5">
              <StringListField
                label="Inclusions"
                value={values.inclusions}
                onChange={(v) => set("inclusions", v)}
              />
              <StringListField
                label="Exclusions"
                value={values.exclusions}
                onChange={(v) => set("exclusions", v)}
              />
              <StringListField
                label="Safety information"
                value={values.safetyInfo}
                onChange={(v) => set("safetyInfo", v)}
              />
            </div>
          </Panel>

          <Panel title="Pickup & cancellation">
            <div className="space-y-4">
              <ToggleField
                label="Pickup available"
                checked={values.pickupAvailable}
                onChange={(v) => set("pickupAvailable", v)}
              />

              {values.pickupAvailable ? (
                <Field label="Pickup note" htmlFor="a-pickup">
                  <Input
                    id="a-pickup"
                    value={values.pickupNote}
                    onChange={(e) => set("pickupNote", e.target.value)}
                    placeholder="Pickup from hotels within 5km, 30 minutes before start."
                  />
                </Field>
              ) : null}

              <Field label="Cancellation policy" htmlFor="a-cancel">
                <Textarea
                  id="a-cancel"
                  rows={2}
                  value={values.cancellationPolicy}
                  onChange={(e) => set("cancellationPolicy", e.target.value)}
                />
              </Field>
            </div>
          </Panel>
        </div>

        {/* --------------------------------- Sidebar -------------------------------- */}
        <aside className="space-y-5">
          <Panel title="Pricing">
            <div className="space-y-4">
              <Field label="Price / adult (INR)" htmlFor="a-priceadult">
                <Input
                  id="a-priceadult"
                  type="number"
                  min={0}
                  value={values.pricePerAdultINR}
                  onChange={(e) => set("pricePerAdultINR", Number(e.target.value))}
                />
              </Field>

              <Field label="Price / child (INR)" htmlFor="a-pricechild">
                <Input
                  id="a-pricechild"
                  type="number"
                  min={0}
                  value={values.pricePerChildINR}
                  onChange={(e) => set("pricePerChildINR", Number(e.target.value))}
                />
              </Field>

              <Field
                label="Was (strike-through)"
                htmlFor="a-priceorig"
                hint="Leave blank if there's no genuine discount."
              >
                <Input
                  id="a-priceorig"
                  type="number"
                  min={0}
                  value={values.originalPriceINR ?? ""}
                  onChange={(e) =>
                    set("originalPriceINR", e.target.value ? Number(e.target.value) : undefined)
                  }
                />
              </Field>

              <Field label="Tax %" htmlFor="a-tax">
                <Input
                  id="a-tax"
                  type="number"
                  min={0}
                  max={30}
                  value={values.taxPercent}
                  onChange={(e) => set("taxPercent", Number(e.target.value))}
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Group size">
            <div className="space-y-4">
              <Field label="Min participants" htmlFor="a-minp">
                <Input
                  id="a-minp"
                  type="number"
                  min={1}
                  value={values.minParticipants}
                  onChange={(e) => set("minParticipants", Number(e.target.value))}
                />
              </Field>
              <Field label="Max participants" htmlFor="a-maxp">
                <Input
                  id="a-maxp"
                  type="number"
                  min={1}
                  value={values.maxParticipants}
                  onChange={(e) => set("maxParticipants", Number(e.target.value))}
                />
              </Field>
              <Field label="Minimum age" htmlFor="a-minage" hint="Leave blank if there's no restriction.">
                <Input
                  id="a-minage"
                  type="number"
                  min={0}
                  value={values.minAge ?? ""}
                  onChange={(e) => set("minAge", e.target.value ? Number(e.target.value) : undefined)}
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Visibility">
            <div className="space-y-3">
              <Field label="Status" htmlFor="a-status">
                <Select
                  id="a-status"
                  value={values.status}
                  onChange={(e) => set("status", e.target.value as ActivityFormValues["status"])}
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
                label="Instant confirmation"
                description="Only enable if you can actually confirm immediately."
                checked={values.instantConfirmation}
                onChange={(v) => set("instantConfirmation", v)}
              />
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
