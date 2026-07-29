// Build: 2026-06-02-tw5
const { withSentryConfig } = require('@sentry/nextjs');


/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.platform === 'win32' && !process.env.FORCE_STANDALONE ? undefined : 'standalone',
  optimizeFonts: false,
  experimental: {
    serverComponentsExternalPackages: ['stripe', 'sharp', '@img/sharp-libvips-dev', '@img/sharp-wasm32', '@img/sharp-libvips-linux-x64', '@img/sharp-libvips-linux-arm64', 'pdfkit'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ['@kealee/ui', '@kealee/intake', '@kealee/shared', '@kealee/pascal-wrapper', '@kealee/core-bim', '@kealee/kealee-agent-stack', '@kealee/storage', '@kealee/concept-engine', '@kealee/database', '@kealee/automation', '@kealee/marketing-privacy', '@kealee/marketing-agency'],
  webpack(config, { isServer }) {
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.tsx', '.jsx'],
    };
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
      // Legacy portal-picker links → dedicated agency login (no homeowner/contractor UI)
      {
        source: '/login',
        has: [{ type: 'query', key: 'redirectTo', value: '/marketing/workspace' }],
        destination: '/marketing/login',
        permanent: false,
      },
      {
        source: '/auth/login',
        has: [{ type: 'query', key: 'next', value: '/marketing/workspace' }],
        destination: '/marketing/login',
        permanent: false,
      },
      { source: '/auth/signup', destination: '/login', permanent: false },
      { source: '/auth/verify', destination: '/login', permanent: false },
      { source: '/auth/forgot-password', destination: '/login', permanent: false },
      { source: '/auth/reset-password', destination: '/login', permanent: false },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(), payment=(self)' },
        ],
      },
      {
        source: '/media/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
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
/* Trigger Railway rebuild */
