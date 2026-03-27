import type { NextConfig } from "next";

const basePath = "/farm";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath,
  skipTrailingSlashRedirect: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
