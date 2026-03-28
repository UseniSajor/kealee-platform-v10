/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@kealee/ui', '@kealee/intake'],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
}

module.exports = nextConfig
