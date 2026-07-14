"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { saveOffer, deleteOffer } from "@/server/admin/actions";
import { Table, TableEmpty, Td, Th, StatusPill } from "./ui";
import { ImageField, type MediaValue } from "./image-field";
import { ToggleField } from "./field-kits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/overlays";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { SmartImage } from "@/components/ui/smart-image";
import { toast } from "@/components/ui/toast";
import { formatDate, toDateInput } from "@/lib/utils";

export interface OfferRow {
  id: string;
  title: string;
  slug: string;
  kind: string;
  headline: string;
  description: string;
  image: MediaValue;
  couponCode: string;
  discountLabel: string;
  ctaLabel: string;
  ctaHref: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  order: number;
}

const KINDS = [
  { value: "early_bird", label: "Early bird" },
  { value: "honeymoon", label: "Honeymoon" },
  { value: "group", label: "Group booking" },
  { value: "flight_inclusive", label: "Flight inclusive" },
  { value: "festival", label: "Festival" },
  { value: "seasonal", label: "Seasonal" },
];

const empty: OfferRow = {
  id: "",
  title: "",
  slug: "",
  kind: "seasonal",
  headline: "",
  description: "",
  image: { url: "", alt: "" },
  couponCode: "",
  discountLabel: "",
  ctaLabel: "View offer",
  ctaHref: "/packages",
  startsAt: toDateInput(new Date()),
  endsAt: toDateInput(new Date(Date.now() + 60 * 86_400_000)),
  isActive: true,
  order: 0,
};

export function OfferManager({ offers }: { offers: OfferRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<OfferRow | null>(null);
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    if (!editing) return;
    setSaving(true);

    const result = await saveOffer({
      ...editing,
      id: editing.id || undefined,
      slug: editing.slug || undefined,
      couponCode: editing.couponCode || undefined,
    });

    if (result.ok) {
      toast.success("Saved", result.message);
      setEditing(null);
      router.refresh();
    } else {
      toast.error("Could not save", result.message);
    }

    setSaving(false);
  };

  const remove = async (id: string) => {
    const result = await deleteOffer(id);
    if (result.ok) {
      toast.success("Deleted", result.message);
      router.refresh();
    } else {
      toast.error("Could not delete", result.message);
    }
  };

  const now = new Date();

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <Button variant="accent" onClick={() => setEditing(empty)}>
          <Plus aria-hidden />
          New offer
        </Button>
      </div>

      <Table caption="Offers">
        <thead>
          <tr className="border-b border-hairline bg-sand-50">
            <Th>Offer</Th>
            <Th>Type</Th>
            <Th>Coupon</Th>
            <Th>Runs</Th>
            <Th>Status</Th>
            <Th />
          </tr>
        </thead>

        <tbody className="divide-y divide-hairline">
          {offers.length === 0 ? (
            <TableEmpty colSpan={6} message="No offers yet." />
          ) : (
            offers.map((o) => {
              const expired = new Date(o.endsAt) < now;
              const scheduled = new Date(o.startsAt) > now;
              const state = !o.isActive
                ? "inactive"
                : expired
                  ? "expired"
                  : scheduled
                    ? "scheduled"
                    : "live";

              return (
                <tr key={o.id} className="transition-colors hover:bg-sand-50">
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg">
                        <SmartImage
                          src={o.image.url}
                          alt={o.image.alt || o.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="block max-w-56 truncate text-sm font-semibold text-midnight-900">
                          {o.title}
                        </span>
                        <span className="block max-w-56 truncate text-xs text-muted">
                          {o.headline}
                        </span>
                      </div>
                    </div>
                  </Td>

                  <Td className="text-xs">
                    {KINDS.find((k) => k.value === o.kind)?.label ?? o.kind}
                    {o.discountLabel ? (
                      <span className="block font-semibold text-sunset-700">{o.discountLabel}</span>
                    ) : null}
                  </Td>

                  <Td className="font-mono text-xs">{o.couponCode || "—"}</Td>

                  <Td className="whitespace-nowrap text-xs">
                    {formatDate(o.startsAt)}
                    <span className="block text-muted">to {formatDate(o.endsAt)}</span>
                  </Td>

                  <Td>
                    <StatusPill
                      status={state}
                      tone={
                        state === "live"
                          ? "success"
                          : state === "scheduled"
                            ? "info"
                            : state === "inactive"
                              ? "neutral"
                              : "danger"
                      }
                    />
                  </Td>

                  <Td>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(o)}
                        aria-label={`Edit ${o.title}`}
                        className="flex size-8 items-center justify-center rounded-lg text-midnight-400 hover:bg-sand-100 hover:text-midnight-900"
                      >
                        <Pencil className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(o.id)}
                        aria-label={`Delete ${o.title}`}
                        className="flex size-8 items-center justify-center rounded-lg text-midnight-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                  </Td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        {editing ? (
          <DialogContent title={editing.id ? "Edit offer" : "New offer"} size="lg">
            <div className="space-y-4">
              <Field label="Title" htmlFor="of-title" required>
                <Input
                  id="of-title"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="Book by August, travel all winter"
                />
              </Field>

              <Field label="Headline" htmlFor="of-headline">
                <Input
                  id="of-headline"
                  value={editing.headline}
                  onChange={(e) => setEditing({ ...editing, headline: e.target.value })}
                  placeholder="One sentence explaining the deal honestly."
                />
              </Field>

              <ImageField
                label="Image"
                required
                value={editing.image}
                onChange={(v) => setEditing({ ...editing, image: v })}
                folder="offers"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Type" htmlFor="of-kind">
                  <Select
                    id="of-kind"
                    value={editing.kind}
                    onChange={(e) => setEditing({ ...editing, kind: e.target.value })}
                  >
                    {KINDS.map((k) => (
                      <option key={k.value} value={k.value}>
                        {k.label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Coupon code" htmlFor="of-coupon" hint="Must exist in Coupons to work.">
                  <Input
                    id="of-coupon"
                    value={editing.couponCode}
                    onChange={(e) =>
                      setEditing({ ...editing, couponCode: e.target.value.toUpperCase() })
                    }
                    className="font-mono uppercase"
                  />
                </Field>

                <Field label="Discount label" htmlFor="of-label" hint="Shown as a badge.">
                  <Input
                    id="of-label"
                    value={editing.discountLabel}
                    onChange={(e) => setEditing({ ...editing, discountLabel: e.target.value })}
                    placeholder="Up to 20% off"
                  />
                </Field>

                <Field label="Button label" htmlFor="of-cta">
                  <Input
                    id="of-cta"
                    value={editing.ctaLabel}
                    onChange={(e) => setEditing({ ...editing, ctaLabel: e.target.value })}
                  />
                </Field>

                <Field label="Button link" htmlFor="of-href">
                  <Input
                    id="of-href"
                    value={editing.ctaHref}
                    onChange={(e) => setEditing({ ...editing, ctaHref: e.target.value })}
                    placeholder="/packages?tripType=honeymoon"
                  />
                </Field>

                <Field label="Display order" htmlFor="of-order">
                  <Input
                    id="of-order"
                    type="number"
                    value={editing.order}
                    onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })}
                  />
                </Field>

                <Field label="Starts" htmlFor="of-start" required>
                  <Input
                    id="of-start"
                    type="date"
                    value={editing.startsAt}
                    onChange={(e) => setEditing({ ...editing, startsAt: e.target.value })}
                  />
                </Field>

                <Field label="Ends" htmlFor="of-end" required>
                  <Input
                    id="of-end"
                    type="date"
                    value={editing.endsAt}
                    onChange={(e) => setEditing({ ...editing, endsAt: e.target.value })}
                  />
                </Field>
              </div>

              <Field label="Description" htmlFor="of-desc">
                <Textarea
                  id="of-desc"
                  rows={3}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </Field>

              <ToggleField
                label="Active"
                checked={editing.isActive}
                onChange={(v) => setEditing({ ...editing, isActive: v })}
              />

              <div className="flex gap-2 pt-2">
                <Button variant="outline" block onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button
                  variant="accent"
                  block
                  onClick={save}
                  loading={saving}
                  loadingText="Saving"
                  disabled={!editing.title || !editing.image.url}
                >
                  {editing.id ? "Save offer" : "Create offer"}
                </Button>
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
