import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://marketing.kealee.com'
  return {
    rules: [
      { userAgent: '*', allow: '/guides/', disallow: ['/', '/api/'] },
    ],
    sitemap: `${baseUrl.replace(/\/$/, '')}/sitemap.xml`,
  }
}
