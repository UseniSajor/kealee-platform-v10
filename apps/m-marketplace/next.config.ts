import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'files.kealee.com',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_MARKETPLACE_URL: process.env.NEXT_PUBLIC_MARKETPLACE_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

export default nextConfig;
