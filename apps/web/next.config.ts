import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@gradual/db-schema", "@gradual/shared-types"],
};

export default nextConfig;

