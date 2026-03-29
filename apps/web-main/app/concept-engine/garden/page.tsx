'use client'

import Link from 'next/link'
import { ArrowRight, ArrowLeft, CheckCircle, Leaf, MapPin, Droplets, Sun, Clock } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    title: 'Your Property',
    desc: 'Share your address and upload photos of your yard or outdoor space. AI analyzes your specific site — sun exposure, layout, soil hints.',
    icon: MapPin,
    color: '#38A169',
  },
  {
    number: '02',
    title: 'Your Goals',
    desc: 'Tell us what you want — food production, ornamental garden, raised beds, irrigation, greenhouse, or all of the above.',
    icon: Leaf,
    color: '#E8793A',
  },
  {
    number: '03',
    title: 'Site + Sun Analysis',
    desc: 'We analyze sun orientation, drainage considerations, and utility locations to inform your garden layout.',
    icon: Sun,
    color: '#38A169',
  },
  {
    number: '04',
    title: 'Your Garden Concept',
    desc: 'Receive a property-specific garden layout with plant placement, raised bed design, irrigation plan, and seasonal calendar.',
    icon: Droplets,
    color: '#38A169',
  },
]

const WHATS_INCLUDED = [
  'AI garden layout — property-specific, not generic',
  'Raised bed placement + sizing plan',
  'Irrigation / drip system design overview',
  'Plant + variety suggestions for your climate',
  'Seasonal planting calendar',
  'Soil amendment + composting recommendations',
  'Downloadable concept PDF package',
  'Included 30-min garden design consultation call',
]

export default function GardenConceptEnginePage() {
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
      <section className="py-16 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #1a3d2b 0%, #22543d 100%)' }}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-16">
            <div className="flex-1">
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
                style={{ backgroundColor: 'rgba(56,161,105,0.2)', color: '#68D391' }}
              >
                Home Farming & Garden
              </span>
              <h1 className="mt-4 text-4xl font-bold text-white font-display leading-tight">
                See your garden before the first shovel.
              </h1>
              <p className="mt-5 text-lg text-gray-300">
                Property-specific AI garden design. Raised beds, irrigation, backyard farming, and greenhouse — visualized for your space. Delivered in 5–7 business days.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/intake/garden_concept"
                  className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#38A169' }}
                >
                  Start My Garden Concept <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/homeowners/garden-farming"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-7 py-3.5 text-base font-semibold text-white/80 hover:text-white hover:border-white/40 transition-all"
                >
                  See All Garden Services
                </Link>
              </div>
              <p className="mt-4 text-xs text-gray-400">
                All onsite installation and build work is performed by your contractor of record. Kealee provides AI design, final design packages, permit filing, advisory, and contractor matching services only.
              </p>
            </div>
            <div className="lg:w-72 shrink-0">
              <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4">Package includes</p>
                <ul className="space-y-3">
                  {WHATS_INCLUDED.map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-white/80">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: '#68D391' }} />
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

      {/* Garden design packages */}
      <section className="py-20" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label" style={{ color: '#38A169' }}>Packages</span>
            <h2 className="mt-3 text-2xl font-bold font-display sm:text-3xl" style={{ color: '#1A2B4A' }}>
              Garden Design Packages
            </h2>
            <p className="mt-3 text-gray-500">Choose the package that fits your garden goals.</p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {([
              {
                name: 'AI Garden Concept',
                price: '$395',
                rounds: '1 feedback round',
                turnaround: '5–7 business days',
                desc: 'Property-specific garden layout with raised beds, irrigation overview, and planting guide.',
                items: ['3 garden layout options', 'Raised bed placement plan', 'Irrigation overview', 'Seasonal planting calendar', '30-min consultation'],
                cta: 'Start My Garden Concept',
                href: '/intake/garden_concept',
                popular: false,
              },
              {
                name: 'Advanced Garden Design',
                price: '$750',
                rounds: 'Up to 3 feedback rounds',
                turnaround: '10–14 business days',
                desc: 'Detailed garden design with plant lists, irrigation specs, and 3D garden views.',
                items: ['Everything in AI Concept', 'Detailed plant + variety list', 'Drip irrigation specs', '3D garden views', '60-min consultation'],
                cta: 'Start Advanced Design',
                href: '/intake/garden_concept',
                popular: true,
              },
              {
                name: 'Full Landscape Design',
                price: 'From $2,500',
                rounds: 'Up to 5 rounds',
                turnaround: '2–3 weeks',
                desc: 'Permit-ready landscape plans with full contractor bid documents.',
                items: ['Everything in Advanced', 'Permit-ready drawings', 'Contractor bid documents', 'Irrigation system plan', 'Grading + drainage plan'],
                cta: 'Contact Us',
                href: '/contact',
                popular: false,
              },
            ] as const).map((tier, i) => (
              <div
                key={tier.name}
                className="relative flex flex-col rounded-xl bg-white p-6"
                style={{
                  boxShadow: tier.popular ? `0 10px 25px -5px #38A16940` : '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                  border: tier.popular ? `2px solid #38A169` : '1px solid #E5E7EB',
                }}
              >
                {tier.popular && (
                  <span className="absolute right-4 top-4 rounded-full px-2 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: '#38A169' }}>
                    Most Popular
                  </span>
                )}
                <h3 className="font-bold font-display" style={{ color: '#1A2B4A' }}>{tier.name}</h3>
                <div className="my-3">
                  <span className="text-3xl font-bold font-mono" style={{ color: '#38A169' }}>{tier.price}</span>
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
                    backgroundColor: tier.popular ? '#38A169' : 'transparent',
                    color: tier.popular ? '#fff' : '#38A169',
                    border: tier.popular ? 'none' : `2px solid #38A169`,
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
              How your garden concept works
            </h2>
            <p className="mt-3 text-gray-500">Simple. Site-specific. Delivered with a consultation call.</p>
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
              3 concept layouts included
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
      <section className="py-16" style={{ backgroundColor: '#1a3d2b' }}>
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white">Ready to grow something real?</h2>
          <p className="mt-4 text-gray-300">Start your garden concept intake. Delivered in 5–7 business days with your consultation included.</p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/intake/garden_concept"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#38A169' }}
            >
              Start My Garden Concept <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/homeowners/garden-farming" className="text-sm text-gray-400 hover:text-white transition-colors">
              View all garden services
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
