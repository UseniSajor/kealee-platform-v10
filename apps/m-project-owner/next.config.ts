import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typedRoutes: false,
  transpilePackages: ['@kealee/ui'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig

