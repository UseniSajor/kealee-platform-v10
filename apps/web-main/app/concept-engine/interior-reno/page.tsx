'use client'

import Link from 'next/link'
import { ArrowRight, ArrowLeft, CheckCircle, PaintBucket, Home, Layout, Plus, Clock } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    title: 'Your Space',
    desc: 'Share your address and interior photos — kitchen, baths, living areas. AI maps out your current layout and identifies the scope.',
    icon: Home,
    color: '#7C3AED',
  },
  {
    number: '02',
    title: 'Your Goals',
    desc: 'Tell us what you want — kitchen remodel, bathroom renovation, room addition, ADU, or full interior redesign.',
    icon: Layout,
    color: '#E8793A',
  },
  {
    number: '03',
    title: 'Zoning + Permits',
    desc: 'For additions and ADUs, we flag permit requirements and zoning constraints before you commit to a design direction.',
    icon: Plus,
    color: '#1A2B4A',
  },
  {
    number: '04',
    title: 'Your 3 Concept Options',
    desc: 'Receive 3 interior concept packages with layout options, finish direction, material palette, and rough cost range.',
    icon: PaintBucket,
    color: '#7C3AED',
  },
]

const WHATS_INCLUDED = [
  '3 interior concept design options',
  'Layout + flow optimization direction',
  'Kitchen and/or bath concept renderings',
  'Addition or ADU conceptual plan',
  'Finish and material palette suggestions',
  'Permit and zoning brief (additions)',
  'Rough scope and cost range',
  'Downloadable digital concept package',
  'Included 30-min design consultation call',
]

export default function InteriorRenoConceptEnginePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Back nav */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
          <Link
            href="/concept-engine"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back to design path selection
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="py-16 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)' }}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-16">
            <div className="flex-1">
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' }}
              >
                Interior Reno & Addition
              </span>
              <h1 className="mt-4 text-4xl font-bold text-white font-display leading-tight">
                Reimagine your interior before swinging a hammer.
              </h1>
              <p className="mt-5 text-lg text-white/80">
                Kitchen, bath, room additions, ADUs, and full interior redesign — all in one concept package. Property-specific AI concepts with 3 options and consultation included.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/intake/interior_reno_concept"
                  className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#E8793A' }}
                >
                  Start My Interior Concept <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/homeowners/interior-reno"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-7 py-3.5 text-base font-semibold text-white/80 hover:text-white hover:border-white/50 transition-all"
                >
                  See Interior Reno Services
                </Link>
              </div>
              <p className="mt-4 text-xs text-white/50">
                All onsite installation and build work is performed by your contractor of record. Kealee provides AI design, final design packages, permit filing, advisory, and contractor matching services only.
              </p>
            </div>
            <div className="lg:w-72 shrink-0">
              <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4">Package includes</p>
                <ul className="space-y-3">
                  {WHATS_INCLUDED.map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-white/80">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: '#c4b5fd' }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 border-t border-white/10 pt-4 flex items-baseline justify-between">
                  <span className="text-sm text-white/50">Starting at</span>
                  <span className="text-3xl font-bold text-white">$395</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interior reno packages — shown first so visitors see options immediately */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-2 text-xl font-bold text-center" style={{ color: '#1A2B4A' }}>Interior reno packages</h2>
          <p className="mb-6 text-center text-sm text-gray-500">Kitchen, bath, addition, ADU — pick the right level for your project.</p>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            {[
              { tier: 'AI Interior Concept', price: '$395', revisions: '1 round (3 options)', note: 'Layout + finish direction + rough cost range', href: '/intake/interior_reno_concept' },
              { tier: 'Advanced Interior Design', price: '$899', revisions: 'Up to 3 rounds', note: 'Detailed floor plans + 3D views + material boards + contractor scope', highlight: true, href: '/intake/interior_reno_concept' },
              { tier: 'Full Design Package', price: '$4,500+', revisions: 'Up to 5 rounds', note: 'Permit-ready drawings + structural coordination + full specifications', href: '/contact' },
            ].map((row, i) => (
              <div
                key={row.tier}
                className="flex items-center justify-between px-5 py-4"
                style={{
                  backgroundColor: row.highlight ? 'rgba(124,58,237,0.04)' : i % 2 === 0 ? 'white' : '#FAFAFA',
                  borderBottom: i < 2 ? '1px solid #F3F4F6' : undefined,
                }}
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>{row.tier}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{row.note}</p>
                </div>
                <div className="ml-4 flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: '#7C3AED' }}>{row.price}</p>
                    <p className="text-xs text-gray-500">{row.revisions}</p>
                  </div>
                  <Link
                    href={row.href}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: '#7C3AED' }}
                  >
                    Start <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: '#1A2B4A' }}>
              How your interior concept works
            </h2>
            <p className="mt-3 text-gray-500">Covers kitchens, baths, additions, ADUs, and full interior redesigns.</p>
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

      {/* Trust signals */}
      <section className="border-t border-gray-100 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Kitchen, bath, addition, ADU — all covered
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              3 concept options, 1 feedback round
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              5–7 business day delivery
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Consultation included
            </span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ backgroundColor: '#4c1d95' }}>
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white">Ready to redesign your interior?</h2>
          <p className="mt-4 text-gray-300">Kitchen, bath, addition, ADU — see it all before you build. Delivered in 5–7 business days.</p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/intake/interior_reno_concept"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#E8793A' }}
            >
              Get My Interior Concept <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/homeowners/interior-reno" className="text-sm text-purple-300 hover:text-white transition-colors">
              View interior reno services
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
