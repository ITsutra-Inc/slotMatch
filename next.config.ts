import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@ringcentral/sdk", "node-cron"],
};

export default nextConfig;
