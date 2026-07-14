"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, ShieldAlert } from "lucide-react";

import { updateVisaApplication } from "@/server/admin/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/overlays";
import { Field, Select, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { VISA_APPLICATION_STATUSES } from "@/models/types";
import { titleCase } from "@/lib/utils";

export function VisaApplicationActions({
  id,
  reference,
  status,
}: {
  id: string;
  reference: string;
  status: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [next, setNext] = React.useState(status);
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    setSaving(true);

    const result = await updateVisaApplication(id, next, note || undefined);

    if (result.ok) {
      toast.success("Application updated", result.message);
      setOpen(false);
      setNote("");
      router.refresh();
    } else {
      toast.error("Could not update", result.message);
    }

    setSaving(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Update ${reference}`}
        className="flex size-8 items-center justify-center rounded-lg text-midnight-400 hover:bg-sand-100 hover:text-midnight-900"
      >
        <Pencil className="size-4" aria-hidden />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          title="Update application"
          description={`${reference} — the traveller is emailed on every change.`}
        >
          <div className="space-y-4">
            <Field label="Status" htmlFor="va-status" required>
              <Select id="va-status" value={next} onChange={(e) => setNext(e.target.value)}>
                {VISA_APPLICATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {titleCase(s.replace(/_/g, " "))}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Note to the traveller"
              htmlFor="va-note"
              hint="Included in the email. Be specific about what they need to do next."
            >
              <Textarea
                id="va-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="We need your bank statements for the last 6 months by Friday."
              />
            </Field>

            <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
              <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Setting &ldquo;approved&rdquo; or &ldquo;rejected&rdquo; records the embassy&apos;s
              decision. It does not make one — never mark an application approved before the authority
              has actually decided.
            </p>

            <div className="flex gap-2">
              <Button variant="outline" block onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="accent" block onClick={save} loading={saving} loadingText="Updating">
                Update & notify
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
