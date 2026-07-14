"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full",
    "font-semibold tracking-tight transition-all duration-300",
    "disabled:pointer-events-none disabled:opacity-55",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lagoon-600",
    "active:scale-[0.985] motion-reduce:active:scale-100",
    "[&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-midnight-900 text-white shadow-tile hover:bg-midnight-800 hover:shadow-lift",
        accent:
          "bg-lagoon-600 text-white shadow-tile hover:bg-lagoon-700 hover:shadow-lift",
        sunset:
          "bg-sunset-600 text-white shadow-tile hover:bg-sunset-700 hover:shadow-lift",
        gold: "bg-gild-500 text-midnight-950 shadow-tile hover:bg-gild-400 hover:shadow-lift",
        outline:
          "border border-midnight-900/15 bg-white text-midnight-900 hover:border-midnight-900/35 hover:bg-sand-50",
        ghost: "text-midnight-800 hover:bg-midnight-900/[0.06]",
        subtle: "bg-sand-100 text-midnight-900 hover:bg-sand-200",
        glass:
          "glass text-white [background-color:rgb(255_255_255/0.14)] [border-color:rgb(255_255_255/0.28)] hover:[background-color:rgb(255_255_255/0.24)]",
        link: "text-lagoon-700 underline-offset-4 hover:underline rounded-sm",
        danger: "bg-red-600 text-white hover:bg-red-700",
      },
      size: {
        sm: "h-9 px-4 text-[0.8125rem] [&_svg]:size-4",
        md: "h-11 px-5 text-sm [&_svg]:size-[1.125rem]",
        lg: "h-13 px-7 text-[0.9375rem] [&_svg]:size-5",
        xl: "h-14 px-8 text-base [&_svg]:size-5",
        icon: "size-11 [&_svg]:size-[1.125rem]",
        "icon-sm": "size-9 [&_svg]:size-4",
      },
      block: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, block, asChild = false, loading = false, loadingText, children, disabled, ...props },
  ref,
) {
  const Comp = asChild ? Slot : "button";

  if (asChild) {
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size, block }), className)} {...props}>
        {children}
      </Comp>
    );
  }

  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size, block }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" aria-hidden />
          <span>{loadingText ?? "Please wait"}</span>
        </>
      ) : (
        children
      )}
    </Comp>
  );
});

export { buttonVariants };
