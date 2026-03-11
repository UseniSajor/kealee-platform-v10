'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, ArrowRight, HelpCircle, Plus, Minus } from 'lucide-react'
import { useState } from 'react'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true as const },
  transition: { duration: 0.5 },
}

const PM_PACKAGES = [
  {
    name: 'Starter',
    subtitle: 'Self-Service',
    price: '$299',
    period: 'mo',
    description: 'For DIY-savvy owners who want project tracking and AI tools.',
    features: [
      'Digital Twin L1 — 3 tracked KPIs',
      '7-milestone payment schedule tracking',
      'KeaBot Owner AI assistant',
      'OS-PM core (schedules, milestones)',
      'Email & SMS notifications',
      'Document storage (5 GB)',
      'Renovation & Addition project types',
    ],
    cta: 'Start Free Trial',
    ctaHref: '/contact',
    popular: false,
    accent: 'teal' as const,
  },
  {
    name: 'Professional',
    subtitle: 'Guided',
    price: '$1,499',
    period: 'mo',
    description: 'For owners who want professional oversight with AI-powered tools.',
    features: [
      'Everything in Starter',
      'Digital Twin L2 — 6 tracked KPIs + health score',
      'Dedicated PM advisor',
      'Escrow milestone payments (OS-Pay)',
      'Contractor vetting via Marketplace',
      'KeaBot Construction + KeaBot Estimate',
      '10 CSI trade categories tracked',
      'Weekly AI progress reports',
    ],
    cta: 'Start Free Trial',
    ctaHref: '/contact',
    popular: true,
    accent: 'orange' as const,
  },
  {
    name: 'Enterprise',
    subtitle: 'Full-Service',
    price: '$4,500',
    period: 'mo',
    description: 'Full project management for complex builds and developments.',
    features: [
      'Everything in Professional',
      'Digital Twin L3 — 10 KPIs + predictive alerts',
      'Full-time project manager',
      'All 12 lifecycle phases tracked',
      'Lender draw coordination (OS-Pay + OS-Dev)',
      'All 13 KeaBot AI assistants',
      '6 permit types auto-tracked',
      'Change orders, RFIs, daily logs',
    ],
    cta: 'Contact Sales',
    ctaHref: '/contact',
    popular: false,
    accent: 'navy' as const,
  },
  {
    name: 'Portfolio',
    subtitle: 'Developer & Investor',
    price: 'Custom',
    period: '',
    description: 'For developers managing multiple projects and capital stacks.',
    features: [
      'Everything in Enterprise',
      'OS-Land + OS-Feas + OS-Dev full access',
      'Multi-project Digital Twins',
      'Capital stack builder & draw management',
      'Investor reporting & distributions',
      'Multifamily & Mixed-Use project types',
      'API access & custom integrations',
      'Dedicated success manager',
    ],
    cta: 'Contact Sales',
    ctaHref: '/contact',
    popular: false,
    accent: 'green' as const,
  },
]

const accentColors = {
  teal: '#2ABFBF',
  orange: '#E8793A',
  navy: '#1A2B4A',
  green: '#38A169',
}

const ADDON_PACKAGES = [
  { name: 'Permit Package', price: 'From $750', description: 'Covers 6 permit types (Building, Electrical, Plumbing, Mechanical, Zoning, Demolition). KeaBot Permit prepares checklists, tracks typical review timelines (10-45 days), and coordinates inspections.' },
  { name: 'Design Package', price: 'From $2,500', description: 'Concept design through construction documents. BIM model integration with 3D Digital Twin viewer. Architect network for licensed professionals.' },
  { name: 'Estimation Package', price: 'From $500', description: 'AI cost estimation across 10 CSI MasterFormat divisions (Concrete through Electrical). Assembly-level costing with RSMeans data and line-item breakdowns.' },
  { name: 'Land Analysis', price: 'From $1,000', description: 'Full parcel analysis via OS-Land: AI zoning analysis, environmental screening, comparable sales, and development readiness scoring with one-click project conversion.' },
  { name: 'Feasibility Study', price: 'From $2,000', description: 'Multi-scenario pro forma via OS-Feas: unit mix modeling, cost and revenue assumptions, IRR/cash-on-cash projections, sensitivity analysis, and AI-powered go/no-go recommendations.' },
]

const FAQ_ITEMS = [
  { question: 'What is a Digital Twin?', answer: 'A Digital Twin is a living digital representation of your construction project. It aggregates data from all 7 operating systems into a single health score and KPI dashboard. L1 twins track 3 KPIs (budget, schedule, quality). L2 twins add health scoring with 6 KPIs. L3 twins provide full predictive analytics with 10 KPIs across all 12 lifecycle phases.' },
  { question: 'What are KeaBots?', answer: 'KeaBots are 13 AI assistants specialized for different construction domains — from KeaBot Owner (project advice) to KeaBot GC (contractor ops) to KeaBot Finance (capital stacks). Each uses domain-specific tools that call OS service APIs. They never replace the system of record — they orchestrate, assist, and automate. Powered by Claude AI.' },
  { question: 'How does escrow payment work?', answer: 'Kealee uses a 7-milestone payment schedule: Deposit (10%), Foundation (15%), Framing (20%), MEP Rough-In (15%), Drywall (15%), Finish (15%), and Final Completion (10%). Funds are held in escrow and released only when each milestone is verified. Lien waivers are collected automatically before every release.' },
  { question: 'What project types does Kealee support?', answer: 'Kealee supports 6 project types: Renovation/Remodel (L1 twin), Home Addition (L2), New Home Construction (L2), Commercial Build-Out (L2), Multifamily Development (L3), and Mixed-Use Development (L3). Each type comes pre-configured with the right OS modules and lifecycle phases.' },
  { question: 'What are the 12 lifecycle phases?', answer: 'Every project moves through: Idea → Land → Feasibility → Design → Permits → Pre-Construction → Construction → Inspections → Payments → Closeout → Operations → Archive. Not every project uses all 12 — a renovation might skip Land and Feasibility, while a multifamily development uses every phase.' },
  { question: 'Do I need all 7 operating systems?', answer: 'No. Each plan includes the OS modules relevant to that tier. Starter includes OS-PM core. Professional adds OS-Pay and Marketplace. Enterprise adds all OS modules with 6 permit types tracked. Portfolio adds OS-Land, OS-Feas, and OS-Dev for pre-development and investor reporting.' },
]

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <div>
      {/* Hero */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.span {...fadeInUp} className="section-label">
            Pricing
          </motion.span>
          <motion.h1
            {...fadeInUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-3 text-4xl font-bold font-display sm:text-5xl"
            style={{ color: '#1A2B4A' }}
          >
            Simple, Transparent Pricing
          </motion.h1>
          <motion.p
            {...fadeInUp}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-gray-600"
          >
            Choose the level of support that fits your project. All plans include your AI assistant and Digital Twin.
          </motion.p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-4">
            {PM_PACKAGES.map((pkg, i) => {
              const color = accentColors[pkg.accent]
              return (
                <motion.div
                  key={pkg.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="relative flex flex-col overflow-hidden rounded-xl bg-white"
                  style={{
                    boxShadow: pkg.popular ? '0 10px 15px -3px rgb(0 0 0 / 0.1)' : '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                    border: pkg.popular ? `2px solid ${color}` : '1px solid #E5E7EB',
                  }}
                >
                  {pkg.popular && (
                    <div className="absolute right-0 top-0 mr-4 mt-4">
                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                        style={{ backgroundColor: color }}
                      >
                        Popular
                      </span>
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-lg font-semibold" style={{ color: '#1A2B4A' }}>{pkg.name}</h3>
                    <p className="text-sm text-gray-500">{pkg.subtitle}</p>

                    <div className="my-4">
                      <span className="text-4xl font-bold font-mono" style={{ color }}>{pkg.price}</span>
                      {pkg.period && <span className="ml-1 text-sm text-gray-500">/{pkg.period}</span>}
                    </div>

                    <p className="mb-6 text-sm text-gray-600">{pkg.description}</p>

                    <ul className="mb-6 flex-1 space-y-3">
                      {pkg.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                          <span className="text-sm text-gray-700">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={pkg.ctaHref}
                      className="flex w-full items-center justify-center rounded-lg py-3 px-4 text-sm font-semibold transition-all hover:opacity-90"
                      style={{
                        backgroundColor: pkg.popular ? color : 'transparent',
                        color: pkg.popular ? '#FFFFFF' : color,
                        border: pkg.popular ? 'none' : `2px solid ${color}`,
                      }}
                    >
                      {pkg.cta}
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Add-on Services */}
      <section className="py-20" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label">Add-On Services</span>
            <h2 className="mt-3 text-2xl font-bold font-display sm:text-3xl" style={{ color: '#1A2B4A' }}>
              Specialized Services
            </h2>
            <p className="mt-4 text-gray-600">
              Add professional services to any plan for additional capabilities.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ADDON_PACKAGES.map((pkg, i) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="rounded-xl bg-white p-6"
                style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}
              >
                <h3 className="text-lg font-semibold" style={{ color: '#1A2B4A' }}>{pkg.name}</h3>
                <p className="mt-1 text-2xl font-bold" style={{ color: '#E8793A' }}>{pkg.price}</p>
                <p className="mt-3 text-sm text-gray-600">{pkg.description}</p>
                <Link
                  href="/contact"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: '#E8793A' }}
                >
                  Learn more <ArrowRight className="h-3 w-3" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <span className="section-label">FAQ</span>
            <h2 className="mt-3 text-2xl font-bold font-display sm:text-3xl" style={{ color: '#1A2B4A' }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = openFaq === i
              return (
                <div key={i} className="overflow-hidden rounded-lg border border-gray-200">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-gray-50"
                  >
                    <span className="text-base font-semibold" style={{ color: '#1A2B4A' }}>{item.question}</span>
                    {isOpen ? <Minus className="h-5 w-5 flex-shrink-0 text-gray-500" /> : <Plus className="h-5 w-5 flex-shrink-0 text-gray-500" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-sm leading-relaxed text-gray-600">
                      {item.answer}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ backgroundColor: '#1A2B4A' }}>
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white font-display">Not Sure Which Plan?</h2>
          <p className="mt-4 text-lg text-gray-300">
            Our team can help you find the right fit for your project. Schedule a call and we&apos;ll walk you through the platform.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/contact" className="btn-primary">
              Schedule a Call <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/features" className="btn-outline-white">
              Explore Features
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
