import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["@google-cloud/firestore"],
  turbopack: { root: process.cwd() },
  outputFileTracingExcludes: {
    "/*": ["./qloo-private/**/*", "./.env*", "./docs/**/*"],
  },
};

export default nextConfig;
