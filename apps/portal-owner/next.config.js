// Build: 2026-06-02-tw4

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@kealee/ui', '@kealee/auth', '@kealee/core-hooks', '@kealee/shared', '@kealee/concept-engine', '@kealee/storage', '@kealee/core-rules', '@kealee/communications'],
  env: {
    // Production: NEXT_PUBLIC_AUTH_HUB_URL=https://kealee.com/auth
    NEXT_PUBLIC_AUTH_HUB_URL: process.env.NEXT_PUBLIC_AUTH_HUB_URL ?? '',
  },
}

module.exports = nextConfig
