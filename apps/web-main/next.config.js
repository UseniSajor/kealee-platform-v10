const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Required for monorepo standalone builds — captures workspace package files
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@kealee/ui', '@kealee/intake'],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
}

module.exports = nextConfig
