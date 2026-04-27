const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@kealee/ui', '@kealee/intake'],
}

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || 'kealee',
  project: process.env.SENTRY_PROJECT || 'web-main',
  silent: !process.env.SENTRY_AUTH_TOKEN,
  hideSourceMaps: true,
});
