import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Layers, PenTool, Home } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Choose Your Path — Design Only, Design + Permits, Full Build | Kealee',
  description:
    'Three customer paths to suit any project. Design Only (you find the contractor), Design + Permits (Kealee handles permits), or Complete Build (Kealee does everything). Compare and choose.',
  openGraph: {
    title: 'Choose Your Path — Kealee',
    description: 'Design Only · Design + Permits · Full Build. Three clear paths from idea to construction.',
    url: 'https://kealee.com/paths',
  },
}

const PATHS = [
  {
    id: 'design-only',
    icon: PenTool,
    badge: 'Most flexible',
    badgeColor: '#2ABFBF',
    name: 'Design Only',
    tagline: 'Get the design. Find your own contractor.',
    description:
      'You want professional AI concept designs and a clear direction — then you handle the rest yourself. Great for experienced homeowners and landlords who already have contractor relationships.',
    steps: [
      { n: '1', label: 'AI Concept Design', detail: 'Starter $599 · Professional $1,299' },
      { n: '2', label: 'Portal delivery', detail: '3 concepts, specs, cost estimates, permit path' },
      { n: '3', label: 'You choose a concept', detail: 'Download all files, take them anywhere' },
      { n: '4', label: 'You find your contractor', detail: 'Use designs to get bids' },
    ],
    totalRange: '$599 – $1,299',
    cta: 'Start Design Only',
    ctaHref: '/concept',
    accentColor: '#2ABFBF',
    bgColor: 'rgba(42,191,191,0.04)',
    borderColor: 'rgba(42,191,191,0.2)',
    whoFor: ['Experienced homeowners', 'Landlords & investors', 'People with existing contractor relationships'],
    notFor: ['First-time renovators', 'Projects requiring architect stamp', 'Complex permit jurisdictions'],
  },
  {
    id: 'design-permits',
    icon: Layers,
    badge: 'Most popular',
    badgeColor: '#E8793A',
    name: 'Design + Permits',
    tagline: 'Get the design and let Kealee handle the permits.',
    description:
      'You want designs and want permits handled by professionals who know DC, MD, and VA jurisdictions. Kealee files, tracks, and reports back every two weeks. Best for most residential renovations.',
    steps: [
      { n: '1', label: 'AI Concept Design', detail: 'Starter $599 · Professional $1,299' },
      { n: '2', label: 'Portal delivery', detail: 'Concepts, specs, permit path guidance' },
      { n: '3', label: 'Kealee Permit Package', detail: 'Standard $495 · Multi-Trade $895 · Full Service $1,495' },
      { n: '4', label: 'Kealee files & tracks permits', detail: 'Biweekly updates in your portal' },
      { n: '5', label: 'Permits approved', detail: 'You engage contractor with approved permits' },
    ],
    totalRange: '$1,094 – $2,794',
    cta: 'Start Design + Permits',
    ctaHref: '/concept?bundle=design_permits',
    accentColor: '#E8793A',
    bgColor: 'rgba(232,121,58,0.04)',
    borderColor: 'rgba(232,121,58,0.25)',
    whoFor: ['Most homeowners', 'First-time renovators', 'Kitchen, bath, addition, ADU projects', 'Anyone who dreads permit offices'],
    notFor: ['Projects that don\'t require permits', 'Very large projects needing full architect oversight'],
  },
  {
    id: 'full-build',
    icon: Home,
    badge: 'All-inclusive',
    badgeColor: '#1A2B4A',
    name: 'Complete Build',
    tagline: 'Design → Architect drawings → Permits → Contractor. Kealee manages it all.',
    description:
      'You want a single point of accountability from concept to construction. Kealee handles the design, architect drawings, permit filing, contractor matching, and project management. Best for complex projects and clients who want zero friction.',
    steps: [
      { n: '1', label: 'AI Concept Design', detail: 'Professional $1,299 (included in quote)' },
      { n: '2', label: 'Architect VIP', detail: 'Permit-ready drawings — $3,890–$9,500+' },
      { n: '3', label: 'Kealee Full Service Permits', detail: '$1,495 + expedited if needed' },
      { n: '4', label: 'Contractor matching', detail: 'Kealee-vetted GC + Kealee PM oversight' },
      { n: '5', label: 'Construction + closeout', detail: 'PM oversight, draw schedule, warranty' },
    ],
    totalRange: 'Custom quote',
    cta: 'Get Complete Build Quote',
    ctaHref: '/contact?service=complete-build',
    accentColor: '#1A2B4A',
    bgColor: 'rgba(26,43,74,0.04)',
    borderColor: 'rgba(26,43,74,0.2)',
    whoFor: ['Complex additions & new construction', 'Out-of-state owners', 'Investors with multiple projects', 'Anyone who wants zero friction'],
    notFor: ['Small cosmetic projects', 'Projects under $50K total budget'],
  },
]

const BUNDLES = [
  {
    label: 'Bundle A',
    name: 'Starter Design + Permits',
    items: ['AI Concept Starter ($599)', 'Standard Permit Package ($495)'],
    total: '$1,094',
    saving: null,
    href: '/concept?bundle=design_permits',
  },
  {
    label: 'Bundle B',
    name: 'Professional Design + Permits',
    items: ['AI Concept Professional ($1,299)', 'Multi-Trade Permit Package ($895)'],
    total: '$2,194',
    saving: null,
    href: '/concept?bundle=design_permits',
  },
  {
    label: 'Bundle C',
    name: 'Design + Architect + Permits',
    items: ['AI Concept Professional ($1,299)', 'Architect VIP Starter ($3,890)', 'Full Service Permits ($1,495)'],
    total: '$6,684',
    saving: null,
    href: '/contact?service=complete-build',
  },
  {
    label: 'Bundle D',
    name: 'Complete Build',
    items: ['AI Concept + Architect VIP + Permits + PM Oversight'],
    total: 'Custom quote',
    saving: null,
    href: '/contact?service=complete-build',
  },
]

export default function PathsPage() {
  return (
    <div className="bg-white">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="py-20" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
            style={{ backgroundColor: 'rgba(232,121,58,0.1)', color: '#E8793A' }}
          >
            Choose Your Path
          </span>
          <h1 className="text-4xl font-bold sm:text-5xl mb-5" style={{ color: '#1A2B4A' }}>
            Three ways to work with Kealee
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Every project is different. Pick the level of service that fits your project, budget, and
            how much you want Kealee involved.
          </p>
        </div>
      </section>

      {/* ── Three paths ───────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {PATHS.map((path) => (
              <div
                key={path.id}
                className="flex flex-col rounded-2xl p-8"
                style={{ backgroundColor: path.bgColor, border: `1.5px solid ${path.borderColor}` }}
              >
                {/* Badge */}
                <div className="flex items-center justify-between mb-5">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${path.accentColor}15` }}
                  >
                    <path.icon className="h-6 w-6" style={{ color: path.accentColor }} />
                  </div>
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full text-white"
                    style={{ backgroundColor: path.badgeColor }}
                  >
                    {path.badge}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold mb-1" style={{ color: '#1A2B4A' }}>{path.name}</h2>
                <p className="text-sm font-medium mb-3" style={{ color: path.accentColor }}>{path.tagline}</p>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">{path.description}</p>

                {/* Steps */}
                <div className="space-y-3 mb-6 flex-1">
                  {path.steps.map((step) => (
                    <div key={step.n} className="flex items-start gap-3">
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white mt-0.5"
                        style={{ backgroundColor: path.accentColor }}
                      >
                        {step.n}
                      </span>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>{step.label}</p>
                        <p className="text-xs text-gray-400">{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="mb-5 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Total range</p>
                  <p className="text-2xl font-bold" style={{ color: path.accentColor }}>{path.totalRange}</p>
                </div>

                {/* Who it's for */}
                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Best for</p>
                  <ul className="space-y-1">
                    {path.whoFor.map((w) => (
                      <li key={w} className="flex items-start gap-1.5 text-xs text-gray-600">
                        <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-green-500" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={path.ctaHref}
                  className="flex items-center justify-center gap-2 rounded-xl py-3 px-5 text-sm font-bold transition-all hover:opacity-90"
                  style={{ backgroundColor: path.accentColor, color: '#FFFFFF' }}
                >
                  {path.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Decision helper ──────────────────────────────────────────────── */}
      <section className="py-16" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-10" style={{ color: '#1A2B4A' }}>
            Not sure which path? Answer 2 questions.
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <p className="font-bold mb-4" style={{ color: '#1A2B4A' }}>
                Q1: Do you need permits for your project?
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm">
                  <p className="font-semibold text-teal-800">Yes — I need permits</p>
                  <p className="text-teal-600 mt-1 text-xs">→ Choose Design + Permits or Complete Build</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 text-sm">
                  <p className="font-semibold text-gray-700">No — cosmetic only</p>
                  <p className="text-gray-500 mt-1 text-xs">→ Design Only is fine</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <p className="font-bold mb-4" style={{ color: '#1A2B4A' }}>
                Q2: Do you already have a contractor you trust?
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 p-4 text-sm">
                  <p className="font-semibold text-gray-700">Yes — I have a contractor</p>
                  <p className="text-gray-500 mt-1 text-xs">→ Design Only or Design + Permits</p>
                </div>
                <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm">
                  <p className="font-semibold text-teal-800">No — I need help finding one</p>
                  <p className="text-teal-600 mt-1 text-xs">→ Complete Build (Kealee handles everything)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bundle offers ────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-3" style={{ color: '#1A2B4A' }}>
            Bundled offers
          </h2>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto text-sm">
            Combine services for a complete package
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BUNDLES.map((bundle) => (
              <div key={bundle.label} className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">{bundle.label}</span>
                <h3 className="text-sm font-bold mb-3" style={{ color: '#1A2B4A' }}>{bundle.name}</h3>
                <ul className="space-y-1.5 flex-1 mb-4">
                  {bundle.items.map((item) => (
                    <li key={item} className="flex items-start gap-1.5 text-xs text-gray-600">
                      <CheckCircle className="h-3 w-3 shrink-0 mt-0.5 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="pt-3 border-t border-gray-100 mb-3">
                  <p className="text-lg font-bold" style={{ color: '#E8793A' }}>{bundle.total}</p>
                </div>
                <Link
                  href={bundle.href}
                  className="block text-center text-xs font-bold py-2 rounded-lg transition-all hover:opacity-90"
                  style={{ backgroundColor: 'rgba(232,121,58,0.1)', color: '#E8793A' }}
                >
                  Start Bundle →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-16" style={{ backgroundColor: '#1A2B4A' }}>
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white mb-4">Still not sure? Talk to us.</h2>
          <p className="text-gray-300 mb-8">
            Our team can help you pick the right path in 15 minutes. No sales pressure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="px-8 py-4 rounded-xl font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#E8793A' }}
            >
              Schedule a Call
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 rounded-xl font-bold border-2 border-gray-500 text-gray-300 transition-colors hover:border-white hover:text-white"
            >
              View Full Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
