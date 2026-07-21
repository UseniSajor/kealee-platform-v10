import { Metadata } from 'next'
import Link from 'next/link'
import {
  Search,
  Star,
  MapPin,
  Users,
  FileText,
  Globe,
  ArrowRight,
  Compass,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Featured Designers & Architects | Kealee Stock Plans',
  description:
    'Browse our directory of licensed architects and designers showcasing ready-to-build stock house plans. Find the right designer for your dream home.',
}

const DESIGNERS = [
  {
    slug: 'summit-design-studio',
    name: 'Summit Design Studio',
    initials: 'SD',
    location: 'Denver, CO',
    specialty: 'Mountain Modern',
    planCount: 142,
    rating: 4.9,
    reviews: 87,
    color: 'bg-blue-600',
  },
  {
    slug: 'coastal-architecture-group',
    name: 'Coastal Architecture Group',
    initials: 'CA',
    location: 'Charleston, SC',
    specialty: 'Lowcountry / Coastal',
    planCount: 98,
    rating: 4.8,
    reviews: 64,
    color: 'bg-teal-600',
  },
  {
    slug: 'heritage-home-design',
    name: 'Heritage Home Design',
    initials: 'HH',
    location: 'Nashville, TN',
    specialty: 'Modern Farmhouse',
    planCount: 215,
    rating: 5.0,
    reviews: 132,
    color: 'bg-amber-700',
  },
  {
    slug: 'pacific-modern-architects',
    name: 'Pacific Modern Architects',
    initials: 'PM',
    location: 'Portland, OR',
    specialty: 'Contemporary / NW Modern',
    planCount: 76,
    rating: 4.7,
    reviews: 51,
    color: 'bg-emerald-700',
  },
  {
    slug: 'cornerstone-plans',
    name: 'Cornerstone Plans',
    initials: 'CP',
    location: 'Austin, TX',
    specialty: 'Hill Country / Craftsman',
    planCount: 184,
    rating: 4.9,
    reviews: 109,
    color: 'bg-orange-600',
  },
  {
    slug: 'bayshore-designs',
    name: 'Bayshore Designs',
    initials: 'BD',
    location: 'Tampa, FL',
    specialty: 'Mediterranean / Tropical',
    planCount: 121,
    rating: 4.6,
    reviews: 73,
    color: 'bg-cyan-700',
  },
  {
    slug: 'prairie-view-studio',
    name: 'Prairie View Studio',
    initials: 'PV',
    location: 'Minneapolis, MN',
    specialty: 'Prairie / Scandinavian',
    planCount: 63,
    rating: 4.8,
    reviews: 42,
    color: 'bg-violet-600',
  },
  {
    slug: 'colonial-blueprint-co',
    name: 'Colonial Blueprint Co.',
    initials: 'CB',
    location: 'Alexandria, VA',
    specialty: 'Colonial / Traditional',
    planCount: 197,
    rating: 4.7,
    reviews: 95,
    color: 'bg-red-700',
  },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= Math.floor(rating)
              ? 'text-amber-400 fill-amber-400'
              : i - 0.5 <= rating
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300'
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-semibold text-gray-700">{rating}</span>
    </div>
  )
}

export default function DesignerDirectoryPage() {
  const totalPlans = DESIGNERS.reduce((sum, d) => sum + d.planCount, 0)

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Compass className="w-6 h-6 text-blue-200" />
            <span className="text-sm font-semibold text-blue-200 uppercase tracking-wider">
              Stock Plans Marketplace
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Featured Designers &amp; Architects
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Discover talented architects and designers showcasing their best
            ready-to-build stock plans. Browse portfolios, compare styles, and
            find the plan that fits your vision.
          </p>
        </div>
      </section>

      {/* Search Bar */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search designers by name or specialty..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              readOnly
            />
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2 text-blue-600">
                <Users className="w-5 h-5" />
                <span className="text-2xl font-bold">45+</span>
              </div>
              <span className="text-sm text-gray-500 font-medium">Designers</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2 text-blue-600">
                <FileText className="w-5 h-5" />
                <span className="text-2xl font-bold">2,800+</span>
              </div>
              <span className="text-sm text-gray-500 font-medium">Plans</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2 text-blue-600">
                <Globe className="w-5 h-5" />
                <span className="text-2xl font-bold">50</span>
              </div>
              <span className="text-sm text-gray-500 font-medium">
                Licensed States
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Designer Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {DESIGNERS.map((designer) => (
            <div
              key={designer.slug}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all group"
            >
              <div className="p-6">
                {/* Avatar */}
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={`w-14 h-14 ${designer.color} rounded-xl flex items-center justify-center flex-shrink-0`}
                  >
                    <span className="text-lg font-bold text-white">
                      {designer.initials}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-blue-600 transition-colors">
                      {designer.name}
                    </h3>
                    <p className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      {designer.location}
                    </p>
                  </div>
                </div>

                {/* Specialty */}
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg">
                    {designer.specialty}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between mb-4">
                  <StarRating rating={designer.rating} />
                  <span className="text-xs text-gray-400">
                    ({designer.reviews})
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-5">
                  <span className="font-semibold text-gray-900">
                    {designer.planCount}
                  </span>{' '}
                  plans available
                </p>

                {/* CTA */}
                <Link
                  href={`/plans/designers/${designer.slug}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors group-hover:shadow-md"
                >
                  View Plans
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Are You an Architect?
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            Showcase your stock plans to thousands of homeowners and builders.
            Join our growing network of designers and start selling your plans on
            the Kealee platform today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              List Your Plans
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/plans"
              className="inline-flex items-center justify-center rounded-xl border border-gray-600 bg-gray-800 px-8 py-3.5 text-sm font-semibold text-gray-200 shadow-sm transition hover:bg-gray-700"
            >
              Browse All Plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
