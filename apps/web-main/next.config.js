// Build: 2026-06-02-tw5
const { withSentryConfig } = require('@sentry/nextjs');


/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  optimizeFonts: false,
  experimental: {
    serverComponentsExternalPackages: ['stripe', 'sharp', '@img/sharp-libvips-dev', '@img/sharp-wasm32', '@img/sharp-libvips-linux-x64', '@img/sharp-libvips-linux-arm64'],
  },
  transpilePackages: ['@kealee/ui', '@kealee/intake', '@kealee/shared', '@kealee/pascal-wrapper', '@kealee/core-bim', '@kealee/kealee-agent-stack', '@kealee/storage', '@kealee/concept-engine'],
  webpack(config, { isServer }) {
    if (isServer) {
      const prev = Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean)
      config.externals = [
        ...prev,
        ({ request }, callback) => {
          if (request && (request.startsWith('@img/') || request === 'sharp')) {
            return callback(null, 'commonjs ' + request)
          }
          callback()
        },
      ]
    }
    return config
  },
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
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
        pathname: '/**',
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
