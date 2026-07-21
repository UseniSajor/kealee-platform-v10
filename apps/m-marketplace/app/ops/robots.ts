import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://kealee.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/development/', '/development/services', '/development/how-it-works', '/development/experience', '/development/contact'],
        disallow: ['/api/', '/portal/', '/login', '/signup', '/onboarding'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
