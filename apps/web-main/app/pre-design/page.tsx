import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Home, Layers, Leaf } from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI Pre-Design — Kealee',
  description: 'Property-specific pre-design packages powered by AI. Exterior facade, interior addition, or landscape — delivered in 2–5 business days.',
}

const TYPES = [
  {
    key: 'exterior',
    icon: Home,
    color: '#E8793A',
    title: 'Exterior Facade',
    description: 'Curb appeal, siding, windows, doors, roofline, and landscaping. Full exterior transformation.',
    from: '$149',
    badge: null,
  },
  {
    key: 'interior',
    icon: Layers,
    color: '#7C3AED',
    title: 'Interior Addition',
    description: 'Kitchen, bath, room addition, ADU, or full interior redesign. Every room, every detail.',
    from: '$149',
    badge: 'Popular',
  },
  {
    key: 'landscape',
    icon: Leaf,
    color: '#38A169',
    title: 'Landscape & Outdoor',
    description: 'Garden design, hardscape, outdoor living, irrigation, and backyard farming.',
    from: '$149',
    badge: null,
  },
]

export default function PreDesignEntryPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7FAFC' }}>
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4"
            style={{ backgroundColor: 'rgba(232,121,58,0.1)', color: '#E8793A' }}
          >
            AI Pre-Design
          </span>
          <h1 className="text-4xl font-bold font-display" style={{ color: '#1A2B4A' }}>
            What are you designing?
          </h1>
          <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
            Property-specific AI concept packages. Delivered in 2–5 business days.
          </p>
        </div>

        {/* Type cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {TYPES.map((t) => {
            const Icon = t.icon
            return (
              <Link
                key={t.key}
                href={`/pre-design/${t.key}`}
                className="group relative flex flex-col rounded-2xl border-2 bg-white p-6 transition-all hover:shadow-lg hover:-translate-y-1"
                style={{ borderColor: 'transparent' }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.borderColor = t.color
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'transparent'
                }}
              >
                {t.badge && (
                  <span
                    className="absolute right-4 top-4 rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-widest"
                    style={{ backgroundColor: `${t.color}15`, color: t.color }}
                  >
                    {t.badge}
                  </span>
                )}
                <div
                  className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${t.color}15` }}
                >
                  <Icon className="h-6 w-6" style={{ color: t.color }} />
                </div>
                <h2 className="text-xl font-bold font-display mb-2" style={{ color: '#1A2B4A' }}>
                  {t.title}
                </h2>
                <p className="text-sm text-gray-500 flex-1">{t.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: t.color }}>
                    From {t.from}
                  </span>
                  <ArrowRight
                    className="h-5 w-5 text-gray-300 transition-colors group-hover:text-gray-600"
                  />
                </div>
              </Link>
            )
          })}
        </div>

        {/* Trust bar */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
          <span>AI-powered analysis</span>
          <span>·</span>
          <span>Property-specific outputs</span>
          <span>·</span>
          <span>Architect-ready packages</span>
          <span>·</span>
          <span>2–5 business day delivery</span>
        </div>
      </div>
    </div>
  )
}
