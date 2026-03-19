import type { MetadataRoute } from 'next'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.kealee.com'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://contractor.kealee.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await fetch(`${API}/marketplace/contractors/slugs`, {
      next: { revalidate: 86400 }, // 24h cache
    })
    if (!res.ok) return []

    const slugs: Array<{ slug: string; updatedAt: string }> = await res.json()

    return slugs.map(({ slug, updatedAt }) => ({
      url:          `${BASE_URL}/${slug}`,
      lastModified: new Date(updatedAt),
      changeFrequency: 'weekly',
      priority:     0.7,
    }))
  } catch {
    return []
  }
}
