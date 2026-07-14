"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, TicketPercent } from "lucide-react";

import { saveCoupon, deleteCoupon } from "@/server/admin/actions";
import { Table, TableEmpty, Td, Th, StatusPill } from "./ui";
import { ChipSelectField, ToggleField } from "./field-kits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/overlays";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { BOOKING_TYPES } from "@/models/types";
import { formatDate, formatPrice, titleCase, toDateInput } from "@/lib/utils";

export interface CouponRow {
  id: string;
  code: string;
  description: string;
  discountType: "percent" | "flat";
  value: number;
  maxDiscountINR?: number;
  minBookingINR: number;
  appliesTo: string[];
  validFrom: string;
  validTo: string;
  usageLimit: number;
  usageCount: number;
  perUserLimit: number;
  isActive: boolean;
}

const empty: CouponRow = {
  id: "",
  code: "",
  description: "",
  discountType: "percent",
  value: 10,
  minBookingINR: 0,
  appliesTo: [],
  validFrom: toDateInput(new Date()),
  validTo: toDateInput(new Date(Date.now() + 90 * 86_400_000)),
  usageLimit: 0,
  usageCount: 0,
  perUserLimit: 1,
  isActive: true,
};

export function CouponManager({ coupons }: { coupons: CouponRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<CouponRow | null>(null);
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    if (!editing) return;
    setSaving(true);

    const result = await saveCoupon({
      ...editing,
      id: editing.id || undefined,
      maxDiscountINR: editing.maxDiscountINR || undefined,
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

  const remove = async (id: string, code: string) => {
    const result = await deleteCoupon(id);

    if (result.ok) {
      toast.success(`${code} removed`, result.message);
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
          New coupon
        </Button>
      </div>

      <Table caption="Coupons">
        <thead>
          <tr className="border-b border-hairline bg-sand-50">
            <Th>Code</Th>
            <Th>Discount</Th>
            <Th>Applies to</Th>
            <Th>Valid</Th>
            <Th className="text-right">Used</Th>
            <Th>Status</Th>
            <Th />
          </tr>
        </thead>

        <tbody className="divide-y divide-hairline">
          {coupons.length === 0 ? (
            <TableEmpty colSpan={7} message="No coupons yet." />
          ) : (
            coupons.map((c) => {
              const expired = new Date(c.validTo) < now;
              const notStarted = new Date(c.validFrom) > now;
              const exhausted = c.usageLimit > 0 && c.usageCount >= c.usageLimit;

              const state = !c.isActive
                ? "inactive"
                : expired
                  ? "expired"
                  : notStarted
                    ? "scheduled"
                    : exhausted
                      ? "exhausted"
                      : "live";

              return (
                <tr key={c.id} className="transition-colors hover:bg-sand-50">
                  <Td>
                    <span className="flex items-center gap-2 font-mono text-sm font-bold text-midnight-900">
                      <TicketPercent className="size-4 text-lagoon-600" aria-hidden />
                      {c.code}
                    </span>
                    {c.description ? (
                      <span className="mt-0.5 block max-w-56 truncate text-xs text-muted">
                        {c.description}
                      </span>
                    ) : null}
                  </Td>

                  <Td className="text-sm font-semibold">
                    {c.discountType === "percent" ? `${c.value}%` : formatPrice(c.value)}
                    {c.maxDiscountINR ? (
                      <span className="block text-[0.6875rem] font-normal text-muted">
                        max {formatPrice(c.maxDiscountINR)}
                      </span>
                    ) : null}
                    {c.minBookingINR > 0 ? (
                      <span className="block text-[0.6875rem] font-normal text-muted">
                        min spend {formatPrice(c.minBookingINR)}
                      </span>
                    ) : null}
                  </Td>

                  <Td className="text-xs capitalize">
                    {c.appliesTo.length ? c.appliesTo.join(", ") : "Everything"}
                  </Td>

                  <Td className="whitespace-nowrap text-xs">
                    {formatDate(c.validFrom)}
                    <span className="block text-muted">to {formatDate(c.validTo)}</span>
                  </Td>

                  <Td className="text-right text-sm">
                    {c.usageCount}
                    {c.usageLimit > 0 ? (
                      <span className="text-muted"> / {c.usageLimit}</span>
                    ) : null}
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
                        onClick={() => setEditing(c)}
                        aria-label={`Edit ${c.code}`}
                        className="flex size-8 items-center justify-center rounded-lg text-midnight-400 hover:bg-sand-100 hover:text-midnight-900"
                      >
                        <Pencil className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(c.id, c.code)}
                        aria-label={`Delete ${c.code}`}
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

      {/* --------------------------------- Editor -------------------------------- */}
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        {editing ? (
          <DialogContent
            title={editing.id ? `Edit ${editing.code}` : "New coupon"}
            size="lg"
            description="Discounts are re-validated on the server at checkout."
          >
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Code" htmlFor="cp-code" required>
                  <Input
                    id="cp-code"
                    value={editing.code}
                    onChange={(e) =>
                      setEditing({ ...editing, code: e.target.value.toUpperCase().replace(/\s/g, "") })
                    }
                    placeholder="SUMMER25"
                    className="font-mono uppercase"
                  />
                </Field>

                <Field label="Discount type" htmlFor="cp-type">
                  <Select
                    id="cp-type"
                    value={editing.discountType}
                    onChange={(e) =>
                      setEditing({ ...editing, discountType: e.target.value as "percent" | "flat" })
                    }
                  >
                    <option value="percent">Percentage off</option>
                    <option value="flat">Flat amount off</option>
                  </Select>
                </Field>

                <Field
                  label={editing.discountType === "percent" ? "Percent off" : "Amount off (INR)"}
                  htmlFor="cp-value"
                  required
                >
                  <Input
                    id="cp-value"
                    type="number"
                    min={0}
                    max={editing.discountType === "percent" ? 100 : undefined}
                    value={editing.value}
                    onChange={(e) => setEditing({ ...editing, value: Number(e.target.value) })}
                  />
                </Field>

                {editing.discountType === "percent" ? (
                  <Field label="Maximum discount (INR)" htmlFor="cp-max" hint="Optional cap.">
                    <Input
                      id="cp-max"
                      type="number"
                      min={0}
                      value={editing.maxDiscountINR ?? ""}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          maxDiscountINR: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    />
                  </Field>
                ) : null}

                <Field label="Minimum booking value (INR)" htmlFor="cp-min">
                  <Input
                    id="cp-min"
                    type="number"
                    min={0}
                    value={editing.minBookingINR}
                    onChange={(e) => setEditing({ ...editing, minBookingINR: Number(e.target.value) })}
                  />
                </Field>

                <Field label="Valid from" htmlFor="cp-from" required>
                  <Input
                    id="cp-from"
                    type="date"
                    value={editing.validFrom}
                    onChange={(e) => setEditing({ ...editing, validFrom: e.target.value })}
                  />
                </Field>

                <Field label="Valid to" htmlFor="cp-to" required>
                  <Input
                    id="cp-to"
                    type="date"
                    value={editing.validTo}
                    onChange={(e) => setEditing({ ...editing, validTo: e.target.value })}
                  />
                </Field>

                <Field label="Total usage limit" htmlFor="cp-limit" hint="0 = unlimited.">
                  <Input
                    id="cp-limit"
                    type="number"
                    min={0}
                    value={editing.usageLimit}
                    onChange={(e) => setEditing({ ...editing, usageLimit: Number(e.target.value) })}
                  />
                </Field>

                <Field label="Per-customer limit" htmlFor="cp-per">
                  <Input
                    id="cp-per"
                    type="number"
                    min={1}
                    value={editing.perUserLimit}
                    onChange={(e) => setEditing({ ...editing, perUserLimit: Number(e.target.value) })}
                  />
                </Field>
              </div>

              <Field label="Internal description" htmlFor="cp-desc">
                <Textarea
                  id="cp-desc"
                  rows={2}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="What campaign is this for?"
                />
              </Field>

              <ChipSelectField
                label="Applies to (leave empty for everything)"
                options={BOOKING_TYPES.map((t) => ({ value: t, label: titleCase(t) }))}
                value={editing.appliesTo}
                onChange={(v) => setEditing({ ...editing, appliesTo: v })}
              />

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
                  disabled={!editing.code || editing.value <= 0}
                >
                  {editing.id ? "Save coupon" : "Create coupon"}
                </Button>
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
