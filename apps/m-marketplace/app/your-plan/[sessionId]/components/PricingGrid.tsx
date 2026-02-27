'use client'

import { Check, Star } from 'lucide-react'

interface PricingTier {
  label: string
  price: number
  description: string
  features: string[]
}

interface PricingGridData {
  title: string
  tiers: PricingTier[]
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export function PricingGrid({ data }: { data: PricingGridData }) {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-neutral-900">{data.title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.tiers.map((tier, idx) => {
          const isMid = idx === 1
          return (
            <div
              key={tier.label}
              className={`rounded-2xl border-2 p-6 relative ${
                isMid ? 'border-indigo-600 bg-indigo-50/30 shadow-lg' : 'border-neutral-100 bg-white'
              }`}
            >
              {isMid && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Recommended
                </span>
              )}
              <h3 className={`text-lg font-bold mb-1 ${isMid ? 'text-indigo-700' : 'text-neutral-900'}`}>
                {tier.label}
              </h3>
              <p className="text-3xl font-bold text-neutral-900 mb-2">
                {formatCurrency(tier.price)}
              </p>
              <p className="text-sm text-neutral-500 mb-4">{tier.description}</p>
              <ul className="space-y-2">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-neutral-700">
                    <Check className={`w-4 h-4 shrink-0 ${isMid ? 'text-indigo-600' : 'text-green-500'}`} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}
