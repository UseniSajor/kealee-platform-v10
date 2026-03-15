'use client'

import { Search, SlidersHorizontal, X } from 'lucide-react'

interface Filters {
  search: string
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
    filters.search ||
    filters.minRating > 0 ||
    filters.priceRange ||
    filters.verifiedOnly ||
    filters.insuredOnly

  return (
    <div className="border-b border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={e => update('search', e.target.value)}
              placeholder="Search contractors, companies, specialties..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm placeholder-gray-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
            />
            {filters.search && (
              <button
                onClick={() => update('search', '')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

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
        </div>

        {/* Result count */}
        <p className="mt-2 text-xs text-gray-400">
          {resultCount} contractor{resultCount !== 1 ? 's' : ''} found
        </p>
      </div>
    </div>
  )
}
