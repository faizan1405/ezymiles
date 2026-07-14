import type { Metadata } from "next";
import { VisaTracker } from "@/components/visa/visa-tracker";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const metadata: Metadata = {
  title: "Track your visa application",
  description: "Check the status of a visa application with your reference number and email.",
  robots: { index: false, follow: true },
};

export default function VisaTrackPage() {
  return (
    <div className="container-page section-y !pt-8">
      <Breadcrumbs
        items={[
          { name: "Visa assistance", href: "/visa" },
          { name: "Track", href: "/visa/track" },
        ]}
      />

      <div className="mx-auto mt-10 max-w-xl">
        <h1 className="text-center text-3xl text-midnight-900 sm:text-4xl">
          Track your application
        </h1>
        <p className="mt-3 text-center text-[0.9375rem] text-muted">
          Enter the reference we sent you and the email you applied with.
        </p>

        <div className="mt-8">
          <VisaTracker />
        </div>
      </div>
    </div>
  );
}
