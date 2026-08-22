// Build: 2026-05-04-tw3
// NOTE: must be .js — Next 14 does not read next.config.ts, so `output:
// 'standalone'` was silently ignored and no standalone server was emitted.
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Pin the file-tracing root to the monorepo root so the standalone output
  // nests as .next/standalone/apps/os-admin/server.js — the path the Railway
  // Dockerfile looks for. (experimental.* is the Next 14 location.)
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '..', '..'),
  },
  reactStrictMode: true,
  transpilePackages: ['@kealee/ui', '@kealee/auth'],
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

module.exports = nextConfig;
