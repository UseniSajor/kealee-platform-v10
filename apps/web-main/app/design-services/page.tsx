import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Pencil, FileText, Layers, Info } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Design Services — Permit-Ready Plans from Licensed Designers | Kealee',
  description: 'Licensed architects and designers create permit-ready plans for your renovation, addition, or new build. From AI concept to stamped drawings — one continuous path.',
}

const COMPARISON = [
  {
    feature: 'What it is',
    concept: 'Pre-design visualization — renderings, layout direction, cost range',
    design: 'Permit-ready, architect-stamped drawings required for construction',
  },
  {
    feature: 'Can I pull a permit?',
    concept: 'No — AI concepts are not permit-ready documents',
    design: 'Yes — stamped drawings are accepted by all DC-MD-VA jurisdictions',
  },
  {
    feature: 'Can contractors build from it?',
    concept: 'No — concepts show intent, not construction instructions',
    design: 'Yes — construction documents include all required specifications',
  },
  {
    feature: 'Best for',
    concept: 'Early planning, budget direction, homeowner buy-in',
    design: 'Permit applications, contractor bids, financing requirements',
  },
  {
    feature: 'Typical cost',
    concept: 'From $395',
    design: 'From $1,200 (Starter) through $6,500+ (Full Pre-Design)',
  },
]

const PACKAGES = [
  {
    name: 'Design Starter',
    price: 'From $1,200',
    env: 'STRIPE_PRICE_DESIGN_STARTER',
    turnaround: '10–14 business days',
    description: 'Schematic design drawings suitable for contractor bidding and basic permit pre-check. Covers layout, dimensions, and basic elevations.',
    items: [
      'Schematic floor plan + elevations',
      'Basic site plan',
      'Contractor bid-ready format',
      'Permit pre-check included',
      '1 revision round',
    ],
    accent: '#2ABFBF',
    href: '/pre-design/starter',
  },
  {
    name: 'Design Visualization',
    price: 'From $2,800',
    env: 'STRIPE_PRICE_DESIGN_VISUALIZATION',
    turnaround: '2–3 weeks',
    description: '3D visualization + construction-level drawings. Includes full floor plans, exterior elevations, sections, and material specifications.',
    items: [
      'Full floor plans + elevations + sections',
      '3D exterior and interior renderings',
      'Material + finish specification sheet',
      'Permit-ready document set',
      'Up to 3 revision rounds',
    ],
    accent: '#E8793A',
    popular: true,
    href: '/pre-design/visualization',
  },
  {
    name: 'Full Pre-Design Package',
    price: 'From $6,500',
    env: 'STRIPE_PRICE_DESIGN_PREDESIGN',
    turnaround: '3–5 weeks',
    description: 'Complete pre-design package with permit-ready drawings, structural coordination, MEP direction, and full contractor bid documents.',
    items: [
      'Complete permit-ready drawing set',
      'Structural direction + coordination',
      'MEP scope notes',
      'Full contractor bid package',
      'Up to 5 revision rounds',
      'Permit submission support',
    ],
    accent: '#7C3AED',
    href: '/pre-design/full',
  },
]

export default function DesignServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section
        className="py-20 md:py-28"
        style={{ background: 'linear-gradient(135deg, #1A2B4A 0%, #2A3D5F 60%, #1A2B4A 100%)' }}
      >
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest mb-5"
            style={{ backgroundColor: 'rgba(42,191,191,0.15)', color: '#2ABFBF' }}
          >
            <Pencil className="h-3.5 w-3.5" />
            Design Services
          </div>
          <h1 className="text-4xl font-bold text-white font-display sm:text-5xl">
            Permit-Ready Plans from Licensed Designers
          </h1>
          <p className="mt-5 text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            When you&apos;re ready to build, you need more than concept renderings — you need
            architect-stamped, permit-ready drawings. Our licensed design team takes you from
            AI concept to construction documents.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/pre-design"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#E8793A' }}
            >
              Start Pre-Design <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/concept-engine"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3.5 text-sm font-semibold text-white/80 hover:text-white hover:border-white/50 transition-all"
            >
              Start with AI Concept First
            </Link>
          </div>
        </div>
      </section>

      {/* AI Concept vs Design Services explainer */}
      <section className="py-16 border-b border-gray-100">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <h2 className="text-xl font-bold font-display" style={{ color: '#1A2B4A' }}>
              AI Concept vs. Design Services — what&apos;s the difference?
            </h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-200">
            <div className="grid grid-cols-3 bg-gray-50 px-5 py-3 text-xs font-bold uppercase tracking-widest text-gray-400">
              <span />
              <span style={{ color: '#E8793A' }}>AI Concept</span>
              <span style={{ color: '#2ABFBF' }}>Design Services</span>
            </div>
            {COMPARISON.map((row, i) => (
              <div
                key={row.feature}
                className="grid grid-cols-3 px-5 py-4"
                style={{ backgroundColor: i % 2 === 0 ? 'white' : '#FAFAFA', borderTop: '1px solid #F3F4F6' }}
              >
                <span className="text-sm font-semibold text-gray-500 pr-4">{row.feature}</span>
                <span className="text-sm text-gray-700 pr-4">{row.concept}</span>
                <span className="text-sm text-gray-700">{row.design}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-center text-gray-400">
            Most homeowners start with an AI concept, then move to Design Services once they&apos;re ready to permit and build.
          </p>
        </div>
      </section>

      {/* Design packages */}
      <section className="py-20" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4"
              style={{ backgroundColor: 'rgba(232,121,58,0.1)', color: '#E8793A' }}
            >
              Packages
            </span>
            <h2 className="text-3xl font-bold font-display" style={{ color: '#1A2B4A' }}>
              Design Service Packages
            </h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">
              Choose the level of design documentation your project needs.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {PACKAGES.map(pkg => (
              <div
                key={pkg.name}
                className="relative flex flex-col rounded-2xl bg-white p-7"
                style={{
                  border: pkg.popular ? `2px solid ${pkg.accent}` : '1px solid #E5E7EB',
                  boxShadow: pkg.popular
                    ? `0 10px 25px -5px ${pkg.accent}30`
                    : '0 1px 3px 0 rgb(0 0 0 / 0.08)',
                }}
              >
                {pkg.popular && (
                  <span
                    className="absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: pkg.accent }}
                  >
                    Most Popular
                  </span>
                )}
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${pkg.accent}14` }}
                >
                  <Layers className="h-5 w-5" style={{ color: pkg.accent }} />
                </div>
                <h3 className="text-lg font-bold font-display" style={{ color: '#1A2B4A' }}>
                  {pkg.name}
                </h3>
                <div className="mt-2 mb-1">
                  <span className="text-2xl font-bold font-mono" style={{ color: pkg.accent }}>
                    {pkg.price}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-3">Delivery: {pkg.turnaround}</p>
                <p className="text-sm text-gray-600 leading-relaxed mb-5">{pkg.description}</p>
                <ul className="flex-1 space-y-2.5 mb-6">
                  {pkg.items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href={pkg.href}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all hover:opacity-90"
                  style={{
                    backgroundColor: pkg.popular ? pkg.accent : 'transparent',
                    color: pkg.popular ? '#fff' : pkg.accent,
                    border: pkg.popular ? 'none' : `2px solid ${pkg.accent}`,
                  }}
                >
                  Start {pkg.name} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-gray-400">
            All design packages include licensed architect or designer review. Permit-ready drawings produced for DC, MD, and VA jurisdictions.
          </p>
        </div>
      </section>

      {/* How it connects to AI concept */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold font-display text-center mb-10" style={{ color: '#1A2B4A' }}>
            The full path from concept to permit
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {[
              { step: '1', label: 'AI Concept', sub: 'From $395', color: '#E8793A', href: '/concept-engine' },
              { step: '2', label: 'Design Services', sub: 'From $1,200', color: '#2ABFBF', href: '/pre-design' },
              { step: '3', label: 'Permit Submission', sub: 'From $595', color: '#38A169', href: '/permits' },
              { step: '4', label: 'Contractor Match', sub: 'Free matching', color: '#7C3AED', href: '/marketplace' },
            ].map((item, i) => (
              <div key={item.step} className="flex items-center gap-4 flex-col sm:flex-row">
                <Link
                  href={item.href}
                  className="flex flex-col items-center rounded-2xl border-2 bg-white p-5 text-center transition-all hover:shadow-md hover:-translate-y-0.5 w-36"
                  style={{ borderColor: item.color }}
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white mb-2"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.step}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>{item.label}</span>
                  <span className="mt-1 text-xs text-gray-400">{item.sub}</span>
                </Link>
                {i < 3 && <ArrowRight className="h-5 w-5 text-gray-300 shrink-0 hidden sm:block" />}
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-gray-400">
            Already have an AI concept? Bring it to our design team and we&apos;ll take it from visualization to permit-ready documents.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ backgroundColor: '#1A2B4A' }}>
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-white font-display">
            Ready to go from concept to permit-ready?
          </h2>
          <p className="mt-3 text-gray-300">
            Start your pre-design intake and our licensed design team will take it from there.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/pre-design"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#E8793A' }}
            >
              Start Pre-Design <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-500 px-6 py-3.5 text-sm font-semibold text-gray-300 transition-colors hover:border-gray-300 hover:text-white"
            >
              Talk to Our Team
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
