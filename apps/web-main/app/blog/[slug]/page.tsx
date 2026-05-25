import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PlatformBlogArticleView } from '@/components/blog/PlatformBlogArticleView'
import {
  PLATFORM_BLOG_SLUGS,
  getPlatformBlogArticle,
} from '@/lib/content/platform-blog-articles'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return PLATFORM_BLOG_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = getPlatformBlogArticle(slug)
  if (!article) return { title: 'Article not found' }

  const url = `https://kealee.com/blog/${slug}`
  return {
    title: `${article.title} | Kealee`,
    description: article.description,
    keywords: article.keywords,
    openGraph: {
      title: article.title,
      description: article.description,
      type: 'article',
      url,
    },
    alternates: { canonical: url },
  }
}

export default async function PlatformBlogArticlePage({ params }: Props) {
  const { slug } = await params
  const article = getPlatformBlogArticle(slug)
  if (!article) notFound()
  return <PlatformBlogArticleView article={article} />
}
