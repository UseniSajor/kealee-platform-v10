// Build: 2026-05-04
/** @type {import('next').NextConfig} */
const path = require('node:path')

const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@kealee/ui', '@kealee/auth', '@kealee/redis'],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@kealee/ai/exterior-concept': path.resolve(
        __dirname,
        '../../packages/ai/src/exterior-concept/index.ts',
      ),
      '@kealee/redis': path.resolve(__dirname, '../../packages/redis/src/index.ts'),
    }
    return config
  },
}

module.exports = nextConfig
