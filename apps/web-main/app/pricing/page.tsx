'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Plus, Minus } from 'lucide-react'
import { useState } from 'react'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true as const },
  transition: { duration: 0.5 },
}

// ── Homeowner project services (one-time per project) ─────────────────────────

const PLAN_ITEMS = [
  { name: 'Project Concept + Validation', price: '$395', note: 'AI concept + zoning + cost band + permit risk. Delivered in 24hrs.', highlight: true },
  { name: 'Advanced AI Concept', price: '$899', note: '3 floor plan options, 3D views, material suggestions' },
  { name: 'Full Design Package', price: '$4,499', note: 'Permit-ready drawing set with licensed architect' },
]

const ESTIMATE_ITEMS = [
  { name: 'AI Estimate', price: 'Free', note: 'Included with all projects' },
  { name: 'Detailed Estimate', price: '$595', note: 'Professional cost analyst review' },
  { name: 'Certified Estimate', price: '$1,850', note: 'Lender-ready certified report' },
]

const PERMIT_ITEMS = [
  { name: 'Permit Guidance', price: 'Free', note: 'AI checklist + jurisdiction info' },
  { name: 'Simple Permit Filing', price: '$149', note: 'Single-trade permits' },
  { name: 'Permit Package', price: '$950', note: 'Full application prep + submission', highlight: true },
  { name: 'Permit Coordination', price: '$2,750', note: 'Submission, tracking + comment response' },
  { name: 'Permit Expediting', price: '$5,500', note: 'Priority approval service' },
]

const PM_ITEMS = [
  { name: 'Self-Managed', price: 'Free', note: 'Platform tools included' },
  { name: 'PM Advisory', price: '$950', note: 'Milestone reviews + budget oversight', highlight: true },
  { name: 'PM Oversight', price: '$2,950', note: 'Full PM from groundbreaking to closeout' },
]

// ── Contractor marketplace ────────────────────────────────────────────────────

const CONTRACTOR_LISTING = [
  {
    name: 'Basic',
    price: '$49',
    period: '/mo',
    description: 'Get listed and start receiving matched leads.',
    features: [
      'Verified contractor profile',
      'AI-matched lead delivery',
      'Up to 5 active bid responses/mo',
      'Basic analytics dashboard',
    ],
    highlight: false,
    cta: 'Start Free Trial',
    ctaHref: '/contractor/register',
  },
  {
    name: 'Pro',
    price: '$149',
    period: '/mo',
    description: 'More leads, better tools, priority matching.',
    features: [
      'Everything in Basic',
      'Priority lead matching',
      'Unlimited bid responses',
      'KeaBot GC bid assistant',
      'Reputation score badge',
    ],
    highlight: true,
    cta: 'Start Free Trial',
    ctaHref: '/contractor/register',
  },
  {
    name: 'Premium',
    price: '$299',
    period: '/mo',
    description: 'Full Construction OS + top-of-feed placement.',
    features: [
      'Everything in Pro',
      'Top-of-feed placement',
      'Full Construction OS access',
      'Advanced analytics & pipeline',
      'Dedicated account support',
    ],
    highlight: false,
    cta: 'Contact Sales',
    ctaHref: '/contact',
  },
]

const CONTRACTOR_GROWTH = [
  { name: 'Starter', price: '$99/mo', note: 'Lead pipeline tools + basic CRM' },
  { name: 'Growth', price: '$299/mo', note: 'Full business development suite' },
  { name: 'Pro', price: '$799/mo', note: 'Enterprise-grade ops + integrations' },
]

// ── Operations OS (B2B) ───────────────────────────────────────────────────────

const OPS_OS_TIERS = [
  {
    name: 'Tier A',
    price: '$1,750',
    period: '/mo',
    description: 'Small operators & independents.',
    features: [
      'Up to 5 active projects',
      'OS-PM + OS-Pay core',
      'KeaBot Construction',
      'Milestone payment escrow',
      'Standard reporting',
    ],
    highlight: false,
    cta: 'Contact Sales',
    ctaHref: '/contact',
  },
  {
    name: 'Tier B',
    price: '$3,750',
    period: '/mo',
    description: 'Growing contractors & mid-size operators.',
    features: [
      'Up to 15 active projects',
      'Full OS-PM + OS-Pay + Marketplace',
      'All KeaBots included',
      'Change orders + RFI tracking',
      'Custom reporting',
    ],
    highlight: true,
    cta: 'Contact Sales',
    ctaHref: '/contact',
  },
  {
    name: 'Tier C',
    price: '$9,500',
    period: '/mo',
    description: 'Large GCs & multi-trade operations.',
    features: [
      'Up to 50 active projects',
      'All 7 OS modules',
      'OS-Land + OS-Feas access',
      'Lender draw coordination',
      'Priority support + SLA',
    ],
    highlight: false,
    cta: 'Contact Sales',
    ctaHref: '/contact',
  },
  {
    name: 'Tier D',
    price: '$16,500',
    period: '/mo',
    description: 'Enterprise developers & portfolio operators.',
    features: [
      'Unlimited projects',
      'Full platform access',
      'White-label options',
      'Custom integrations + API',
      'Dedicated success team',
    ],
    highlight: false,
    cta: 'Contact Sales',
    ctaHref: '/contact',
  },
]

// ── Developer services (one-time) ─────────────────────────────────────────────

const DEVELOPER_SERVICES = [
  { name: 'Feasibility Study', price: '$4,500–$12,000', note: 'Pro forma, scenario modeling, IRR/cash-on-cash, go/no-go recommendation' },
  { name: 'Pro Forma Analysis', price: '$2,500–$6,000', note: 'Unit mix, cost + revenue assumptions, sensitivity analysis' },
  { name: 'Capital Stack Modeling', price: '$3,500–$8,000', note: 'Debt/equity structure, draw schedule, waterfall projections' },
  { name: 'Entitlement Support', price: '$7,500–$20,000', note: 'Zoning, variance, regulatory filing coordination' },
]

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    question: 'What does the $395 Concept + Validation include?',
    answer: 'You get an AI-generated floor plan concept, a zoning compliance check for your parcel, a structural risk assessment, a cost band (low/mid/high estimate range), and a permit risk summary — all delivered within 24 hours. It is the fastest way to know whether your project is viable before spending more.',
  },
  {
    question: 'Are homeowner fees subscriptions?',
    answer: 'No. All homeowner project fees are one-time per project. You pay for the services your project needs — Concept + Validation, estimate, permits, PM — without any ongoing subscription.',
  },
  {
    question: 'How does contractor listing pricing work?',
    answer: 'Contractor listing tiers (Basic $49/mo, Pro $149/mo, Premium $299/mo) are monthly subscriptions that control your lead volume, bid tools, and platform visibility. Growth packages are separate and cover business development and pipeline tools.',
  },
  {
    question: 'What is the Ops OS pricing for?',
    answer: 'Ops OS tiers (A–D, $1,750–$16,500/mo) are for construction businesses and operators running multiple projects. They include full Construction OS access, all 7 platform modules, and KeaBot AI assistants — priced by active project count and complexity.',
  },
  {
    question: 'What do developer services cover?',
    answer: 'Developer services are professional advisory engagements priced per project. Feasibility, pro forma, capital stack, and entitlement work are delivered by Kealee analysts using our OS-Land, OS-Feas, and OS-Dev modules. Pricing varies with project size and complexity.',
  },
  {
    question: 'Is there a free tier?',
    answer: 'Yes. AI Estimate and Permit Guidance are both free for all homeowners. Contractors can explore the platform before subscribing. Contact us to learn more about what is included at no cost.',
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function PriceRow({
  name, price, note, highlight = false, index, total,
}: {
  name: string; price: string; note: string; highlight?: boolean; index: number; total: number
}) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4"
      style={{
        backgroundColor: highlight ? 'rgba(42,191,191,0.04)' : index % 2 === 0 ? 'white' : '#FAFAFA',
        borderBottom: index < total - 1 ? '1px solid #F3F4F6' : undefined,
      }}
    >
      <div>
        <p className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>
          {name}
          {highlight && (
            <span
              className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: 'rgba(42,191,191,0.1)', color: '#2ABFBF' }}
            >
              Popular
            </span>
          )}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">{note}</p>
      </div>
      <span className="ml-4 flex-shrink-0 text-sm font-bold" style={{ color: '#E8793A' }}>
        {price}
      </span>
    </div>
  )
}

function SectionHeader({ label, title, subtitle }: { label: string; title: string; subtitle?: string }) {
  return (
    <motion.div {...fadeInUp} className="mx-auto max-w-2xl text-center">
      <span className="section-label">{label}</span>
      <h2 className="mt-3 text-2xl font-bold font-display sm:text-3xl" style={{ color: '#1A2B4A' }}>{title}</h2>
      {subtitle && <p className="mt-4 text-gray-600">{subtitle}</p>}
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

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
            Transparent pricing for every role
          </motion.h1>
          <motion.p
            {...fadeInUp}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-gray-600"
          >
            Homeowners pay per project. Contractors choose a listing tier. Businesses pick an Ops OS plan.
            No hidden fees, no surprises.
          </motion.p>
        </div>
      </section>

      {/* ── Homeowner Project Services ── */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label="For Homeowners"
            title="Pay only for what your project needs"
            subtitle="All homeowner fees are one-time per project — no subscriptions."
          />

          <div className="mt-12 space-y-10">

            {/* Plan */}
            <div>
              <h3 className="mb-3 text-base font-bold" style={{ color: '#1A2B4A' }}>Plan Your Project</h3>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                {PLAN_ITEMS.map((item, i) => (
                  <PriceRow key={item.name} {...item} index={i} total={PLAN_ITEMS.length} />
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Projects over $65,000 or with structural complexity are connected with a licensed architect.
              </p>
            </div>

            {/* Estimate */}
            <div>
              <h3 className="mb-3 text-base font-bold" style={{ color: '#1A2B4A' }}>Price Your Project</h3>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                {ESTIMATE_ITEMS.map((item, i) => (
                  <PriceRow key={item.name} {...item} index={i} total={ESTIMATE_ITEMS.length} />
                ))}
              </div>
            </div>

            {/* Permits */}
            <div>
              <h3 className="mb-3 text-base font-bold" style={{ color: '#1A2B4A' }}>Permit Your Project</h3>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                {PERMIT_ITEMS.map((item, i) => (
                  <PriceRow key={item.name} {...item} index={i} total={PERMIT_ITEMS.length} />
                ))}
              </div>
            </div>

            {/* PM */}
            <div>
              <h3 className="mb-3 text-base font-bold" style={{ color: '#1A2B4A' }}>Control Your Project</h3>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                {PM_ITEMS.map((item, i) => (
                  <PriceRow key={item.name} {...item} index={i} total={PM_ITEMS.length} />
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-400">One-time per project fee — not a subscription.</p>
            </div>

            {/* Typical path callout */}
            <div className="rounded-2xl p-8" style={{ backgroundColor: 'rgba(26,43,74,0.03)' }}>
              <p className="text-center text-sm font-medium text-gray-600">
                Typical fully-managed project:
                <span className="ml-2 font-bold" style={{ color: '#1A2B4A' }}>
                  $395 + $595 + $950 + $2,950 = $4,890
                </span>
              </p>
              <p className="mt-2 text-center text-xs text-gray-400">
                Concept + Validation · Detailed Estimate · Permit Package · PM Oversight
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contractor Marketplace Listings ── */}
      <section className="py-20" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label="For Contractors"
            title="Marketplace listing tiers"
            subtitle="Get verified, get matched, get paid. Pick the tier that fits your business."
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {CONTRACTOR_LISTING.map((pkg, i) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex flex-col overflow-hidden rounded-xl bg-white"
                style={{
                  boxShadow: pkg.highlight ? '0 10px 15px -3px rgb(0 0 0 / 0.1)' : '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                  border: pkg.highlight ? '2px solid #2ABFBF' : '1px solid #E5E7EB',
                }}
              >
                <div className="flex flex-1 flex-col p-6">
                  {pkg.highlight && (
                    <span
                      className="mb-3 inline-block self-start rounded-full px-3 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: '#2ABFBF' }}
                    >
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-lg font-semibold" style={{ color: '#1A2B4A' }}>{pkg.name}</h3>
                  <div className="my-3">
                    <span className="text-3xl font-bold font-mono" style={{ color: pkg.highlight ? '#2ABFBF' : '#1A2B4A' }}>
                      {pkg.price}
                    </span>
                    <span className="text-sm text-gray-500">{pkg.period}</span>
                  </div>
                  <p className="mb-4 text-sm text-gray-600">{pkg.description}</p>
                  <ul className="mb-6 flex-1 space-y-2">
                    {pkg.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                        <span style={{ color: '#2ABFBF' }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={pkg.ctaHref}
                    className="flex w-full items-center justify-center rounded-lg py-2.5 px-4 text-sm font-semibold transition-all hover:opacity-90"
                    style={{
                      backgroundColor: pkg.highlight ? '#2ABFBF' : 'transparent',
                      color: pkg.highlight ? '#FFFFFF' : '#2ABFBF',
                      border: pkg.highlight ? 'none' : '2px solid #2ABFBF',
                    }}
                  >
                    {pkg.cta}
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Growth packages teaser */}
          <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6">
            <h4 className="mb-1 font-bold" style={{ color: '#1A2B4A' }}>Growth Packages</h4>
            <p className="mb-4 text-sm text-gray-500">Business development tools for contractors looking to scale.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {CONTRACTOR_GROWTH.map(pkg => (
                <div key={pkg.name} className="rounded-lg bg-gray-50 px-4 py-3">
                  <p className="text-sm font-bold" style={{ color: '#1A2B4A' }}>{pkg.name}</p>
                  <p className="text-sm font-semibold" style={{ color: '#E8793A' }}>{pkg.price}</p>
                  <p className="mt-1 text-xs text-gray-400">{pkg.note}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-gray-400">
              Verify your contractor account to see full growth package details and unlock all features.
            </p>
          </div>
        </div>
      </section>

      {/* ── Ops OS (B2B) ── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label="Operations OS"
            title="For businesses running multiple projects"
            subtitle="Full platform access with AI, escrow payments, and all 7 OS modules — priced by scale."
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {OPS_OS_TIERS.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex flex-col overflow-hidden rounded-xl bg-white"
                style={{
                  boxShadow: tier.highlight ? '0 10px 15px -3px rgb(0 0 0 / 0.1)' : '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                  border: tier.highlight ? '2px solid #E8793A' : '1px solid #E5E7EB',
                }}
              >
                <div className="flex flex-1 flex-col p-6">
                  {tier.highlight && (
                    <span
                      className="mb-3 inline-block self-start rounded-full px-3 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: '#E8793A' }}
                    >
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-lg font-semibold" style={{ color: '#1A2B4A' }}>{tier.name}</h3>
                  <div className="my-3">
                    <span className="text-3xl font-bold font-mono" style={{ color: tier.highlight ? '#E8793A' : '#1A2B4A' }}>
                      {tier.price}
                    </span>
                    <span className="text-sm text-gray-500">{tier.period}</span>
                  </div>
                  <p className="mb-4 text-sm text-gray-600">{tier.description}</p>
                  <ul className="mb-6 flex-1 space-y-2">
                    {tier.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                        <span style={{ color: '#E8793A' }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={tier.ctaHref}
                    className="flex w-full items-center justify-center rounded-lg py-2.5 px-4 text-sm font-semibold transition-all hover:opacity-90"
                    style={{
                      backgroundColor: tier.highlight ? '#E8793A' : 'transparent',
                      color: tier.highlight ? '#FFFFFF' : '#E8793A',
                      border: tier.highlight ? 'none' : '2px solid #E8793A',
                    }}
                  >
                    {tier.cta}
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Developer Services ── */}
      <section className="py-20" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label="For Developers"
            title="Professional development services"
            subtitle="One-time advisory engagements powered by OS-Land, OS-Feas, and OS-Dev. Priced by project size."
          />

          <div className="mt-12 overflow-hidden rounded-xl border border-gray-200 bg-white">
            {DEVELOPER_SERVICES.map((item, i) => (
              <div
                key={item.name}
                className="flex items-center justify-between px-5 py-4"
                style={{
                  backgroundColor: i % 2 === 0 ? 'white' : '#FAFAFA',
                  borderBottom: i < DEVELOPER_SERVICES.length - 1 ? '1px solid #F3F4F6' : undefined,
                }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>{item.name}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{item.note}</p>
                </div>
                <span className="ml-4 flex-shrink-0 text-sm font-bold" style={{ color: '#E8793A' }}>
                  {item.price}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/developers/start"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#1A2B4A' }}
            >
              Schedule a developer consultation <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
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
                    {isOpen
                      ? <Minus className="h-5 w-5 flex-shrink-0 text-gray-500" />
                      : <Plus className="h-5 w-5 flex-shrink-0 text-gray-500" />
                    }
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
          <h2 className="text-3xl font-bold text-white font-display">Not sure which option is right?</h2>
          <p className="mt-4 text-lg text-gray-300">
            Our team can help you find the right fit. Schedule a call and we&apos;ll walk you through the platform.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/contact" className="btn-primary">
              Schedule a Call <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/homeowners/start" className="btn-outline-white">
              Start with $395 Concept
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
