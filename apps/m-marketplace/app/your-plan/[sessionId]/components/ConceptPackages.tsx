'use client'

import { Check, Sparkles, Zap, Crown } from 'lucide-react'

interface ConceptPackage {
  id: string
  name: string
  description: string | null
  price: number
  tierLevel: string | null
  features: string[]
}

interface ConceptPackagesData {
  title: string
  subtitle: string
  packages: ConceptPackage[]
}

const TIER_ICONS: Record<string, React.ElementType> = {
  basic: Sparkles,
  enhanced: Zap,
  premium: Crown,
}

const TIER_COLORS: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  basic: { border: 'border-neutral-200', bg: 'bg-white', text: 'text-neutral-900', badge: '' },
  enhanced: { border: 'border-indigo-600', bg: 'bg-indigo-50/30', text: 'text-indigo-700', badge: 'bg-indigo-600' },
  premium: { border: 'border-amber-500', bg: 'bg-amber-50/30', text: 'text-amber-700', badge: 'bg-amber-600' },
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100)
}

export function ConceptPackages({ data }: { data: ConceptPackagesData }) {
  return (
    <section id="concept-packages" className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900">{data.title}</h2>
        <p className="text-neutral-500 mt-2">{data.subtitle}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.packages.map((pkg) => {
          const tier = pkg.tierLevel || 'basic'
          const colors = TIER_COLORS[tier] || TIER_COLORS.basic
          const Icon = TIER_ICONS[tier] || Sparkles
          const isRecommended = tier === 'enhanced'

          return (
            <div
              key={pkg.id}
              className={`rounded-2xl border-2 p-6 relative flex flex-col ${colors.border} ${colors.bg} ${
                isRecommended ? 'shadow-lg scale-[1.02]' : ''
              }`}
            >
              {isRecommended && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}

              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-5 h-5 ${colors.text}`} />
                <h3 className={`text-lg font-bold ${colors.text}`}>{pkg.name}</h3>
              </div>

              <p className="text-4xl font-bold text-neutral-900 mb-1">
                {formatPrice(pkg.price)}
              </p>
              <p className="text-sm text-neutral-500 mb-5">{pkg.description}</p>

              <ul className="space-y-2 mb-6 flex-1">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-neutral-700">
                    <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isRecommended ? 'text-indigo-600' : 'text-green-500'}`} />
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href={`/checkout?package=${pkg.id}`}
                className={`block w-full text-center font-bold py-3 px-6 rounded-xl transition-all active:scale-95 ${
                  isRecommended
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                    : tier === 'premium'
                    ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-200'
                    : 'bg-neutral-900 text-white hover:bg-neutral-800'
                }`}
              >
                Get {pkg.name.replace('AI Concept', '').trim() || 'Started'}
              </a>
            </div>
          )
        })}
      </div>
    </section>
  )
}
