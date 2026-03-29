import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const PRODUCTS = [
  {
    icon: '🧠',
    name: 'AI Concept Package',
    price: '$395–$585',
    desc: 'AI-generated design concepts, cost band, permit checklist — delivered in days.',
    cta: 'Start a project',
    href: '/concept',
    accent: '#C8521A',
  },
  {
    icon: '📋',
    name: 'Permit Path Only',
    price: '$149',
    desc: 'Have drawings already? Our AI reviews and files for you.',
    cta: 'File permits',
    href: '/permits',
    accent: '#2ABFBF',
  },
  {
    icon: '🏠',
    name: 'Construction OS',
    price: 'Free to start',
    desc: 'Milestone payments, scheduling, RFIs, and lien waivers for project owners.',
    cta: 'Start free',
    href: '/auth/sign-in',
    accent: '#3A7D52',
  },
  {
    icon: '🤝',
    name: 'Contractor Marketplace',
    price: 'Free to browse',
    desc: 'AI-vetted GCs, electricians, HVAC, and specialty trades.',
    cta: 'Browse contractors',
    href: '/marketplace',
    accent: '#4A8FA8',
  },
  {
    icon: '📊',
    name: 'Developer Feasibility',
    price: '$1,499+',
    desc: 'AI-assisted pro forma, IRR modeling, and go/no-go analysis.',
    cta: 'Get started',
    href: '/developers',
    accent: '#C8521A',
  },
  {
    icon: '🔮',
    name: 'Digital Twin Platform',
    price: 'Enterprise',
    desc: 'Live digital model of every project — tracking milestones, draws, and inspections.',
    cta: 'Learn more',
    href: '/developers',
    accent: '#1A2B4A',
  },
]

export function FeaturedProductsSection() {
  return (
    <section className="py-20" style={{ background: 'var(--surface, #F5F4F0)' }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <span className="section-label">Products</span>
          <h2 className="mt-3 text-3xl font-bold font-display sm:text-4xl" style={{ color: '#1A2B4A' }}>
            Everything you need to build
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-gray-500">
            Six AI-powered products that work together from first concept to final payment.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map(p => (
            <div
              key={p.name}
              className="flex flex-col rounded-2xl bg-white p-6 transition-shadow hover:shadow-md"
              style={{ border: '1px solid var(--border, #E2E1DC)' }}
            >
              <div className="mb-4 flex items-start justify-between">
                <span className="text-3xl">{p.icon}</span>
                <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: `${p.accent}18`, color: p.accent }}>
                  {p.price}
                </span>
              </div>
              <h3 className="text-base font-bold font-display" style={{ color: '#1A1C1B' }}>{p.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500">{p.desc}</p>
              <Link
                href={p.href}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold transition-all hover:gap-2.5"
                style={{ color: p.accent }}
              >
                {p.cta} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
