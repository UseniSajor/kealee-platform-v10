'use client'

import { SlidersHorizontal, X } from 'lucide-react'

export interface Filters {
  minRating: number
  priceRange: string
  verifiedOnly: boolean
  insuredOnly: boolean
  sortBy: 'rating' | 'reviews' | 'experience' | 'newest'
}

interface MarketplaceFilterBarProps {
  filters: Filters
  resultCount: number
  onFiltersChange: (filters: Filters) => void
  onReset: () => void
}

const SORT_OPTIONS = [
  { value: 'rating', label: 'Highest Rated' },
  { value: 'reviews', label: 'Most Reviews' },
  { value: 'experience', label: 'Most Experience' },
  { value: 'newest', label: 'Newest' },
] as const

const PRICE_OPTIONS = [
  { value: '', label: 'Any Price' },
  { value: 'budget', label: '$ Budget' },
  { value: 'mid', label: '$$ Mid-Range' },
  { value: 'premium', label: '$$$ Premium' },
]

export function MarketplaceFilterBar({
  filters,
  resultCount,
  onFiltersChange,
  onReset,
}: MarketplaceFilterBarProps) {
  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    onFiltersChange({ ...filters, [key]: value })
  }

  const hasActiveFilters =
    filters.minRating > 0 ||
    filters.priceRange ||
    filters.verifiedOnly ||
    filters.insuredOnly

  return (
    <div className="border-b border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 flex-shrink-0 text-gray-400" />

            {/* Min rating */}
            <select
              value={filters.minRating}
              onChange={e => update('minRating', Number(e.target.value))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
            >
              <option value={0}>Any Rating</option>
              <option value={4}>4+ Stars</option>
              <option value={4.5}>4.5+ Stars</option>
            </select>

            {/* Price range */}
            <select
              value={filters.priceRange}
              onChange={e => update('priceRange', e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
            >
              {PRICE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={filters.sortBy}
              onChange={e => update('sortBy', e.target.value as Filters['sortBy'])}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Toggle: verified */}
            <button
              onClick={() => update('verifiedOnly', !filters.verifiedOnly)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                filters.verifiedOnly
                  ? 'border-teal-400 bg-teal-50 text-teal-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              Verified
            </button>

            {/* Toggle: insured */}
            <button
              onClick={() => update('insuredOnly', !filters.insuredOnly)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                filters.insuredOnly
                  ? 'border-teal-400 bg-teal-50 text-teal-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              Insured
            </button>

            {hasActiveFilters && (
              <button
                onClick={onReset}
                className="flex items-center gap-1 text-sm text-gray-400 underline hover:text-gray-600"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
          <span className="ml-auto text-xs text-gray-400">
            {resultCount} contractor{resultCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}
