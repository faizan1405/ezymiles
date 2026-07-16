import { cn } from "@/lib/utils";

/**
 * Wordmark + monogram lockup.
 *
 * The monogram is an original mark: a compass rose reduced to a single stroke
 * that also reads as a paper plane. When the client uploads a logo from the
 * admin panel it replaces the whole lockup.
 */
export function Logo({
  tone = "light",
  name,
  logoUrl,
  className,
}: {
  tone?: "light" | "dark";
  name: string;
  logoUrl?: string;
  className?: string;
}) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={name} className={cn("h-9 w-auto", className)} />;
  }

  const isDark = tone === "dark";

  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-xl transition-colors",
          isDark ? "bg-midnight-800" : "wash-ocean",
        )}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M12 2.5 15.2 9.6l7.3 1-5.3 4.9 1.4 7.1-6.6-3.6-6.6 3.6 1.4-7.1L1.5 10.6l7.3-1z"
            stroke="white"
            strokeWidth="1.4"
            opacity="0.35"
          />
          <path d="M4 13.5 20 6l-6 14-2.4-5.6z" fill="white" />
        </svg>
      </span>

      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-[1.0625rem] font-semibold tracking-tight",
            isDark ? "text-white" : "text-midnight-950",
          )}
        >
          {name}
        </span>
        <span
          className={cn(
            "mt-0.5 text-[0.5625rem] font-bold uppercase tracking-[0.18em]",
            isDark ? "text-midnight-100" : "text-lagoon-700",
          )}
        >
          Travel Atelier
        </span>
      </span>
    </span>
  );
}
