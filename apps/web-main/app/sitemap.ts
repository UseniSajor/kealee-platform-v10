import type { MetadataRoute } from 'next'
import { PUBLISHED_BLOG_SLUGS } from '@/lib/content/public-blog-slugs'
import { SERVICE_AREA_SLUGS } from '@/lib/content/service-areas'

const BASE_URL = 'https://kealee.com'

const HIGH_PRIORITY_ROUTES: MetadataRoute.Sitemap = [
  { url: BASE_URL, changeFrequency: 'weekly', priority: 1.0 },
  { url: `${BASE_URL}/concept`, changeFrequency: 'weekly', priority: 0.95 },
  { url: `${BASE_URL}/concept-engine`, changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE_URL}/permits`, changeFrequency: 'weekly', priority: 0.95 },
  { url: `${BASE_URL}/estimate`, changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE_URL}/marketplace`, changeFrequency: 'weekly', priority: 0.85 },
  { url: `${BASE_URL}/contractors`, changeFrequency: 'weekly', priority: 0.85 },
  { url: `${BASE_URL}/pricing`, changeFrequency: 'monthly', priority: 0.85 },
  { url: `${BASE_URL}/get-concept`, changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE_URL}/get-started`, changeFrequency: 'weekly', priority: 0.85 },
  { url: `${BASE_URL}/homeowners`, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE_URL}/build`, changeFrequency: 'monthly', priority: 0.75 },
  { url: `${BASE_URL}/design-services`, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE_URL}/book-a-call`, changeFrequency: 'monthly', priority: 0.75 },
]

const STANDARD_ROUTES: MetadataRoute.Sitemap = [
  { url: `${BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.6 },
  { url: `${BASE_URL}/blog`, changeFrequency: 'weekly', priority: 0.75 },
  { url: `${BASE_URL}/faq`, changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE_URL}/contact`, changeFrequency: 'yearly', priority: 0.55 },
  { url: `${BASE_URL}/services`, changeFrequency: 'monthly', priority: 0.65 },
  { url: `${BASE_URL}/permits/dmv`, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE_URL}/service-areas`, changeFrequency: 'monthly', priority: 0.78 },
  { url: `${BASE_URL}/concept-engine/exterior`, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE_URL}/concept-engine/whole-home`, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE_URL}/concept-engine/interior-reno`, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE_URL}/concept-engine/garden`, changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE_URL}/concept-engine/homeowner`, changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE_URL}/concept-engine/developer`, changeFrequency: 'monthly', priority: 0.7 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const withDates = (entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap =>
    entries.map((e) => ({ ...e, lastModified: now }))

  const blogRoutes: MetadataRoute.Sitemap = PUBLISHED_BLOG_SLUGS.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.72,
  }))

  const serviceAreaRoutes: MetadataRoute.Sitemap = SERVICE_AREA_SLUGS.map((slug) => ({
    url: `${BASE_URL}/service-areas/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: slug === 'oxon-hill-md' ? 0.82 : 0.7,
  }))

  return [
    ...withDates(HIGH_PRIORITY_ROUTES),
    ...withDates(STANDARD_ROUTES),
    ...withDates(serviceAreaRoutes),
    ...blogRoutes,
  ]
}
