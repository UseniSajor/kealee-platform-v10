import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle } from 'lucide-react'
import { RoleHero } from '@/components/roles/RoleHero'
import { RoleFAQ } from '@/components/roles/RoleFAQ'
import { RoleCTA } from '@/components/roles/RoleCTA'

export const metadata: Metadata = {
  title: 'Project Management Services — Kealee',
  description:
    'Professional project management for residential and commercial construction. PM Advisory and PM Oversight — one-time per project, no subscriptions.',
}

const PM_TIERS = [
  {
    name: 'Self-Managed',
    price: 'Free',
    description: 'Use all platform tools to manage your own project.',
    features: [
      'Owner dashboard + milestone tracking',
      'Contractor messaging + document sharing',
      'Escrow-protected milestone payments',
      'KeaBot Owner AI assistant',
      'Inspection coordination tools',
    ],
    highlight: false,
    cta: 'Start a Project',
    ctaHref: '/homeowners/start',
  },
  {
    name: 'PM Advisory',
    price: '$950',
    period: 'one-time',
    description: 'A Kealee PM reviews your project at key milestones and flags issues before they become problems.',
    features: [
      'Milestone-by-milestone advisory reviews',
      'Budget variance alerts + analysis',
      'Bid review and contractor guidance',
      'Change order oversight',
      'Final walkthrough checklist review',
    ],
    highlight: true,
    cta: 'Add PM Advisory',
    ctaHref: '/intake',
  },
  {
    name: 'PM Oversight',
    price: '$2,950',
    period: 'one-time',
    description: 'Full project management from groundbreaking to closeout. Recommended for projects over $75K.',
    features: [
      'Everything in PM Advisory',
      'Full PM from groundbreaking to closeout',
      'Weekly progress reports',
      'Contractor coordination + issue resolution',
      'Lien waiver and closeout management',
      'Post-construction punch list management',
    ],
    highlight: false,
    cta: 'Add PM Oversight',
    ctaHref: '/intake',
  },
]

const WHAT_PM_COVERS = [
  {
    icon: '📋',
    title: 'Milestone Reviews',
    desc: 'Your PM reviews each phase of construction against the approved scope and flags deviations before payment is released.',
  },
  {
    icon: '💰',
    title: 'Budget Oversight',
    desc: 'Automatic variance alerts when spending diverges from plan. No surprise invoices or scope creep goes unnoticed.',
  },
  {
    icon: '📄',
    title: 'Change Order Management',
    desc: 'Every change order is documented, priced, and approved through the platform before work begins.',
  },
  {
    icon: '🔍',
    title: 'Inspection Coordination',
    desc: 'All required code inspections are scheduled, tracked, and resolved. Punch lists ensure nothing is missed before closeout.',
  },
  {
    icon: '🤝',
    title: 'Contractor Communication',
    desc: 'Your PM is the single point of contact for contractor questions, reducing noise and protecting your time.',
  },
  {
    icon: '✅',
    title: 'Closeout & Lien Waivers',
    desc: 'Final walkthrough, punch list completion, lien waiver collection, and certificate of occupancy support.',
  },
]

export default function PMPage() {
  return (
    <>
      <RoleHero
        badge="Project Management Services"
        headline="Professional Oversight at Every Phase"
        highlight="Every Phase"
        subhead="From milestone reviews to full project oversight — Kealee PM services protect your investment and keep your project on track. One-time per project, no subscriptions."
        cta={{ label: 'Add PM to My Project', href: '/intake' }}
        secondaryCta={{ label: 'View All Pricing', href: '/pricing' }}
        trustItems={['One-time fee', 'No subscriptions', 'Licensed PM professionals', 'Escrow-protected payments']}
        dark
      />

      {/* PM Tiers */}
      <section className="py-20" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold" style={{ color: '#1A2B4A' }}>Choose your level of oversight</h2>
            <p className="mt-3 text-gray-500">All homeowner PM fees are one-time per project — not a subscription.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {PM_TIERS.map(tier => (
              <div
                key={tier.name}
                className="flex flex-col overflow-hidden rounded-xl bg-white"
                style={{
                  boxShadow: tier.highlight ? '0 10px 15px -3px rgb(0 0 0 / 0.1)' : '0 1px 3px 0 rgb(0 0 0 / 0.07)',
                  border: tier.highlight ? '2px solid #2ABFBF' : '1px solid #E5E7EB',
                }}
              >
                <div className="flex flex-1 flex-col p-6">
                  {tier.highlight && (
                    <span
                      className="mb-3 inline-block self-start rounded-full px-3 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: '#2ABFBF' }}
                    >
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-lg font-semibold" style={{ color: '#1A2B4A' }}>{tier.name}</h3>
                  <div className="my-3">
                    <span className="text-3xl font-bold font-mono" style={{ color: tier.highlight ? '#2ABFBF' : '#1A2B4A' }}>
                      {tier.price}
                    </span>
                    {tier.period && <span className="ml-1 text-sm text-gray-400">{tier.period}</span>}
                  </div>
                  <p className="mb-4 text-sm text-gray-600">{tier.description}</p>
                  <ul className="mb-6 flex-1 space-y-2">
                    {tier.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={tier.ctaHref}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 px-4 text-sm font-semibold transition-all hover:opacity-90"
                    style={{
                      backgroundColor: tier.highlight ? '#2ABFBF' : 'transparent',
                      color: tier.highlight ? '#FFFFFF' : '#2ABFBF',
                      border: tier.highlight ? 'none' : '2px solid #2ABFBF',
                    }}
                  >
                    {tier.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-gray-400">
            All services requiring onsite support are performed by your contractor of record. Kealee provides advisory and coordination services only.
          </p>
        </div>
      </section>

      {/* What PM Covers */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold" style={{ color: '#1A2B4A' }}>What project management covers</h2>
            <p className="mt-3 text-gray-500">Professional oversight at every stage of your build.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WHAT_PM_COVERS.map(item => (
              <div key={item.title} className="rounded-xl border border-gray-100 bg-white p-6">
                <span className="text-2xl">{item.icon}</span>
                <h3 className="mt-3 font-semibold" style={{ color: '#1A2B4A' }}>{item.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <RoleFAQ
        items={[
          {
            question: 'What is the difference between PM Advisory and PM Oversight?',
            answer: 'PM Advisory ($950) covers milestone reviews, budget oversight, bid review, and final walkthrough checklist. PM Oversight ($2,950) adds full project management from groundbreaking to closeout, including weekly reports, contractor coordination, and lien waiver management.',
          },
          {
            question: 'Are PM fees a subscription?',
            answer: 'No. All PM fees are one-time per project. You pay once per project — not monthly.',
          },
          {
            question: 'Does Kealee perform onsite inspections or supervision?',
            answer: 'No. All onsite activities must be performed by your licensed contractor of record. Kealee provides remote advisory, coordination, and platform oversight services only.',
          },
          {
            question: 'When should I add PM Oversight vs PM Advisory?',
            answer: 'PM Advisory is ideal for projects under $75K where you want expert reviews at key points. PM Oversight is recommended for projects over $75K, complex renovations, or additions where continuous coordination and contractor management adds significant value.',
          },
          {
            question: 'Can I upgrade from PM Advisory to PM Oversight after starting?',
            answer: 'Yes. Contact our support team to upgrade your PM level at any point during the project. The advisory fee already paid will be credited toward the oversight package.',
          },
        ]}
      />

      <RoleCTA
        headline="Add Professional Oversight to Your Project"
        subhead="One-time fee. No subscriptions. Your build protected from day one."
        cta={{ label: 'Add PM to My Project', href: '/intake' }}
        secondaryCta={{ label: 'View All Pricing', href: '/pricing' }}
      />
    </>
  )
}
