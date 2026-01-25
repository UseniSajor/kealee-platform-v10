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
  // Turbopack config (required in Next.js 16 when webpack config is present)
  turbopack: {
    resolveAlias: {
      canvas: false,
    },
  },
  // Webpack config for backwards compatibility
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
