// Build: 2026-05-04-tw3

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@kealee/ui', '@kealee/auth', '@kealee/core-hooks', '@kealee/shared', '@kealee/concept-engine', '@kealee/storage', '@kealee/core-rules'],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  env: {
    // Production: NEXT_PUBLIC_AUTH_HUB_URL=https://kealee.com/auth
    NEXT_PUBLIC_AUTH_HUB_URL: process.env.NEXT_PUBLIC_AUTH_HUB_URL ?? '',
  },
}

module.exports = nextConfig
