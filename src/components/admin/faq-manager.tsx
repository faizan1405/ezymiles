"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { saveFAQ, deleteFAQ } from "@/server/admin/actions";
import { Panel, StatusPill } from "./ui";
import { ToggleField } from "./field-kits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/overlays";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/primitives";
import { toast } from "@/components/ui/toast";
import { titleCase } from "@/lib/utils";

export interface FaqRow {
  id: string;
  question: string;
  answer: string;
  group: string;
  order: number;
  isActive: boolean;
}

const GROUPS = ["general", "booking", "payment", "visa", "flights", "hotels", "activities"];

const empty: FaqRow = {
  id: "",
  question: "",
  answer: "",
  group: "general",
  order: 0,
  isActive: true,
};

export function FaqManager({ faqs }: { faqs: FaqRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<FaqRow | null>(null);
  const [saving, setSaving] = React.useState(false);

  const grouped = faqs.reduce<Record<string, FaqRow[]>>((acc, f) => {
    (acc[f.group] ??= []).push(f);
    return acc;
  }, {});

  const save = async () => {
    if (!editing) return;
    setSaving(true);

    const result = await saveFAQ({ ...editing, id: editing.id || undefined });

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
    const result = await deleteFAQ(id);
    if (result.ok) {
      toast.success("Deleted");
      router.refresh();
    } else {
      toast.error("Could not delete", result.message);
    }
  };

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <Button variant="accent" onClick={() => setEditing(empty)}>
          <Plus aria-hidden />
          New FAQ
        </Button>
      </div>

      {faqs.length === 0 ? (
        <EmptyState
          title="No FAQs yet"
          description="Add the questions people actually ask you — they'll show on /faqs and in search results."
          action={
            <Button variant="accent" onClick={() => setEditing(empty)}>
              Add the first FAQ
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([group, items]) => (
            <Panel key={group} title={titleCase(group)}>
              <ul className="divide-y divide-hairline">
                {items.map((f) => (
                  <li key={f.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-semibold text-midnight-900">
                        {f.question}
                        {!f.isActive ? <StatusPill status="hidden" tone="neutral" /> : null}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                        {f.answer}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(f)}
                        aria-label={`Edit "${f.question}"`}
                        className="flex size-8 items-center justify-center rounded-lg text-midnight-400 hover:bg-sand-100 hover:text-midnight-900"
                      >
                        <Pencil className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(f.id)}
                        aria-label={`Delete "${f.question}"`}
                        className="flex size-8 items-center justify-center rounded-lg text-midnight-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        {editing ? (
          <DialogContent title={editing.id ? "Edit FAQ" : "New FAQ"} size="lg">
            <div className="space-y-4">
              <Field label="Question" htmlFor="fq-question" required>
                <Input
                  id="fq-question"
                  value={editing.question}
                  onChange={(e) => setEditing({ ...editing, question: e.target.value })}
                  placeholder="Do I need travel insurance?"
                />
              </Field>

              <Field label="Answer" htmlFor="fq-answer" required>
                <Textarea
                  id="fq-answer"
                  rows={5}
                  value={editing.answer}
                  onChange={(e) => setEditing({ ...editing, answer: e.target.value })}
                  placeholder="Answer it properly. A vague answer is worse than none."
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Group" htmlFor="fq-group">
                  <Select
                    id="fq-group"
                    value={editing.group}
                    onChange={(e) => setEditing({ ...editing, group: e.target.value })}
                  >
                    {GROUPS.map((g) => (
                      <option key={g} value={g}>
                        {titleCase(g)}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Order" htmlFor="fq-order">
                  <Input
                    id="fq-order"
                    type="number"
                    value={editing.order}
                    onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })}
                  />
                </Field>
              </div>

              <ToggleField
                label="Visible on the site"
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
                  disabled={!editing.question || !editing.answer}
                >
                  Save FAQ
                </Button>
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
