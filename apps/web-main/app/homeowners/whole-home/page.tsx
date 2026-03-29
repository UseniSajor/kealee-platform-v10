'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Building2, CheckCircle, Layers, Zap, Shield } from 'lucide-react'
import { useState } from 'react'

const ACCENT = '#2ABFBF'

const SERVICES = [
  {
    category: 'Whole Home Concept & Design',
    image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80&auto=format&fit=crop',
    imageAlt: 'Modern open concept whole home renovation with kitchen and living area',
    items: [
      { name: 'Whole Home Concept Package', price: '$750', desc: 'AI whole-home concept with floor plan, room overview, systems summary, and phasing plan. 7–10 business days.' },
      { name: 'Detailed Home Design', price: '$1,800', desc: 'Full whole-home design with detailed floor plans, material selections, and contractor coordination package. Up to 3 rounds.' },
      { name: 'Full Architectural Package', price: 'From $5,500', desc: 'Permit-ready architectural drawings with structural engineering coordination and full contractor documentation.' },
    ],
  },
  {
    category: 'Structural & Systems Upgrades',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80&auto=format&fit=crop',
    imageAlt: 'Home renovation with structural work and systems upgrades in progress',
    items: [
      { name: 'Structural Analysis & Design', price: '$950', desc: 'AI structural change concept: wall removals, beam placements, load path analysis, and engineer coordination overview.' },
      { name: 'Mechanical, Electrical & Plumbing Overview', price: '$650', desc: 'MEP systems audit and upgrade recommendations — HVAC, electrical panel, plumbing layout, and energy efficiency.' },
      { name: 'Full Systems Upgrade', price: 'From $15,000', desc: 'Comprehensive MEP systems upgrade coordination with licensed contractors. Panel, HVAC, plumbing, and insulation.' },
    ],
  },
  {
    category: 'Room-by-Room Transformation',
    image: 'https://images.unsplash.com/photo-1631679706909-1972befa7633?w=600&q=80&auto=format&fit=crop',
    imageAlt: 'Beautiful room renovation with modern finishes and open concept design',
    items: [
      { name: 'Room-by-Room Design', price: '$1,200', desc: 'Detailed design for up to 5 rooms: kitchen, bathrooms, bedrooms, living spaces — with finish and fixture selections.' },
      { name: 'Open Concept Conversion', price: '$850', desc: 'AI design for removing walls, expanding spaces, and creating open-plan living areas. Includes structural overview.' },
      { name: 'Full Interior Finish Package', price: '$2,200', desc: 'Complete interior finish selection: flooring, paint, cabinetry, countertops, lighting, hardware for every room.' },
    ],
  },
  {
    category: 'Energy & Sustainability Upgrades',
    image: 'https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=600&q=80&auto=format&fit=crop',
    imageAlt: 'Solar panels and energy efficient home upgrades on modern residential building',
    items: [
      { name: 'Energy Audit + Upgrade Plan', price: '$595', desc: 'AI energy performance analysis with insulation, windows, HVAC, and solar recommendations with ROI projections.' },
      { name: 'Solar + Battery Storage Design', price: '$450', desc: 'Solar system sizing, panel placement, battery storage, and utility interconnection design. Contractor match included.' },
      { name: 'Green Building Certification Path', price: '$1,200', desc: 'LEED, ENERGY STAR, or net-zero pathway planning with specification requirements and compliance checklist.' },
    ],
  },
]

const BENEFITS = [
  { icon: Building2, title: 'Whole-Home Floor Plan Redesign', desc: 'AI floor plan concepts that optimize your home\'s layout — open concept, room additions, and space reallocation.' },
  { icon: Layers, title: 'Room-by-Room Design System', desc: 'Cohesive design across every room with coordinated finishes, fixtures, and material selections that work together.' },
  { icon: Zap, title: 'Systems & Energy Planning', desc: 'HVAC, electrical, plumbing, and energy efficiency upgrades planned as part of the whole-home concept.' },
  { icon: Shield, title: 'Phased Build Planning', desc: 'Break your renovation into logical phases so you can manage budget, timeline, and livability during construction.' },
  { icon: CheckCircle, title: 'Permit Scope Summary', desc: 'Every whole-home concept includes a permit scope summary so you know what to expect before hiring a contractor.' },
  { icon: ArrowRight, title: 'General Contractor Network', desc: 'Matched with licensed general contractors who specialize in whole-home renovations in your market.' },
]

const FAQ = [
  {
    q: 'What does the Whole Home Concept package include?',
    a: 'The $750 package includes a concept floor plan, room-by-room design overview, MEP systems summary, phasing plan, and a 45-minute consultation. Delivered in 7–10 business days.',
  },
  {
    q: 'Does this include construction or contractor services?',
    a: 'No. All onsite construction is performed by your contractor of record. Kealee provides AI design, final design packages, permit filing, advisory, and contractor matching services only.',
  },
  {
    q: 'Can I renovate in phases?',
    a: 'Yes. The whole home concept includes a phasing plan that breaks your project into logical stages — letting you manage budget, cash flow, and livability during construction.',
  },
  {
    q: 'What permits does a whole-home renovation require?',
    a: 'Whole-home renovations typically require building, electrical, plumbing, and mechanical permits. Structural changes require engineered drawings. We include a permit scope summary in every concept package.',
  },
  {
    q: 'How is this different from hiring an architect directly?',
    a: 'Our AI concept packages help you clarify your vision and get realistic contractor bids before committing to full architectural fees. Many clients use a Kealee concept to decide whether and how to engage a licensed architect.',
  },
]

export default function WholeHomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden py-20 lg:py-28"
        style={{ background: 'linear-gradient(135deg, #0A1F2E 0%, #1A3040 60%, #1A8F8F 100%)' }}
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
                Whole Home Renovation
              </span>
              <h1 className="mt-4 text-4xl font-bold text-white font-display sm:text-5xl lg:text-6xl">
                Your entire home, completely transformed
              </h1>
              <p className="mt-6 text-lg text-gray-300">
                Floor plan redesigns, structural changes, systems upgrades, and room-by-room renovations — AI concept
                design that covers every inch of your home, start to finish.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/concept-engine/whole-home"
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: ACCENT }}
                >
                  Start Whole Home Concept <ArrowRight className="h-4 w-4" />
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
                  src="https://images.unsplash.com/photo-1484154218962-a197022b5858?w=700&q=80&auto=format&fit=crop"
                  alt="Modern open concept whole home renovation"
                  className="h-80 w-full object-cover"
                />
              </div>
              <div
                className="absolute -bottom-4 -left-4 rounded-xl px-4 py-3"
                style={{ backgroundColor: ACCENT, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)' }}
              >
                <p className="text-xs font-semibold text-white">Whole Home Concept</p>
                <p className="text-2xl font-bold text-white font-mono">From $750</p>
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
              Whole Home Services
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
                    style={{ background: 'linear-gradient(to top, rgba(10,31,46,0.85) 0%, transparent 60%)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: ACCENT }}>
                        <Building2 className="h-4 w-4 text-white" />
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
                          href={ii === 0 ? '/concept-engine/whole-home' : '/contact'}
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
            <span className="section-label" style={{ color: ACCENT }}>Why Kealee Whole Home</span>
            <h2 className="mt-3 text-2xl font-bold font-display sm:text-3xl" style={{ color: '#1A2B4A' }}>
              Complete Renovation, Completely Planned
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
      <section className="py-20" style={{ backgroundColor: '#0A1F2E' }}>
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white font-display">Transform Your Whole Home</h2>
          <p className="mt-4 text-lg text-gray-300">
            $750 · Floor plan concept + phasing plan · 7–10 business days · Consultation included
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/concept-engine/whole-home"
              className="inline-flex items-center gap-2 rounded-lg px-8 py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: ACCENT }}
            >
              Start Whole Home Concept <ArrowRight className="h-4 w-4" />
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
