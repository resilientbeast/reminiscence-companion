import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  outputFileTracingExcludes: {
    "/*": ["./qloo-private/**/*", "./.env*", "./docs/**/*"],
  },
};

export default nextConfig;
