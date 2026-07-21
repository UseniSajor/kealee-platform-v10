'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, CheckCircle, Star } from 'lucide-react'
import { useState } from 'react'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

type ProjectType = 'exterior' | 'interior' | 'landscape'

const TYPE_CONFIG: Record<ProjectType, {
  label: string
  color: string
  description: string
}> = {
  exterior: {
    label: 'Exterior Facade',
    color: '#E8793A',
    description: 'Facade, curb appeal, and outdoor transformation',
  },
  interior: {
    label: 'Interior Addition',
    color: '#7C3AED',
    description: 'Kitchen, bath, addition, and interior redesign',
  },
  landscape: {
    label: 'Landscape & Outdoor',
    color: '#38A169',
    description: 'Garden, hardscape, and outdoor living design',
  },
}

const TIERS = [
  {
    key: 'starter',
    label: 'Starter',
    price: 149,
    priceLabel: '$149',
    tagline: 'Fast concept clarity',
    description: 'AI-generated concept visuals + design direction brief. Ideal for early-stage homeowners who want to see possibilities.',
    includes: [
      '3 AI concept images (exterior or interior)',
      'Style + materials brief',
      'Rough scope summary',
      'Downloadable PDF package',
    ],
    excludes: [
      'Zoning + buildability analysis',
      'Architect-ready export',
      'Consultation call',
    ],
    badge: null,
  },
  {
    key: 'visualization',
    label: 'Visualization',
    price: 395,
    priceLabel: '$395',
    tagline: 'Full concept package',
    description: 'Everything in Starter, plus zoning review, feasibility brief, and a 30-min consultation. The most popular choice.',
    includes: [
      'Everything in Starter',
      'Zoning + buildability analysis',
      'Feasibility brief',
      'Scope + budget range',
      '30-min consultation call',
    ],
    excludes: [
      'Architect-ready CAD/DXF export',
    ],
    badge: 'Most Popular',
  },
  {
    key: 'pre-design',
    label: 'Pre-Design',
    price: 950,
    priceLabel: '$950',
    tagline: 'Architect-ready package',
    description: 'The full pre-design package with architect-ready exports, detailed scope, systems impact analysis, and full routing support.',
    includes: [
      'Everything in Visualization',
      'Detailed scope of work',
      'Systems impact analysis',
      'Architect-ready export (JSON + DXF)',
      'Architect handoff coordination',
      'Priority processing',
    ],
    excludes: [],
    badge: 'Architect Ready',
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PreDesignTierPage() {
  const params = useParams()
  const typeKey = (params?.type as string) || 'exterior'
  const config = TYPE_CONFIG[typeKey as ProjectType] ?? TYPE_CONFIG.exterior
  const [selected, setSelected] = useState<string>('visualization')

  const selectedTier = TIERS.find((t) => t.key === selected)!

  return (
    <div className="min-h-screen bg-white">
      {/* Back nav */}
      <div className="border-b border-gray-100">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
          <Link href="/pre-design" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" /> Back to project type
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="py-12 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #1A2B4A 0%, #1e3a5f 100%)' }}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-3"
            style={{ backgroundColor: `${config.color}25`, color: config.color }}
          >
            {config.label}
          </span>
          <h1 className="text-3xl font-bold text-white font-display">
            Choose your package
          </h1>
          <p className="mt-2 text-gray-300 text-base">{config.description}</p>
        </div>
      </section>

      {/* Tier selector */}
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {TIERS.map((tier) => {
              const isSelected = selected === tier.key
              return (
                <button
                  key={tier.key}
                  onClick={() => setSelected(tier.key)}
                  className="relative text-left rounded-2xl border-2 p-5 transition-all"
                  style={{
                    borderColor: isSelected ? config.color : '#E5E7EB',
                    backgroundColor: isSelected ? `${config.color}08` : 'white',
                  }}
                >
                  {tier.badge && (
                    <span
                      className="absolute right-4 top-4 rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-widest"
                      style={{ backgroundColor: `${config.color}15`, color: config.color }}
                    >
                      {tier.badge}
                    </span>
                  )}
                  <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
                    {tier.tagline}
                  </div>
                  <div className="text-xl font-bold font-display" style={{ color: '#1A2B4A' }}>
                    {tier.label}
                  </div>
                  <div className="mt-1 text-2xl font-bold" style={{ color: config.color }}>
                    {tier.priceLabel}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">{tier.description}</p>

                  {isSelected && (
                    <div className="mt-4 space-y-1.5">
                      {tier.includes.map((item) => (
                        <div key={item} className="flex items-start gap-2 text-xs text-gray-600">
                          <CheckCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" style={{ color: config.color }} />
                          {item}
                        </div>
                      ))}
                      {tier.excludes.map((item) => (
                        <div key={item} className="flex items-start gap-2 text-xs text-gray-400 line-through">
                          <span className="h-3.5 w-3.5 mt-0.5 flex-shrink-0">—</span>
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* CTA */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
            <Link
              href={`/pre-design/${typeKey}/checkout?tier=${selected}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: config.color }}
            >
              Continue — {selectedTier.priceLabel} <ArrowRight className="h-5 w-5" />
            </Link>
            <p className="text-sm text-gray-400">
              Secure checkout · Instant confirmation · 2–5 day delivery
            </p>
          </div>

          {/* Review badge */}
          <div className="mt-6 flex items-center gap-2 text-sm text-gray-400">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="ml-1">4.9 · 120+ homeowners</span>
          </div>
        </div>
      </section>
    </div>
  )
}
