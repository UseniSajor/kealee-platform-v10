import { Metadata } from 'next'
import Link from 'next/link'
import {
  Star,
  MapPin,
  ArrowLeft,
  BedDouble,
  Bath,
  Ruler,
  Award,
  ShieldCheck,
  Mail,
  ChevronDown,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Sample data -- in production this would come from a database lookup by slug
// ---------------------------------------------------------------------------

const DESIGNERS: Record<
  string,
  {
    name: string
    initials: string
    color: string
    location: string
    bio: string
    specialties: string[]
    rating: number
    reviews: number
    totalPlans: number
    licenses: string[]
    certifications: string[]
    plans: {
      slug: string
      name: string
      style: string
      beds: number
      baths: number
      sqft: number
      price: number
      id: string
    }[]
  }
> = {
  'summit-design-studio': {
    name: 'Summit Design Studio',
    initials: 'SD',
    color: 'bg-blue-600',
    location: 'Denver, CO',
    bio: 'Summit Design Studio has been crafting mountain modern and contemporary home plans for over 18 years. Our designs blend clean modern lines with the rugged beauty of mountain landscapes, using natural materials and expansive glass to bring the outdoors in. Every plan is drawn to maximize views, energy efficiency, and livability at altitude.',
    specialties: ['Mountain Modern', 'Contemporary', 'Timber Frame', 'Cabin'],
    rating: 4.9,
    reviews: 87,
    totalPlans: 142,
    licenses: [
      'Colorado Licensed Architect #AR-12847',
      'Wyoming Licensed Architect #A-2931',
      'Montana Licensed Architect #ARC-7764',
    ],
    certifications: ['AIA Member', 'NCARB Certified', 'LEED AP BD+C'],
    plans: [
      { id: 'p1', slug: 'alpine-ridge-3200', name: 'Alpine Ridge 3200', style: 'Mountain Modern', beds: 4, baths: 3, sqft: 3200, price: 1895 },
      { id: 'p2', slug: 'summit-view-2400', name: 'Summit View 2400', style: 'Contemporary', beds: 3, baths: 2, sqft: 2400, price: 1495 },
      { id: 'p3', slug: 'timber-creek-cabin', name: 'Timber Creek Cabin', style: 'Timber Frame', beds: 2, baths: 2, sqft: 1600, price: 995 },
      { id: 'p4', slug: 'peak-panorama-4100', name: 'Peak Panorama 4100', style: 'Mountain Modern', beds: 5, baths: 4, sqft: 4100, price: 2495 },
      { id: 'p5', slug: 'canyon-edge-2800', name: 'Canyon Edge 2800', style: 'Contemporary', beds: 3, baths: 3, sqft: 2800, price: 1695 },
      { id: 'p6', slug: 'aspen-retreat-1900', name: 'Aspen Retreat 1900', style: 'Cabin', beds: 2, baths: 1, sqft: 1900, price: 1095 },
    ],
  },
  'coastal-architecture-group': {
    name: 'Coastal Architecture Group',
    initials: 'CA',
    color: 'bg-teal-600',
    location: 'Charleston, SC',
    bio: 'Coastal Architecture Group specializes in Lowcountry and coastal-inspired home plans that embrace Southern living. Our designs feature expansive porches, elevated foundations for flood zones, and open floor plans that capture cross-breezes and natural light. With deep roots in Charleston, we understand how to design homes that respect regional traditions while meeting modern building codes.',
    specialties: ['Lowcountry', 'Coastal', 'Southern Traditional', 'Beach House'],
    rating: 4.8,
    reviews: 64,
    totalPlans: 98,
    licenses: [
      'South Carolina Licensed Architect #A-5823',
      'Georgia Licensed Architect #RA-11029',
      'North Carolina Licensed Architect #14662',
    ],
    certifications: ['AIA Member', 'NCARB Certified', 'Fortified Home Evaluator'],
    plans: [
      { id: 'p1', slug: 'palmetto-cottage-2100', name: 'Palmetto Cottage 2100', style: 'Lowcountry', beds: 3, baths: 2, sqft: 2100, price: 1295 },
      { id: 'p2', slug: 'harbor-breeze-3400', name: 'Harbor Breeze 3400', style: 'Coastal', beds: 4, baths: 3, sqft: 3400, price: 1895 },
      { id: 'p3', slug: 'tidewater-classic-2800', name: 'Tidewater Classic 2800', style: 'Southern Traditional', beds: 4, baths: 3, sqft: 2800, price: 1695 },
      { id: 'p4', slug: 'dune-cottage-1500', name: 'Dune Cottage 1500', style: 'Beach House', beds: 2, baths: 2, sqft: 1500, price: 995 },
      { id: 'p5', slug: 'marsh-landing-3100', name: 'Marsh Landing 3100', style: 'Lowcountry', beds: 4, baths: 4, sqft: 3100, price: 1795 },
      { id: 'p6', slug: 'sea-island-retreat', name: 'Sea Island Retreat', style: 'Coastal', beds: 3, baths: 2, sqft: 2400, price: 1395 },
    ],
  },
}

// Fallback designer for slugs not explicitly listed
const DEFAULT_DESIGNER = {
  name: 'Featured Designer',
  initials: 'FD',
  color: 'bg-gray-600',
  location: 'United States',
  bio: 'A talented designer on the Kealee platform offering a curated collection of ready-to-build stock plans. Browse the portfolio below to explore their latest designs.',
  specialties: ['Residential', 'Custom Homes'],
  rating: 4.7,
  reviews: 40,
  totalPlans: 80,
  licenses: ['State Licensed Architect'],
  certifications: ['AIA Member', 'NCARB Certified'],
  plans: [
    { id: 'p1', slug: 'modern-classic-2600', name: 'Modern Classic 2600', style: 'Contemporary', beds: 3, baths: 2, sqft: 2600, price: 1495 },
    { id: 'p2', slug: 'craftsman-home-3000', name: 'Craftsman Home 3000', style: 'Craftsman', beds: 4, baths: 3, sqft: 3000, price: 1695 },
    { id: 'p3', slug: 'traditional-estate-3800', name: 'Traditional Estate 3800', style: 'Traditional', beds: 5, baths: 4, sqft: 3800, price: 2195 },
    { id: 'p4', slug: 'compact-bungalow-1400', name: 'Compact Bungalow 1400', style: 'Bungalow', beds: 2, baths: 1, sqft: 1400, price: 895 },
    { id: 'p5', slug: 'family-ranch-2200', name: 'Family Ranch 2200', style: 'Ranch', beds: 3, baths: 2, sqft: 2200, price: 1295 },
    { id: 'p6', slug: 'farmhouse-charm-2900', name: 'Farmhouse Charm 2900', style: 'Farmhouse', beds: 4, baths: 3, sqft: 2900, price: 1595 },
  ],
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const designer = DESIGNERS[slug] ?? DEFAULT_DESIGNER
  return {
    title: `${designer.name} - Stock Plans | Kealee`,
    description: `Browse ${designer.totalPlans} ready-to-build stock house plans by ${designer.name}. ${designer.specialties.join(', ')} styles available.`,
  }
}

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function DesignerProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const designer = DESIGNERS[slug] ?? DEFAULT_DESIGNER

  return (
    <div className="w-full">
      {/* Designer Header */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Back link */}
          <Link
            href="/plans/designers"
            className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm font-medium mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            All Designers
          </Link>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div
              className={`w-24 h-24 ${designer.color} rounded-2xl flex items-center justify-center flex-shrink-0`}
            >
              <span className="text-3xl font-bold text-white">
                {designer.initials}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-2">
                {designer.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mb-4">
                <p className="flex items-center gap-1.5 text-gray-500 text-sm">
                  <MapPin className="w-4 h-4" />
                  {designer.location}
                </p>
                <StarRating rating={designer.rating} />
                <span className="text-sm text-gray-400">
                  ({designer.reviews} reviews)
                </span>
                <span className="text-sm font-semibold text-gray-700">
                  {designer.totalPlans} plans
                </span>
              </div>

              <p className="text-gray-600 leading-relaxed max-w-3xl mb-5 text-sm md:text-base">
                {designer.bio}
              </p>

              {/* Specialty badges */}
              <div className="flex flex-wrap gap-2">
                {designer.specialties.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Style filter */}
            <div className="relative">
              <select className="appearance-none bg-white border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">All Styles</option>
                {designer.specialties.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Bedrooms filter */}
            <div className="relative">
              <select className="appearance-none bg-white border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Bedrooms</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Sort */}
            <div className="relative ml-auto">
              <select className="appearance-none bg-white border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="popular">Sort: Popular</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {designer.plans.map((plan) => (
            <Link
              key={plan.id}
              href={`/plans/${plan.slug}`}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all group overflow-hidden"
            >
              {/* Image placeholder */}
              <div className="aspect-[4/3] bg-gray-200 rounded-t-2xl flex items-center justify-center">
                <span className="text-gray-400 text-sm font-medium">
                  Plan Preview
                </span>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                    {plan.name}
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-md whitespace-nowrap">
                    {plan.style}
                  </span>
                </div>

                {/* Specs row */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <BedDouble className="w-4 h-4" />
                    {plan.beds} Beds
                  </span>
                  <span className="flex items-center gap-1">
                    <Bath className="w-4 h-4" />
                    {plan.baths} Baths
                  </span>
                  <span className="flex items-center gap-1">
                    <Ruler className="w-4 h-4" />
                    {plan.sqft.toLocaleString()} sqft
                  </span>
                </div>

                {/* Price */}
                <p className="text-blue-600 font-bold">
                  From ${plan.price.toLocaleString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid md:grid-cols-2 gap-12">
            {/* About text */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                About {designer.name}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                {designer.bio}
              </p>
              <p className="text-gray-600 leading-relaxed">
                All plans include a complete construction document set with
                floor plans, elevations, foundation details, electrical
                layouts, and structural specifications. Customization services
                are available for most plans upon request.
              </p>
            </div>

            {/* Credentials */}
            <div className="space-y-8">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  Licenses
                </h3>
                <ul className="space-y-2">
                  {designer.licenses.map((lic) => (
                    <li
                      key={lic}
                      className="text-sm text-gray-600 flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                      {lic}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                  <Award className="w-5 h-5 text-blue-600" />
                  Certifications
                </h3>
                <div className="flex flex-wrap gap-2">
                  {designer.certifications.map((cert) => (
                    <span
                      key={cert}
                      className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contact button */}
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Mail className="w-4 h-4" />
                Contact {designer.name.split(' ')[0]}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
