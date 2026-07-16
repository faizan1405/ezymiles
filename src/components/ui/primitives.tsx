"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* ---------------------------------- Card ---------------------------------- */

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-hairline bg-surface shadow-tile",
        className,
      )}
      {...props}
    />
  );
}

/* ---------------------------------- Badge --------------------------------- */

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-semibold leading-none [&_svg]:size-3",
  {
    variants: {
      tone: {
        neutral: "bg-sand-100 text-midnight-700",
        ink: "bg-midnight-900 text-white",
        lagoon: "bg-lagoon-50 text-lagoon-800",
        gold: "bg-gild-100 text-gild-800",
        sunset: "bg-sunset-50 text-sunset-800",
        success: "bg-emerald-50 text-emerald-800",
        warning: "bg-amber-50 text-amber-800",
        danger: "bg-red-50 text-red-700",
        info: "bg-sky-50 text-sky-800",
        glass: "glass-dark text-white",
      },
      size: {
        sm: "px-2 py-1 text-[0.625rem] tracking-wide uppercase",
        md: "px-2.5 py-1.5 text-[0.6875rem]",
        lg: "px-3 py-2 text-xs",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, size }), className)} {...props} />;
}

/* --------------------------------- Rating --------------------------------- */

export function Rating({
  value,
  count,
  size = "sm",
  className,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const rounded = Math.round(value * 10) / 10;
  const starSize = size === "md" ? "size-4" : "size-3.5";

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span
        className="flex items-center gap-0.5"
        role="img"
        aria-label={`Rated ${rounded} out of 5`}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            className={cn(
              starSize,
              i < Math.round(value)
                ? "fill-gild-400 text-gild-400"
                : "fill-sand-200 text-sand-200",
            )}
            aria-hidden
          />
        ))}
      </span>
      <span className={cn("font-semibold text-midnight-800", size === "md" ? "text-sm" : "text-xs")}>
        {rounded.toFixed(1)}
      </span>
      {typeof count === "number" ? (
        <span className={cn("text-muted", size === "md" ? "text-sm" : "text-xs")}>
          ({count})
        </span>
      ) : null}
    </div>
  );
}

/* -------------------------------- Skeleton -------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-xl", className)} aria-hidden />;
}

/* ------------------------------- Empty state ------------------------------ */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-hairline bg-sand-50 px-6 py-16 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-white text-lagoon-600 shadow-tile [&_svg]:size-6">
          {icon}
        </div>
      ) : null}
      <h3 className="text-xl text-midnight-900">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

/* -------------------------------- Section --------------------------------- */

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  action,
  className,
  tone = "light",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
  action?: React.ReactNode;
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 md:flex-row md:items-end md:justify-between",
        align === "center" && "md:flex-col md:items-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "text-center")}>
        {eyebrow ? (
          <p
            className={cn(
              "text-eyebrow mb-3",
              tone === "dark" ? "text-lagoon-300" : "text-lagoon-700",
            )}
          >
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={cn(
            "text-[1.75rem] leading-[1.15] sm:text-4xl lg:text-[2.75rem]",
            tone === "dark" ? "text-white" : "text-midnight-900",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "mt-4 text-[0.9375rem] leading-relaxed sm:text-base",
              tone === "dark" ? "text-midnight-100" : "text-muted",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
