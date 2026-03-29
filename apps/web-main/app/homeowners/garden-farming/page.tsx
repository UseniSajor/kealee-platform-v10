import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Leaf, Droplets, Sun, Home } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Home Farming & Garden Design/Build — Kealee',
  description: 'AI garden design, raised beds, backyard farming, drip irrigation, and greenhouse build. Property-specific design concepts starting at $395.',
}

const SERVICES = [
  {
    icon:    Leaf,
    color:   '#38A169',
    title:   'Garden Design',
    desc:    'AI-powered garden layouts tailored to your space, sun exposure, and goals. From decorative to productive gardens.',
    items: [
      { name: 'AI Garden Concept Package',  price: '$395',        note: '3 layout options · consultation included' },
      { name: 'Advanced Garden Design',     price: '$750',        note: 'Detailed plant lists + irrigation specs + 3D views' },
      { name: 'Full Landscape Design',      price: '$2,500+',     note: 'Permit-ready landscape plans + contractor package · 2–3 weeks' },
    ],
  },
  {
    icon:    Sun,
    color:   '#D69E2E',
    title:   'Raised Beds & Backyard Farming',
    desc:    'Custom raised bed layouts and backyard farming systems designed for your space — from a single bed to full food production.',
    items: [
      { name: 'Raised Bed Design',          price: '$295',        note: 'AI layout + placement + sizing plan' },
      { name: 'Raised Bed Build Package',   price: '$1,200–$3,500', note: 'Design + vetted contractor build · 2–6 beds' },
      { name: 'Full Farm Layout',           price: '$4,500+',     note: 'Beds + paths + irrigation + compost + fencing' },
    ],
  },
  {
    icon:    Droplets,
    color:   '#2B6CB0',
    title:   'Irrigation & Water Systems',
    desc:    'Drip irrigation, rainwater harvesting, and water management designed for efficiency and maximum plant health.',
    items: [
      { name: 'Drip Irrigation Design',     price: 'Free AI',     note: 'Included with garden concept packages' },
      { name: 'Drip System Install',        price: '$850–$2,500', note: 'Design + vetted contractor installation' },
      { name: 'Rainwater Harvesting',       price: '$2,500–$6,000', note: 'Tank + collection + distribution system' },
    ],
  },
  {
    icon:    Home,
    color:   '#2D3748',
    title:   'Greenhouse & Structures',
    desc:    'Greenhouse design, cold frames, shade structures, and garden buildings — planned and built for your property.',
    items: [
      { name: 'Greenhouse Design',          price: '$450',        note: 'AI layout + structural direction + siting plan' },
      { name: 'Greenhouse Build',           price: '$3,500–$15,000', note: 'Custom or kit install via vetted contractor' },
      { name: 'Cold Frame + Shade Structures', price: '$500–$2,500', note: 'Season extension and shade design + build' },
    ],
  },
]

const BENEFITS = [
  { title: 'AI-Designed for Your Property',   desc: 'Every concept is built around your specific yard, sun exposure, and soil conditions — not a generic template.' },
  { title: 'Vetted Garden Contractors',        desc: 'All installation and build work is performed by licensed, background-checked contractors in our network.' },
  { title: 'Seasonal Planning Built In',       desc: 'Your concept includes a seasonal planting calendar tailored to your climate zone and goals.' },
  { title: 'Water Efficiency First',           desc: 'Drip irrigation and water management built into every design to reduce waste and maximize yield.' },
  { title: 'Permit Coordination',              desc: 'For structures and major installations, we flag permit requirements and guide you through the process.' },
  { title: 'Harvest Planning Included',        desc: 'For food gardens and farms, we include planting schedules, variety recommendations, and yield estimates.' },
]

const WORKFLOW = [
  { step: '01', title: 'Submit Your Goals',          desc: 'Share your address, photos, and what you want to grow or create. Takes about 10 minutes.' },
  { step: '02', title: 'AI Concept Delivered',       desc: 'Receive 3 property-specific garden concepts in 5–7 business days, with a consultation call.' },
  { step: '03', title: 'Contractor Match',            desc: 'Review your concept and get matched to vetted garden contractors in your area for build estimates.' },
  { step: '04', title: 'Build + Install',             desc: 'Your contractor handles all onsite work — beds, irrigation, structures, plantings, and more.' },
  { step: '05', title: 'Harvest + Maintain',          desc: 'Your seasonal calendar and maintenance guides keep your garden productive year-round.' },
]

const FAQS = [
  {
    q: 'What does the AI garden concept package include?',
    a: 'The $395 AI Garden Concept Package includes 3 property-specific layout options, raised bed placement, irrigation overview, plant suggestions, a seasonal planting calendar, soil recommendations, a downloadable PDF, and a 30-minute consultation call.',
  },
  {
    q: 'Does Kealee do the planting and installation onsite?',
    a: 'No. All onsite installation and build work is performed by your contractor of record. Kealee provides AI design, final design packages, permit filing, advisory, and contractor matching services only.',
  },
  {
    q: 'What kinds of contractors do you match for garden projects?',
    a: 'We match landscape contractors, hardscape specialists, irrigation installers, and general contractors experienced in outdoor structures. All are background-checked and license-verified.',
  },
  {
    q: 'Do I need a permit for a garden or greenhouse?',
    a: 'Raised beds typically don\'t require permits. Greenhouses and large permanent structures may need building permits depending on your jurisdiction and size. We flag this during your concept review.',
  },
  {
    q: 'How many revision rounds are included?',
    a: 'The AI Garden Concept ($395) includes 1 feedback round with 3 layout options. The Advanced Garden Design ($750) includes up to 3 rounds. The Full Landscape Design includes up to 5 rounds.',
  },
  {
    q: 'Can you design just irrigation without a full garden redesign?',
    a: 'Yes. Drip irrigation design is included free with any concept package, and we also offer standalone irrigation design and installation coordination starting at $850.',
  },
]

export default function GardenFarmingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="py-20 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #1a3d2b 0%, #276749 100%)' }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4"
              style={{ backgroundColor: 'rgba(56,161,105,0.25)', color: '#68D391' }}
            >
              Home Farming & Garden Design/Build
            </span>
            <h1 className="text-4xl font-bold text-white font-display leading-tight sm:text-5xl">
              Grow Something Real.
            </h1>
            <p className="mt-5 text-lg text-gray-300 leading-relaxed">
              AI-powered garden design, raised beds, backyard farming, drip irrigation, and greenhouse build — all from one platform. Property-specific concepts starting at $395.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/concept-engine/garden"
                className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#38A169' }}
              >
                Start My Garden Concept <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-7 py-3.5 text-base font-semibold text-white/80 hover:text-white hover:border-white/40 transition-all"
              >
                Talk to Our Team
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-gray-300">
              {['AI garden design', 'Vetted landscape contractors', 'Raised beds + irrigation', 'Greenhouse build'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4" style={{ color: '#68D391' }} />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Photo grid */}
      <section className="py-12 border-b border-gray-100">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <img
              src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80"
              alt="Garden raised beds"
              className="h-40 w-full rounded-xl object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=80"
              alt="Backyard vegetable garden"
              className="h-40 w-full rounded-xl object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80"
              alt="Drip irrigation system"
              className="h-40 w-full rounded-xl object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1520052205864-92d242b3a76b?w=600&q=80"
              alt="Garden greenhouse"
              className="h-40 w-full rounded-xl object-cover"
            />
          </div>
        </div>
      </section>

      {/* Services pricing */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold font-display" style={{ color: '#1A2B4A' }}>Garden & Farming Services</h2>
            <p className="mt-3 text-gray-500">From concept to contractor — every garden service in one place.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {SERVICES.map(svc => (
              <div key={svc.title} className="rounded-2xl border border-gray-200 bg-white p-7">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${svc.color}14` }}>
                    <svc.icon className="h-5 w-5" style={{ color: svc.color }} />
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: '#1A2B4A' }}>{svc.title}</h3>
                </div>
                <p className="mb-5 text-sm text-gray-500 leading-relaxed">{svc.desc}</p>
                <div className="space-y-3">
                  {svc.items.map(item => (
                    <div key={item.name} className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>{item.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.note}</p>
                      </div>
                      <span className="shrink-0 text-sm font-bold" style={{ color: svc.color }}>{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-gray-400">
            All onsite installation and build work is performed by your contractor of record. Kealee provides AI design, final design packages, permit filing, advisory, and contractor matching services only.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 border-t border-gray-100" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold font-display" style={{ color: '#1A2B4A' }}>Why Kealee for your garden</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(b => (
              <div key={b.title} className="rounded-xl bg-white p-6 border border-gray-200">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(56,161,105,0.12)' }}>
                  <CheckCircle className="h-4 w-4" style={{ color: '#38A169' }} />
                </div>
                <h3 className="mb-2 font-semibold" style={{ color: '#1A2B4A' }}>{b.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold font-display" style={{ color: '#1A2B4A' }}>From concept to harvest</h2>
            <p className="mt-3 text-gray-500">5 simple steps to get your garden designed and built.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {WORKFLOW.map((w, i) => (
              <div key={w.step} className="relative text-center">
                {i < WORKFLOW.length - 1 && (
                  <div className="absolute left-1/2 top-5 hidden h-0.5 w-full lg:block" style={{ backgroundColor: 'rgba(56,161,105,0.2)' }} />
                )}
                <div
                  className="relative mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: '#38A169' }}
                >
                  {w.step}
                </div>
                <h3 className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>{w.title}</h3>
                <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-gray-100" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-3xl font-bold font-display" style={{ color: '#1A2B4A' }}>Common questions</h2>
          <div className="space-y-6">
            {FAQS.map(faq => (
              <div key={faq.q} className="rounded-xl bg-white p-6 border border-gray-200">
                <h3 className="font-semibold" style={{ color: '#1A2B4A' }}>{faq.q}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg, #1a3d2b 0%, #276749 100%)' }}>
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white font-display">Start Growing</h2>
          <p className="mt-4 text-gray-300 leading-relaxed">
            Get a property-specific AI garden concept in 5–7 business days. Includes consultation, raised bed plan, irrigation overview, and seasonal calendar.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/concept-engine/garden"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#38A169' }}
            >
              Start My Garden Concept <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">
              Talk to our team first
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
