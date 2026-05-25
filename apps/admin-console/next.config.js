/** @type {import('next').NextConfig} */
const adminHost =
  process.env.NEXT_PUBLIC_OS_ADMIN_URL?.replace(/\/$/, '') || 'https://admin.kealee.com'

const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@kealee/ui', '@kealee/auth'],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  async redirects() {
    return [
      {
        source: '/:path*',
        destination: `${adminHost}/:path*`,
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
