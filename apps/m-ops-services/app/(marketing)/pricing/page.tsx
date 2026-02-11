'use client'

import { useState } from 'react'
import Link from 'next/link'

type Tab = 'packages' | 'software' | 'individual' | 'escrow'

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('packages')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'packages', label: 'PM Packages' },
    { key: 'software', label: 'PM Software' },
    { key: 'individual', label: 'Individual Services' },
    { key: 'escrow', label: 'Escrow & Finance' },
  ]

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-gradient-to-b from-zinc-50 to-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 mb-4">
            Clear, Simple Pricing
          </h1>
          <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
            From on-demand services to full PM teams — find the right fit for your business.
          </p>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="border-b border-zinc-200 bg-white sticky top-16 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition ${
                  activeTab === tab.key
                    ? 'border-sky-500 text-sky-600'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tab Content */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeTab === 'packages' && <PackagesTab />}
          {activeTab === 'software' && <SoftwareTab />}
          {activeTab === 'individual' && <IndividualTab />}
          {activeTab === 'escrow' && <EscrowTab />}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-zinc-50 border-t border-zinc-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8 text-zinc-900">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-zinc-200 bg-white p-5">
                <h3 className="font-semibold text-zinc-900">{faq.q}</h3>
                <p className="mt-2 text-sm text-zinc-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-sky-500 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Not Sure Which Plan Is Right?</h2>
          <p className="text-lg opacity-95 mb-8">
            Talk to our team for a free consultation. We&apos;ll recommend the best fit based on your projects and goals.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3 text-sm font-semibold text-sky-700 hover:bg-sky-50 transition"
          >
            Get Free Consultation
          </Link>
        </div>
      </section>
    </div>
  )
}

/* ── PM Packages Tab ────────────────────────────────────── */
function PackagesTab() {
  const packages = [
    {
      name: 'Package A',
      subtitle: 'Starter',
      price: '$1,750',
      hours: '5-10 hrs/week',
      projects: '1 project',
      features: ['Weekly status reports', 'Permit tracking', 'Basic sub coordination', 'Document organization', 'Email support'],
    },
    {
      name: 'Package B',
      subtitle: 'Professional',
      price: '$3,750',
      hours: '15-20 hrs/week',
      projects: '3 projects',
      popular: true,
      features: ['Everything in Package A', 'Full PM support', 'Client communication management', 'Budget tracking & variance alerts', 'Change order documentation', 'Priority phone support'],
    },
    {
      name: 'Package C',
      subtitle: 'Premium',
      price: '$9,500',
      hours: '30-40 hrs/week',
      projects: 'Up to 20 projects',
      features: ['Everything in Package B', 'Dedicated PM team', 'Multi-project portfolio management', 'Advanced reporting & analytics', 'Inspection scheduling', 'Sub vetting & onboarding', '24/7 emergency support'],
    },
    {
      name: 'Package D',
      subtitle: 'Enterprise',
      price: '$16,500',
      hours: '40+ hrs/week',
      projects: 'Unlimited projects',
      features: ['Everything in Package C', 'Custom SLAs', 'Executive dashboard & reporting', 'Full operations outsourcing', 'Dedicated account manager', 'Custom integrations', 'Quarterly business reviews'],
    },
  ]

  return (
    <div>
      <p className="text-center text-zinc-600 mb-8">PM Managed Services — your operations team, on demand.</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {packages.map((pkg) => (
          <div key={pkg.name} className={`rounded-2xl border bg-white p-6 shadow-sm flex flex-col ${pkg.popular ? 'border-sky-500 ring-1 ring-sky-500/20' : 'border-zinc-200'}`}>
            {pkg.popular && <span className="inline-block self-start rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700 mb-3">MOST POPULAR</span>}
            <h3 className="text-xl font-bold text-zinc-900">{pkg.name}</h3>
            <p className="text-sm text-zinc-500">{pkg.subtitle}</p>
            <div className="mt-3">
              <span className="text-3xl font-bold text-zinc-900">{pkg.price}</span>
              <span className="text-zinc-500">/mo</span>
            </div>
            <div className="mt-2 text-sm text-zinc-600">
              <p>{pkg.hours}</p>
              <p>{pkg.projects}</p>
            </div>
            <ul className="mt-4 space-y-2 flex-1">
              {pkg.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-zinc-700">
                  <svg className="w-4 h-4 text-sky-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/contact" className={`mt-6 block text-center py-2.5 rounded-xl font-semibold transition ${pkg.popular ? 'bg-sky-500 text-white hover:bg-sky-600' : 'border border-zinc-200 hover:bg-zinc-50'}`}>
              Get Started
            </Link>
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-zinc-500 mt-6">All packages include a 14-day free trial. Cancel anytime.</p>
    </div>
  )
}

/* ── PM Software Tab ────────────────────────────────────── */
function SoftwareTab() {
  const tiers = [
    { name: 'Essentials', price: '$99', features: ['Up to 5 users', '3 active projects', 'Basic reporting', 'Email support'] },
    { name: 'Performance', price: '$199', popular: true, features: ['Up to 20 users', '10 active projects', 'Advanced analytics', 'Integrations', 'Priority support'] },
    { name: 'Scale', price: '$349', features: ['Up to 50 users', 'Up to 20 projects', 'Custom workflows', 'API access', 'Dedicated support'] },
    { name: 'Enterprise', price: 'Custom', period: '', features: ['Unlimited users', 'Unlimited projects', 'SSO/SAML', 'Custom integrations', 'SLA guarantee', 'Account manager'] },
  ]

  return (
    <div>
      <p className="text-center text-zinc-600 mb-8">Construction PM software for contractors and builders.</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier) => (
          <div key={tier.name} className={`rounded-2xl border bg-white p-6 shadow-sm flex flex-col ${tier.popular ? 'border-sky-500 ring-1 ring-sky-500/20' : 'border-zinc-200'}`}>
            {tier.popular && <span className="inline-block self-start rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700 mb-3">MOST POPULAR</span>}
            <h3 className="text-xl font-bold text-zinc-900">{tier.name}</h3>
            <div className="mt-3">
              <span className="text-3xl font-bold text-zinc-900">{tier.price}</span>
              {tier.price !== 'Custom' && <span className="text-zinc-500">/mo</span>}
            </div>
            <ul className="mt-4 space-y-2 flex-1">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-zinc-700">
                  <svg className="w-4 h-4 text-sky-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/contact" className={`mt-6 block text-center py-2.5 rounded-xl font-semibold transition ${tier.popular ? 'bg-sky-500 text-white hover:bg-sky-600' : 'border border-zinc-200 hover:bg-zinc-50'}`}>
              {tier.name === 'Enterprise' ? 'Contact Sales' : 'Start Trial'}
            </Link>
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-zinc-500 mt-6">Free 14-day trial on all plans. No credit card required.</p>
    </div>
  )
}

/* ── Individual Services Tab ────────────────────────────── */
function IndividualTab() {
  const categories = [
    {
      title: 'Permits & Field Operations',
      services: [
        { name: 'Permit Application Filing', price: '$200 - $400' },
        { name: 'Inspection Scheduling', price: '$150 / inspection' },
        { name: 'Site Visit & Documentation', price: '$250 / visit' },
        { name: 'Code Compliance Review', price: '$300 - $500' },
      ],
    },
    {
      title: 'Coordination & Admin',
      services: [
        { name: 'Vendor/Sub Scheduling', price: '$250 / week' },
        { name: 'Weekly Client Report', price: '$150 / report' },
        { name: 'Material Procurement Support', price: '$300 / order' },
        { name: 'Document Organization', price: '$500 / project setup' },
      ],
    },
    {
      title: 'Estimating & Pre-Construction',
      services: [
        { name: 'Quantity Takeoff', price: '$300 - $800' },
        { name: 'Scope of Work Review', price: '$250 - $500' },
        { name: 'Bid Package Preparation', price: '$500 - $1,250' },
        { name: 'Budget Reconciliation', price: '$400 / review' },
      ],
    },
    {
      title: 'Developer Services',
      services: [
        { name: 'Feasibility Study', price: '$2,500 - $5,000' },
        { name: 'Pro Forma Analysis', price: '$1,500 - $3,000' },
        { name: 'Entitlement Support', price: '$3,000 - $7,500' },
        { name: 'Development Management', price: 'Custom' },
      ],
    },
  ]

  return (
    <div>
      <p className="text-center text-zinc-600 mb-8">On-demand operations services — pay only for what you need.</p>
      <div className="grid md:grid-cols-2 gap-6">
        {categories.map((cat) => (
          <div key={cat.title} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 mb-4">{cat.title}</h3>
            <div className="space-y-3">
              {cat.services.map((s) => (
                <div key={s.name} className="flex justify-between items-center pb-3 border-b border-zinc-100 last:border-0 last:pb-0">
                  <span className="text-sm text-zinc-700">{s.name}</span>
                  <span className="text-sm font-semibold text-zinc-900 whitespace-nowrap ml-4">{s.price}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <p className="text-sm text-zinc-500 mb-4">Need a custom scope? We&apos;ll build a tailored service package for you.</p>
        <Link href="/contact" className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition">
          Request a Quote
        </Link>
      </div>
    </div>
  )
}

/* ── Escrow & Finance Tab ───────────────────────────────── */
function EscrowTab() {
  const fees = [
    { service: 'Escrow Account Setup', fee: '$250 one-time' },
    { service: 'Milestone Payment Processing', fee: '1.5% of disbursement' },
    { service: 'Change Order Processing', fee: '$75 per change order' },
    { service: 'Monthly Account Maintenance', fee: '$50/month' },
    { service: 'Dispute Resolution', fee: '$150/hour' },
    { service: 'Final Closeout & Release', fee: 'Included' },
  ]

  return (
    <div>
      <p className="text-center text-zinc-600 mb-8">Secure, milestone-based payment processing for construction projects.</p>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 mb-4">Fee Schedule</h3>
          <div className="space-y-3">
            {fees.map((f) => (
              <div key={f.service} className="flex justify-between items-center pb-3 border-b border-zinc-100 last:border-0 last:pb-0">
                <span className="text-sm text-zinc-700">{f.service}</span>
                <span className="text-sm font-semibold text-zinc-900 whitespace-nowrap ml-4">{f.fee}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 mb-4">What&apos;s Included</h3>
          <ul className="space-y-3">
            {[
              'FDIC-insured trust accounts',
              'Milestone verification before release',
              'Automated payment notifications',
              'Real-time balance tracking',
              'Lien waiver collection',
              'Detailed payment history',
              'SOC 2 compliant infrastructure',
              '256-bit encryption',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-zinc-700">
                <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="text-center">
        <Link href="/escrow" className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition">
          Learn More About Escrow
        </Link>
      </div>
    </div>
  )
}

/* ── FAQ Data ───────────────────────────────────────────── */
const faqs = [
  {
    q: 'Can I switch packages later?',
    a: 'Yes. You can upgrade or downgrade your PM package at any time. Changes take effect at the start of the next billing cycle.',
  },
  {
    q: 'Is there a long-term contract?',
    a: 'No. All packages are month-to-month. We earn your business every month — no lock-in contracts.',
  },
  {
    q: 'Can I combine PM packages with individual services?',
    a: 'Absolutely. Many clients use a PM package for ongoing operations and add individual services for specific needs like estimating or permit filing.',
  },
  {
    q: 'What if I only need help occasionally?',
    a: 'Our individual services are perfect for that. Pay only for what you need, when you need it — no monthly commitment required.',
  },
  {
    q: 'Do I need PM software to use PM packages?',
    a: 'No. PM packages include access to our platform tools. If you already use other software, we can work with your existing setup.',
  },
  {
    q: 'How quickly can I get started?',
    a: 'Most clients are onboarded within 48 hours. We schedule an onboarding call, set up your portal access, and start working on your projects right away.',
  },
]
