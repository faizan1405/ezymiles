"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, ArrowLeft, Eye } from "lucide-react";

import { saveHotel } from "@/server/admin/actions";
import { Panel } from "./ui";
import { ImageField, GalleryField, type MediaValue } from "./image-field";
import { RepeatableField, StringListField, ToggleField } from "./field-kits";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { HOTEL_CATEGORIES } from "@/config/site";
import { slugify } from "@/lib/utils";

export interface HotelRoomFormValues {
  key: string;
  name: string;
  description: string;
  images: MediaValue[];
  maxAdults: number;
  maxChildren: number;
  maxOccupancy: number;
  bedType: string;
  sizeSqft?: number;
  amenities: string[];
  mealPlan: "room_only" | "breakfast" | "half_board" | "full_board" | "all_inclusive";
  pricePerNightINR: number;
  originalPricePerNightINR?: number;
  taxPercent: number;
  refundable: boolean;
  cancellationRule: string;
  roomsAvailable: number;
}

export interface HotelFormValues {
  id?: string;
  name: string;
  slug: string;
  destination: string;
  city: string;
  country: string;
  address: string;
  starCategory: 3 | 4 | 5;
  propertyType: "hotel" | "resort" | "villa" | "boutique" | "homestay";
  summary: string;
  description: string;
  heroImage: MediaValue;
  gallery: MediaValue[];
  amenities: string[];
  rooms: HotelRoomFormValues[];
  lat: number;
  lng: number;
  checkInTime: string;
  checkOutTime: string;
  policies: string[];
  startingPriceINR: number;
  isFeatured: boolean;
  status: "draft" | "scheduled" | "published" | "archived";
  seoTitle: string;
  seoDescription: string;
  noIndex: boolean;
}

export const emptyHotel: HotelFormValues = {
  name: "",
  slug: "",
  destination: "",
  city: "",
  country: "",
  address: "",
  starCategory: 4,
  propertyType: "hotel",
  summary: "",
  description: "",
  heroImage: { url: "", alt: "" },
  gallery: [],
  amenities: [],
  rooms: [],
  lat: 0,
  lng: 0,
  checkInTime: "14:00",
  checkOutTime: "11:00",
  policies: [],
  startingPriceINR: 0,
  isFeatured: false,
  status: "draft",
  seoTitle: "",
  seoDescription: "",
  noIndex: false,
};

const PROPERTY_TYPES = [
  { value: "hotel", label: "Hotel" },
  { value: "resort", label: "Resort" },
  { value: "villa", label: "Villa" },
  { value: "boutique", label: "Boutique" },
  { value: "homestay", label: "Homestay" },
] as const;

const MEAL_PLANS = [
  { value: "room_only", label: "Room only" },
  { value: "breakfast", label: "Breakfast included" },
  { value: "half_board", label: "Half board" },
  { value: "full_board", label: "Full board" },
  { value: "all_inclusive", label: "All inclusive" },
] as const;

export function HotelEditor({
  initial,
  destinations,
}: {
  initial: HotelFormValues;
  destinations: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [values, setValues] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);

  const set = <K extends keyof HotelFormValues>(key: K, value: HotelFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const save = async (status?: HotelFormValues["status"]) => {
    setSaving(true);

    const result = await saveHotel({
      ...values,
      status: status ?? values.status,
      slug: values.slug || slugify(values.name),
      coordinates: { lat: values.lat, lng: values.lng },
      // A room left without its own key inherits one from its name, the same
      // way the hotel's own slug falls back to the property name.
      rooms: values.rooms.map((r) => ({ ...r, key: r.key.trim() ? slugify(r.key) : slugify(r.name) })),
      seo: {
        title: values.seoTitle || undefined,
        description: values.seoDescription || undefined,
        noIndex: values.noIndex,
      },
    });

    if (result.ok) {
      toast.success("Saved", result.message);
      if (!values.id && result.id) router.push(`/admin/hotels/${result.id}`);
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
          href="/admin/hotels"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-lagoon-700 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          All hotels
        </Link>

        <div className="flex gap-2">
          {values.id && values.slug ? (
            <Button asChild size="sm" variant="outline">
              <a href={`/hotels/${values.slug}`} target="_blank" rel="noopener noreferrer">
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
          <Panel title="Property">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor="h-name" required>
                <Input
                  id="h-name"
                  value={values.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="The Ocean Retreat"
                />
              </Field>

              <Field
                label="URL slug"
                htmlFor="h-slug"
                hint={`/hotels/${values.slug || slugify(values.name) || "…"}`}
              >
                <Input id="h-slug" value={values.slug} onChange={(e) => set("slug", e.target.value)} />
              </Field>

              <Field label="Destination" htmlFor="h-dest" required>
                <Select
                  id="h-dest"
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

              <Field label="City" htmlFor="h-city" required>
                <Input id="h-city" value={values.city} onChange={(e) => set("city", e.target.value)} />
              </Field>

              <Field label="Country" htmlFor="h-country" required>
                <Input
                  id="h-country"
                  value={values.country}
                  onChange={(e) => set("country", e.target.value)}
                />
              </Field>

              <Field label="Address" htmlFor="h-address" className="sm:col-span-2">
                <Input
                  id="h-address"
                  value={values.address}
                  onChange={(e) => set("address", e.target.value)}
                />
              </Field>

              <Field label="Star category" htmlFor="h-star">
                <Select
                  id="h-star"
                  value={values.starCategory}
                  onChange={(e) => set("starCategory", Number(e.target.value) as 3 | 4 | 5)}
                >
                  {HOTEL_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Property type" htmlFor="h-type">
                <Select
                  id="h-type"
                  value={values.propertyType}
                  onChange={(e) => set("propertyType", e.target.value as HotelFormValues["propertyType"])}
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Summary" htmlFor="h-summary" className="sm:col-span-2">
                <Textarea
                  id="h-summary"
                  rows={2}
                  value={values.summary}
                  onChange={(e) => set("summary", e.target.value)}
                  placeholder="One or two honest lines. Shown on cards and in search results."
                />
              </Field>

              <Field label="Full description" htmlFor="h-desc" className="sm:col-span-2">
                <Textarea
                  id="h-desc"
                  rows={7}
                  value={values.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </Field>
            </div>

            <div className="mt-5">
              <StringListField
                label="Amenities"
                value={values.amenities}
                onChange={(v) => set("amenities", v)}
                placeholder="Add an amenity and press Enter"
              />
            </div>
          </Panel>

          <Panel title="Media">
            <ImageField
              label="Hero image"
              required
              value={values.heroImage}
              onChange={(v) => set("heroImage", v)}
              folder="hotels"
            />

            <div className="mt-5">
              <p className="mb-2 text-[0.8125rem] font-semibold text-midnight-800">Gallery</p>
              <GalleryField value={values.gallery} onChange={(v) => set("gallery", v)} folder="hotels" />
            </div>
          </Panel>

          <Panel title="Rooms">
            <RepeatableField<HotelRoomFormValues>
              label="Rooms"
              addLabel="Add room"
              items={values.rooms}
              onChange={(v) => set("rooms", v)}
              createEmpty={() => ({
                key: "",
                name: "",
                description: "",
                images: [],
                maxAdults: 2,
                maxChildren: 1,
                maxOccupancy: 3,
                bedType: "King",
                sizeSqft: undefined,
                amenities: [],
                mealPlan: "breakfast",
                pricePerNightINR: 0,
                originalPricePerNightINR: undefined,
                taxPercent: 12,
                refundable: true,
                cancellationRule: "Free cancellation up to 72 hours before check-in.",
                roomsAvailable: 5,
              })}
              renderRow={(room, i, update) => (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-4">
                    <Field label="Name" htmlFor={`rm-${i}-name`} className="sm:col-span-2">
                      <Input
                        id={`rm-${i}-name`}
                        value={room.name}
                        onChange={(e) => update({ name: e.target.value })}
                        placeholder="Deluxe Sea View"
                      />
                    </Field>

                    <Field
                      label="Key"
                      htmlFor={`rm-${i}-key`}
                      hint={room.key || slugify(room.name) || "auto-generated from name"}
                      className="sm:col-span-2"
                    >
                      <Input
                        id={`rm-${i}-key`}
                        value={room.key}
                        onChange={(e) => update({ key: e.target.value })}
                      />
                    </Field>

                    <Field label="Bed type" htmlFor={`rm-${i}-bed`}>
                      <Input
                        id={`rm-${i}-bed`}
                        value={room.bedType}
                        onChange={(e) => update({ bedType: e.target.value })}
                      />
                    </Field>

                    <Field label="Max adults" htmlFor={`rm-${i}-adults`}>
                      <Input
                        id={`rm-${i}-adults`}
                        type="number"
                        min={1}
                        value={room.maxAdults}
                        onChange={(e) => update({ maxAdults: Number(e.target.value) })}
                      />
                    </Field>

                    <Field label="Max children" htmlFor={`rm-${i}-children`}>
                      <Input
                        id={`rm-${i}-children`}
                        type="number"
                        min={0}
                        value={room.maxChildren}
                        onChange={(e) => update({ maxChildren: Number(e.target.value) })}
                      />
                    </Field>

                    <Field label="Max occupancy" htmlFor={`rm-${i}-occ`}>
                      <Input
                        id={`rm-${i}-occ`}
                        type="number"
                        min={1}
                        value={room.maxOccupancy}
                        onChange={(e) => update({ maxOccupancy: Number(e.target.value) })}
                      />
                    </Field>

                    <Field label="Size (sqft)" htmlFor={`rm-${i}-size`}>
                      <Input
                        id={`rm-${i}-size`}
                        type="number"
                        min={0}
                        value={room.sizeSqft ?? ""}
                        onChange={(e) =>
                          update({ sizeSqft: e.target.value ? Number(e.target.value) : undefined })
                        }
                      />
                    </Field>

                    <Field label="Meal plan" htmlFor={`rm-${i}-meal`}>
                      <Select
                        id={`rm-${i}-meal`}
                        value={room.mealPlan}
                        onChange={(e) =>
                          update({ mealPlan: e.target.value as HotelRoomFormValues["mealPlan"] })
                        }
                      >
                        {MEAL_PLANS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </Select>
                    </Field>

                    <Field label="Price / night" htmlFor={`rm-${i}-price`}>
                      <Input
                        id={`rm-${i}-price`}
                        type="number"
                        min={0}
                        value={room.pricePerNightINR}
                        onChange={(e) => update({ pricePerNightINR: Number(e.target.value) })}
                      />
                    </Field>

                    <Field
                      label="Was (strike-through)"
                      htmlFor={`rm-${i}-orig`}
                      hint="Leave blank if there's no genuine discount."
                    >
                      <Input
                        id={`rm-${i}-orig`}
                        type="number"
                        min={0}
                        value={room.originalPricePerNightINR ?? ""}
                        onChange={(e) =>
                          update({
                            originalPricePerNightINR: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                      />
                    </Field>

                    <Field label="Tax %" htmlFor={`rm-${i}-tax`}>
                      <Input
                        id={`rm-${i}-tax`}
                        type="number"
                        min={0}
                        max={30}
                        value={room.taxPercent}
                        onChange={(e) => update({ taxPercent: Number(e.target.value) })}
                      />
                    </Field>

                    <Field label="Rooms available" htmlFor={`rm-${i}-avail`}>
                      <Input
                        id={`rm-${i}-avail`}
                        type="number"
                        min={0}
                        value={room.roomsAvailable}
                        onChange={(e) => update({ roomsAvailable: Number(e.target.value) })}
                      />
                    </Field>

                    <Field label="Description" htmlFor={`rm-${i}-desc`} className="sm:col-span-4">
                      <Textarea
                        id={`rm-${i}-desc`}
                        rows={2}
                        value={room.description}
                        onChange={(e) => update({ description: e.target.value })}
                      />
                    </Field>

                    <Field label="Cancellation rule" htmlFor={`rm-${i}-cancel`} className="sm:col-span-4">
                      <Input
                        id={`rm-${i}-cancel`}
                        value={room.cancellationRule}
                        onChange={(e) => update({ cancellationRule: e.target.value })}
                      />
                    </Field>
                  </div>

                  <div className="sm:col-span-4">
                    <StringListField
                      label="Room amenities"
                      value={room.amenities}
                      onChange={(v) => update({ amenities: v })}
                    />
                  </div>

                  <div>
                    <p className="mb-2 text-[0.8125rem] font-semibold text-midnight-800">Room images</p>
                    <GalleryField
                      value={room.images}
                      onChange={(v) => update({ images: v })}
                      folder="hotel-rooms"
                    />
                  </div>

                  <ToggleField
                    label="Refundable"
                    checked={room.refundable}
                    onChange={(v) => update({ refundable: v })}
                  />
                </div>
              )}
            />
          </Panel>

          <Panel title="Policies">
            <StringListField
              label="Policies"
              value={values.policies}
              onChange={(v) => set("policies", v)}
              placeholder="Add a house rule and press Enter"
            />
          </Panel>
        </div>

        {/* --------------------------------- Sidebar -------------------------------- */}
        <aside className="space-y-5">
          <Panel title="Facts">
            <div className="space-y-4">
              <Field
                label="Starting price (INR)"
                htmlFor="h-price"
                hint="Shown on cards. Keep it aligned with your cheapest room."
              >
                <Input
                  id="h-price"
                  type="number"
                  min={0}
                  value={values.startingPriceINR}
                  onChange={(e) => set("startingPriceINR", Number(e.target.value))}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Check-in" htmlFor="h-checkin">
                  <Input
                    id="h-checkin"
                    value={values.checkInTime}
                    onChange={(e) => set("checkInTime", e.target.value)}
                  />
                </Field>
                <Field label="Check-out" htmlFor="h-checkout">
                  <Input
                    id="h-checkout"
                    value={values.checkOutTime}
                    onChange={(e) => set("checkOutTime", e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </Panel>

          <Panel title="Map position">
            <p className="mb-3 text-xs leading-relaxed text-muted">
              Used to place the marker on the destination map. Copy the coordinates from any map service.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Latitude" htmlFor="h-lat">
                <Input
                  id="h-lat"
                  type="number"
                  step="0.0001"
                  value={values.lat}
                  onChange={(e) => set("lat", Number(e.target.value))}
                />
              </Field>
              <Field label="Longitude" htmlFor="h-lng">
                <Input
                  id="h-lng"
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
              <Field label="Status" htmlFor="h-status">
                <Select
                  id="h-status"
                  value={values.status}
                  onChange={(e) => set("status", e.target.value as HotelFormValues["status"])}
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
            </div>
          </Panel>

          <Panel title="SEO">
            <div className="space-y-4">
              <Field label="Meta title" htmlFor="h-seotitle">
                <Input
                  id="h-seotitle"
                  value={values.seoTitle}
                  onChange={(e) => set("seoTitle", e.target.value)}
                  placeholder={values.name}
                />
              </Field>

              <Field label="Meta description" htmlFor="h-seodesc">
                <Textarea
                  id="h-seodesc"
                  rows={3}
                  value={values.seoDescription}
                  onChange={(e) => set("seoDescription", e.target.value)}
                />
              </Field>

              <ToggleField
                label="Hide from search engines"
                description="Adds noindex. Use for private or unlisted properties."
                checked={values.noIndex}
                onChange={(v) => set("noIndex", v)}
              />
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
