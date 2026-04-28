'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Search, X, ArrowRight, Home, Wrench, Plus, LayoutGrid,
  Building2, Store, Flower2, Shield, Calculator, Users, Zap,
} from 'lucide-react'
import Link from 'next/link'
import { MarketplaceTopbar } from '@/components/marketplace/MarketplaceTopbar'
import { MarketplaceNav } from '@/components/marketplace/MarketplaceNav'
import { MarketplaceFilterBar, type Filters } from '@/components/marketplace/MarketplaceFilterBar'
import { MarketplaceCard, type ContractorCardData } from '@/components/marketplace/MarketplaceCard'
import { EmptyState } from '@/components/ui/EmptyState'

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceItem = {
  slug: string
  label: string
  price: number
  delivery: string
  popular?: boolean
}

type ServiceCategory = {
  id: string
  label: string
  color: string
  bgLight: string
  Icon: React.ElementType
  services: ServiceItem[]
  trades: string[]
}

// ─── Service Category Data ─────────────────────────────────────────────────────

const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'interior',
    label: 'Interior Renovations',
    color: '#7C3AED',
    bgLight: '#F5F3FF',
    Icon: Home,
    services: [
      { slug: 'kitchen_remodel',     label: 'Kitchen Design Package',  price: 395, delivery: '3–5 days', popular: true },
      { slug: 'bathroom_remodel',    label: 'Bathroom Design Package', price: 295, delivery: '2–4 days' },
      { slug: 'interior_reno_concept', label: 'Interior Reno Concept', price: 345, delivery: '3–5 days' },
      { slug: 'interior_renovation', label: 'Interior Renovation',     price: 345, delivery: '3–5 days' },
    ],
    trades: ['General Contractor', 'Flooring', 'Painting', 'Drywall', 'Electrician'],
  },
  {
    id: 'exterior',
    label: 'Exterior Upgrades',
    color: '#E8793A',
    bgLight: '#FFF7ED',
    Icon: Wrench,
    services: [
      { slug: 'exterior_concept',      label: 'Exterior Concept Package', price: 395, delivery: '3–5 days', popular: true },
      { slug: 'capture_site_concept',  label: 'Site Capture + Concept',   price: 125, delivery: '1–2 days' },
      { slug: 'design_build',          label: 'Design + Build Package',   price: 795, delivery: '5–7 days' },
    ],
    trades: ['General Contractor', 'Roofing', 'Painting', 'Masonry', 'Landscaping'],
  },
  {
    id: 'additions',
    label: 'Additions',
    color: '#2ABFBF',
    bgLight: '#F0FDFD',
    Icon: Plus,
    services: [
      { slug: 'addition_expansion', label: 'Addition / Expansion', price: 495, delivery: '3–5 days' },
    ],
    trades: ['General Contractor'],
  },
  {
    id: 'whole-house',
    label: 'Whole House',
    color: '#3B82F6',
    bgLight: '#EFF6FF',
    Icon: LayoutGrid,
    services: [
      { slug: 'whole_home_concept', label: 'Whole Home Concept',  price: 595, delivery: '4–6 days', popular: true },
      { slug: 'whole_home_remodel', label: 'Whole-Home Remodel',  price: 695, delivery: '4–6 days' },
    ],
    trades: ['General Contractor'],
  },
  {
    id: 'new-construction',
    label: 'New Construction',
    color: '#1A2B4A',
    bgLight: '#F0F4FF',
    Icon: Building2,
    services: [
      { slug: 'developer_concept',          label: 'Developer Concept',           price: 795,  delivery: '5–7 days' },
      { slug: 'single_lot_development',     label: 'Single-Lot Development',      price: 899,  delivery: '4–6 days' },
      { slug: 'development_feasibility',    label: 'Feasibility Study',           price: 1499, delivery: '5–7 days' },
      { slug: 'single_family_subdivision',  label: 'Single-Family Subdivision',   price: 1499, delivery: '6–8 days' },
      { slug: 'townhome_subdivision',       label: 'Townhome Subdivision',        price: 1699, delivery: '7–10 days' },
    ],
    trades: ['General Contractor', 'Excavation', 'Steel / Structural'],
  },
  {
    id: 'commercial',
    label: 'Commercial',
    color: '#64748B',
    bgLight: '#F8FAFC',
    Icon: Store,
    services: [
      { slug: 'commercial_office',     label: 'Commercial Office',       price: 1199, delivery: '5–7 days' },
      { slug: 'mixed_use',             label: 'Mixed-Use Concept',       price: 1299, delivery: '6–8 days' },
      { slug: 'multi_unit_residential',label: 'Multi-Unit Residential',  price: 999,  delivery: '5–7 days' },
    ],
    trades: ['General Contractor', 'HVAC', 'Roofing', 'Electrician', 'Plumber'],
  },
  {
    id: 'landscaping',
    label: 'Landscaping',
    color: '#38A169',
    bgLight: '#F0FFF4',
    Icon: Flower2,
    services: [
      { slug: 'garden_concept', label: 'Garden Concept', price: 295, delivery: '2–4 days' },
    ],
    trades: ['Landscaping', 'Masonry', 'Irrigation'],
  },
]

// ─── Cross-Category Services ───────────────────────────────────────────────────

const CROSS_SERVICES = [
  { label: 'Permit Package',    price: '$499', href: '/intake/permit_path_only', Icon: Shield,     desc: 'Permit-ready drawings + submission' },
  { label: 'Cost Estimate',     price: '$595', href: '/intake/cost_estimate',    Icon: Calculator, desc: 'Detailed cost breakdown for bidding' },
  { label: 'Contractor Match',  price: '$199', href: '/intake/contractor_match', Icon: Users,      desc: 'Matched to 3 vetted local contractors' },
]

// ─── Combo Packages ────────────────────────────────────────────────────────────

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
    href: '/products/exterior',
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

// ─── Contractors ───────────────────────────────────────────────────────────────

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

const DEFAULT_FILTERS: Filters = {
  minRating: 0,
  priceRange: '',
  verifiedOnly: false,
  insuredOnly: false,
  sortBy: 'rating',
}

// ─── Service Card ──────────────────────────────────────────────────────────────

function ServiceCard({ service, color }: { service: ServiceItem; color: string }) {
  return (
    <Link
      href={`/intake/${service.slug}`}
      className="group relative flex flex-col rounded-xl bg-white p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
      style={{ border: `1px solid ${color}25`, borderLeft: `3px solid ${color}` }}
    >
      {service.popular && (
        <span
          className="absolute -top-2 right-3 rounded-full px-2 py-0.5 text-xs font-bold text-white"
          style={{ backgroundColor: color }}
        >
          Popular
        </span>
      )}
      <p className="text-sm font-semibold text-gray-900 mb-1">{service.label}</p>
      <p className="text-xs text-gray-400 mb-4">Delivered in {service.delivery}</p>
      <div className="mt-auto flex items-center justify-between">
        <span className="text-lg font-bold" style={{ color: '#1A2B4A' }}>
          ${service.price.toLocaleString()}
        </span>
        <span
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity group-hover:opacity-90"
          style={{ backgroundColor: color }}
        >
          Get Started <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  )
}

// ─── Category Section ──────────────────────────────────────────────────────────

function CategorySection({
  cat,
  activeTrade,
  onTradeClick,
}: {
  cat: ServiceCategory
  activeTrade: string
  onTradeClick: (trade: string) => void
}) {
  const minPrice = Math.min(...cat.services.map(s => s.price))
  return (
    <section id={cat.id} className="scroll-mt-16 rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm">
      {/* ── Category Header ─────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-4 px-6 py-5 border-b border-gray-100"
        style={{ backgroundColor: cat.bgLight }}
      >
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm"
          style={{ backgroundColor: cat.color }}
        >
          <cat.Icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-extrabold text-gray-900 leading-tight">{cat.label}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {cat.services.length} AI-powered service{cat.services.length > 1 ? 's' : ''} · from ${minPrice.toLocaleString()}
          </p>
        </div>
        <div
          className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white shrink-0"
          style={{ backgroundColor: cat.color }}
        >
          {cat.services.length} {cat.services.length === 1 ? 'Service' : 'Services'}
        </div>
      </div>

      {/* ── AI Service Cards ─────────────────────────────────────────────── */}
      <div className="px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-5">
          {cat.services.map(s => (
            <ServiceCard key={s.slug} service={s} color={cat.color} />
          ))}
        </div>

        {/* ── Contractor Trade Chips ──────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100">
          <span className="text-xs font-semibold text-gray-400 mr-1">Find a contractor:</span>
          {cat.trades.map(trade => (
            <button
              key={trade}
              onClick={() => onTradeClick(trade)}
              className="rounded-full border px-3.5 py-1 text-xs font-medium transition-all"
              style={{
                borderColor: activeTrade === trade ? cat.color : '#E5E7EB',
                backgroundColor: activeTrade === trade ? cat.color : '#FFFFFF',
                color: activeTrade === trade ? '#FFFFFF' : '#6B7280',
              }}
            >
              {trade}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [search, setSearch] = useState('')
  const [activeTrade, setActiveTrade] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [activeCatId, setActiveCatId] = useState('interior')
  const [stickyVisible, setStickyVisible] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0 }
    )
    if (heroRef.current) obs.observe(heroRef.current)
    return () => obs.disconnect()
  }, [])

  function scrollToCategory(id: string) {
    setActiveCatId(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleTradeClick(trade: string) {
    setActiveTrade(prev => (prev === trade ? '' : trade))
    document.getElementById('contractor-directory')?.scrollIntoView({ behavior: 'smooth' })
  }

  const filtered = useMemo(() => {
    let results = [...CONTRACTORS]
    if (activeTrade) results = results.filter(c => c.trade === activeTrade)
    if (activeCategory) results = results.filter(c => c.category === activeCategory)
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
    if (filters.minRating > 0) results = results.filter(c => c.rating >= filters.minRating)
    if (filters.priceRange) results = results.filter(c => c.priceRange === filters.priceRange)
    if (filters.verifiedOnly) results = results.filter(c => c.isVerified)
    if (filters.insuredOnly) results = results.filter(c => c.isInsured)
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

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div ref={heroRef} className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-3xl px-4 pt-10 pb-6 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-3xl font-bold sm:text-4xl" style={{ color: '#1A2B4A' }}>
            What are you building?
          </h1>
          <p className="mt-2 text-sm text-gray-500 mb-6">
            AI-powered design, permits, and estimates — plus vetted local contractors.
          </p>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by service, trade, or specialty..."
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

          {/* Category pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {SERVICE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className="flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all"
                style={{
                  borderColor: activeCatId === cat.id ? cat.color : '#E5E7EB',
                  backgroundColor: activeCatId === cat.id ? cat.color : '#FFFFFF',
                  color: activeCatId === cat.id ? '#FFFFFF' : '#374151',
                }}
              >
                <cat.Icon className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Trust strip */}
        <div className="border-t border-gray-100 bg-gray-50 py-3">
          <div className="mx-auto max-w-3xl px-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-green-500" />
              Licensed contractors
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-blue-500" />
              Escrow-protected
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-orange-500" />
              AI-powered
            </span>
          </div>
        </div>
      </div>

      {/* ── STICKY CATEGORY NAV ───────────────────────────────────────────── */}
      <div
        className={`fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 transition-transform duration-200 ${
          stickyVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-2 [scrollbar-width:none]">
            {SERVICE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all"
                style={{
                  backgroundColor: activeCatId === cat.id ? cat.color : 'transparent',
                  color: activeCatId === cat.id ? '#FFFFFF' : '#6B7280',
                }}
              >
                <cat.Icon className="h-3 w-3" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CATEGORY SECTIONS ─────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        {SERVICE_CATEGORIES.map(cat => (
          <CategorySection
            key={cat.id}
            cat={cat}
            activeTrade={activeTrade}
            onTradeClick={handleTradeClick}
          />
        ))}
      </div>

      {/* ── CROSS-CATEGORY STRIP ──────────────────────────────────────────── */}
      <div className="bg-white border-y border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Also Available</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {CROSS_SERVICES.map(s => (
              <Link
                key={s.label}
                href={s.href}
                className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-sm hover:border-[#2ABFBF]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                  <s.Icon className="h-5 w-5 text-gray-500 group-hover:text-[#2ABFBF] transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{s.label}</p>
                  <p className="text-xs text-gray-500 truncate">{s.desc}</p>
                </div>
                <span className="text-sm font-bold text-[#1A2B4A] shrink-0">{s.price}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── COMBO PACKAGES ────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 pt-8 pb-2 sm:px-6 lg:px-8">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Featured Packages</h2>
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

      {/* ── CONTRACTOR DIRECTORY ──────────────────────────────────────────── */}
      <div id="contractor-directory" className="mx-auto max-w-7xl px-4 pt-10 pb-2 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Contractor Directory</h2>
          {activeTrade && (
            <button
              onClick={() => setActiveTrade('')}
              className="flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              {activeTrade} <X className="h-3 w-3 ml-0.5" />
            </button>
          )}
        </div>
      </div>

      <MarketplaceNav
        activeTrade={activeTrade}
        activeCategory={activeCategory}
        onTradeChange={(t) => { setActiveTrade(t) }}
        onCategoryChange={setActiveCategory}
      />

      <MarketplaceFilterBar
        filters={filters}
        resultCount={filtered.length}
        onFiltersChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {filtered.length === 0 ? (
          <EmptyState
            icon="🔍"
            title={activeTrade ? `No ${activeTrade} contractors yet` : 'No contractors found'}
            description={
              activeTrade
                ? 'Be the first to join our contractor network for this trade.'
                : 'Try adjusting your filters or search terms to find contractors in your area.'
            }
            action={
              activeTrade
                ? { label: 'Join Our Network', href: '/contractor/register' }
                : {
                    label: 'Clear Filters',
                    onClick: () => {
                      setFilters(DEFAULT_FILTERS)
                      setActiveTrade('')
                      setActiveCategory('')
                      setSearch('')
                    },
                  }
            }
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
