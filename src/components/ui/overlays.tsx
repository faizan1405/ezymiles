"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------------------------- Modal --------------------------------- */

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  title,
  description,
  size = "md",
}: {
  className?: string;
  children: React.ReactNode;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const widths = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  } as const;

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-100 bg-midnight-950/45 backdrop-blur-[3px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-101 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2",
          "max-h-[90dvh] overflow-y-auto rounded-3xl bg-surface p-6 shadow-panel sm:p-8",
          widths[size],
          className,
        )}
      >
        <div className="mb-5 pr-8">
          <DialogPrimitive.Title className="font-display text-2xl text-midnight-900">
            {title}
          </DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="mt-2 text-sm text-muted">
              {description}
            </DialogPrimitive.Description>
          ) : (
            <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
          )}
        </div>

        <DialogPrimitive.Close
          className="absolute right-5 top-5 flex size-9 items-center justify-center rounded-full text-midnight-600 transition-colors hover:bg-sand-100 hover:text-midnight-900"
          aria-label="Close dialog"
        >
          <X className="size-4" aria-hidden />
        </DialogPrimitive.Close>

        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/* ---------------------------------- Sheet --------------------------------- */

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export function SheetContent({
  className,
  children,
  title,
  side = "right",
  hideTitle = false,
}: {
  className?: string;
  children: React.ReactNode;
  title: string;
  side?: "right" | "left" | "bottom";
  hideTitle?: boolean;
}) {
  const sides = {
    right:
      "inset-y-0 right-0 h-full w-[min(26rem,90vw)] rounded-l-3xl data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
    left:
      "inset-y-0 left-0 h-full w-[min(26rem,90vw)] rounded-r-3xl data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
    bottom:
      "inset-x-0 bottom-0 max-h-[88dvh] w-full rounded-t-3xl data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
  } as const;

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-100 bg-midnight-950/45 backdrop-blur-[3px]" />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-101 flex flex-col overflow-hidden bg-surface shadow-panel",
          "duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out",
          sides[side],
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <DialogPrimitive.Title
            className={cn("font-display text-lg text-midnight-900", hideTitle && "sr-only")}
          >
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
          <DialogPrimitive.Close
            className="flex size-9 items-center justify-center rounded-full text-midnight-600 transition-colors hover:bg-sand-100 hover:text-midnight-900"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden />
          </DialogPrimitive.Close>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/* -------------------------------- Accordion -------------------------------- */

export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({
  value,
  trigger,
  children,
  className,
}: {
  value: string;
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AccordionPrimitive.Item
      value={value}
      className={cn("border-b border-hairline last:border-b-0", className)}
    >
      <AccordionPrimitive.Header>
        <AccordionPrimitive.Trigger className="group flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-lagoon-700">
          <span className="text-[0.9375rem] font-semibold text-midnight-900 group-hover:text-lagoon-700 sm:text-base">
            {trigger}
          </span>
          <ChevronDown
            className="size-5 shrink-0 text-midnight-500 transition-transform duration-300 group-data-[state=open]:rotate-180"
            aria-hidden
          />
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
        <div className="pb-5 pr-8 text-[0.9375rem] leading-relaxed text-muted">{children}</div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  );
}

/* ----------------------------------- Tabs ---------------------------------- */

export const Tabs = TabsPrimitive.Root;
export const TabsContent = TabsPrimitive.Content;

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn("no-scrollbar flex gap-1 overflow-x-auto", className)}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold text-midnight-600",
        "transition-colors duration-200 hover:text-midnight-900",
        "data-[state=active]:bg-midnight-900 data-[state=active]:text-white",
        className,
      )}
      {...props}
    />
  );
}

/* --------------------------------- Popover --------------------------------- */

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export function PopoverContent({
  className,
  align = "start",
  sideOffset = 8,
  children,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-100 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-hairline bg-surface p-4 shadow-float",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}
