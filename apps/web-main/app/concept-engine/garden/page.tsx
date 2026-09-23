'use client'

import Link from 'next/link'
import { ArrowRight, ArrowLeft, CheckCircle, Leaf, MapPin, Droplets, Sun, Clock } from 'lucide-react'
import { getProductPricing, formatPriceRange } from '@kealee/core-rules'

// Price and contents come from the quoting engine, never from copy. The tier
// cards this replaced advertised $99/$399/$799 for packages that no longer
// exist, while the engine priced the product at $595-$995.
const GARDEN = getProductPricing('garden_concept')!
const GARDEN_PRICE = `From ${formatPriceRange('garden_concept')?.split('–')[0] ?? ''}`

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

      {/* Pre-design disclaimer banner */}
      <div className="bg-green-50 border-b border-green-100 py-2.5 px-4 text-center text-sm text-green-800">
        design concept is a pre-design service — not a permit-ready plan.{' '}
        <Link href="/design-services" className="font-semibold underline hover:text-green-900">
          Need permit-ready plans? See Design Services →
        </Link>
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
                All onsite installation and build work is performed by your contractor of record. Kealee provides design, final design packages, permit filing, advisory, and contractor matching services only.
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
              Garden and Landscape Concept
            </h2>
            <p className="mt-3 text-gray-500">One package. Your exact price is quoted after intake, from the size and conditions of your property.</p>
          </div>
          <div className="mx-auto mt-12 max-w-2xl">
            <div
              className="relative flex flex-col rounded-xl bg-white p-8"
              style={{ boxShadow: '0 10px 25px -5px #38A16940', border: '2px solid #38A169' }}
            >
              <h3 className="font-bold font-display text-xl" style={{ color: '#1A2B4A' }}>
                {GARDEN.label}
              </h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono" style={{ color: '#38A169' }}>
                  {GARDEN_PRICE}
                </span>
                <span className="text-sm text-gray-500">quoted after intake</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">{GARDEN.deliveryDays}</p>
              <ul className="mt-5 space-y-2.5">
                {GARDEN.included.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: '#38A169' }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/intake/garden_concept"
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#38A169', color: '#fff' }}
              >
                Start My Garden Concept <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
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
