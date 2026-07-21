import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import { SEO_PAGE_TYPES, type SeoPageType } from '@/lib/domain'

interface PageProps {
  params: { state: string; county: string; pageType: string }
}

async function getPage(params: PageProps['params']) {
  if (!SEO_PAGE_TYPES.includes(params.pageType as SeoPageType)) return null
  const supabase = getSupabaseAdmin()
  const pathname = `/guides/${params.state}/${params.county}/${params.pageType}`
  const { data: page } = await supabase
    .from('marketing_os_seo_pages')
    .select('id, pathname, robots_directive, breadcrumb_schema, entity_schema, faq_schema, content_item_id')
    .eq('pathname', pathname)
    .eq('indexable', true)
    .single()
  if (!page) return null
  const { data: item } = await supabase
    .from('marketing_os_content_items')
    .select('id, title, current_version, canonical_url, published_at, updated_at')
    .eq('id', page.content_item_id)
    .eq('status', 'published')
    .single()
  if (!item) return null
  const { data: version } = await supabase
    .from('marketing_os_content_versions')
    .select('title, excerpt, body_html, seo_title, meta_description, schema_json, source_citations')
    .eq('content_item_id', item.id)
    .eq('version', item.current_version)
    .single()
  if (!version) return null
  const { data: links } = await supabase
    .from('marketing_os_internal_links')
    .select('anchor_text, target_page:marketing_os_seo_pages!target_page_id(pathname, content_item:marketing_os_content_items(title))')
    .eq('source_page_id', page.id)
    .eq('active', true)
    .order('relevance_score', { ascending: false })
    .limit(12)
  return { page, item, version, links: links ?? [] }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const result = await getPage(params)
  if (!result) return { title: 'Guide not found', robots: { index: false, follow: false } }
  return {
    title: result.version.seo_title || result.version.title,
    description: result.version.meta_description || result.version.excerpt,
    alternates: { canonical: result.item.canonical_url || result.page.pathname },
    robots: result.page.robots_directive,
  }
}

export default async function ProgrammaticGuidePage({ params }: PageProps) {
  const result = await getPage(params)
  if (!result) notFound()
  const schema = [
    result.page.breadcrumb_schema,
    result.page.entity_schema,
    result.page.faq_schema,
    result.version.schema_json,
  ].filter((entry) => entry && Object.keys(entry as object).length > 0)

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {schema.map((entry, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }} />
      ))}
      <article className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-sm font-bold uppercase tracking-wider text-emerald-700">Kealee construction intelligence</p>
        <h1 className="mt-4 text-4xl font-bold leading-tight md:text-6xl">{result.version.title}</h1>
        {result.version.excerpt && <p className="mt-5 text-xl leading-relaxed text-slate-600">{result.version.excerpt}</p>}
        <div className="prose prose-slate mt-12 max-w-none" dangerouslySetInnerHTML={{ __html: result.version.body_html || '' }} />
        {result.links.length > 0 && (
          <aside className="mt-14 border-t pt-8">
            <h2 className="text-xl font-bold">Related construction guides</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {result.links.map((link, index) => {
                const target = Array.isArray(link.target_page) ? link.target_page[0] : link.target_page
                return target?.pathname ? (
                  <a key={`${target.pathname}-${index}`} href={target.pathname} className="rounded-lg border p-4 font-semibold hover:border-emerald-600">
                    {link.anchor_text}
                  </a>
                ) : null
              })}
            </div>
          </aside>
        )}
        <footer className="mt-14 border-t pt-6 text-sm text-slate-500">
          Updated {new Date(result.item.updated_at).toLocaleDateString()}. Verify requirements directly with the applicable jurisdiction before filing.
        </footer>
      </article>
    </main>
  )
}
