'use client'

import Link from 'next/link'
import { ArrowRight, ArrowLeft, CheckCircle, Building2, BarChart3, MapPin, FileText, TrendingUp } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    title: 'Property + Deal Parameters',
    desc: 'Submit your parcel, deal size, use type, and investment goals. Our system pulls zoning, parcel data, and market context automatically.',
    icon: MapPin,
    color: '#805AD5',
  },
  {
    number: '02',
    title: 'Use Type + Program',
    desc: 'Define your intended use: office, retail, multifamily, mixed-use, industrial. We build a preliminary program based on your inputs.',
    icon: Building2,
    color: '#E8793A',
  },
  {
    number: '03',
    title: 'Concept + Feasibility Package',
    desc: 'Receive design concept options with pro forma direction, entitlement brief, development path, and estimated returns.',
    icon: BarChart3,
    color: '#2ABFBF',
  },
  {
    number: '04',
    title: 'Development Path',
    desc: 'A structured roadmap from concept through entitlement, permitting, financing, and construction — with team and timeline recommendations.',
    icon: TrendingUp,
    color: '#1A2B4A',
  },
]

const WHATS_INCLUDED = [
  '3 development concept options',
  'Entitlement and zoning brief',
  'Preliminary pro forma direction',
  'Estimated development costs by phase',
  'Capital stack recommendation',
  'Regulatory and permitting path',
  'Professional network referrals',
  'Included developer consultation call',
]

const ADD_ONS = [
  { name: 'Full Feasibility Study', price: '$4,500–$12,000', desc: 'Pro forma, IRR analysis, scenario modeling, go/no-go recommendation' },
  { name: 'Pro Forma Analysis', price: '$2,500–$6,000', desc: 'Unit mix, cost + revenue assumptions, sensitivity analysis' },
  { name: 'Capital Stack Modeling', price: '$3,500–$8,000', desc: 'Debt/equity structure, draw schedule, waterfall projections' },
  { name: 'Entitlement Support', price: '$7,500–$20,000', desc: 'Zoning, variance, regulatory filing coordination' },
]

export default function DeveloperConceptEnginePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Back nav */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
          <Link
            href="/concept-engine"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back to project type selection
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="py-16 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #1A2B4A 0%, #2d1b69 100%)' }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-16">
            <div className="flex-1">
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
                style={{ backgroundColor: 'rgba(128,90,213,0.2)', color: '#C4B5FD' }}
              >
                For Developers & Investors
              </span>
              <h1 className="mt-4 text-4xl font-bold text-white font-display leading-tight">
                Business-grade concept intelligence for your next development deal.
              </h1>
              <p className="mt-5 text-lg text-gray-300">
                Get a developer concept package with design direction, feasibility context, pro forma framing, entitlement brief, and a structured development path — before you engage a design team.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/intake/developer_concept"
                  className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#805AD5' }}
                >
                  Start Developer Concept <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/developers"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-7 py-3.5 text-base font-semibold text-white/80 hover:text-white hover:border-white/40 transition-all"
                >
                  View Developer Platform
                </Link>
              </div>
            </div>
            <div className="lg:w-72 shrink-0">
              <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4">Concept package includes</p>
                <ul className="space-y-3">
                  {WHATS_INCLUDED.map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-white/80">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-purple-300" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 border-t border-white/10 pt-4 flex items-baseline justify-between">
                  <span className="text-sm text-white/50">Starting at</span>
                  <span className="text-3xl font-bold text-white">$1,299</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: '#1A2B4A' }}>
              What the developer concept engine does
            </h2>
            <p className="mt-3 text-gray-500">A structured intelligence package — before you invest in full feasibility.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(step => (
              <div key={step.number} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${step.color}18` }}
                >
                  <step.icon className="h-5 w-5" style={{ color: step.color }} />
                </div>
                <p className="text-xs font-bold text-gray-300">{step.number}</p>
                <h3 className="mt-1 font-semibold" style={{ color: '#1A2B4A' }}>{step.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-on services */}
      <section className="py-16 border-t border-gray-100" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>Upgrade with professional advisory services</h2>
            <p className="mt-2 text-gray-500 text-sm">Once you have your concept, take it further with our advisory team.</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            {ADD_ONS.map((item, i) => (
              <div
                key={item.name}
                className="flex items-center justify-between px-5 py-4"
                style={{
                  backgroundColor: i % 2 === 0 ? 'white' : '#FAFAFA',
                  borderBottom: i < ADD_ONS.length - 1 ? '1px solid #F3F4F6' : undefined,
                }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>{item.name}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{item.desc}</p>
                </div>
                <span className="ml-4 flex-shrink-0 text-sm font-bold" style={{ color: '#E8793A' }}>{item.price}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-400 text-center">
            All advisory services are priced per engagement. Contact us for a custom quote on large or complex deals.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ backgroundColor: '#1A2B4A' }}>
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white">Ready to analyze your deal?</h2>
          <p className="mt-4 text-gray-300">Get a developer concept package with feasibility context, pro forma framing, and a clear development path.</p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/intake/developer_concept"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#805AD5' }}
            >
              Start Developer Concept <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">
              Schedule a developer consultation
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
