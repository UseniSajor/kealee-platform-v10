import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import {
  PUBLIC_CATALOG_CATEGORIES,
  PUBLIC_PRODUCT_CATALOG,
  formatCatalogPrice,
  type PublicCatalogProduct,
} from '@kealee/core-rules'
import { REVENUE_PRODUCT_CATALOG } from '@/lib/revenue-product-catalog'
import { BuyingPathways } from '@/components/commerce/BuyingPathways'
import { availabilityLabel, getProductAvailability } from '@/lib/product-availability'
import { EditorialVideoHero } from '@/components/marketing/EditorialVideoHero'
import { ServiceExamplesGallery } from '@/components/marketing/ServiceExamplesGallery'
import { SectionBoundary } from '@/components/ui/SectionBoundary'
import { PreconstructionSuiteSection } from '@/components/home/PreconstructionSuiteSection'

export const metadata: Metadata = {
  title: 'All Products & Services — Kealee',
  description: 'Every Kealee service in one place. AI design, permits, cost estimation, construction management, and landscape — all starting with AI concept.',
}

const CATEGORY_ACCENTS = {
  'site-intelligence': '#0F766E',
  'concept-planning': '#D4A017',
  estimation: '#147D92',
  'permits-professional': '#8A5A3C',
  'construction-execution': '#1F3D38',
} as const

function CatalogProductCard({ product }: { product: PublicCatalogProduct }) {
  const accent = CATEGORY_ACCENTS[product.categoryId]
  const availability = getProductAvailability(product.key)
  return (
    <Link
      href={product.href}
      className="group flex flex-col overflow-hidden rounded-xl border-2 border-teal-100 bg-gradient-to-br from-white via-white to-teal-50/70 p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-yellow-300 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white" style={{ backgroundColor: accent }}>
          {product.audience.join(' · ')}
        </span>
        <span className="shrink-0 text-xs font-black" style={{ color: accent }}>{availabilityLabel(availability)}</span>
      </div>
      <h3 className="mt-4 font-bold text-lg font-display" style={{ color: '#1A2B4A' }}>{product.name}</h3>
      <p className="mt-2 flex-1 text-sm text-gray-500 leading-relaxed">{product.shortDescription}</p>
      <div className="mt-5 flex items-center justify-between border-t border-[#8a5a3c]/20 pt-4">
        <span className="text-xs text-slate-400">Scope and price confirmed after review</span>
        <span className="flex items-center gap-1 text-sm font-semibold group-hover:gap-2 transition-all" style={{ color: accent }}>
          View <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  )
}

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Supporting sections are isolated: none of them may take the catalog
          — and its buy buttons — offline if they throw. */}
      <SectionBoundary name="products-hero">
        <EditorialVideoHero eyebrow="Preconstruction services" title="Every service. One path toward construction." description="Explore what Kealee can produce across design, site planning, cost intelligence, permits, professional coordination, and construction readiness." videoSrc="/media/service-videos/home-build-video.mp4" poster="/media/service-photos/home-build.jpg" primary={{ label: 'Get project clarity', href: '/products/home-project-readiness-review' }} secondary={{ label: 'Browse all products', href: '/products#homeowner-services' }} />
      </SectionBoundary>

      {/* The four core products lead the catalog. */}
      <PreconstructionSuiteSection />

      <SectionBoundary name="products-examples">
        <ServiceExamplesGallery serviceKey="all-services" limit={9} />
      </SectionBoundary>

      <SectionBoundary name="products-buying-pathways">
        <section className="border-b border-gray-100 bg-slate-50">
          <BuyingPathways />
        </section>
      </SectionBoundary>

      {/* Category sections */}
      <div id="homeowner-services" className="mx-auto max-w-6xl scroll-mt-24 px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-orange-600">Public product catalog</span>
          <h2 className="mt-3 font-display text-3xl font-bold text-[#1A2B4A]">Buy the next project outcome</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            Kitchens, additions, ADUs, pools, landscapes, commercial projects, and multifamily sites are selected during
            intake. The products below remain consistent across project types.
          </p>
        </div>
        {PUBLIC_CATALOG_CATEGORIES.map(cat => {
          const products = PUBLIC_PRODUCT_CATALOG.filter(product => product.categoryId === cat.id)
          if (products.length === 0) return null
          return (
            <section key={cat.id} id={cat.id} className="scroll-mt-24">
              <div className="flex items-end justify-between mb-8 border-b border-gray-100 pb-4">
                <div>
                  <span
                    className="text-xs font-bold uppercase tracking-widest block mb-1"
                    style={{ color: CATEGORY_ACCENTS[cat.id] }}
                  >
                    {cat.label}
                  </span>
                  <p className="text-sm text-gray-500">{cat.description}</p>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map(product => (
                  <CatalogProductCard key={product.key} product={product} />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {/* Professional project services */}
      <section className="border-t border-[#ded8cc] bg-[#ece7dc] py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 border-b border-[#cfc7b9] pb-4">
            <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-[#b85831]">Professional project services</span>
            <p className="text-sm text-[#68746f]">Separate per-project deliverables for contractor clients and development sites. Contractor marketplace membership is not included.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {Object.values(REVENUE_PRODUCT_CATALOG)
              .filter(product => product.customerType === 'contractor' || product.customerType === 'developer')
              .map(product => {
                const price = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(product.priceCents / 100)
                return (
                  <Link
                    key={product.productKey}
                    href={`/products/${product.productKey}`}
                    className="group flex flex-col rounded-2xl border border-[#d5cec1] bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
                  >
                    <span className="mb-2 inline-block w-fit rounded-full bg-orange-500/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-orange-300">
                      {product.customerType}
                    </span>
                    <h3 className="font-display text-lg font-bold text-[#263831]">{product.name}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-[#68746f]">Includes {product.botTypes.join(', ')}. Scope, professional involvement, price, and timing are confirmed before purchase.</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm font-bold text-orange-300">Scope confirmation required</span>
                      <span className="flex items-center gap-1 text-sm font-semibold text-orange-300 transition-all group-hover:gap-2">
                        View <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                )
              })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold font-display" style={{ color: '#1A2B4A' }}>Not sure where to start?</h2>
          <p className="mt-3 text-gray-500">Most projects start with project clarity. If you&apos;re not sure which service fits, tell us about your project.</p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/products/home-project-readiness-review"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#E8793A' }}
            >
              Get Project Clarity <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-7 py-3.5 text-base font-semibold text-gray-700 hover:border-gray-400 transition-all"
            >
              Talk to our team
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
