import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { Skeleton } from "@/components/ui/primitives";
import { getCurrentUser } from "@/lib/session";
import { integrations } from "@/lib/env";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.isAdmin ? "/admin" : "/account");

  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <LoginForm googleEnabled={integrations.google} />
    </Suspense>
  );
}
