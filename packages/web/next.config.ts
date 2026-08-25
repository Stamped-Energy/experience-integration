import type { NextConfig } from "next";

/**
 * BFF origin for the browser. Prefer NEXT_PUBLIC_BFF_URL from packages/web/.env.local
 * (Next does not auto-load the monorepo root .env when cwd is packages/web).
 */
const BFF =
  process.env.NEXT_PUBLIC_BFF_URL?.replace(/\/$/, "") ||
  "http://localhost:3001";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BFF_URL: BFF,
  },
  // Same-origin /api fallback if a client build somehow has an empty BFF URL.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BFF}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
