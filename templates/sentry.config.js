// sentry.config.js
// Sentry webpack plugin configuration for Next.js apps

/** @type {import('@sentry/nextjs').SentryWebpackPluginOptions} */
const sentryConfig = {
  // Suppresses source map uploading logs during build
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
};

module.exports = sentryConfig;
