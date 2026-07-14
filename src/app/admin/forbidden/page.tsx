import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Access denied", robots: { index: false } };

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <ShieldOff className="size-7" aria-hidden />
        </span>

        <h1 className="mt-6 font-display text-2xl text-midnight-900">
          You don&apos;t have access to that
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Your role doesn&apos;t include the permission needed for that module. If you think that&apos;s
          wrong, ask a Super Admin to adjust your permissions.
        </p>

        <Button asChild variant="accent" className="mt-7">
          <Link href="/admin">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
