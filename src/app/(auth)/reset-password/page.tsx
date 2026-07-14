import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/password-forms";
import { Skeleton } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Skeleton className="h-80" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
