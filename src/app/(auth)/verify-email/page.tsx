import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailPanel } from "@/components/auth/password-forms";
import { Skeleton } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Verify email",
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <VerifyEmailPanel />
    </Suspense>
  );
}
