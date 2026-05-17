import type { NextConfig } from "next";

// ─── Required env vars ────────────────────────────────────────────────────────
// These are checked at build/startup time on Vercel deployments.
// Missing vars will cause a loud error rather than silent runtime failures.
const REQUIRED_ENV_VARS = [
  "NEXTAUTH_SECRET",
  "MONGODB_URI",
  "PUSHER_APP_ID",
  "PUSHER_KEY",
  "PUSHER_SECRET",
  "PUSHER_CLUSTER",
] as const;

function validateEnv() {
  if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
    const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(
        `\n\n🚨 Missing required environment variables on Vercel:\n${missing.map((k) => `  • ${k}`).join("\n")}\n\nSee .env.example for setup instructions.\n`
      );
    }
  }
}

validateEnv();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Google profile photos (NextAuth)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      // Allow Gravatar fallback avatars if needed
      {
        protocol: "https",
        hostname: "www.gravatar.com",
        pathname: "/**",
      },
    ],
    // Local images in /public are always served without configuration —
    // no remotePatterns needed. Turf images in /public/turfs/ work out of the box.
    // Image optimisation is enabled by default for best Lighthouse scores.
    formats: ["image/avif", "image/webp"],
  },

  // Typed route checking — Link href must be a literal known route
  typedRoutes: true,

  // Recommended: log only warnings/errors in production
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === "development",
    },
  },
};

export default nextConfig;
