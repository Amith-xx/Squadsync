import type { NextConfig } from "next";

const REQUIRED_ENV_VARS = [
  "NEXTAUTH_SECRET",
  "MONGODB_URI",
  "PUSHER_APP_ID",
  "PUSHER_KEY",
  "PUSHER_SECRET",
  "PUSHER_CLUSTER",
] as const;

function validateEnv() {
  // Only enforce on Vercel deployments, not local `next build` runs
  if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
    const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`
      );
    }
  }
}

validateEnv();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  typedRoutes: true,
};

export default nextConfig;
