/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ['@kealee/shared-ai', '@kealee/database'],
  images: {
    domains: ['localhost', 'supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
  },
  // Empty turbopack config to satisfy Next.js 16 requirement when webpack config is present
  turbopack: {},
  // Webpack config for backwards compatibility (handles canvas for webpack builds)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias.canvas = false;
    }
    config.externals = config.externals || [];
    config.externals.push('canvas');
    return config;
  },
};

module.exports = nextConfig;
