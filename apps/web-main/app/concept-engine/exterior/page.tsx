'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Home, CheckCircle, Star } from 'lucide-react'
import { useState } from 'react'

const ACCENT = '#E8793A'

const STEPS = [
  {
    n: '01',
    title: 'Your Property',
    desc: 'Share your address, photos of your current exterior, and any reference images you love.',
  },
  {
    n: '02',
    title: 'Your Goals',
    desc: 'Tell us what you want: new facade, landscaping refresh, hardscaping, outdoor kitchen, driveway update.',
  },
  {
    n: '03',
    title: 'Site Analysis',
    desc: 'Our AI evaluates your lot, existing architecture, neighborhood context, and local climate.',
  },
  {
    n: '04',
    title: 'Your Concept',
    desc: 'Receive 3 exterior concept renderings with material palettes, a landscape plan, and a contractor-ready PDF.',
  },
]

const INCLUDED = [
  '3 exterior concept renderings',
  'Facade redesign with material + color palette',
  'Front yard landscape & planting plan',
  'Hardscape layout (driveway, walkways, patios)',
  'Outdoor living space design',
  'Lighting placement overview',
  'Downloadable PDF concept package',
  '30-minute consultation call',
]

const TIERS = [
  {
    name: 'AI Exterior Concept',
    price: '$595',
    rounds: '1 feedback round',
    turnaround: '5–7 business days',
    desc: 'AI-generated exterior concept with 3 renderings, material palette, and landscape layout.',
    items: ['3 exterior concept renderings', 'Material + color palette', 'Landscape overview', '30-min consultation'],
    cta: 'Start My Exterior Concept',
  },
  {
    name: 'Advanced Exterior Design',
    price: '$1,200',
    rounds: 'Up to 3 feedback rounds',
    turnaround: '10–14 business days',
    desc: 'Full exterior design with detailed landscape plan, hardscape specifications, and lighting layout.',
    items: [
      'Everything in AI Concept',
      'Detailed hardscape plan',
      'Lighting layout + fixture specs',
      'Plant species + sizing list',
      '60-min consultation call',
    ],
    cta: 'Start Advanced Design',
    popular: true,
  },
  {
    name: 'Full Landscape Design',
    price: 'From $3,500',
    rounds: 'Up to 5 rounds',
    turnaround: '3–4 weeks',
    desc: 'Complete landscape + exterior design package with permit-ready drawings and contractor bid documents.',
    items: [
      'Everything in Advanced',
      'Permit-level drawings',
      'Contractor bid documents',
      'Irrigation system plan',
      'Full grading + drainage plan',
    ],
    cta: 'Contact Us',
  },
]

const FAQ = [
  {
    q: 'What is the AI Exterior Concept Package?',
    a: 'It\'s a $595 AI-generated concept design package for your home\'s exterior. You submit your property details and goals; we deliver 3 rendered concepts, a material palette, a landscape overview, and a consultation call — all within 5–7 business days.',
  },
  {
    q: 'Does this include contractor services?',
    a: 'No. The concept package is a design and planning service only. All onsite installation and build work is performed by your contractor of record. Kealee provides AI design, advisory, and contractor matching services only.',
  },
  {
    q: 'What kinds of contractors do you match with?',
    a: 'We match with licensed landscape contractors, hardscape specialists, exterior painters, masonry contractors, and outdoor living builders — all vetted through our Marketplace.',
  },
  {
    q: 'Are permits required for exterior work?',
    a: 'It depends on the scope. Landscape and painting typically don\'t require permits. Structural changes, driveways, retaining walls, and additions often do. We note permit scope in every concept package.',
  },
  {
    q: 'How many revision rounds are included?',
    a: 'The AI Exterior Concept includes 1 feedback round. Advanced Design includes up to 3 rounds. Full Landscape Design includes up to 5 rounds.',
  },
  {
    q: 'Can I use the concept package to get contractor bids?',
    a: 'Yes — that\'s the point. Every concept package is designed to be contractor-ready so you can get accurate bids from multiple contractors without paying for an architect first.',
  },
]

export default function ExteriorConceptPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div>
      {/* Back nav */}
      <div className="border-b border-gray-100 bg-white py-3">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/concept-engine"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Concept Engine
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section
        className="relative overflow-hidden py-20 lg:py-28"
        style={{ background: 'linear-gradient(135deg, #1A2B4A 0%, #2A3D5F 60%, #C65A20 100%)' }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="section-label" style={{ color: '#F09A5A' }}>
                AI Exterior Concept
              </span>
              <h1 className="mt-3 text-4xl font-bold text-white font-display sm:text-5xl lg:text-6xl">
                See your exterior before the first brushstroke
              </h1>
              <p className="mt-6 text-lg text-gray-300">
                AI-generated exterior concepts covering facade redesign, landscaping, hardscaping, driveways, and outdoor
                living — delivered as a contractor-ready package in 5–7 business days.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/intake/exterior_concept"
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: ACCENT }}
                >
                  Start My Exterior Concept <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="btn-outline-white"
                >
                  Talk to Our Team
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap gap-4">
                {['3 concept renderings', '5–7 day delivery', 'Consultation included', '1 feedback round'].map((t) => (
                  <span key={t} className="flex items-center gap-1.5 text-sm text-gray-300">
                    <CheckCircle className="h-4 w-4" style={{ color: ACCENT }} /> {t}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Photo */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="relative hidden lg:block"
            >
              <div className="overflow-hidden rounded-2xl" style={{ boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)' }}>
                <img
                  src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=700&q=80&auto=format&fit=crop"
                  alt="Beautiful home exterior with professional landscaping and curb appeal"
                  className="h-80 w-full object-cover"
                />
              </div>
              <div
                className="absolute -bottom-4 -left-4 rounded-xl px-4 py-3"
                style={{ backgroundColor: ACCENT, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)' }}
              >
                <p className="text-xs font-semibold text-white">AI Exterior Concept</p>
                <p className="text-2xl font-bold text-white font-mono">$595</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What's Included + Steps */}
      <section className="py-20" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Included sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl p-6 text-white"
              style={{ backgroundColor: '#1A2B4A' }}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: ACCENT }}>
                  <Home className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg font-bold font-display">What&apos;s Included</h2>
              </div>
              <ul className="space-y-3">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: ACCENT }} />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-gray-700 pt-6">
                <p className="text-xs text-gray-400">
                  All onsite installation and build work is performed by your contractor of record. Kealee provides AI design,
                  advisory, and contractor matching services only.
                </p>
              </div>
            </motion.div>

            {/* Steps */}
            <div className="lg:col-span-2">
              <span className="section-label">How It Works</span>
              <h2 className="mt-3 text-2xl font-bold font-display sm:text-3xl" style={{ color: '#1A2B4A' }}>
                4 Steps to Your Exterior Concept
              </h2>
              <div className="mt-8 space-y-6">
                {STEPS.map((step, i) => (
                  <motion.div
                    key={step.n}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className="flex gap-5 rounded-xl bg-white p-5"
                    style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.08)' }}
                  >
                    <span
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold text-white"
                      style={{ backgroundColor: ACCENT }}
                    >
                      {step.n}
                    </span>
                    <div>
                      <h3 className="font-semibold" style={{ color: '#1A2B4A' }}>{step.title}</h3>
                      <p className="mt-1 text-sm text-gray-600">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label">Packages</span>
            <h2 className="mt-3 text-2xl font-bold font-display sm:text-3xl" style={{ color: '#1A2B4A' }}>
              Exterior Design Packages
            </h2>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {TIERS.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative flex flex-col rounded-xl bg-white p-6"
                style={{
                  boxShadow: tier.popular
                    ? `0 10px 25px -5px ${ACCENT}40`
                    : '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                  border: tier.popular ? `2px solid ${ACCENT}` : '1px solid #E5E7EB',
                }}
              >
                {tier.popular && (
                  <span
                    className="absolute right-4 top-4 rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: ACCENT }}
                  >
                    Most Popular
                  </span>
                )}
                <h3 className="font-bold font-display" style={{ color: '#1A2B4A' }}>{tier.name}</h3>
                <div className="my-3">
                  <span className="text-3xl font-bold font-mono" style={{ color: ACCENT }}>{tier.price}</span>
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
                  href={tier.cta === 'Contact Us' ? '/contact' : '/intake/exterior_concept'}
                  className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-all hover:opacity-90"
                  style={{
                    backgroundColor: tier.popular ? ACCENT : 'transparent',
                    color: tier.popular ? '#fff' : ACCENT,
                    border: tier.popular ? 'none' : `2px solid ${ACCENT}`,
                  }}
                >
                  {tier.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <span className="section-label">FAQ</span>
            <h2 className="mt-3 text-2xl font-bold font-display sm:text-3xl" style={{ color: '#1A2B4A' }}>
              Common Questions
            </h2>
          </div>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left"
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
      <section className="py-20" style={{ backgroundColor: '#1A2B4A' }}>
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white font-display">Start Your Exterior Concept Today</h2>
          <p className="mt-4 text-lg text-gray-300">
            $595 · 3 renderings · 5–7 business days · Consultation included
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/intake/exterior_concept"
              className="inline-flex items-center gap-2 rounded-lg px-8 py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: ACCENT }}
            >
              Start My Exterior Concept <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/concept-engine" className="btn-outline-white">
              View All Concept Paths
            </Link>
          </div>
          <p className="mt-6 text-xs text-gray-500">
            All onsite installation and build work is performed by your contractor of record. Kealee provides AI design,
            advisory, and contractor matching services only.
          </p>
        </div>
      </section>
    </div>
  )
}
