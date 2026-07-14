"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Save, Send, Phone, Mail, MessageCircle, StickyNote, Users } from "lucide-react";

import { addLeadNote, updateLead } from "@/server/admin/actions";
import { Panel } from "./ui";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { LEAD_STATUSES } from "@/models/types";
import { formatDateTime, titleCase, cn } from "@/lib/utils";

interface NoteRow {
  id: string;
  body: string;
  kind: string;
  authorName: string;
  createdAt: string;
}

const NOTE_KINDS = [
  { value: "note", label: "Note", Icon: StickyNote },
  { value: "call", label: "Call", Icon: Phone },
  { value: "email", label: "Email", Icon: Mail },
  { value: "whatsapp", label: "WhatsApp", Icon: MessageCircle },
  { value: "meeting", label: "Meeting", Icon: Users },
] as const;

export function LeadWorkspace({
  leadId,
  notes,
  lead,
  staff,
  canManage,
}: {
  leadId: string;
  notes: NoteRow[];
  lead: {
    status: string;
    assignedTo: string;
    followUpDate: string;
    estimatedValueINR: number;
    lostReason: string;
  };
  staff: { id: string; name: string }[];
  canManage: boolean;
}) {
  const router = useRouter();

  const [form, setForm] = React.useState(lead);
  const [saving, setSaving] = React.useState(false);

  const [note, setNote] = React.useState("");
  const [noteKind, setNoteKind] = React.useState<(typeof NOTE_KINDS)[number]["value"]>("note");
  const [addingNote, setAddingNote] = React.useState(false);

  const save = async () => {
    setSaving(true);

    const result = await updateLead({
      id: leadId,
      status: form.status,
      assignedTo: form.assignedTo || undefined,
      followUpDate: form.followUpDate || undefined,
      estimatedValueINR: form.estimatedValueINR,
      lostReason: form.lostReason || undefined,
    });

    if (result.ok) {
      toast.success("Lead updated", result.message);
      router.refresh();
    } else {
      toast.error("Could not update lead", result.message);
    }

    setSaving(false);
  };

  const submitNote = async () => {
    if (!note.trim()) return;
    setAddingNote(true);

    const result = await addLeadNote(leadId, note, noteKind);

    if (result.ok) {
      setNote("");
      toast.success("Note added");
      router.refresh();
    } else {
      toast.error("Could not add note", result.message);
    }

    setAddingNote(false);
  };

  return (
    <>
      {canManage ? (
        <Panel title="Update lead">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status" htmlFor="lw-status">
              <Select
                id="lw-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {titleCase(s.replace(/_/g, " "))}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Assigned to" htmlFor="lw-assigned">
              <Select
                id="lw-assigned"
                value={form.assignedTo}
                onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              >
                <option value="">Unassigned</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Follow-up date" htmlFor="lw-followup">
              <Input
                id="lw-followup"
                type="date"
                value={form.followUpDate}
                onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
              />
            </Field>

            <Field label="Estimated value (INR)" htmlFor="lw-value">
              <Input
                id="lw-value"
                type="number"
                min={0}
                value={form.estimatedValueINR}
                onChange={(e) => setForm({ ...form, estimatedValueINR: Number(e.target.value) })}
              />
            </Field>

            {form.status === "lost" ? (
              <Field label="Why was it lost?" htmlFor="lw-lost" className="sm:col-span-2">
                <Input
                  id="lw-lost"
                  value={form.lostReason}
                  onChange={(e) => setForm({ ...form, lostReason: e.target.value })}
                  placeholder="Went with a competitor, budget, dates changed…"
                />
              </Field>
            ) : null}
          </div>

          <Button
            variant="accent"
            className="mt-5"
            onClick={save}
            loading={saving}
            loadingText="Saving"
          >
            <Save aria-hidden />
            Save changes
          </Button>
        </Panel>
      ) : null}

      <Panel title={`Activity (${notes.length})`}>
        {canManage ? (
          <div className="mb-6 rounded-2xl bg-sand-50 p-4">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {NOTE_KINDS.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setNoteKind(value)}
                  aria-pressed={noteKind === value}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                    noteKind === value
                      ? "bg-midnight-900 text-white"
                      : "bg-white text-midnight-600 hover:bg-sand-100",
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {label}
                </button>
              ))}
            </div>

            <label htmlFor="lw-note" className="sr-only">
              Add a note
            </label>
            <Textarea
              id="lw-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What was discussed? What's the next step?"
            />

            <Button
              size="sm"
              variant="primary"
              className="mt-3"
              onClick={submitNote}
              loading={addingNote}
              loadingText="Adding"
              disabled={!note.trim()}
            >
              <Send aria-hidden />
              Add {noteKind}
            </Button>
          </div>
        ) : null}

        {notes.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">No activity logged yet.</p>
        ) : (
          <ol className="space-y-3">
            {notes.map((n) => {
              const meta = NOTE_KINDS.find((k) => k.value === n.kind);
              const Icon = meta?.Icon ?? StickyNote;

              return (
                <li key={n.id} className="flex gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-sand-100 text-midnight-600">
                    <Icon className="size-3.5" aria-hidden />
                  </span>

                  <div className="min-w-0 flex-1 rounded-xl border border-hairline p-3">
                    <p className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-midnight-900">{n.authorName}</span>
                      <span className="text-[0.6875rem] text-muted">
                        {formatDateTime(n.createdAt)}
                      </span>
                    </p>
                    <p className="mt-1 whitespace-pre-line text-[0.875rem] leading-relaxed text-muted">
                      {n.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Panel>
    </>
  );
}
