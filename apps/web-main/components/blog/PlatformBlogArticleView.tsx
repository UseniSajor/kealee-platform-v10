import Link from 'next/link'
import type { PlatformBlogArticle } from '@/lib/content/platform-blog-articles'
import { KEALEE_SITE_URL } from '@/lib/site/contact'

const articleStyle = {
  maxWidth: 780,
  margin: '0 auto',
  padding: '40px 24px 80px',
  fontFamily: 'sans-serif',
  color: '#2D3748',
  lineHeight: 1.75,
} as const

export function PlatformBlogArticleView({ article }: { article: PlatformBlogArticle }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    author: { '@type': 'Organization', name: 'Kealee' },
    publisher: {
      '@type': 'Organization',
      name: 'Kealee',
      logo: { '@type': 'ImageObject', url: `${KEALEE_SITE_URL}/media/service-photos/home-design.jpg` },
    },
    datePublished: article.datePublished,
    dateModified: article.datePublished,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${KEALEE_SITE_URL}/blog/${article.slug}` },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article style={articleStyle}>
        <div style={{ marginBottom: 32 }}>
          <span
            style={{
              background: 'rgba(232,121,58,0.12)',
              color: '#E8793A',
              borderRadius: 999,
              padding: '3px 12px',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {article.category}
          </span>
          <h1 style={{ color: '#1A2B4A', fontSize: 34, fontWeight: 800, marginTop: 12, marginBottom: 8, lineHeight: 1.2 }}>
            {article.title}
          </h1>
          <p style={{ color: '#718096', fontSize: 14 }}>
            By Kealee · {new Date(article.datePublished).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} ·{' '}
            {article.readTime} read
          </p>
        </div>

        {article.sections.map((section) => (
          <section key={section.heading}>
            <h2 style={{ color: '#1A2B4A', fontSize: 24, fontWeight: 700, marginTop: 36, marginBottom: 12 }}>
              {section.heading}
            </h2>
            {section.paragraphs.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
            {section.bullets && (
              <ul style={{ paddingLeft: 24 }}>
                {section.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <div
          style={{
            marginTop: 48,
            padding: 24,
            borderRadius: 12,
            background: '#F7FAFC',
            border: '1px solid #E2E8F0',
          }}
        >
          <p style={{ fontWeight: 600, color: '#1A2B4A', marginBottom: 12 }}>Ready for your project?</p>
          <Link
            href={article.cta.href}
            style={{
              display: 'inline-block',
              background: '#E8793A',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: 8,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            {article.cta.label} →
          </Link>
        </div>

        <p style={{ marginTop: 32, fontSize: 14 }}>
          <Link href="/blog" style={{ color: '#2ABFBF' }}>
            ← All articles
          </Link>
        </p>
      </article>
    </>
  )
}
