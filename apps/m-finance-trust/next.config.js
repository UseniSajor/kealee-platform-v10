/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@kealee/ui', '@kealee/auth'],
};

module.exports = nextConfig;
