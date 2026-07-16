import type { ComponentType, SVGProps } from "react";

import {
  InstagramIcon,
  FacebookIcon,
  YoutubeIcon,
  LinkedinIcon,
  XIcon,
} from "@/components/ui/brand-icons";
import type { Settings } from "@/lib/settings";
import { cn } from "@/lib/utils";

/**
 * The one place social profiles are described.
 *
 * Footer, mobile menu, contact and about all render from here, so the URLs live
 * in a single spot — `BRAND.social` at build time, overridden at runtime by
 * Admin → Site Settings → Social links. A network with an empty URL disappears
 * from every surface on its own; nothing needs a per-page toggle.
 */

export const FOLLOW_DESCRIPTION =
  "Stay connected with us for travel inspiration, destination ideas, offers and important updates.";

type Network = {
  key: "instagram" | "facebook" | "youtube" | "linkedin" | "x";
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const NETWORKS: Network[] = [
  { key: "instagram", label: "Instagram", Icon: InstagramIcon },
  { key: "facebook", label: "Facebook", Icon: FacebookIcon },
  { key: "youtube", label: "YouTube", Icon: YoutubeIcon },
  { key: "linkedin", label: "LinkedIn", Icon: LinkedinIcon },
  { key: "x", label: "X", Icon: XIcon },
];

/** Only absolute URLs are links — this drops blanks and legacy "#" placeholders. */
const isProfileUrl = (value?: string) => !!value && /^https?:\/\/\S+$/i.test(value.trim());

export function socialLinks(social: Settings["social"]) {
  return NETWORKS.flatMap((network) => {
    const href = social[network.key]?.trim();
    return isProfileUrl(href) ? [{ ...network, href: href! }] : [];
  });
}

/* --------------------------------- Icon row -------------------------------- */

export function SocialIcons({
  social,
  brandName,
  tone = "light",
  className,
}: {
  social: Settings["social"];
  brandName: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  const links = socialLinks(social);
  if (links.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {links.map(({ key, href, label, Icon }) => (
        <li key={key}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Follow ${brandName} on ${label}`}
            className={cn(
              "flex size-10 items-center justify-center rounded-full border transition-colors",
              tone === "dark"
                ? "border-midnight-800 text-midnight-200 hover:border-lagoon-500 hover:bg-midnight-900 hover:text-white"
                : "border-hairline bg-white text-midnight-700 hover:border-lagoon-300 hover:bg-lagoon-50 hover:text-lagoon-700",
            )}
          >
            <Icon className="size-4" aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------ Instagram handle ---------------------------- */

export function InstagramHandle({
  social,
  brandName,
  tone = "light",
  className,
}: {
  social: Settings["social"];
  brandName: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  const handle = social.instagramHandle?.trim();
  if (!handle) return null;

  const href = isProfileUrl(social.instagram) ? social.instagram!.trim() : undefined;
  const text = cn(
    "inline-flex items-center gap-1.5 text-sm font-semibold",
    tone === "dark" ? "text-midnight-100" : "text-midnight-900",
  );

  if (!href) {
    return (
      <span className={cn(text, className)}>
        <InstagramIcon className="size-4 shrink-0" aria-hidden />
        {handle}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Follow ${brandName} on Instagram`}
      className={cn(
        text,
        "transition-colors",
        tone === "dark" ? "hover:text-white" : "hover:text-lagoon-700",
        className,
      )}
    >
      <InstagramIcon className="size-4 shrink-0" aria-hidden />
      {handle}
    </a>
  );
}

/* ------------------------------ Follow section ------------------------------ */

/** Heading + blurb + icons + Instagram handle. Used on Contact and About. */
export function FollowSection({
  settings,
  className,
}: {
  settings: Settings;
  className?: string;
}) {
  const links = socialLinks(settings.social);
  if (links.length === 0) return null;

  const brandName = settings.brand.name;

  return (
    <section className={cn("rounded-2xl border border-hairline bg-white p-6", className)}>
      <h2 className="font-display text-xl text-midnight-900">Follow {brandName}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{FOLLOW_DESCRIPTION}</p>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <SocialIcons social={settings.social} brandName={brandName} />
        <InstagramHandle social={settings.social} brandName={brandName} />
      </div>
    </section>
  );
}
