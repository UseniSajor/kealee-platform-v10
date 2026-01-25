/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Exclude canvas from client-side bundling (server-only)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle canvas on the client side
      config.resolve.alias.canvas = false;
    }
    // Externalize canvas for server-side
    config.externals = config.externals || [];
    config.externals.push('canvas');
    
    return config;
  },
};

module.exports = nextConfig;
