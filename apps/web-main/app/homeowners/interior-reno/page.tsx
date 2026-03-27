'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Layers, CheckCircle, Shield, Zap, Home } from 'lucide-react'
import { useState } from 'react'

const ACCENT = '#7C3AED'

const SERVICES = [
  {
    category: 'Kitchen Renovation',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80&auto=format&fit=crop',
    imageAlt: 'Beautiful modern kitchen renovation with white cabinets and marble countertops',
    items: [
      { name: 'AI Kitchen Concept', price: '$650', desc: 'AI kitchen concept with layout, cabinetry overview, countertop + backsplash selection, and appliance placement. 5–7 days.' },
      { name: 'Full Kitchen Design', price: '$1,500', desc: 'Detailed kitchen design with custom cabinetry specs, lighting plan, and contractor bid package. Up to 3 revision rounds.' },
      { name: 'Kitchen Remodel Build', price: '$25,000–$85,000', desc: 'Full kitchen demolition and renovation by vetted contractor. Includes cabinetry, counters, appliances, plumbing, electrical.' },
    ],
  },
  {
    category: 'Bathroom Renovation',
    image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80&auto=format&fit=crop',
    imageAlt: 'Luxurious bathroom renovation with freestanding tub and custom tile work',
    items: [
      { name: 'AI Bathroom Concept', price: '$450', desc: 'AI bathroom concept with fixture placement, tile selection, vanity overview, and lighting plan. 5–7 days.' },
      { name: 'Master Bath Full Design', price: '$950', desc: 'Detailed master bath design with custom shower, freestanding tub, double vanity, and tile specification package.' },
      { name: 'Bathroom Remodel Build', price: '$8,000–$35,000', desc: 'Full bathroom renovation by vetted contractor. Demo, tile, plumbing fixtures, vanity, and lighting.' },
    ],
  },
  {
    category: 'Home Additions & ADUs',
    image: 'https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=600&q=80&auto=format&fit=crop',
    imageAlt: 'Modern home addition with large windows and seamless integration with existing structure',
    items: [
      { name: 'Addition Concept Design', price: '$850', desc: 'AI addition floor plan: bedroom suite, family room, garage, or ADU. Includes structural overview and permit scope.' },
      { name: 'ADU Design Package', price: '$1,200', desc: 'Full ADU design — detached, attached, or garage conversion — with permit-ready drawings and contractor bid package.' },
      { name: 'Addition Build', price: 'From $45,000', desc: 'Full addition construction by vetted general contractor. Foundation, framing, MEP, insulation, and finishes.' },
    ],
  },
  {
    category: 'Full Interior Renovation',
    image: 'https://images.unsplash.com/photo-1631679706909-1972befa7633?w=600&q=80&auto=format&fit=crop',
    imageAlt: 'Complete interior renovation with open concept design and modern finishes throughout',
    items: [
      { name: 'Multi-Room Interior Concept', price: '$1,100', desc: 'AI concept for up to 4 rooms: flooring, paint, trim, lighting, and finish coordination across the full interior.' },
      { name: 'Full Interior Design Package', price: '$2,800', desc: 'Comprehensive interior design with specification sheets, contractor bid package, and procurement coordination.' },
      { name: 'Full Interior Renovation Build', price: 'From $40,000', desc: 'Complete interior renovation coordination: flooring, paint, trim, lighting, cabinetry, and finish installation.' },
    ],
  },
]

const BENEFITS = [
  { icon: Layers, title: 'Room-by-Room AI Design', desc: 'Every space designed cohesively — finishes, fixtures, and layouts that work together across the whole interior.' },
  { icon: Zap, title: 'Fast Concept Turnaround', desc: 'Kitchen and bathroom concepts delivered in 5–7 business days with revision rounds included in every package.' },
  { icon: Shield, title: 'Permit-Ready Drawings', desc: 'Addition and ADU packages include permit-ready drawings and structural coordination for faster permitting.' },
  { icon: CheckCircle, title: 'Finish Specification Packages', desc: 'Every concept includes a finish selection guide with countertop, tile, flooring, fixture, and cabinetry options.' },
  { icon: Home, title: 'Vetted Interior Contractors', desc: 'Matched with licensed kitchen, bathroom, and addition contractors who specialize in your project type.' },
  { icon: ArrowRight, title: 'Phased Renovation Planning', desc: 'Break large interior projects into phases — prioritize high-impact rooms and manage budget effectively.' },
]

const FAQ = [
  {
    q: 'What\'s included in the AI Kitchen or Bathroom Concept?',
    a: 'The kitchen concept ($650) includes layout design, cabinetry overview, countertop + backsplash selection, appliance placement, and a 45-minute consultation. The bathroom concept ($450) includes fixture placement, tile selection, vanity overview, and lighting plan.',
  },
  {
    q: 'Does this include construction or installation?',
    a: 'No. All onsite construction is performed by your contractor of record. Kealee provides AI design, advisory, and contractor matching services only.',
  },
  {
    q: 'Can you design a home addition or ADU?',
    a: 'Yes. Our Addition Concept Design ($850) covers bedroom suites, family rooms, garages, and ADUs with structural overview and permit scope. The ADU Design Package ($1,200) includes permit-ready drawings for detached, attached, or garage conversion ADUs.',
  },
  {
    q: 'What permits are required for interior renovations?',
    a: 'Kitchen and bathroom remodels typically require electrical, plumbing, and sometimes mechanical permits. Additions always require full building permits. We include a permit scope summary in every concept package.',
  },
  {
    q: 'Can I get concepts for multiple rooms at once?',
    a: 'Yes. The Multi-Room Interior Concept ($1,100) covers up to 4 rooms with coordinated finishes. For the entire home, consider our Whole Home Renovation package.',
  },
  {
    q: 'How do I get matched with a contractor?',
    a: 'After your concept is complete, activate Contractor Match to receive competitive bids from vetted kitchen, bathroom, and addition contractors in your area. All contractors are licensed and background-checked through our Marketplace.',
  },
]

export default function InteriorRenoPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden py-20 lg:py-28"
        style={{ background: 'linear-gradient(135deg, #1A0A2E 0%, #2D1B69 60%, #7C3AED 100%)' }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white"
                style={{ backgroundColor: `${ACCENT}CC` }}
              >
                Interior Reno & Additions
              </span>
              <h1 className="mt-4 text-4xl font-bold text-white font-display sm:text-5xl lg:text-6xl">
                Every room, redesigned from the inside out
              </h1>
              <p className="mt-6 text-lg text-gray-300">
                Kitchen remodels, bathroom renovations, home additions, ADUs, and full interior transformations — AI
                concept design that gets you from vision to vetted contractor with no wasted weekends.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/concept-engine/interior-reno"
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: ACCENT }}
                >
                  Start Interior Concept <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/contact" className="btn-outline-white">
                  Talk to Our Team
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="relative hidden lg:block"
            >
              <div className="overflow-hidden rounded-2xl" style={{ boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)' }}>
                <img
                  src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=700&q=80&auto=format&fit=crop"
                  alt="Beautiful modern kitchen renovation with white cabinets and marble countertops"
                  className="h-80 w-full object-cover"
                />
              </div>
              <div
                className="absolute -bottom-4 -left-4 rounded-xl px-4 py-3"
                style={{ backgroundColor: ACCENT, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)' }}
              >
                <p className="text-xs font-semibold text-white">Interior Reno Concept</p>
                <p className="text-2xl font-bold text-white font-mono">From $450</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="bg-white py-4">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="text-sm text-gray-500">
            All onsite construction is performed by your contractor of record. Kealee provides AI design, advisory, and
            contractor matching services only.
          </p>
        </div>
      </div>

      {/* Services */}
      <section className="py-20" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label" style={{ color: ACCENT }}>Services & Pricing</span>
            <h2 className="mt-3 text-3xl font-bold font-display sm:text-4xl" style={{ color: '#1A2B4A' }}>
              Interior Renovation Services
            </h2>
          </div>

          <div className="mt-12 space-y-12">
            {SERVICES.map((section, si) => (
              <motion.div
                key={section.category}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: si * 0.1 }}
                className="overflow-hidden rounded-2xl bg-white"
                style={{ boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)' }}
              >
                <div className="relative h-40 overflow-hidden">
                  <img src={section.image} alt={section.imageAlt} className="h-full w-full object-cover" />
                  <div
                    className="absolute inset-0 flex items-end p-6"
                    style={{ background: 'linear-gradient(to top, rgba(26,10,46,0.85) 0%, transparent 60%)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: ACCENT }}>
                        <Layers className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-white font-display">{section.category}</h3>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {section.items.map((item, ii) => (
                    <div key={item.name} className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm" style={{ color: '#1A2B4A' }}>{item.name}</span>
                          {ii === 0 && (
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ backgroundColor: ACCENT }}>
                              Start Here
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-3 sm:ml-6">
                        <span className="font-bold font-mono text-sm" style={{ color: ACCENT }}>{item.price}</span>
                        <Link
                          href={ii === 0 ? '/concept-engine/interior-reno' : '/contact'}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90"
                          style={{ backgroundColor: ACCENT }}
                        >
                          {ii === 0 ? 'Get Started' : 'Inquire'} <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label" style={{ color: ACCENT }}>Why Kealee Interior</span>
            <h2 className="mt-3 text-2xl font-bold font-display sm:text-3xl" style={{ color: '#1A2B4A' }}>
              From Concept to Keys
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b, i) => {
              const Icon = b.icon
              return (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="rounded-xl bg-white p-6"
                  style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.08)' }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${ACCENT}20` }}>
                    <Icon className="h-5 w-5" style={{ color: ACCENT }} />
                  </div>
                  <h3 className="mt-3 font-semibold" style={{ color: '#1A2B4A' }}>{b.title}</h3>
                  <p className="mt-1 text-sm text-gray-600 leading-relaxed">{b.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <span className="section-label" style={{ color: ACCENT }}>FAQ</span>
            <h2 className="mt-3 text-2xl font-bold font-display sm:text-3xl" style={{ color: '#1A2B4A' }}>Common Questions</h2>
          </div>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-gray-50"
                >
                  <span className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>{item.q}</span>
                  <span className="text-gray-500 text-xl leading-none">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm leading-relaxed text-gray-600">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ backgroundColor: '#1A0A2E' }}>
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white font-display">Start Your Interior Renovation</h2>
          <p className="mt-4 text-lg text-gray-300">
            Kitchen concept from $650 · Bathroom from $450 · Addition from $850 · Consultation included
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/concept-engine/interior-reno"
              className="inline-flex items-center gap-2 rounded-lg px-8 py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: ACCENT }}
            >
              Start Interior Concept <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/homeowners" className="btn-outline-white">
              View All Home Services
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
