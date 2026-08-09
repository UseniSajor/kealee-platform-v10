import type { MetadataRoute } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://marketing.kealee.com'
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return []
  const { data, error } = await getSupabaseAdmin()
    .from('marketing_os_seo_pages')
    .select('pathname, sitemap_priority, sitemap_change_frequency, updated_at, content_item:marketing_os_content_items!inner(status)')
    .eq('indexable', true)
    .eq('content_item.status', 'published')
    .limit(50_000)
  if (error) return []

  return (data ?? []).map((page) => ({
    url: `${baseUrl.replace(/\/$/, '')}${page.pathname}`,
    lastModified: page.updated_at,
    changeFrequency: page.sitemap_change_frequency as MetadataRoute.Sitemap[number]['changeFrequency'],
    priority: Number(page.sitemap_priority),
  }))
}
