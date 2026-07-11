// Build: 2026-05-04-tw3
import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Pin the file-tracing root to the monorepo root so the standalone output
  // nests as .next/standalone/apps/os-admin/server.js — matching every other
  // app and the path the Railway Dockerfile looks for. build.mjs runs
  // `next build` with cwd = this app dir, so ../.. is the repo root.
  experimental: {
    outputFileTracingRoot: path.join(process.cwd(), '..', '..'),
  },
  reactStrictMode: true,
  transpilePackages: ['@kealee/ui', '@kealee/auth'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configure webpack to be more compatible
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        module: false,
        child_process: false,
        async_hooks: false,
        net: false,
        tls: false,
        dns: false,
      };
    }
    return config;
  },
};

export default nextConfig;
