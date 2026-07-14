"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, RotateCcw } from "lucide-react";

import { saveEmailTemplate, resetEmailTemplate } from "@/server/admin/actions";
import { Panel, StatusPill } from "./ui";
import { ToggleField } from "./field-kits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/overlays";
import { Field, Input, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";

export interface EmailTemplateRow {
  key: string;
  label: string;
  variables: string[];
  name: string;
  subject: string;
  body: string;
  isActive: boolean;
  hasOverride: boolean;
}

export function EmailTemplateManager({ templates }: { templates: EmailTemplateRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<EmailTemplateRow | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [resetting, setResetting] = React.useState(false);

  const save = async () => {
    if (!editing) return;
    setSaving(true);

    const result = await saveEmailTemplate({
      key: editing.key,
      name: editing.name || editing.label,
      subject: editing.subject,
      body: editing.body,
      isActive: editing.isActive,
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

  const reset = async (key: string) => {
    setResetting(true);
    const result = await resetEmailTemplate(key);

    if (result.ok) {
      toast.success("Reverted", result.message);
      setEditing(null);
      router.refresh();
    } else {
      toast.error("Could not revert", result.message);
    }

    setResetting(false);
  };

  return (
    <Panel title="Transactional email templates">
      <p className="mb-4 text-xs leading-relaxed text-muted">
        Every automated email — booking confirmations, payment receipts, visa updates and so on — uses a
        built-in default. Override any of them here; leave a template alone and it keeps using the
        default. Use <code className="rounded bg-sand-100 px-1 py-0.5">{"{{variable}}"}</code> tokens from
        the list below the subject line.
      </p>

      <ul className="divide-y divide-hairline">
        {templates.map((t) => (
          <li key={t.key} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-semibold text-midnight-900">
                {t.label}
                {t.hasOverride ? (
                  <StatusPill status={t.isActive ? "custom" : "custom (disabled)"} tone={t.isActive ? "success" : "neutral"} />
                ) : (
                  <StatusPill status="default" tone="neutral" />
                )}
              </p>
              <p className="mt-1 truncate text-xs text-muted">
                {t.hasOverride ? t.subject : `Variables: ${t.variables.join(", ")}`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setEditing(t)}
              aria-label={`Edit ${t.label}`}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-midnight-400 hover:bg-sand-100 hover:text-midnight-900"
            >
              <Pencil className="size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        {editing ? (
          <DialogContent title={editing.label} size="lg">
            <div className="space-y-4">
              <p className="rounded-xl bg-sand-50 p-3 text-xs leading-relaxed text-muted">
                Available variables:{" "}
                {editing.variables.map((v) => (
                  <code key={v} className="mr-1 rounded bg-white px-1 py-0.5">{`{{${v}}}`}</code>
                ))}
              </p>

              <Field label="Subject" htmlFor="et-subject" required>
                <Input
                  id="et-subject"
                  value={editing.subject}
                  onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
                  placeholder="Leave the built-in subject and just change the wording that follows"
                />
              </Field>

              <Field label="Body" htmlFor="et-body" required hint="Plain text or simple HTML — rendered inside the branded email shell.">
                <Textarea
                  id="et-body"
                  rows={8}
                  value={editing.body}
                  onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                />
              </Field>

              <ToggleField
                label="Use this override"
                description="Turn off to keep the override saved but fall back to the default while you work on it."
                checked={editing.isActive}
                onChange={(v) => setEditing({ ...editing, isActive: v })}
              />

              <div className="flex gap-2 pt-2">
                {editing.hasOverride ? (
                  <Button
                    variant="outline"
                    onClick={() => reset(editing.key)}
                    loading={resetting}
                    loadingText="Reverting"
                  >
                    <RotateCcw aria-hidden />
                    Use default
                  </Button>
                ) : null}
                <Button variant="outline" block onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button
                  variant="accent"
                  block
                  onClick={save}
                  loading={saving}
                  loadingText="Saving"
                  disabled={!editing.subject.trim() || !editing.body.trim()}
                >
                  Save override
                </Button>
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </Panel>
  );
}
