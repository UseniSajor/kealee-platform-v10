import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@kealee/ui', '@kealee/auth'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
