'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const TRADES = [
  'All Trades',
  'General Contractor',
  'Electrician',
  'Plumber',
  'HVAC',
  'Framing',
  'Drywall',
  'Flooring',
  'Roofing',
  'Masonry',
  'Painting',
  'Landscaping',
  'Excavation',
  'Steel / Structural',
]

const CATEGORIES = [
  { label: 'All Projects', value: '' },
  { label: 'Residential', value: 'residential' },
  { label: 'Multifamily', value: 'multifamily' },
  { label: 'Commercial', value: 'commercial' },
  { label: 'Government', value: 'government' },
  { label: 'Infrastructure', value: 'infrastructure' },
]

interface MarketplaceNavProps {
  activeTrade: string
  activeCategory: string
  onTradeChange: (trade: string) => void
  onCategoryChange: (cat: string) => void
}

export function MarketplaceNav({
  activeTrade,
  activeCategory,
  onTradeChange,
  onCategoryChange,
}: MarketplaceNavProps) {
  const [tradeOpen, setTradeOpen] = useState(false)

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Category tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => onCategoryChange(cat.value)}
              className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeCategory === cat.value
                  ? 'text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={
                activeCategory === cat.value
                  ? { backgroundColor: '#1A2B4A' }
                  : {}
              }
            >
              {cat.label}
            </button>
          ))}

          {/* Divider */}
          <div className="mx-2 h-5 w-px flex-shrink-0 bg-gray-200" />

          {/* Trade dropdown */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setTradeOpen(v => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              {activeTrade || 'All Trades'}
              <ChevronDown className={`h-4 w-4 transition-transform ${tradeOpen ? 'rotate-180' : ''}`} />
            </button>

            {tradeOpen && (
              <div className="absolute left-0 top-full z-20 mt-1 w-52 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                {TRADES.map(trade => (
                  <button
                    key={trade}
                    onClick={() => {
                      onTradeChange(trade === 'All Trades' ? '' : trade)
                      setTradeOpen(false)
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                      (activeTrade || 'All Trades') === trade
                        ? 'font-semibold'
                        : 'text-gray-700'
                    }`}
                    style={
                      (activeTrade || 'All Trades') === trade
                        ? { color: '#2ABFBF' }
                        : {}
                    }
                  >
                    {trade}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
