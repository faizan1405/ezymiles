"use client";

import * as React from "react";
import { ChevronDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Field shell — label + control + hint/error, wired for screen readers.      */
/* -------------------------------------------------------------------------- */

interface FieldProps {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, hint, error, required, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <label
          htmlFor={htmlFor}
          className="text-[0.8125rem] font-semibold text-midnight-800"
        >
          {label}
          {required ? (
            <span className="ml-0.5 text-sunset-600" aria-hidden>
              *
            </span>
          ) : null}
        </label>
      ) : null}

      {children}

      {error ? (
        <p
          id={htmlFor ? `${htmlFor}-error` : undefined}
          role="alert"
          className="flex items-center gap-1.5 text-xs font-medium text-red-600"
        >
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={htmlFor ? `${htmlFor}-hint` : undefined} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/* ---------------------------------- Input --------------------------------- */

const controlBase = [
  "w-full rounded-xl border bg-white text-midnight-900",
  "px-3.5 text-[0.9375rem] placeholder:text-midnight-900/35",
  "transition-colors duration-200",
  "focus:border-lagoon-500 focus:outline-none focus:ring-4 focus:ring-lagoon-500/12",
  "disabled:cursor-not-allowed disabled:bg-sand-50 disabled:text-muted",
].join(" ");

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  leadingIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, leadingIcon, ...props },
  ref,
) {
  const control = (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        controlBase,
        "h-12",
        invalid ? "border-red-400 focus:border-red-500 focus:ring-red-500/12" : "border-hairline",
        leadingIcon && "pl-10",
        className,
      )}
      {...props}
    />
  );

  if (!leadingIcon) return control;

  return (
    <div className="relative">
      <span
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-midnight-900/40 [&_svg]:size-4"
        aria-hidden
      >
        {leadingIcon}
      </span>
      {control}
    </div>
  );
});

/* -------------------------------- Textarea -------------------------------- */

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ className, invalid, rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        controlBase,
        "resize-y py-3",
        invalid ? "border-red-400 focus:border-red-500 focus:ring-red-500/12" : "border-hairline",
        className,
      )}
      {...props}
    />
  );
});

/* --------------------------------- Select --------------------------------- */
/**
 * Native <select> on purpose: it gives us the OS picker on mobile (big touch
 * targets, no custom scroll traps) and full keyboard support for free.
 */
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(function Select({ className, invalid, children, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          controlBase,
          "h-12 cursor-pointer appearance-none pr-10",
          invalid ? "border-red-400" : "border-hairline",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-midnight-900/40"
        aria-hidden
      />
    </div>
  );
});

/* -------------------------------- Checkbox -------------------------------- */

export const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label?: React.ReactNode }
>(function Checkbox({ className, label, id, ...props }, ref) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  return (
    <div className="flex items-start gap-2.5">
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        className={cn(
          "mt-0.5 size-[1.15rem] shrink-0 cursor-pointer rounded-md border-hairline text-lagoon-600",
          "accent-lagoon-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lagoon-600",
          className,
        )}
        {...props}
      />
      {label ? (
        <label htmlFor={inputId} className="cursor-pointer text-[0.8125rem] leading-relaxed text-midnight-700">
          {label}
        </label>
      ) : null}
    </div>
  );
});

/* ------------------------------ Error summary ------------------------------ */
/**
 * WCAG 2.2: on submit failure, surface a single summary that moves focus and is
 * announced, rather than relying on inline messages alone.
 */
export function ErrorSummary({ errors }: { errors: string[] }) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (errors.length) ref.current?.focus();
  }, [errors]);

  if (!errors.length) return null;

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      aria-live="assertive"
      className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
    >
      <p className="mb-1.5 font-semibold">Please fix the following before continuing:</p>
      <ul className="list-disc space-y-0.5 pl-5">
        {errors.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </div>
  );
}
