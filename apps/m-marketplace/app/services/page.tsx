import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
const heroImage = { src: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1920&q=80&auto=format&fit=crop', alt: 'Modern building under construction with steel beams' };

export const metadata: Metadata = {
  title: 'All Services | Kealee',
  description: 'Explore the complete Kealee platform — architecture, estimation, permits, pre-construction, project management, finance, contractor marketplace, and operations services.',
}

const services = [
  {
    title: 'Architecture',
    description: 'Professional architectural design with CAD/BIM integration and permit-ready drawings.',
    href: '/services/architect',
    color: 'indigo',
    badge: 'Design',
  },
  {
    title: 'Engineering',
    description: 'Licensed structural, MEP, civil, and fire protection engineering with PE-stamped drawings.',
    href: '/services/engineer',
    color: 'orange',
    badge: 'Design',
  },
  {
    title: 'Pre-Construction',
    description: 'End-to-end pre-con workflow from design intake to contractor award with escrow-backed contracts.',
    href: '/services/precon',
    color: 'emerald',
    badge: 'Pre-Con',
  },
  {
    title: 'Estimation',
    description: 'AI-powered cost estimation with labor, materials, and timeline projections for accurate bidding.',
    href: '/services/estimation',
    color: 'blue',
    badge: 'AI-Powered',
  },
  {
    title: 'Permits & Inspections',
    description: 'Automated permit tracking, inspection scheduling, and AI-powered document review.',
    href: '/services/permits',
    color: 'amber',
    badge: 'Compliance',
  },
  {
    title: 'Project Management',
    description: 'Construction PM tools for contractors — milestone tracking, payment requests, and client communication.',
    href: '/services/pm-software',
    color: 'sky',
    badge: 'Software',
  },
  {
    title: 'Finance & Escrow',
    description: 'Secure escrow management, milestone payments, and clear financial tracking for all parties.',
    href: '/services/finance',
    color: 'emerald',
    badge: 'Payments',
  },
  {
    title: 'Contractor Network',
    description: 'Connect with verified contractors, vendors, and suppliers. Quality leads and clear bidding.',
    href: '/services/marketplace-network',
    color: 'sky',
    badge: 'Network',
  },
  {
    title: 'Operations Services',
    description: 'Outsource your operations department — PM packages, individual services, and dedicated teams.',
    href: '/services/ops',
    color: 'sky',
    badge: 'Managed',
  },
  {
    title: 'Developer Services',
    description: 'Feasibility studies, pro forma analysis, and end-to-end development management for real estate projects.',
    href: '/services/developer',
    color: 'violet',
    badge: 'Development',
  },
]

const colorMap: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-700' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200', badge: 'bg-sky-100 text-sky-700' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700' },
}

export default function ServicesIndexPage() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative py-16 lg:py-20 overflow-hidden">
        <Image
          src={heroImage.src}
          alt={heroImage.alt}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            All Services
          </h1>
          <p className="text-xl text-white/85 max-w-3xl mx-auto">
            One platform for every phase of construction — from design and pre-construction through permitting, project management, and closeout. Explore our complete suite of services.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const colors = colorMap[service.color]
              return (
                <Link
                  key={service.title}
                  href={service.href}
                  className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition-all hover:border-blue-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${colors.badge}`}>
                      {service.badge}
                    </span>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-sm text-gray-600">{service.description}</p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Portal Access CTA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Already a Customer?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Access your portal to manage projects, track permits, view estimates, and more.
          </p>
          <Link
            href="/portals"
            className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg font-semibold transition-colors"
          >
            Go to Portals
          </Link>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Not Sure Where to Start?</h2>
          <p className="text-lg mb-8 opacity-95">
            Tell us about your project and we will recommend the right services for you.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 hover:bg-gray-100 rounded-xl text-lg font-semibold transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  )
}
