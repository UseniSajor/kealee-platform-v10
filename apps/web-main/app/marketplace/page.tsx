'use client'

import { useState, useMemo } from 'react'
import { Search, X, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { MarketplaceTopbar } from '@/components/marketplace/MarketplaceTopbar'
import { MarketplaceNav } from '@/components/marketplace/MarketplaceNav'
import { MarketplaceFilterBar } from '@/components/marketplace/MarketplaceFilterBar'
import { MarketplaceCard, type ContractorCardData } from '@/components/marketplace/MarketplaceCard'
import { EmptyState } from '@/components/ui/EmptyState'

// Project types organized in 5 buckets
const PROJECT_TYPE_BUCKETS = [
  {
    bucket: 'Interior Renovations',
    color: '#7C3AED',
    types: [
      { label: 'Kitchen Remodel',     trade: 'General Contractor' },
      { label: 'Bathroom Remodel',    trade: 'General Contractor' },
      { label: 'Master Bath',         trade: 'General Contractor' },
      { label: 'Basement Finish',     trade: 'General Contractor' },
      { label: 'Flooring',            trade: 'Flooring' },
      { label: 'Interior Painting',   trade: 'Painting' },
      { label: 'Drywall',             trade: 'Drywall' },
      { label: 'Closet & Storage',    trade: 'General Contractor' },
      { label: 'Home Theater / AV',   trade: 'Electrician' },
    ],
  },
  {
    bucket: 'Exterior Improvements',
    color: '#E8793A',
    types: [
      { label: 'Roof Replacement',    trade: 'Roofing' },
      { label: 'Siding & Cladding',   trade: 'General Contractor' },
      { label: 'Windows & Doors',     trade: 'General Contractor' },
      { label: 'Deck & Patio',        trade: 'General Contractor' },
      { label: 'Fence & Gate',        trade: 'General Contractor' },
      { label: 'Driveway & Hardscape',trade: 'Masonry' },
      { label: 'Exterior Painting',   trade: 'Painting' },
      { label: 'Gutters',             trade: 'General Contractor' },
      { label: 'Landscaping',         trade: 'Landscaping' },
      { label: 'Outdoor Kitchen',     trade: 'General Contractor' },
    ],
  },
  {
    bucket: 'Additions & Structures',
    color: '#2ABFBF',
    types: [
      { label: 'Addition / Bump-Out', trade: 'General Contractor' },
      { label: 'ADU / Garage Conversion', trade: 'General Contractor' },
      { label: 'Whole-Home Renovation',   trade: 'General Contractor' },
      { label: 'New Construction',        trade: 'General Contractor' },
      { label: 'Pool & Hot Tub',          trade: 'General Contractor' },
    ],
  },
  {
    bucket: 'Specialty Trade',
    color: '#38A169',
    types: [
      { label: 'HVAC / Heat Pump',   trade: 'HVAC' },
      { label: 'Electrical Panel',   trade: 'Electrician' },
      { label: 'EV Charger Install', trade: 'Electrician' },
      { label: 'Solar',              trade: 'Electrician' },
      { label: 'Plumbing',           trade: 'Plumber' },
      { label: 'Water Heater',       trade: 'Plumber' },
      { label: 'Insulation',         trade: 'General Contractor' },
      { label: 'Irrigation',         trade: 'Landscaping' },
    ],
  },
  {
    bucket: 'Property & Multifamily',
    color: '#1A2B4A',
    types: [
      { label: 'Multifamily Renovation', trade: 'General Contractor' },
      { label: 'Office Fit-Out',         trade: 'General Contractor' },
      { label: 'Retail Build-Out',       trade: 'General Contractor' },
      { label: 'Restaurant Renovation',  trade: 'General Contractor' },
      { label: 'Warehouse / Industrial', trade: 'Steel / Structural' },
      { label: 'Commercial Roofing',     trade: 'Roofing' },
      { label: 'Commercial HVAC',        trade: 'HVAC' },
      { label: 'ADA Compliance',         trade: 'General Contractor' },
      { label: 'Parking & Site Work',    trade: 'Excavation' },
    ],
  },
]

// Flattened for filtering
const PROJECT_TYPES = PROJECT_TYPE_BUCKETS.flatMap(b =>
  b.types.map(t => ({ ...t, group: b.bucket }))
)

// Combo packages
const COMBO_PACKAGES = [
  {
    name: 'Design + Permit Starter',
    desc: 'AI concept → permit-ready plans → permit submission',
    price: 'From $2,095',
    href: '/design-services',
    color: '#2ABFBF',
  },
  {
    name: 'Concept + Estimate',
    desc: 'AI concept design + detailed cost estimate for contractor bidding',
    price: 'From $990',
    href: '/estimate',
    color: '#E8793A',
  },
  {
    name: 'Permit + Owner Oversight',
    desc: 'Full permit package + Owner Portal for milestone tracking',
    price: 'From $597',
    href: '/permits',
    color: '#38A169',
  },
  {
    name: 'Exterior Upgrade Package',
    desc: 'Exterior AI concept + contractor match + milestone payments',
    price: 'From $595',
    href: '/concept-engine/exterior',
    color: '#7C3AED',
  },
  {
    name: 'ADU Complete',
    desc: 'ADU concept + design services + permit + contractor match',
    price: 'From $3,499',
    href: '/contact',
    color: '#1A2B4A',
  },
]

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
  minRating: 0,
  priceRange: '',
  verifiedOnly: false,
  insuredOnly: false,
  sortBy: 'rating' as const,
}

export default function MarketplacePage() {
  const [search, setSearch] = useState('')
  const [activeTrade, setActiveTrade] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [activeProjectType, setActiveProjectType] = useState('')

  function handleProjectType(label: string, trade: string) {
    if (activeProjectType === label) {
      setActiveProjectType('')
      setActiveTrade('')
    } else {
      setActiveProjectType(label)
      setActiveTrade(trade)
    }
  }

  const filtered = useMemo(() => {
    let results = [...CONTRACTORS]

    if (activeTrade) {
      results = results.filter(c => c.trade === activeTrade)
    }
    if (activeCategory) {
      results = results.filter(c => c.category === activeCategory)
    }
    if (search) {
      const q = search.toLowerCase()
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

    results.sort((a, b) => {
      if (filters.sortBy === 'rating') return b.rating - a.rating
      if (filters.sortBy === 'reviews') return b.reviewCount - a.reviewCount
      if (filters.sortBy === 'experience') return b.yearsExperience - a.yearsExperience
      return 0
    })

    return results
  }, [activeTrade, activeCategory, search, filters])

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7FAFC' }}>
      <MarketplaceTopbar />

      {/* Hero — search focused */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="font-display text-2xl font-bold text-center sm:text-3xl" style={{ color: '#1A2B4A' }}>
            Find a Contractor
          </h1>
          <p className="mt-1.5 text-sm text-center text-gray-500 mb-5">
            Licensed, insured, and background-checked professionals in the DC–Baltimore corridor.
          </p>

          {/* Big search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by trade, company, specialty, or location..."
              className="w-full rounded-2xl border border-gray-200 py-3.5 pl-12 pr-12 text-sm shadow-sm placeholder-gray-400 focus:border-[#2ABFBF] focus:outline-none focus:ring-2 focus:ring-[#2ABFBF]/20"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Project type chips — 5 bucket groups */}
        <div className="mx-auto max-w-7xl px-4 pb-5 sm:px-6 lg:px-8 space-y-4">
          {PROJECT_TYPE_BUCKETS.map((bucket) => (
            <div key={bucket.bucket}>
              <p
                className="mb-2 text-xs font-bold uppercase tracking-wider"
                style={{ color: bucket.color }}
              >
                {bucket.bucket}
              </p>
              <div className="flex flex-wrap gap-2">
                {bucket.types.map((pt) => {
                  const active = activeProjectType === pt.label
                  return (
                    <button
                      key={pt.label}
                      onClick={() => handleProjectType(pt.label, pt.trade)}
                      className="rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all"
                      style={{
                        borderColor: active ? bucket.color : '#E5E7EB',
                        backgroundColor: active ? bucket.color : '#FFFFFF',
                        color: active ? '#FFFFFF' : '#374151',
                      }}
                    >
                      {pt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 3 — Nav: trade + category filters */}
      <MarketplaceNav
        activeTrade={activeTrade}
        activeCategory={activeCategory}
        onTradeChange={(t) => { setActiveTrade(t); setActiveProjectType('') }}
        onCategoryChange={setActiveCategory}
      />

      {/* Filters (no search — it's in the hero) */}
      <MarketplaceFilterBar
        filters={filters}
        resultCount={filtered.length}
        onFiltersChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {/* Combo packages */}
      <div className="mx-auto max-w-7xl px-4 pt-8 pb-2 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Featured Packages</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {COMBO_PACKAGES.map(pkg => (
            <Link
              key={pkg.name}
              href={pkg.href}
              className="group flex flex-col rounded-xl bg-white p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ border: `1px solid ${pkg.color}30` }}
            >
              <div className="h-0.5 w-8 rounded-full mb-3" style={{ backgroundColor: pkg.color }} />
              <p className="text-xs font-bold mb-1" style={{ color: pkg.color }}>{pkg.name}</p>
              <p className="flex-1 text-xs text-gray-500 leading-relaxed mb-2">{pkg.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: '#1A2B4A' }}>{pkg.price}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" style={{ color: pkg.color }} />
              </div>
            </Link>
          ))}
        </div>
      </div>

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
                setSearch('')
                setActiveProjectType('')
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
