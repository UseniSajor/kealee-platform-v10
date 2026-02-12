import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ChevronRight,
  BedDouble,
  Bath,
  Layers,
  Car,
  Ruler,
  Home,
  FileText,
  Download,
  Pencil,
  CheckCircle2,
  ArrowRight,
  User,
  Star,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Sample plan data (will be replaced with database/CMS lookup by slug)
// ---------------------------------------------------------------------------
const SAMPLE_PLAN = {
  slug: 'modern-farmhouse-4br',
  planNumber: 'KP-2847',
  name: 'The Hawthorne',
  style: 'Modern Farmhouse',
  price: 1495,
  sqft: 2840,
  bedrooms: 4,
  bathrooms: 3.5,
  stories: 2,
  garageBays: 2,
  width: 62,
  depth: 48,
  foundationType: 'Slab / Crawlspace',
  description:
    'The Hawthorne is a striking modern farmhouse design that blends rustic charm with clean contemporary lines. The open-concept main level features a spacious great room with a vaulted ceiling, a chef-inspired kitchen with a walk-in pantry, and a formal dining area that flows seamlessly onto a covered rear porch. The main-level owner suite offers a spa-style bath with a freestanding tub and an oversized walk-in closet. Upstairs, three generously sized bedrooms share a full bath and a flexible loft space perfect for a home office or media room. Board-and-batten siding, metal roof accents, and a welcoming wraparound porch give this home unmistakable curb appeal.',
  rooms: [
    { name: 'Great Room', dimensions: "20'-0\" x 18'-6\"", floor: 'First' },
    { name: 'Kitchen', dimensions: "16'-4\" x 14'-0\"", floor: 'First' },
    { name: 'Dining Room', dimensions: "14'-0\" x 12'-6\"", floor: 'First' },
    { name: 'Owner Suite', dimensions: "16'-0\" x 15'-0\"", floor: 'First' },
    { name: 'Owner Bath', dimensions: "14'-0\" x 10'-6\"", floor: 'First' },
    { name: 'Laundry', dimensions: "8'-6\" x 7'-0\"", floor: 'First' },
    { name: 'Bedroom 2', dimensions: "14'-0\" x 12'-0\"", floor: 'Second' },
    { name: 'Bedroom 3', dimensions: "13'-6\" x 12'-0\"", floor: 'Second' },
    { name: 'Bedroom 4', dimensions: "12'-0\" x 11'-6\"", floor: 'Second' },
    { name: 'Loft / Office', dimensions: "16'-0\" x 12'-0\"", floor: 'Second' },
    { name: 'Full Bath', dimensions: "10'-0\" x 8'-0\"", floor: 'Second' },
  ],
  packages: [
    {
      name: 'PDF Set',
      price: 1495,
      description: 'Complete set of construction drawings delivered as high-resolution PDF files. Printable at any size.',
    },
    {
      name: 'CAD Set',
      price: 1995,
      description: 'Editable CAD files (DWG format) for easy customization by your architect or designer.',
    },
    {
      name: 'Reproducible Set',
      price: 2295,
      description: 'Full-size reproducible masters on bond paper, plus a PDF and CAD license for unlimited local prints.',
    },
  ],
  designer: {
    name: 'Ridgeline Design Co.',
    slug: 'ridgeline-design-co',
    plansCount: 87,
    rating: 4.8,
  },
}

const INCLUDED_ITEMS = [
  'Foundation Plan',
  'Detailed Floor Plans (all levels)',
  'Electrical Plan',
  'Exterior Elevations (all sides)',
  'Roof Plan',
  'Building Cross-Sections',
  'Wall Sections & Details',
  'General Notes & Specifications',
]

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: `${SAMPLE_PLAN.name} - ${SAMPLE_PLAN.style} House Plan ${SAMPLE_PLAN.planNumber}`,
  description: `${SAMPLE_PLAN.sqft} sq ft ${SAMPLE_PLAN.style} plan with ${SAMPLE_PLAN.bedrooms} bedrooms, ${SAMPLE_PLAN.bathrooms} baths, and ${SAMPLE_PLAN.garageBays}-car garage. Plan ${SAMPLE_PLAN.planNumber} by ${SAMPLE_PLAN.designer.name}.`,
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------
export default function PlanDetailPage({ params }: { params: { slug: string } }) {
  const plan = SAMPLE_PLAN // Future: look up by params.slug

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* ----------------------------------------------------------------- */}
      {/* Breadcrumb                                                        */}
      {/* ----------------------------------------------------------------- */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <ol className="flex items-center gap-1.5 text-sm text-gray-500">
          <li>
            <Link href="/plans" className="hover:text-blue-600 transition-colors">
              Plans
            </Link>
          </li>
          <li><ChevronRight className="w-3.5 h-3.5" /></li>
          <li>
            <Link href={`/plans?style=${encodeURIComponent(plan.style)}`} className="hover:text-blue-600 transition-colors">
              {plan.style}
            </Link>
          </li>
          <li><ChevronRight className="w-3.5 h-3.5" /></li>
          <li className="text-gray-900 font-medium truncate">{plan.name}</li>
        </ol>
      </nav>

      {/* ----------------------------------------------------------------- */}
      {/* Hero: Gallery + Specs Sidebar                                     */}
      {/* ----------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image Gallery */}
          <div className="lg:col-span-2 space-y-3">
            {/* Main Image */}
            <div className="aspect-[16/10] bg-gray-200 rounded-xl flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Home className="w-16 h-16 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">Plan Rendering</p>
              </div>
            </div>
            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="aspect-[4/3] bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 cursor-pointer hover:ring-2 hover:ring-blue-600 transition-all"
                >
                  <span className="text-xs font-medium">View {i}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Specs Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
              {/* Plan number + name */}
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
                  Plan {plan.planNumber}
                </p>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                  {plan.name}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">{plan.style}</p>
              </div>

              {/* Price */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-500">Starting from</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${plan.price.toLocaleString()}
                </p>
              </div>

              {/* Specs grid */}
              <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Ruler className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Sq. Ft.</p>
                    <p className="text-sm font-semibold text-gray-900">{plan.sqft.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <BedDouble className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Bedrooms</p>
                    <p className="text-sm font-semibold text-gray-900">{plan.bedrooms}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Bath className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Bathrooms</p>
                    <p className="text-sm font-semibold text-gray-900">{plan.bathrooms}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Layers className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Stories</p>
                    <p className="text-sm font-semibold text-gray-900">{plan.stories}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Car className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Garage</p>
                    <p className="text-sm font-semibold text-gray-900">{plan.garageBays}-Car</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Home className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Dimensions</p>
                    <p className="text-sm font-semibold text-gray-900">{plan.width}' x {plan.depth}'</p>
                  </div>
                </div>
              </div>

              {/* Foundation */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-500 mb-0.5">Foundation Type</p>
                <p className="text-sm font-semibold text-gray-900">{plan.foundationType}</p>
              </div>

              {/* CTA buttons */}
              <div className="space-y-3 pt-2">
                <Link
                  href="/contact"
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Order This Plan
                </Link>
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 font-semibold py-3.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Request Modifications
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Description                                                       */}
      {/* ----------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Plan Description</h2>
          <p className="text-gray-600 leading-relaxed">{plan.description}</p>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Floor Plan Images                                                 */}
      {/* ----------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-5">Floor Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {['First Floor', 'Second Floor'].map((label) => (
            <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="aspect-[4/3] bg-gray-200 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">{label} Plan</p>
                </div>
              </div>
              <div className="px-5 py-3 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-900">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Room Dimensions Table                                             */}
      {/* ----------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Room Dimensions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 font-semibold text-gray-600">Room</th>
                  <th className="px-6 py-3 font-semibold text-gray-600">Dimensions</th>
                  <th className="px-6 py-3 font-semibold text-gray-600">Floor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {plan.rooms.map((room, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-gray-900 font-medium">{room.name}</td>
                    <td className="px-6 py-3 text-gray-600">{room.dimensions}</td>
                    <td className="px-6 py-3 text-gray-600">{room.floor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* What's Included                                                   */}
      {/* ----------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">What&apos;s Included</h2>
          <p className="text-sm text-gray-500 mb-5">
            Every plan set includes 5 professionally drafted PDF sheets covering the following:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            {INCLUDED_ITEMS.map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4.5 h-4.5 text-green-600 shrink-0" />
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Package Options                                                   */}
      {/* ----------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-5">Package Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plan.packages.map((pkg, idx) => (
            <div
              key={pkg.name}
              className={`bg-white rounded-xl shadow-sm border p-6 flex flex-col ${
                idx === 0 ? 'border-blue-600 ring-1 ring-blue-600' : 'border-gray-200'
              }`}
            >
              {idx === 0 && (
                <span className="inline-block text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full mb-3 w-fit">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-bold text-gray-900 mb-1">{pkg.name}</h3>
              <p className="text-2xl font-bold text-gray-900 mb-3">
                ${pkg.price.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 leading-relaxed flex-grow">
                {pkg.description}
              </p>
              <Link
                href="/contact"
                className={`mt-5 flex items-center justify-center gap-2 font-semibold py-3 rounded-lg transition-colors text-sm ${
                  idx === 0
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Select Package
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Designer Info Card                                                */}
      {/* ----------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar placeholder */}
          <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-grow">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Designed By</p>
            <h3 className="text-lg font-bold text-gray-900">{plan.designer.name}</h3>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                {plan.designer.rating}
              </span>
              <span>{plan.designer.plansCount} plans</span>
            </div>
          </div>
          <Link
            href={`/plans/designers/${plan.designer.slug}`}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors shrink-0"
          >
            View Designer Profile
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Related Plans                                                     */}
      {/* ----------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-xl font-bold text-gray-900 mb-5">Related Plans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: 'The Ashford', style: 'Modern Farmhouse', sqft: 2450, beds: 3, baths: 2.5, price: 1295, slug: 'the-ashford' },
            { name: 'The Cedar Ridge', style: 'Craftsman', sqft: 3100, beds: 4, baths: 3, price: 1695, slug: 'the-cedar-ridge' },
            { name: 'The Briar Glen', style: 'Modern Farmhouse', sqft: 2680, beds: 4, baths: 3, price: 1395, slug: 'the-briar-glen' },
            { name: 'The Magnolia', style: 'Southern Living', sqft: 3350, beds: 5, baths: 4, price: 1895, slug: 'the-magnolia' },
          ].map((related) => (
            <Link
              key={related.slug}
              href={`/plans/${related.slug}`}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Placeholder image */}
              <div className="aspect-[4/3] bg-gray-200 flex items-center justify-center text-gray-400 group-hover:bg-gray-300 transition-colors">
                <Home className="w-10 h-10 opacity-40" />
              </div>
              <div className="p-4">
                <p className="text-xs text-blue-600 font-semibold mb-0.5">{related.style}</p>
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {related.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {related.sqft.toLocaleString()} sq ft &middot; {related.beds} bd / {related.baths} ba
                </p>
                <p className="text-sm font-bold text-gray-900 mt-2">
                  ${related.price.toLocaleString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
