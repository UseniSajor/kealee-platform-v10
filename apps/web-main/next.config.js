// Build: 2026-05-04-tw3
const { withSentryConfig } = require('@sentry/nextjs');


/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@kealee/ui', '@kealee/intake', '@kealee/shared', '@kealee/pascal-wrapper', '@kealee/core-bim'],
  async redirects() {
    return [
      { source: '/auth/login', destination: '/login', permanent: false },
      { source: '/auth/signup', destination: '/login', permanent: false },
      { source: '/auth/verify', destination: '/login', permanent: false },
      { source: '/auth/forgot-password', destination: '/login', permanent: false },
      { source: '/auth/reset-password', destination: '/login', permanent: false },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/photo-**',
      },
    ],
  },
}

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || 'kealee',
  project: process.env.SENTRY_PROJECT || 'web-main',
  silent: !process.env.SENTRY_AUTH_TOKEN,
  hideSourceMaps: true,
});
