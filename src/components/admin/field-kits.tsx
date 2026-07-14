"use client";

import * as React from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ----------------------------- List of strings ----------------------------- */

export function StringListField({
  label,
  value,
  onChange,
  placeholder = "Add an item and press Enter",
  hint,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  hint?: string;
}) {
  const [draft, setDraft] = React.useState("");

  const add = () => {
    const item = draft.trim();
    if (!item || value.includes(item)) return;
    onChange([...value, item]);
    setDraft("");
  };

  return (
    <fieldset>
      <legend className="mb-1.5 text-[0.8125rem] font-semibold text-midnight-800">{label}</legend>
      {hint ? <p className="mb-2 text-xs text-muted">{hint}</p> : null}

      {value.length ? (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {value.map((item, i) => (
            <li
              key={`${item}-${i}`}
              className="flex items-center gap-1.5 rounded-full bg-sand-100 py-1.5 pl-3 pr-1.5 text-[0.8125rem] text-midnight-800"
            >
              {item}
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                aria-label={`Remove ${item}`}
                className="flex size-5 items-center justify-center rounded-full text-midnight-400 hover:bg-white hover:text-red-600"
              >
                <Trash2 className="size-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          aria-label={label}
        />
        <Button type="button" size="md" variant="subtle" onClick={add} className="shrink-0">
          <Plus aria-hidden />
          Add
        </Button>
      </div>
    </fieldset>
  );
}

/* --------------------------- Multi-select of chips ------------------------- */

export function ChipSelectField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-[0.8125rem] font-semibold text-midnight-800">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() =>
                onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])
              }
              className={cn(
                "rounded-full border px-3 py-1.5 text-[0.8125rem] font-medium transition-colors",
                on
                  ? "border-midnight-900 bg-midnight-900 text-white"
                  : "border-hairline text-midnight-700 hover:bg-sand-50",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/* --------------------------- Repeatable row editor -------------------------- */

export function RepeatableField<T>({
  label,
  items,
  onChange,
  createEmpty,
  renderRow,
  addLabel = "Add row",
  hint,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  createEmpty: () => T;
  renderRow: (item: T, index: number, update: (patch: Partial<T>) => void) => React.ReactNode;
  addLabel?: string;
  hint?: string;
}) {
  const update = (index: number, patch: Partial<T>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;

    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <fieldset>
      <div className="mb-2 flex items-center justify-between gap-3">
        <legend className="text-[0.8125rem] font-semibold text-midnight-800">{label}</legend>
        <Button type="button" size="sm" variant="subtle" onClick={() => onChange([...items, createEmpty()])}>
          <Plus aria-hidden />
          {addLabel}
        </Button>
      </div>
      {hint ? <p className="mb-3 text-xs text-muted">{hint}</p> : null}

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-hairline p-4 text-center text-xs text-muted">
          Nothing added yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li key={i} className="rounded-2xl border border-hairline bg-sand-50/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[0.625rem] font-bold uppercase tracking-wider text-muted">
                  <GripVertical className="size-3.5" aria-hidden />
                  {label.replace(/s$/, "")} {i + 1}
                </span>

                <span className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                    className="rounded-md px-1.5 py-0.5 text-xs text-midnight-500 hover:bg-white disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1}
                    aria-label="Move down"
                    className="rounded-md px-1.5 py-0.5 text-xs text-midnight-500 hover:bg-white disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                    aria-label={`Remove ${label} ${i + 1}`}
                    className="flex size-6 items-center justify-center rounded-md text-midnight-400 hover:bg-white hover:text-red-600"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </span>
              </div>

              {renderRow(item, i, (patch) => update(i, patch))}
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}

/* --------------------------------- Toggle ---------------------------------- */

export function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = React.useId();

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-hairline p-3.5">
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-[0.8125rem] font-semibold text-midnight-900">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-muted">{description}</span>
        ) : null}
      </label>

      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-lagoon-600" : "bg-sand-300",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-[1.375rem]" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}
