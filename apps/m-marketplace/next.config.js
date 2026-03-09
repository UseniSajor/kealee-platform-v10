/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['@kealee/ui', '@kealee/auth', '@kealee/funnel-session'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      'images.unsplash.com',
      'assets.vercel.com',
      'kealee-marketplace.s3.amazonaws.com',
      'kealee-marketplace.s3.us-east-1.amazonaws.com',
      'localhost'
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },
  
  // Redirects for marketing URLs
  async redirects() {
    return [
      {
        source: '/contractors',
        destination: '/network',
        permanent: true
      },
      {
        source: '/find-contractors',
        destination: '/network',
        permanent: true
      },
      {
        source: '/services',
        destination: '/#services',
        permanent: true
      },
      {
        source: '/how-it-works',
        destination: '/#how-it-works',
        permanent: true
      },
      {
        source: '/testimonials',
        destination: '/#testimonials',
        permanent: true
      },
      {
        source: '/blog',
        destination: 'https://blog.kealee.com',
        permanent: false
      }
    ];
  },
  
  // Environment variables for client-side
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://marketplace.kealee.com',
    NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
    NEXT_PUBLIC_HOTJAR_ID: process.env.NEXT_PUBLIC_HOTJAR_ID,
    NEXT_PUBLIC_CRISP_WEBSITE_ID: process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  },
  
  // Compress responses
  compress: true,
  // Enable React 18 concurrent features
  experimental: {},
};

module.exports = nextConfig;
