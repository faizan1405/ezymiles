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
