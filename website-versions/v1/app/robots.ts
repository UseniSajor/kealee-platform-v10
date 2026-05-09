import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/concept-package/',
          '/command-center/',
          '/_next/',
        ],
      },
    ],
    sitemap: 'https://kealee.com/sitemap.xml',
    host: 'https://kealee.com',
  }
}
