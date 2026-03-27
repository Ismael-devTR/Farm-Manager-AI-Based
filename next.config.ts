import type { NextConfig } from "next";

const isProd = process.env.FM_NODE_ENV === "production";
const basePath = isProd ? "/farm" : "";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath,
  skipTrailingSlashRedirect: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
