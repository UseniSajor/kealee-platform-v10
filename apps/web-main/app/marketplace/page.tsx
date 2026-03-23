'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { MarketplaceTopbar } from '@/components/marketplace/MarketplaceTopbar'
import { MarketplaceNav } from '@/components/marketplace/MarketplaceNav'
import { MarketplaceFilterBar } from '@/components/marketplace/MarketplaceFilterBar'
import { MarketplaceCard, type ContractorCardData } from '@/components/marketplace/MarketplaceCard'
import { EmptyState } from '@/components/ui/EmptyState'

// Mock contractor data — replace with API calls when backend is integrated
const CONTRACTORS: ContractorCardData[] = [
  {
    id: 'c1',
    name: 'Carlos Rivera',
    company: 'Summit Build Group',
    trade: 'General Contractor',
    category: 'residential',
    rating: 4.9,
    reviewCount: 87,
    location: 'Bethesda, MD',
    yearsExperience: 18,
    projectsCompleted: 214,
    isVerified: true,
    isInsured: true,
    responseTime: '< 2hr',
    priceRange: 'mid',
    specialties: ['Kitchen', 'Additions', 'New Construction'],
    bio: 'Specializing in high-end residential renovations and additions across Montgomery County. Known for transparent communication and on-time delivery.',
    initials: 'CR',
    accentColor: '#1A2B4A',
  },
  {
    id: 'c2',
    name: 'Dana Kim',
    company: 'Precision Electric Co',
    trade: 'Electrician',
    category: 'residential',
    rating: 4.8,
    reviewCount: 63,
    location: 'Silver Spring, MD',
    yearsExperience: 12,
    projectsCompleted: 155,
    isVerified: true,
    isInsured: true,
    responseTime: '< 4hr',
    priceRange: 'mid',
    specialties: ['Panel Upgrades', 'EV Charging', 'Remodels'],
    bio: 'Master electrician with expertise in residential panel upgrades, EV charger installation, and whole-home rewires.',
    initials: 'DK',
    accentColor: '#E8793A',
  },
  {
    id: 'c3',
    name: 'Marcus Thompson',
    company: 'Capitol Plumbing Solutions',
    trade: 'Plumber',
    category: 'commercial',
    rating: 4.7,
    reviewCount: 42,
    location: 'Washington, DC',
    yearsExperience: 9,
    projectsCompleted: 98,
    isVerified: true,
    isInsured: true,
    responseTime: '< 6hr',
    priceRange: 'budget',
    specialties: ['Commercial Fit-Out', 'Rough Plumbing', 'Water Heaters'],
    bio: 'Commercial and residential plumber focused on new construction rough-in, tenant fit-outs, and emergency service.',
    initials: 'MT',
    accentColor: '#2ABFBF',
  },
  {
    id: 'c4',
    name: 'Elena Santos',
    company: 'Prestige Interiors DC',
    trade: 'General Contractor',
    category: 'multifamily',
    rating: 5.0,
    reviewCount: 31,
    location: 'Arlington, VA',
    yearsExperience: 14,
    projectsCompleted: 67,
    isVerified: true,
    isInsured: true,
    responseTime: '< 1hr',
    priceRange: 'premium',
    specialties: ['Luxury Residential', 'Multifamily', 'Historic Renovation'],
    bio: 'Award-winning GC specializing in luxury renovations and multifamily gut rehabs in the DC metro area.',
    initials: 'ES',
    accentColor: '#38A169',
  },
  {
    id: 'c5',
    name: 'James Wu',
    company: 'ComfortPro HVAC',
    trade: 'HVAC',
    category: 'residential',
    rating: 4.6,
    reviewCount: 58,
    location: 'Rockville, MD',
    yearsExperience: 11,
    projectsCompleted: 189,
    isVerified: true,
    isInsured: false,
    responseTime: '< 8hr',
    priceRange: 'mid',
    specialties: ['Mini-Splits', 'Heat Pumps', 'Commercial HVAC'],
    bio: 'NATE-certified HVAC technician specializing in heat pump and mini-split installations for new construction and retrofits.',
    initials: 'JW',
    accentColor: '#1A2B4A',
  },
  {
    id: 'c6',
    name: 'Priya Patel',
    company: 'Patel Framing Corp',
    trade: 'Framing',
    category: 'multifamily',
    rating: 4.8,
    reviewCount: 24,
    location: 'Baltimore, MD',
    yearsExperience: 16,
    projectsCompleted: 78,
    isVerified: true,
    isInsured: true,
    responseTime: '< 12hr',
    priceRange: 'mid',
    specialties: ['Wood Framing', 'Steel Stud', 'Multifamily'],
    bio: 'Framing specialist with deep experience in multifamily wood-frame construction across the Baltimore metro.',
    initials: 'PP',
    accentColor: '#E8793A',
  },
]

const DEFAULT_FILTERS = {
  search: '',
  minRating: 0,
  priceRange: '',
  verifiedOnly: false,
  insuredOnly: false,
  sortBy: 'rating' as const,
}

export default function MarketplacePage() {
  const [activeTrade, setActiveTrade] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  const filtered = useMemo(() => {
    let results = [...CONTRACTORS]

    if (activeTrade) {
      results = results.filter(c => c.trade === activeTrade)
    }
    if (activeCategory) {
      results = results.filter(c => c.category === activeCategory)
    }
    if (filters.search) {
      const q = filters.search.toLowerCase()
      results = results.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.trade.toLowerCase().includes(q) ||
          c.specialties.some(s => s.toLowerCase().includes(q))
      )
    }
    if (filters.minRating > 0) {
      results = results.filter(c => c.rating >= filters.minRating)
    }
    if (filters.priceRange) {
      results = results.filter(c => c.priceRange === filters.priceRange)
    }
    if (filters.verifiedOnly) {
      results = results.filter(c => c.isVerified)
    }
    if (filters.insuredOnly) {
      results = results.filter(c => c.isInsured)
    }

    // Sort
    results.sort((a, b) => {
      if (filters.sortBy === 'rating') return b.rating - a.rating
      if (filters.sortBy === 'reviews') return b.reviewCount - a.reviewCount
      if (filters.sortBy === 'experience') return b.yearsExperience - a.yearsExperience
      return 0
    })

    return results
  }, [activeTrade, activeCategory, filters])

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7FAFC' }}>
      {/* Topbar — rows 1 + 2: brand/roles/auth + utility links */}
      <MarketplaceTopbar />

      {/* Hero */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold sm:text-3xl" style={{ color: '#1A2B4A' }}>
                Vetted Contractors, Every Trade
              </h1>
              <p className="mt-1.5 text-sm text-gray-500">
                Licensed, insured, background-checked, and reputation-scored professionals in the DC-Baltimore corridor.
              </p>
            </div>
            <Link
              href="/contractor/register"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1A2B4A' }}
            >
              Join as GC / Contractor <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* AI Concept Engine banner */}
        <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
          <div
            className="flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between"
            style={{ backgroundColor: 'rgba(232,121,58,0.07)', border: '1px solid rgba(232,121,58,0.2)' }}
          >
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0" style={{ color: '#E8793A' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>Get an AI Concept Design first — then match to a contractor</p>
                <p className="text-xs text-gray-500 mt-0.5">Property-specific design concepts starting at $395. Exterior, garden, whole home, interior reno, and developer packages available.</p>
              </div>
            </div>
            <Link
              href="/concept-engine"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#E8793A' }}
            >
              Start AI Concept <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Row 3 — Nav: trade + category filters */}
      <MarketplaceNav
        activeTrade={activeTrade}
        activeCategory={activeCategory}
        onTradeChange={setActiveTrade}
        onCategoryChange={setActiveCategory}
      />

      {/* Filters */}
      <MarketplaceFilterBar
        filters={filters}
        resultCount={filtered.length}
        onFiltersChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {filtered.length === 0 ? (
          <EmptyState
            icon="search"
            title="No contractors found"
            description="Try adjusting your filters or search terms to find contractors in your area."
            action={{
              label: 'Clear Filters',
              onClick: () => {
                setFilters(DEFAULT_FILTERS)
                setActiveTrade('')
                setActiveCategory('')
              },
            }}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(contractor => (
              <MarketplaceCard key={contractor.id} contractor={contractor} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
