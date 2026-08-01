import { cn } from "@/lib/utils";

/**
 * Wordmark + monogram lockup.
 *
 * Falls back to an inline SVG of the eZyMiles brand logo when no custom
 * logo image has been uploaded via the admin panel.
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
    return <img src={logoUrl} alt={name} className={cn("h-20 w-auto md:h-24", className)} />;
  }

  const isDark = tone === "dark";
  const circleFill = isDark ? "#e2e8f0" : "#0f1d3d";
  const markStroke = isDark ? "#0f1d3d" : "#22d3ee";
  const markAccent = isDark ? "#334155" : "#0e7490";
  const wordmarkFill = isDark ? "#e2e8f0" : "#0f1d3d";
  const taglineFill = isDark ? "#94a3b8" : "#22d3ee";

  return (
    <span className={cn("flex items-center gap-1", className)}>
      {/* ── Brand mark ── */}
      <svg
        viewBox="0 0 220 56"
        className="h-20 w-auto shrink-0 md:h-24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Circle badge */}
        <circle cx="28" cy="30" r="23" fill={circleFill} />

        {/* Subtle inner ring */}
        <circle cx="28" cy="30" r="19" stroke={markAccent} strokeWidth="0.8" opacity="0.4" />

        {/* Stylised "e" letterform — bowl + crossbar that extends into a flowing tail */}
        <path
          d="M18 20C18 14.5 23.5 11.5 29 16C34.5 20.5 34.5 29.5 29 34.5C25 38 18.5 37.5 17.5 32C17.3 30.2 18.8 29 21 29C25 29 28.5 27 31 23.5L44 15"
          stroke={markStroke}
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Airplane silhouette at tip of tail */}
        <g transform="translate(42, 5.5) scale(0.58)" fill={markStroke}>
          <path d="M14 2L16 8L22 9.5L16 11L14 17L12 11L6 9.5L12 8Z" />
        </g>
      </svg>

      {/* ── Wordmark + tagline ── */}
      <span className="flex flex-col leading-none">
        <span
          className="text-3xl font-bold tracking-tight md:text-[2.25rem]"
          style={{ color: wordmarkFill }}
        >
          {name}
        </span>
        <span className="mt-[3px] flex items-center gap-1.5">
          <span
            className="h-px w-2"
            style={{ backgroundColor: taglineFill }}
          />
          <span
            className="text-[0.55rem] font-bold uppercase tracking-[0.2em]"
            style={{ color: taglineFill }}
          >
            Travel Atelier
          </span>
          <span
            className="h-px w-2"
            style={{ backgroundColor: taglineFill }}
          />
        </span>
      </span>
    </span>
  );
}
