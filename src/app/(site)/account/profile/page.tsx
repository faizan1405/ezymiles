import type { Metadata } from "next";

import { requireUser } from "@/lib/session";
import { tryConnectDB } from "@/lib/db";
import { User } from "@/models";
import { ProfileForm } from "@/components/account/profile-form";
import { EmptyState } from "@/components/ui/primitives";
import { serialise, toDateInput } from "@/lib/utils";
import type { IUser } from "@/models";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const session = await requireUser();

  if (!(await tryConnectDB())) {
    return <EmptyState title="Unavailable" description="Please refresh in a moment." />;
  }

  const doc = await User.findById(session.id).lean();
  if (!doc) {
    return <EmptyState title="Profile not found" description="Try signing out and back in." />;
  }

  const user = serialise(doc) as unknown as IUser;

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl text-midnight-900 sm:text-4xl">Profile</h1>
        <p className="mt-2 text-[0.9375rem] text-muted">
          Your details, your currency, and what we&apos;re allowed to send you.
        </p>
      </header>

      <ProfileForm
        hasPassword={Boolean(doc.passwordHash)}
        isVerified={Boolean(user.emailVerified)}
        defaults={{
          name: user.name,
          email: user.email,
          phone: user.phone ?? "",
          nationality: user.nationality ?? "Indian",
          dateOfBirth: user.dateOfBirth ? toDateInput(user.dateOfBirth) : "",
          preferredCurrency: (user.preferredCurrency ?? "INR") as "INR",
          marketingOptIn: user.marketingOptIn,
          whatsappOptIn: user.whatsappOptIn,
        }}
      />
    </div>
  );
}
