import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@kealee/ui', '@kealee/auth'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
