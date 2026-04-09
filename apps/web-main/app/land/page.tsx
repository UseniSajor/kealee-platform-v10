import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, CheckCircle2, ArrowRight, TrendingUp, AlertTriangle, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Land Buildability Analysis | Kealee',
  description: 'Find out what you can build on your land — zoning, setbacks, cost estimate, and a clear next step.',
}

const OUTCOMES = [
  { icon: MapPin,       text: 'Parcel & zoning review' },
  { icon: AlertTriangle,text: 'Overlay and setback flag check' },
  { icon: TrendingUp,   text: 'Buildability assessment' },
  { icon: FileText,     text: 'Rough cost-to-build band' },
  { icon: CheckCircle2, text: 'Recommended next step' },
]

const PRODUCTS = [
  {
    sku: 'LAND_FEASIBILITY_BASIC',
    name: 'Land Buildability & Cost Analysis',
    price: 'From $195',
    tagline: 'Know what your land can support before you spend more.',
    bullets: [
      'Parcel and address review',
      'Zoning and jurisdiction screen',
      'Basic buildability assessment',
      'Setback and overlay flag review',
      'Likely permit path overview',
      'Rough cost-to-build band',
      'Recommended next step',
    ],
    cta: 'Start Basic Analysis',
    href: '/land/intake?sku=LAND_FEASIBILITY_BASIC',
    highlight: false,
  },
  {
    sku: 'LAND_FEASIBILITY_PRO',
    name: 'Land Feasibility Pro',
    price: 'From $495',
    tagline: 'Deeper analysis for serious buyers and small investors.',
    bullets: [
      'Everything in Basic, plus:',
      'Build envelope analysis',
      'Use scenario modeling',
      'Stronger cost range with quality bands',
      'Concept-readiness package',
      'Risk flags with mitigation notes',
      'Recommended design direction',
    ],
    cta: 'Start Pro Analysis',
    href: '/land/intake?sku=LAND_FEASIBILITY_PRO',
    highlight: true,
  },
]

export default function LandPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#0F1A2E] px-6 py-20 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#2ABFBF]">
          Land Owners &amp; First-Time Buyers
        </p>
        <h1 className="mx-auto max-w-2xl font-display text-4xl font-bold text-white md:text-5xl">
          Find out what you can build on your land
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/60">
          Before investing in design or permits, know exactly what your parcel supports —
          zoning, setbacks, buildable area, and a clear cost estimate.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/land/intake?sku=LAND_FEASIBILITY_BASIC"
            className="rounded-lg bg-[#E8793A] px-8 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Check My Land — From $195
          </Link>
          <Link
            href="/land/intake?sku=LAND_FEASIBILITY_PRO"
            className="rounded-lg border border-white/20 px-8 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            View Pro Package
          </Link>
        </div>
      </section>

      {/* What you get */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center font-display text-2xl font-bold text-[#1A2B4A]">
            Every land analysis includes
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {OUTCOMES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3 rounded-xl border border-gray-100 p-4">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#2ABFBF]" />
                <span className="text-sm font-medium text-[#1A2B4A]">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product cards */}
      <section className="bg-gray-50 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center font-display text-2xl font-bold text-[#1A2B4A]">
            Choose your analysis
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {PRODUCTS.map((p) => (
              <div
                key={p.sku}
                className={`rounded-2xl border p-8 ${
                  p.highlight
                    ? 'border-[#2ABFBF] bg-white shadow-lg ring-1 ring-[#2ABFBF]'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {p.highlight && (
                  <span className="mb-4 inline-block rounded-full bg-[#2ABFBF]/10 px-3 py-1 text-xs font-semibold text-[#2ABFBF]">
                    Most Complete
                  </span>
                )}
                <h3 className="font-display text-xl font-bold text-[#1A2B4A]">{p.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{p.tagline}</p>
                <p className="mt-4 font-display text-3xl font-bold text-[#E8793A]">{p.price}</p>
                <ul className="mt-6 space-y-2">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2ABFBF]" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.href}
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-[#E8793A] py-3 font-semibold text-white transition hover:opacity-90"
                >
                  {p.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What happens next */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-bold text-[#1A2B4A]">What happens after your analysis?</h2>
          <p className="mt-4 text-gray-600">
            Once your land analysis is complete, Kealee will recommend the single best next step —
            whether that&apos;s an AI design concept, a permit review, or a conversation with an architect.
            You&apos;re never shown a full catalog. Just the right next product for your land.
          </p>
          <Link
            href="/paths"
            className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[#2ABFBF] hover:underline"
          >
            See the full project path <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
