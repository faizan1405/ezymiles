import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentUser } from "@/lib/session";
import { integrations } from "@/lib/env";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.isAdmin ? "/admin" : "/account");

  return <RegisterForm googleEnabled={integrations.google} />;
}
