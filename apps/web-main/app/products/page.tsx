import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle } from 'lucide-react'
import {
  PUBLIC_CATALOG_CATEGORIES,
  PUBLIC_PRODUCT_CATALOG,
  formatCatalogPrice,
  type PublicCatalogProduct,
} from '@kealee/core-rules'
import { REVENUE_PRODUCT_CATALOG } from '@/lib/revenue-product-catalog'
import { BuyingPathways } from '@/components/commerce/BuyingPathways'

export const metadata: Metadata = {
  title: 'All Products & Services — Kealee',
  description: 'Every Kealee service in one place. AI design, permits, cost estimation, construction management, and landscape — all starting with AI concept.',
}

const CATEGORY_ACCENTS = {
  'site-intelligence': '#0F766E',
  'concept-planning': '#E8793A',
  estimation: '#2563EB',
  'permits-professional': '#7C3AED',
  'construction-execution': '#1A2B4A',
} as const

function CatalogProductCard({ product }: { product: PublicCatalogProduct }) {
  const accent = CATEGORY_ACCENTS[product.categoryId]
  return (
    <Link
      href={product.href}
      className="group flex flex-col rounded-xl bg-white border border-gray-200 p-5 hover:shadow-md transition-all hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white" style={{ backgroundColor: accent }}>
          {product.audience.join(' · ')}
        </span>
        <span className="shrink-0 text-sm font-black" style={{ color: accent }}>{formatCatalogPrice(product)}</span>
      </div>
      <h3 className="mt-4 font-bold text-lg font-display" style={{ color: '#1A2B4A' }}>{product.name}</h3>
      <p className="mt-2 flex-1 text-sm text-gray-500 leading-relaxed">{product.shortDescription}</p>
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-xs text-slate-400">{product.deliveryDays ?? 'Scope confirmed after intake'}</span>
        <span className="flex items-center gap-1 text-sm font-semibold group-hover:gap-2 transition-all" style={{ color: accent }}>
          Start <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  )
}

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="py-20 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #1A2B4A 0%, #2d4a72 100%)' }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4" style={{ backgroundColor: 'rgba(232,121,58,0.2)', color: '#FBB98A' }}>
            All Services
          </span>
          <h1 className="text-4xl font-bold text-white font-display sm:text-5xl">
            Every Kealee service.<br />One place.
          </h1>
          <p className="mt-5 text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            Choose the right path for a homeowner project, contractor business, or development site.
            Start small, then advance only when the project is ready.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center text-sm text-white/60">
            {['Role-specific paths', 'Clear starting prices', 'Staff reviewed', 'Nationwide intake'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-gray-100 bg-slate-50">
        <BuyingPathways />
      </section>

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
      <section className="border-t border-gray-100 bg-[#0d1b33] py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 border-b border-white/10 pb-4">
            <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-orange-300">Professional project services</span>
            <p className="text-sm text-white/60">Separate per-project deliverables for contractor clients and development sites. Contractor marketplace membership is not included.</p>
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
                    className="group flex flex-col rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:border-orange-300/60 hover:bg-white/10"
                  >
                    <span className="mb-2 inline-block w-fit rounded-full bg-orange-500/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-orange-300">
                      {product.customerType}
                    </span>
                    <h3 className="font-display text-lg font-bold text-white">{product.name}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-white/60">Includes {product.botTypes.join(', ')} · target delivery within {product.fulfillmentSlaHours} hours.</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm font-bold text-orange-300">{price}</span>
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
          <p className="mt-3 text-gray-500">Most projects start with an AI concept package. If you're not sure which one fits, tell us about your project.</p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/concept-engine"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#E8793A' }}
            >
              Browse AI Design Paths <ArrowRight className="h-5 w-5" />
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
