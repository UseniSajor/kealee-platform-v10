/** @type {import("next").NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@kealee/ui', '@kealee/auth', '@kealee/api-client', '@kealee/types'],
}

module.exports = nextConfig
