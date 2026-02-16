/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Warning: This allows production builds to complete even with type errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to complete even with ESLint errors
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@kealee/shared-ai', '@kealee/database', '@kealee/auth'],
  images: {
    domains: ['localhost', 'supabase.co', 'images.unsplash.com'],
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
      // Prevent Prisma/Node.js modules from being bundled into client-side code
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        child_process: false,
        'fs/promises': false,
        async_hooks: false,
        net: false,
        tls: false,
        dns: false,
      };
    }
    // Externalize canvas for server-side
    config.externals = config.externals || [];
    config.externals.push('canvas');

    return config;
  },
};

module.exports = nextConfig;
