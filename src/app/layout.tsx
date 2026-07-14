import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/toast";
import { getSettings } from "@/lib/settings";
import { SITE_URL } from "@/config/site";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${settings.brand.name} — ${settings.seo.defaultTitle}`,
      template: settings.seo.titleTemplate.replace("[TRAVEL BRAND NAME]", settings.brand.name),
    },
    description: settings.seo.defaultDescription,
    keywords: settings.seo.keywords,
    applicationName: settings.brand.name,
    openGraph: {
      type: "website",
      locale: "en_IN",
      siteName: settings.brand.name,
      title: `${settings.brand.name} — ${settings.seo.defaultTitle}`,
      description: settings.seo.defaultDescription,
      url: SITE_URL,
    },
    twitter: {
      card: "summary_large_image",
      title: `${settings.brand.name} — ${settings.seo.defaultTitle}`,
      description: settings.seo.defaultDescription,
    },
    robots: { index: true, follow: true },
    alternates: { canonical: "/" },
    verification: settings.seo.googleSiteVerification
      ? { google: settings.seo.googleSiteVerification }
      : undefined,
  };
}

export const viewport: Viewport = {
  themeColor: "#0a1628",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-IN"
      className={`${jakarta.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only rounded-full bg-midnight-900 px-5 py-3 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-300"
        >
          Skip to main content
        </a>
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
