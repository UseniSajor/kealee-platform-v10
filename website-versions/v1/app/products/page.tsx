import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { WEB_MARKETING_PRODUCTS } from '@kealee/core-rules/pricing'
import type { Product } from '@/lib/products'
import { getMergedCatalogProducts } from '@/lib/products'
import { ProductsCatalogFilter, type CatalogCard } from '@/components/catalog/ProductsCatalogFilter'

export const metadata: Metadata = {
  title: 'Products & Services — Kealee',
  description:
    'Explore PM packages, architecture SKUs, permits, estimation, ops modules, owner subscriptions, and legacy AI design offerings.',
}

function catalogBucket(product: Product): string {
  const marketing = WEB_MARKETING_PRODUCTS.find((p) => p.slug === product.slug)
  if (marketing) return marketing.category
  if (product.category === 'ai-design' || product.category === 'landscape') return 'ai-design'
  return product.category
}

export default function ProductsPage() {
  const cards: CatalogCard[] = getMergedCatalogProducts()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((product) => ({
      slug: product.slug,
      name: product.name,
      tagline: product.tagline,
      price: product.price,
      bucket: catalogBucket(product),
      imageUrl: product.imageUrl,
    }))

  return (
    <div className="min-h-screen bg-white">
      <section className="border-b border-slate-100 bg-gradient-to-br from-navy via-navy-light to-navy-dark px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-teal-light">Catalog</p>
          <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">Products built for disciplined execution.</h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-white/75">
            Filter across PM, architecture, owner subscriptions, permits, ops modules, estimation, and specialty offerings — pricing pulls from the Kealee catalog.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/concept"
              className="inline-flex items-center gap-2 rounded-xl bg-builder-orange px-7 py-3 text-sm font-semibold text-white hover:bg-builder-orange-dark"
            >
              Start in Concept <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-7 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Review pathways
            </Link>
          </div>
        </div>
      </section>

      <ProductsCatalogFilter items={cards} />

      <section className="border-t border-slate-100 bg-slate-50 px-4 py-12 text-center sm:px-6">
        <p className="text-sm text-slate-600">
          Garden, landscape, and kitchen journeys always route through AI Concept before downstream filings or contractor matching.
        </p>
      </section>
    </div>
  )
}
