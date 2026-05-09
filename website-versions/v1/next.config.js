/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@kealee/ui', '@kealee/intake', '@kealee/core-rules', '@kealee/shared'],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
}

module.exports = nextConfig
