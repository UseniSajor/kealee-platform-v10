'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Plus, Minus } from 'lucide-react'
import { useState } from 'react'
import { BuyingPathways } from '@/components/commerce/BuyingPathways'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true as const },
  transition: { duration: 0.5 },
}

// ── Homeowner project services (one-time per project) ─────────────────────────

const PLAN_ITEMS = [
  { name: 'AI Concept Design Package', price: '$585', note: 'Property-specific visuals, design direction, zoning brief, path-to-approval plan + consultation included.', highlight: true },
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
  { name: 'Permit Expediting', price: 'Starting at $5,500', note: 'Priority approval service' },
]

const PM_ITEMS = [
  { name: 'Self-Managed', price: 'Free', note: 'Platform tools included' },
  { name: 'PM Advisory', price: '$950', note: 'Milestone reviews + budget oversight', highlight: true },
  { name: 'PM Oversight', price: '$2,950', note: 'Full PM from groundbreaking to closeout' },
]

// ── Contractor marketplace ────────────────────────────────────────────────────

const CONTRACTOR_LISTING = [
  {
    name: 'Starter',
    price: '$99',
    period: '/mo',
    description: 'Get listed, verified, and start receiving AI-matched leads.',
    features: [
      'Verified contractor profile',
      'AI-matched lead delivery',
      'Up to 10 active bid responses/mo',
      'Basic analytics dashboard',
      'Reputation score tracking',
    ],
    highlight: false,
    cta: 'Join as Contractor',
    ctaHref: '/contractor/register',
  },
  {
    name: 'Growth',
    price: '$199',
    period: '/mo',
    description: 'Priority matching, KeaBot GC, and full pipeline tools.',
    features: [
      'Everything in Starter',
      'Priority lead matching',
      'Unlimited bid responses',
      'KeaBot GC bid assistant',
      'Pipeline CRM + follow-up tools',
      'Reputation score badge',
    ],
    highlight: true,
    cta: 'Join as Contractor',
    ctaHref: '/contractor/register',
  },
  {
    name: 'Pro',
    price: '$499',
    period: '/mo',
    description: 'Full Construction OS, top placement, and enterprise ops.',
    features: [
      'Everything in Growth',
      'Top-of-feed placement',
      'Full Construction OS access',
      'Advanced analytics & profitability',
      'Custom integrations + API access',
      'Dedicated account support',
    ],
    highlight: false,
    cta: 'Contact Sales',
    ctaHref: '/contact',
  },
]

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    question: 'What does the $585 AI Concept Design Package include?',
    answer: 'You get 8 structured deliverables: property-specific concept visuals (2–4 options), a design direction summary, layout and flow recommendations, a property-based zoning analysis, a path-to-approval plan, rough scope direction, a downloadable digital concept package, and an included design consultation call. Everything is built around your specific property — not generic AI outputs.',
  },
  {
    question: 'Are homeowner fees subscriptions?',
    answer: 'No. All homeowner project fees are one-time per project. You pay for the services your project needs — Concept, estimate, permits, and PM — without any ongoing subscription.',
  },
  {
    question: 'How does contractor pricing work?',
    answer: 'Contractor packages (Starter $99/mo, Growth $199/mo, Pro $499/mo) are monthly subscriptions that control your lead volume, AI bid tools, Contractor Portal access, and platform visibility. Cancel anytime. All plans include a 14-day free trial.',
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
        <p className="text-sm font-semibold text-slate-900">
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
        <p className="mt-0.5 text-xs text-slate-400">{note}</p>
      </div>
      <span className="ml-4 flex-shrink-0 text-sm font-bold text-orange-600">
        {price}
      </span>
    </div>
  )
}

function SectionHeader({ label, title, subtitle }: { label: string; title: string; subtitle?: string }) {
  return (
    <motion.div {...fadeInUp} className="mx-auto max-w-2xl text-center">
      <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#2ABFBF]">{label}</span>
      <h2 className="mt-3 text-2xl font-bold font-display sm:text-3xl text-slate-900">{title}</h2>
      {subtitle && <p className="mt-4 text-slate-600 text-sm leading-relaxed">{subtitle}</p>}
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <div>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.span {...fadeInUp} className="text-xs font-bold uppercase tracking-[0.15em] text-[#2ABFBF]">
            Pricing
          </motion.span>
          <motion.h1
            className="mt-3 text-4xl font-black font-display sm:text-5xl text-slate-900 tracking-tight"
          >
            Transparent Pricing
          </motion.h1>
          <motion.p
            className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 leading-relaxed"
          >
            One-time project services for homeowners, marketplace memberships for contractors, and site-based
            feasibility for developers.
          </motion.p>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <BuyingPathways />
      </section>

      {/* ── Homeowner Project Services ── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label="For Homeowners"
            title="Add services as the project becomes more certain"
            subtitle="Start with readiness or a concept. Add estimating, permits, and oversight only when the scope calls for them. All homeowner fees are one-time per project."
          />

          <div className="mt-12 space-y-10">

            {/* Plan */}
            <div>
              <h3 className="mb-3 text-base font-bold text-slate-900">Plan Your Project</h3>
              <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                {PLAN_ITEMS.map((item, i) => (
                  <PriceRow key={item.name} {...item} index={i} total={PLAN_ITEMS.length} />
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Projects over $65,000 or with structural complexity are connected with a licensed architect.
              </p>
            </div>

            {/* Estimate */}
            <div>
              <h3 className="mb-3 text-base font-bold text-slate-900">Price Your Project</h3>
              <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                {ESTIMATE_ITEMS.map((item, i) => (
                  <PriceRow key={item.name} {...item} index={i} total={ESTIMATE_ITEMS.length} />
                ))}
              </div>
            </div>

            {/* Permits */}
            <div>
              <h3 className="mb-3 text-base font-bold text-slate-900">Permit Your Project</h3>
              <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                {PERMIT_ITEMS.map((item, i) => (
                  <PriceRow key={item.name} {...item} index={i} total={PERMIT_ITEMS.length} />
                ))}
              </div>
            </div>

            {/* PM */}
            <div>
              <h3 className="mb-3 text-base font-bold text-slate-900">Control Your Project</h3>
              <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                {PM_ITEMS.map((item, i) => (
                  <PriceRow key={item.name} {...item} index={i} total={PM_ITEMS.length} />
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-400">One-time per project fee — not a subscription.</p>
            </div>

            {/* Purchase boundary callout */}
            <div className="rounded-2xl p-8 border border-slate-200" style={{ backgroundColor: '#F8FAFC' }}>
              <p className="text-center text-sm font-semibold text-slate-700">
                You do not need to buy every service at once.
              </p>
              <p className="mt-2 text-center text-xs text-slate-500">
                Your intake and project findings carry forward, so each next step builds on the same property and scope.
                Final professional, agency, and construction fees depend on the project.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contractor Marketplace Listings ── */}
      <section className="py-20 border-t border-b border-slate-200" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            label="For Contractors"
            title="Marketplace membership"
            subtitle="Subscription tiers cover business visibility, lead matching, and platform tools. Estimate and permit deliverables for a specific client are separate per-project purchases."
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {CONTRACTOR_LISTING.map((pkg, i) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex flex-1 flex-col p-6">
                  {pkg.highlight && (
                    <span
                      className="mb-3 inline-block self-start rounded-full px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider bg-orange-600"
                    >
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-slate-900">{pkg.name}</h3>
                  <div className="my-3">
                    <span className="text-3xl font-black font-display text-slate-950">
                      {pkg.price}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{pkg.period}</span>
                  </div>
                  <p className="mb-4 text-xs text-slate-500 leading-relaxed">{pkg.description}</p>
                  <ul className="mb-6 flex-1 space-y-2">
                    {pkg.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                        <span className="text-green-600 font-bold">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={pkg.ctaHref}
                    className="flex w-full items-center justify-center rounded-xl py-3 px-4 text-xs font-bold transition-all hover:scale-[1.02]"
                    style={{
                      backgroundColor: pkg.highlight ? '#E8724B' : 'transparent',
                      color: pkg.highlight ? '#FFFFFF' : '#E8724B',
                      border: pkg.highlight ? 'none' : '1.5px solid #E8724B',
                    }}
                  >
                    {pkg.cta}
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="mt-6 text-xs text-slate-400 text-center">
            Contractor business verification is required before marketplace activation. Contact sales for current trial,
            billing, and enterprise terms.
          </p>

          <div className="mt-10 rounded-2xl border border-teal-200 bg-teal-50 p-6 sm:flex sm:items-center sm:justify-between sm:gap-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-teal-700">Per client project</p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">Contractor Estimate and Permit Package — $795</h3>
              <p className="mt-1 text-sm text-slate-600">Client-facing estimate, zoning, permit, sales, and project roadmap. This does not replace a marketplace membership.</p>
            </div>
            <Link href="/products/contractor-estimate-permit-package" className="mt-4 inline-flex shrink-0 items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white hover:bg-teal-800 sm:mt-0">
              View package <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-950 py-20 text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-violet-300">For developers</span>
              <h2 className="mt-3 font-display text-3xl font-bold">Feasibility starts at $1,095 per site</h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/65">
                Developer Feasibility Express provides an early zoning, estimate, permit, sales, and project analysis.
                Higher-detail yield, massing, parking, earthwork, NOI, entitlement, and execution services are scoped
                after the initial site screen.
              </p>
              <p className="mt-3 text-xs text-white/45">Preliminary feasibility / not for construction / subject to licensed professional review.</p>
            </div>
            <Link href="/products/developer-feasibility-express" className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-violet-500">
              View developer package <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#2ABFBF]">FAQ</span>
            <h2 className="mt-3 text-2xl font-bold font-display sm:text-3xl text-slate-900">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = openFaq === i
              return (
                <div key={i} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-slate-50"
                  >
                    <span className="text-base font-bold text-slate-900">{item.question}</span>
                    {isOpen
                      ? <Minus className="h-4 w-4 flex-shrink-0 text-slate-500" />
                      : <Plus className="h-4 w-4 flex-shrink-0 text-slate-500" />
                    }
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-sm leading-relaxed text-slate-600 border-t border-slate-100 pt-3">
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
      <section className="py-20 border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black font-display text-slate-900 tracking-tight">Not sure which option is right?</h2>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">
            Our team can help you find the right fit. Schedule a call and we&apos;ll walk you through the platform.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link 
              href="/contact" 
              className="w-full sm:w-auto rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 px-8 text-sm transition-all hover:shadow-md text-center"
            >
              Schedule a Call
            </Link>
            <Link 
              href="/concept" 
              className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3.5 px-8 text-sm transition-all text-center"
            >
              Start Design Concept
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
