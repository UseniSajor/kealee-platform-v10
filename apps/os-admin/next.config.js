/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable SWC minify to avoid pnpm issues
  swcMinify: false,
  // Use Terser instead
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Disable all experimental features that might cause issues
  experimental: {
    optimizePackageImports: [],
    swcPlugins: [],
    webpackBuildWorker: false,
    parallelServerBuildTraces: false,
    parallelServerCompiles: false,
  },
  // Configure webpack to be more compatible
  webpack: (config, { isServer }) => {
    if (!isServer) {
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
}

module.exports = nextConfig
