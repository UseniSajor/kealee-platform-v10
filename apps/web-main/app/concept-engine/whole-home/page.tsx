'use client'

import Link from 'next/link'
import { ArrowRight, ArrowLeft, CheckCircle, Layers, Home, Layout, Hammer, Clock } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    title: 'Your Property',
    desc: 'Share your address, current floor plan (if available), and photos. AI maps out your existing layout and structural context.',
    icon: Home,
    color: '#E8793A',
  },
  {
    number: '02',
    title: 'Your Vision',
    desc: 'Tell us what transformation you want — total gut-reno, floor plan reconfiguration, room additions, or full systems overhaul.',
    icon: Layout,
    color: '#2ABFBF',
  },
  {
    number: '03',
    title: 'Zoning + Buildability',
    desc: "We review your jurisdiction's rules — setbacks, FAR, height limits, and structural feasibility to frame what's achievable.",
    icon: Layers,
    color: '#1A2B4A',
  },
  {
    number: '04',
    title: 'Your 3 Concept Options',
    desc: 'Receive 3 whole-home concept packages with floor plan direction, scope breakdowns, material palette, and cost direction.',
    icon: Hammer,
    color: '#E8793A',
  },
]

const WHATS_INCLUDED = [
  '3 whole-home concept design options',
  'Floor plan reconfiguration concepts',
  'Structural scope summary',
  'MEP / systems direction notes',
  'Material and finish palette direction',
  'Property-based zoning + FAR brief',
  'Rough scope and cost range',
  'Downloadable digital concept package',
  'Included 30-min design consultation call',
]

export default function WholeHomeConceptEnginePage() {
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
      <section className="py-16 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #c05621 0%, #e8793a 100%)' }}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-16">
            <div className="flex-1">
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' }}
              >
                Whole Home Renovation
              </span>
              <h1 className="mt-4 text-4xl font-bold text-white font-display leading-tight">
                See your whole home transformed — before breaking ground.
              </h1>
              <p className="mt-5 text-lg text-white/80">
                Floor plans, structural changes, systems, and every room redesigned. Property-specific AI concept with 3 options and consultation included.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/intake/whole_home_concept"
                  className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#1A2B4A', color: 'white' }}
                >
                  Start My Whole Home Concept <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/homeowners/whole-home"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-7 py-3.5 text-base font-semibold text-white/80 hover:text-white hover:border-white/50 transition-all"
                >
                  See Whole Home Services
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
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-200" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 border-t border-white/10 pt-4 flex items-baseline justify-between">
                  <span className="text-sm text-white/50">Starting at</span>
                  <span className="text-3xl font-bold text-white">$585</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Whole home design packages */}
      <section className="py-20" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label" style={{ color: '#E8793A' }}>Packages</span>
            <h2 className="mt-3 text-2xl font-bold font-display sm:text-3xl" style={{ color: '#1A2B4A' }}>
              Whole Home Design Packages
            </h2>
            <p className="mt-3 text-gray-500">Choose the package that matches your renovation scope.</p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {([
              {
                name: 'AI Whole Home Concept',
                price: '$585',
                rounds: '1 feedback round',
                turnaround: '7–10 business days',
                desc: 'Floor plan direction, scope summary, material palette, and rough cost range.',
                items: ['3 whole-home concept options', 'Floor plan reconfiguration', 'Scope + structural summary', 'Material palette direction', '30-min consultation'],
                cta: 'Start My Whole Home Concept',
                href: '/intake/whole_home_concept',
                popular: false,
              },
              {
                name: 'Advanced Whole Home Design',
                price: '$1,200',
                rounds: 'Up to 3 feedback rounds',
                turnaround: '2–3 weeks',
                desc: '3D views, detailed floor plans, and a full contractor-ready scope package.',
                items: ['Everything in AI Concept', 'Detailed 3D floor plan views', 'Room-by-room finish direction', 'MEP systems summary', '60-min consultation'],
                cta: 'Start Advanced Design',
                href: '/intake/whole_home_concept',
                popular: true,
              },
              {
                name: 'Full Design Package',
                price: 'From $6,500',
                rounds: 'Up to 5 rounds',
                turnaround: '4–6 weeks',
                desc: 'Permit-ready drawing set with structural coordination and full project specifications.',
                items: ['Everything in Advanced', 'Permit-ready drawing set', 'Structural coordination', 'Full specification package', 'Contractor bid documents'],
                cta: 'Contact Us',
                href: '/contact',
                popular: false,
              },
            ] as const).map((tier) => (
              <div
                key={tier.name}
                className="relative flex flex-col rounded-xl bg-white p-6"
                style={{
                  boxShadow: tier.popular ? `0 10px 25px -5px #E8793A40` : '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                  border: tier.popular ? `2px solid #E8793A` : '1px solid #E5E7EB',
                }}
              >
                {tier.popular && (
                  <span className="absolute right-4 top-4 rounded-full px-2 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: '#E8793A' }}>
                    Most Popular
                  </span>
                )}
                <h3 className="font-bold font-display" style={{ color: '#1A2B4A' }}>{tier.name}</h3>
                <div className="my-3">
                  <span className="text-3xl font-bold font-mono" style={{ color: '#E8793A' }}>{tier.price}</span>
                </div>
                <p className="text-xs text-gray-500 mb-1">{tier.rounds} · {tier.turnaround}</p>
                <p className="text-sm text-gray-600 mb-4">{tier.desc}</p>
                <ul className="flex-1 space-y-2 mb-6">
                  {tier.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.href}
                  className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-all hover:opacity-90"
                  style={{
                    backgroundColor: tier.popular ? '#E8793A' : 'transparent',
                    color: tier.popular ? '#fff' : '#E8793A',
                    border: tier.popular ? 'none' : `2px solid #E8793A`,
                  }}
                >
                  {tier.cta}
                </Link>
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
              How your whole home concept works
            </h2>
            <p className="mt-3 text-gray-500">Comprehensive. Property-specific. Delivered with a consultation call.</p>
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
              3 concept options included
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              1 feedback round
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
      <section className="py-16" style={{ backgroundColor: '#1A2B4A' }}>
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white">Ready to see your whole home reimagined?</h2>
          <p className="mt-4 text-gray-300">Start your intake. Delivered in 5–7 business days with consultation included.</p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/intake/whole_home_concept"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#E8793A' }}
            >
              Get My Whole Home Concept <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/homeowners/whole-home" className="text-sm text-gray-400 hover:text-white transition-colors">
              View whole home services
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
