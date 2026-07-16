import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Remote media: Cloudinary (managed uploads) plus the royalty-free
    // placeholder sources used by the demo seed. Anything else is blocked.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 430, 640, 768, 1024, 1280, 1440, 1920, 2560],
  },

  serverExternalPackages: ["mongoose", "razorpay", "cloudinary", "nodemailer"],

  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "date-fns"],
  },

  async redirects() {
    // Travellers sign in with Google only, so registration and the password
    // flows no longer exist. Anything still pointing at them — a bookmark, an
    // old email, a search result — lands on the sign-in page instead of a 404.
    //
    // 307 (permanent: false), not 308: these are product decisions, not
    // permanent moves, and a browser that caches 308 forever would be
    // impossible to walk back. None of the sources is /login, so there is no
    // loop to fall into.
    return [
      { source: "/register", destination: "/login", permanent: false },
      { source: "/forgot-password", destination: "/login", permanent: false },
      { source: "/reset-password", destination: "/login", permanent: false },
      { source: "/reset-password/:path*", destination: "/login", permanent: false },
      { source: "/verify-email", destination: "/login", permanent: false },
      { source: "/verify-email/:path*", destination: "/login", permanent: false },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
      {
        // Account and admin surfaces must never sit in a shared cache.
        source: "/:group(account|admin)/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },
};

export default nextConfig;
