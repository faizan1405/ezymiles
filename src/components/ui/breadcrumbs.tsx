import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

export interface Crumb {
  name: string;
  href: string;
}

export function Breadcrumbs({
  items,
  tone = "light",
  className,
}: {
  items: Crumb[];
  tone?: "light" | "dark";
  className?: string;
}) {
  const all = [{ name: "Home", href: "/" }, ...items];

  return (
    <>
      <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
        <ol className="flex flex-wrap items-center gap-1.5 text-xs">
          {all.map((crumb, i) => {
            const last = i === all.length - 1;
            return (
              <li key={crumb.href} className="flex items-center gap-1.5">
                {last ? (
                  <span
                    aria-current="page"
                    className={cn(
                      "font-semibold",
                      tone === "dark" ? "text-white" : "text-midnight-900",
                    )}
                  >
                    {crumb.name}
                  </span>
                ) : (
                  <>
                    <Link
                      href={crumb.href}
                      className={cn(
                        "transition-colors",
                        tone === "dark"
                          ? "text-midnight-100 hover:text-white"
                          : "text-muted hover:text-midnight-900",
                      )}
                    >
                      {crumb.name}
                    </Link>
                    <ChevronRight className="size-3.5 text-midnight-300" aria-hidden />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <BreadcrumbJsonLd items={all} />
    </>
  );
}
