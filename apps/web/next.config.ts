import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@gradual/db-schema", "@gradual/shared-types"],
  // Avoid apps/web/AGENTS.md and apps/web/CLAUDE.md shadowing the
  // domain-split instructions in the repo root files of the same name.
  agentRules: false,
};

export default nextConfig;

