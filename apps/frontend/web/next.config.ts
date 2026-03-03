import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@flux/shared", "@flux/ui", "@flux/store", "@flux/api-client", "@flux/editor-core"],
};

export default nextConfig;
