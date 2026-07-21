import { PLATFORM_BLOG_SLUGS } from '@/lib/content/platform-blog-articles'

/** Long-form static article routes (app/blog/<slug>/page.tsx folders). */
export const STATIC_BLOG_SLUGS = [
  'deck-permit-pg-county',
  'home-addition-cost-dmv',
  'dc-dcra-permit-guide',
  'basement-finish-northern-virginia',
] as const

/** All indexable blog URLs for sitemap. */
export const PUBLISHED_BLOG_SLUGS = [...STATIC_BLOG_SLUGS, ...PLATFORM_BLOG_SLUGS] as const

export type PublishedBlogSlug = (typeof PUBLISHED_BLOG_SLUGS)[number]
