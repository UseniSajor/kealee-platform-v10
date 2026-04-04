import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle } from 'lucide-react'
import { getProductsByCategory, type Product } from '@/lib/products'

export const metadata: Metadata = {
  title: 'All Products & Services — Kealee',
  description: 'Every Kealee service in one place. AI design, permits, cost estimation, construction management, and landscape — all starting with AI concept.',
}

const CATEGORIES = [
  {
    id: 'ai-design' as const,
    label: 'AI Design Engine',
    description: 'Start here. See your project before anything is built.',
    accent: '#E8793A',
  },
  {
    id: 'landscape' as const,
    label: 'Garden & Landscape',
    description: 'AI concept, then permits if needed, then contractor match.',
    accent: '#38A169',
  },
  {
    id: 'architectural' as const,
    label: 'Architectural & Engineering',
    description: 'Licensed professionals. Schematic through permit-ready.',
    accent: '#1A2B4A',
  },
  {
    id: 'permits' as const,
    label: 'Permits & Compliance',
    description: 'We file, track, and respond to comments. DC · MD · VA.',
    accent: '#4A8FA8',
  },
  {
    id: 'estimation' as const,
    label: 'Cost Estimation',
    description: 'RSMeans-validated, lender-ready cost documentation.',
    accent: '#4A8FA8',
  },
  {
    id: 'construction' as const,
    label: 'Construction & PM',
    description: 'Project management, bundles, and oversight for active builds.',
    accent: '#1A2B4A',
  },
  {
    id: 'specialty' as const,
    label: 'Specialty Services',
    description: 'Historic preservation, water mitigation, and site remediation.',
    accent: '#3A7D52',
  },
]

function ProductCard({ product }: { product: Product }) {
  const accent = product.accentColor ?? '#E8793A'
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col rounded-xl bg-white border border-gray-200 overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5"
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span
          className="absolute bottom-3 left-3 rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
          style={{ backgroundColor: accent }}
        >
          {product.badge}
        </span>
      </div>
      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <div className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: accent }}>
          {product.label}
        </div>
        <h3 className="font-bold text-base font-display mb-2" style={{ color: '#1A2B4A' }}>{product.name}</h3>
        <p className="text-sm text-gray-500 leading-relaxed flex-1 line-clamp-2">{product.tagline}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-bold" style={{ color: accent }}>{product.price}</span>
          <span className="flex items-center gap-1 text-sm font-semibold group-hover:gap-2 transition-all" style={{ color: accent }}>
            View <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
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
            Start with an AI concept. Add permits if required. Match with a verified contractor when you're ready.
            Each service is separate — stop at any step.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center text-sm text-white/60">
            {['No subscription', 'Per-service pricing', 'Staff reviewed', 'DMV-specific expertise'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Journey callout */}
      <section className="py-10 border-b border-gray-100 bg-orange-50">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <p className="text-sm font-medium text-gray-700">
            <strong style={{ color: '#E8793A' }}>How it works:</strong>{' '}
            AI Concept Package
            <span className="mx-2 text-gray-400">→</span>
            Permits (if required)
            <span className="mx-2 text-gray-400">→</span>
            Contractor Match (if elected)
          </p>
          <p className="text-xs text-gray-500 mt-1.5">Garden, landscape, kitchen, bath, exterior, basement, ADU — all start with AI concept.</p>
        </div>
      </section>

      {/* Category sections */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        {CATEGORIES.map(cat => {
          const products = getProductsByCategory(cat.id)
          if (products.length === 0) return null
          return (
            <section key={cat.id}>
              <div className="flex items-end justify-between mb-8 border-b border-gray-100 pb-4">
                <div>
                  <span
                    className="text-xs font-bold uppercase tracking-widest block mb-1"
                    style={{ color: cat.accent }}
                  >
                    {cat.label}
                  </span>
                  <p className="text-sm text-gray-500">{cat.description}</p>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map(product => (
                  <ProductCard key={product.slug} product={product} />
                ))}
              </div>
            </section>
          )
        })}
      </div>

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
