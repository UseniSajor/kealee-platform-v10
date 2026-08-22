// Build: 2026-05-04-tw3

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@kealee/ui', '@kealee/auth', '@kealee/core-hooks', '@kealee/shared'],
}

module.exports = nextConfig
