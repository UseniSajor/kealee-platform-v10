import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@kealee/ui', '@kealee/auth'],
}

export default nextConfig

