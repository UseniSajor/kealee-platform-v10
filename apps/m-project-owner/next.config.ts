import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typedRoutes: false,
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig

