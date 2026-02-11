'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, SlidersHorizontal, Home, BedDouble, Bath, Car, Ruler, ChevronRight, Star, Heart, X } from 'lucide-react'

const styles = [
  { name: 'Modern Farmhouse', count: 420, slug: 'modern-farmhouse' },
  { name: 'Craftsman', count: 385, slug: 'craftsman' },
  { name: 'Contemporary', count: 310, slug: 'contemporary' },
  { name: 'Ranch', count: 295, slug: 'ranch' },
  { name: 'Colonial', count: 240, slug: 'colonial' },
  { name: 'Mediterranean', count: 185, slug: 'mediterranean' },
  { name: 'Coastal', count: 175, slug: 'coastal' },
  { name: 'Mountain', count: 160, slug: 'mountain' },
  { name: 'Barndominium', count: 140, slug: 'barndominium' },
  { name: 'Cottage', count: 130, slug: 'cottage' },
  { name: 'Tudor', count: 95, slug: 'tudor' },
  { name: 'A-Frame', count: 75, slug: 'a-frame' },
]

const allPlans = [
  {
    slug: 'summit-farmhouse-2450',
    name: 'Summit Farmhouse',
    style: 'Modern Farmhouse',
    sqft: 2450,
    beds: 4,
    baths: 3,
    stories: 2,
    garages: 2,
    price: 1295,
    designer: 'Heritage Home Design',
    designerSlug: 'heritage-home-design',
    rating: 4.9,
    reviews: 47,
    featured: true,
  },
  {
    slug: 'coastal-breeze-1850',
    name: 'Coastal Breeze',
    style: 'Coastal',
    sqft: 1850,
    beds: 3,
    baths: 2.5,
    stories: 1,
    garages: 2,
    price: 1095,
    designer: 'Coastal Architecture Group',
    designerSlug: 'coastal-architecture-group',
    rating: 4.8,
    reviews: 32,
    featured: false,
  },
  {
    slug: 'pacific-modern-3200',
    name: 'Pacific Modern',
    style: 'Contemporary',
    sqft: 3200,
    beds: 5,
    baths: 4,
    stories: 2,
    garages: 3,
    price: 1895,
    designer: 'Pacific Modern Architects',
    designerSlug: 'pacific-modern-architects',
    rating: 4.9,
    reviews: 28,
    featured: true,
  },
  {
    slug: 'hill-country-ranch-2100',
    name: 'Hill Country Ranch',
    style: 'Craftsman',
    sqft: 2100,
    beds: 3,
    baths: 2.5,
    stories: 1,
    garages: 2,
    price: 1195,
    designer: 'Cornerstone Plans',
    designerSlug: 'cornerstone-plans',
    rating: 4.7,
    reviews: 56,
    featured: false,
  },
  {
    slug: 'colonial-estate-3800',
    name: 'Colonial Estate',
    style: 'Colonial',
    sqft: 3800,
    beds: 5,
    baths: 4.5,
    stories: 2,
    garages: 3,
    price: 2195,
    designer: 'Colonial Blueprint Co',
    designerSlug: 'colonial-blueprint-co',
    rating: 4.8,
    reviews: 19,
    featured: false,
  },
  {
    slug: 'prairie-retreat-1650',
    name: 'Prairie Retreat',
    style: 'Ranch',
    sqft: 1650,
    beds: 3,
    baths: 2,
    stories: 1,
    garages: 2,
    price: 895,
    designer: 'Prairie View Studio',
    designerSlug: 'prairie-view-studio',
    rating: 4.6,
    reviews: 41,
    featured: false,
  },
  {
    slug: 'mediterranean-villa-4200',
    name: 'Mediterranean Villa',
    style: 'Mediterranean',
    sqft: 4200,
    beds: 6,
    baths: 5,
    stories: 2,
    garages: 3,
    price: 2495,
    designer: 'Bayshore Designs',
    designerSlug: 'bayshore-designs',
    rating: 4.9,
    reviews: 15,
    featured: true,
  },
  {
    slug: 'alpine-lodge-2800',
    name: 'Alpine Lodge',
    style: 'Mountain',
    sqft: 2800,
    beds: 4,
    baths: 3.5,
    stories: 2,
    garages: 2,
    price: 1595,
    designer: 'Summit Design Studio',
    designerSlug: 'summit-design-studio',
    rating: 4.8,
    reviews: 23,
    featured: false,
  },
  {
    slug: 'modern-barn-2200',
    name: 'Modern Barn',
    style: 'Barndominium',
    sqft: 2200,
    beds: 3,
    baths: 2.5,
    stories: 1,
    garages: 2,
    price: 995,
    designer: 'Heritage Home Design',
    designerSlug: 'heritage-home-design',
    rating: 4.7,
    reviews: 38,
    featured: false,
  },
]

const collections = [
  { name: 'Under 2000 sq ft', description: 'Efficient, well-designed plans for smaller lots', count: 480, slug: 'under-2000-sqft' },
  { name: 'Open Floor Plans', description: 'Flowing layouts perfect for modern living', count: 620, slug: 'open-floor-plans' },
  { name: 'ADU & Guest Houses', description: 'Accessory dwelling units and in-law suites', count: 145, slug: 'adu-guest-houses' },
  { name: 'Energy Efficient', description: 'Green-certified and high-performance designs', count: 210, slug: 'energy-efficient' },
  { name: 'Multi-Family', description: 'Duplexes, triplexes, and townhomes', count: 95, slug: 'multi-family' },
  { name: 'Narrow Lot', description: 'Designs optimized for lots under 50 ft wide', count: 175, slug: 'narrow-lot' },
]

type SortOption = 'popular' | 'newest' | 'price-asc' | 'price-desc' | 'sqft-asc' | 'sqft-desc' | 'rating'

function parseSqftRange(value: string): [number, number] | null {
  switch (value) {
    case 'Under 1,000': return [0, 999]
    case '1,000 - 1,500': return [1000, 1500]
    case '1,500 - 2,000': return [1500, 2000]
    case '2,000 - 2,500': return [2000, 2500]
    case '2,500 - 3,000': return [2500, 3000]
    case '3,000 - 4,000': return [3000, 4000]
    case '4,000+': return [4000, Infinity]
    default: return null
  }
}

export default function StockPlansPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [bedsFilter, setBedsFilter] = useState('')
  const [bathsFilter, setBathsFilter] = useState('')
  const [storiesFilter, setStoriesFilter] = useState('')
  const [garageFilter, setGarageFilter] = useState('')
  const [sqftFilter, setSqftFilter] = useState('')
  const [styleFilter, setStyleFilter] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('popular')

  const hasActiveFilters = searchQuery || bedsFilter || bathsFilter || storiesFilter || garageFilter || sqftFilter || styleFilter

  function clearFilters() {
    setSearchQuery('')
    setBedsFilter('')
    setBathsFilter('')
    setStoriesFilter('')
    setGarageFilter('')
    setSqftFilter('')
    setStyleFilter('')
  }

  const filteredPlans = useMemo(() => {
    let results = [...allPlans]

    // Text search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.style.toLowerCase().includes(q) ||
          p.designer.toLowerCase().includes(q)
      )
    }

    // Style filter
    if (styleFilter) {
      results = results.filter((p) => p.style.toLowerCase().replace(/\s+/g, '-') === styleFilter)
    }

    // Bedrooms
    if (bedsFilter) {
      const min = parseInt(bedsFilter)
      if (!isNaN(min)) results = results.filter((p) => p.beds >= min)
    }

    // Bathrooms
    if (bathsFilter) {
      const min = parseInt(bathsFilter)
      if (!isNaN(min)) results = results.filter((p) => p.baths >= min)
    }

    // Stories
    if (storiesFilter) {
      const val = parseFloat(storiesFilter)
      if (!isNaN(val)) results = results.filter((p) => p.stories === val)
    }

    // Garage
    if (garageFilter === '0') {
      results = results.filter((p) => p.garages === 0)
    } else if (garageFilter) {
      const min = parseInt(garageFilter)
      if (!isNaN(min)) results = results.filter((p) => p.garages >= min)
    }

    // Sq Ft Range
    if (sqftFilter) {
      const range = parseSqftRange(sqftFilter)
      if (range) {
        results = results.filter((p) => p.sqft >= range[0] && p.sqft <= range[1])
      }
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        results.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        results.sort((a, b) => b.price - a.price)
        break
      case 'sqft-asc':
        results.sort((a, b) => a.sqft - b.sqft)
        break
      case 'sqft-desc':
        results.sort((a, b) => b.sqft - a.sqft)
        break
      case 'rating':
        results.sort((a, b) => b.rating - a.rating)
        break
      case 'newest':
        // Reverse the original order as a proxy for newest
        results.reverse()
        break
      case 'popular':
      default:
        results.sort((a, b) => b.reviews - a.reviews)
        break
    }

    return results
  }, [searchQuery, bedsFilter, bathsFilter, storiesFilter, garageFilter, sqftFilter, styleFilter, sortBy])

  function handleStyleClick(slug: string) {
    setStyleFilter(slug === styleFilter ? '' : slug)
  }

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-white border-b border-gray-200 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Stock House Plans
            </h1>
            <p className="text-xl text-gray-600">
              Browse ready-to-build plans from licensed architects and designers on the Kealee platform. Every plan is permit-ready and available for instant download.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-col md:flex-row gap-3"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by plan name, style, or designer..."
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition text-sm"
              >
                <Search className="h-4 w-4" />
                Search Plans
              </button>
            </form>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span className="text-sm text-gray-500 font-medium">Quick filters:</span>
              <div className="flex flex-wrap gap-2">
                <select
                  value={bedsFilter}
                  onChange={(e) => setBedsFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="">Bedrooms</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5+</option>
                </select>
                <select
                  value={bathsFilter}
                  onChange={(e) => setBathsFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="">Bathrooms</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </select>
                <select
                  value={storiesFilter}
                  onChange={(e) => setStoriesFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="">Stories</option>
                  <option value="1">1 Story</option>
                  <option value="1.5">1.5 Stories</option>
                  <option value="2">2 Stories</option>
                  <option value="3">3 Stories</option>
                </select>
                <select
                  value={garageFilter}
                  onChange={(e) => setGarageFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="">Garage</option>
                  <option value="0">None</option>
                  <option value="1">1+ Car</option>
                  <option value="2">2+ Car</option>
                  <option value="3">3+ Car</option>
                </select>
                <select
                  value={sqftFilter}
                  onChange={(e) => setSqftFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="">Sq Ft Range</option>
                  <option>Under 1,000</option>
                  <option>1,000 - 1,500</option>
                  <option>1,500 - 2,000</option>
                  <option>2,000 - 2,500</option>
                  <option>2,500 - 3,000</option>
                  <option>3,000 - 4,000</option>
                  <option>4,000+</option>
                </select>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Browse by Style */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Browse by Style</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {styles.map((style) => (
              <button
                key={style.slug}
                onClick={() => handleStyleClick(style.slug)}
                className={`group rounded-xl border p-4 text-center transition-all ${
                  styleFilter === style.slug
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                    : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className={`w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center transition ${
                  styleFilter === style.slug ? 'bg-blue-100' : 'bg-gray-200 group-hover:bg-blue-100'
                }`}>
                  <Home className={`h-6 w-6 transition ${
                    styleFilter === style.slug ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'
                  }`} />
                </div>
                <p className={`text-sm font-semibold transition ${
                  styleFilter === style.slug ? 'text-blue-600' : 'text-gray-900 group-hover:text-blue-600'
                }`}>{style.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{style.count} plans</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Plan Results */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {hasActiveFilters ? 'Search Results' : 'Featured Plans'}
              </h2>
              <p className="text-gray-600 mt-1">
                {hasActiveFilters
                  ? `${filteredPlans.length} plan${filteredPlans.length !== 1 ? 's' : ''} found`
                  : 'Hand-picked designs from top platform architects'}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="popular">Sort: Most Popular</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="sqft-asc">Sq Ft: Small to Large</option>
                <option value="sqft-desc">Sq Ft: Large to Small</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Active filter tags */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  &ldquo;{searchQuery}&rdquo;
                  <button onClick={() => setSearchQuery('')} className="hover:text-blue-900"><X className="h-3 w-3" /></button>
                </span>
              )}
              {styleFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  Style: {styles.find(s => s.slug === styleFilter)?.name}
                  <button onClick={() => setStyleFilter('')} className="hover:text-blue-900"><X className="h-3 w-3" /></button>
                </span>
              )}
              {bedsFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  {bedsFilter}+ Beds
                  <button onClick={() => setBedsFilter('')} className="hover:text-blue-900"><X className="h-3 w-3" /></button>
                </span>
              )}
              {bathsFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  {bathsFilter}+ Baths
                  <button onClick={() => setBathsFilter('')} className="hover:text-blue-900"><X className="h-3 w-3" /></button>
                </span>
              )}
              {storiesFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  {storiesFilter} {parseFloat(storiesFilter) === 1 ? 'Story' : 'Stories'}
                  <button onClick={() => setStoriesFilter('')} className="hover:text-blue-900"><X className="h-3 w-3" /></button>
                </span>
              )}
              {garageFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  {garageFilter === '0' ? 'No Garage' : `${garageFilter}+ Car Garage`}
                  <button onClick={() => setGarageFilter('')} className="hover:text-blue-900"><X className="h-3 w-3" /></button>
                </span>
              )}
              {sqftFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  {sqftFilter} sqft
                  <button onClick={() => setSqftFilter('')} className="hover:text-blue-900"><X className="h-3 w-3" /></button>
                </span>
              )}
            </div>
          )}

          {/* Plan Grid */}
          {filteredPlans.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.map((plan) => (
                <PlanCard key={plan.slug} plan={plan} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Home className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No plans match your filters</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search criteria or clearing some filters.</p>
              <button
                onClick={clearFilters}
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition text-sm"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Collections */}
      <section className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Popular Collections</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((col) => (
              <Link
                key={col.slug}
                href={`/plans?collection=${col.slug}`}
                className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition">
                  <Home className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">{col.name}</h3>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition" />
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{col.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{col.count} plans</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Designers */}
      <section className="py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Featured Designers</h2>
              <p className="text-gray-600 mt-1">Licensed architects showcasing their best work</p>
            </div>
            <Link href="/plans/designers" className="text-sm text-blue-600 hover:underline font-medium">
              View All Designers
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Heritage Home Design', location: 'Nashville, TN', specialty: 'Modern Farmhouse', plans: 185, slug: 'heritage-home-design' },
              { name: 'Pacific Modern Architects', location: 'Portland, OR', specialty: 'Contemporary', plans: 142, slug: 'pacific-modern-architects' },
              { name: 'Cornerstone Plans', location: 'Austin, TX', specialty: 'Craftsman', plans: 210, slug: 'cornerstone-plans' },
              { name: 'Summit Design Studio', location: 'Denver, CO', specialty: 'Mountain Modern', plans: 168, slug: 'summit-design-studio' },
            ].map((designer) => (
              <Link
                key={designer.slug}
                href={`/plans/designers/${designer.slug}`}
                className="group rounded-xl border border-gray-200 bg-white p-5 hover:border-blue-300 hover:shadow-md transition-all text-center"
              >
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <span className="text-blue-700 font-bold text-lg">{designer.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">{designer.name}</h3>
                <p className="text-sm text-gray-500">{designer.location}</p>
                <span className="inline-block mt-2 px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{designer.specialty}</span>
                <p className="text-sm text-gray-600 mt-2">{designer.plans} plans</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">How Stock Plans Work</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Browse & Select', description: 'Search by style, size, or features. Preview floor plans and elevations.' },
              { step: '2', title: 'Choose Your Package', description: 'Select PDF, CAD, or Reproducible plan sets based on your build needs.' },
              { step: '3', title: 'Customize If Needed', description: 'Request modifications through our platform architects for a perfect fit.' },
              { step: '4', title: 'Build With Confidence', description: 'Plans are permit-ready. Connect with Kealee services for permits, estimation, and PM.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 mx-auto bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Designers CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Are You an Architect or Designer?</h2>
          <p className="text-lg opacity-95 mb-8 max-w-2xl mx-auto">
            Showcase your plans to thousands of builders and homeowners on the Kealee platform. Earn revenue from every plan sold.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition"
            >
              List Your Plans
            </Link>
            <Link
              href="/plans/designers"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition"
            >
              See Current Designers
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ── Plan Card Component ────────────────────────────────── */
function PlanCard({ plan }: { plan: typeof allPlans[number] }) {
  return (
    <Link
      href={`/plans/${plan.slug}`}
      className="group rounded-2xl border border-gray-200 bg-white overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all"
    >
      {/* Image Placeholder */}
      <div className="relative aspect-[4/3] bg-gray-200">
        <div className="absolute inset-0 flex items-center justify-center">
          <Home className="h-12 w-12 text-gray-300" />
        </div>
        {plan.featured && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg">
            FEATURED
          </span>
        )}
        <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition" aria-label="Save plan">
          <Heart className="h-4 w-4 text-gray-400" />
        </button>
        <div className="absolute bottom-3 left-3">
          <span className="px-2.5 py-1 bg-white/90 text-gray-700 text-xs font-semibold rounded-lg">
            {plan.style}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
            {plan.name}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-medium text-gray-700">{plan.rating}</span>
            <span className="text-xs text-gray-400">({plan.reviews})</span>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-0.5">
          by{' '}
          <span className="text-blue-600 hover:underline">{plan.designer}</span>
        </p>

        {/* Specs */}
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5" />
            {plan.beds} bd
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-3.5 w-3.5" />
            {plan.baths} ba
          </span>
          <span className="flex items-center gap-1">
            <Ruler className="h-3.5 w-3.5" />
            {plan.sqft.toLocaleString()} sqft
          </span>
          <span className="flex items-center gap-1">
            <Car className="h-3.5 w-3.5" />
            {plan.garages}
          </span>
        </div>

        {/* Price */}
        <div className="mt-3 flex items-center justify-between">
          <p className="text-lg font-bold text-gray-900">
            From ${plan.price.toLocaleString()}
          </p>
          <span className="text-xs text-gray-500">
            {plan.stories === 1 ? '1 Story' : `${plan.stories} Stories`}
          </span>
        </div>
      </div>
    </Link>
  )
}
