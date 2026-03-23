import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { RoleHero } from '@/components/roles/RoleHero'
import { RoleBenefits } from '@/components/roles/RoleBenefits'
import { RoleWorkflow } from '@/components/roles/RoleWorkflow'
import { RoleCTA } from '@/components/roles/RoleCTA'
import { RoleFAQ } from '@/components/roles/RoleFAQ'

export const metadata: Metadata = {
  title: 'For Contractors — Kealee',
  description:
    'Win more projects, manage your pipeline, and get paid faster. Join the Kealee contractor network with AI-powered lead matching.',
}

const BENEFITS = [
  {
    icon: '🎯',
    title: 'Smart Lead Matching',
    desc: 'AI matches you to projects that fit your trade, license, geography, and capacity — no cold outreach, no wasted bids.',
  },
  {
    icon: '📋',
    title: 'AI Bid Assistant',
    desc: 'KeaBot GC helps you prepare competitive bids from plans and specs. Reduces quote time by 60% on average.',
  },
  {
    icon: '🏗️',
    title: 'Construction OS',
    desc: 'Built-in scheduling, daily logs, RFI tracking, punch lists, and change orders — everything your crew needs in the field.',
  },
  {
    icon: '💳',
    title: 'Milestone Payments',
    desc: 'Escrow-backed payments are released automatically when milestones are verified. No more chasing invoices.',
  },
  {
    icon: '⭐',
    title: 'Reputation Scoring',
    desc: 'Build your verified reputation with every completed project. Strong scores unlock premium project opportunities.',
  },
  {
    icon: '📊',
    title: 'Business Analytics',
    desc: 'Track win rates, revenue pipeline, utilization, and profitability across all your active projects in one dashboard.',
  },
]

const WORKFLOW = [
  {
    number: 1,
    title: 'Apply & Get Verified',
    desc: 'Submit your license, insurance, and references. Our verification team confirms your credentials within 48 hours.',
  },
  {
    number: 2,
    title: 'Build Your Profile',
    desc: 'Upload portfolio photos, describe your specialties, and set your capacity and service area to start attracting matched leads.',
  },
  {
    number: 3,
    title: 'Receive Matched Leads',
    desc: "Kealee's AI surfaces project opportunities that match your trade, license, geography, and available capacity.",
  },
  {
    number: 4,
    title: 'Submit AI-Assisted Bids',
    desc: 'KeaBot GC helps you analyze scope, pull line-item costs, and prepare competitive proposals — fast.',
  },
  {
    number: 5,
    title: 'Win & Execute',
    desc: 'Digital contracts are signed on the platform. Construction OS activates with your schedule, crew assignments, and daily log.',
  },
  {
    number: 6,
    title: 'Get Paid on Milestones',
    desc: 'Escrow funds are released automatically when each milestone is verified. Lien waivers handled digitally.',
  },
]

const LISTING_TIERS = [
  {
    name: 'Starter',
    price: '$99/mo',
    description: 'Get listed, verified, and start receiving AI-matched leads.',
    features: [
      'Verified contractor profile',
      'AI-matched lead delivery',
      'Up to 10 active bid responses/mo',
      'Basic analytics dashboard',
      'Reputation score tracking',
    ],
    highlight: false,
  },
  {
    name: 'Growth',
    price: '$199/mo',
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
  },
  {
    name: 'Pro',
    price: '$499/mo',
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
  },
]

export default function ContractorsPage() {
  return (
    <>
      <RoleHero
        badge="For Contractors & Specialty Trades"
        headline="Win More Projects. Build More Efficiently."
        highlight="Build More Efficiently."
        subhead="Kealee's smart lead matching connects you with projects that fit your trade, license, capacity, and geography. The Construction OS handles schedule, daily logs, RFIs, and payments."
        cta={{ label: 'Join the Marketplace', href: '/contractor/register' }}
        secondaryCta={{ label: 'Browse Open Projects', href: '/marketplace' }}
        trustItems={['AI-matched leads', 'Verified credentials', 'Escrow-backed payments', 'Field-ready OS']}
        dark={false}
      />

      {/* Pricing Section */}
      <section className="py-20" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold" style={{ color: '#1A2B4A' }}>
              Marketplace listing tiers
            </h2>
            <p className="mt-3 text-gray-500">
              Choose the level of access that fits your business. Cancel anytime.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {LISTING_TIERS.map(tier => (
              <div
                key={tier.name}
                className="flex flex-col overflow-hidden rounded-xl bg-white"
                style={{
                  boxShadow: tier.highlight ? '0 10px 15px -3px rgb(0 0 0 / 0.1)' : '0 1px 3px 0 rgb(0 0 0 / 0.1)',
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
                  <p className="my-2 text-2xl font-bold font-mono" style={{ color: tier.highlight ? '#2ABFBF' : '#1A2B4A' }}>
                    {tier.price}
                  </p>
                  <p className="mb-4 text-sm text-gray-600">{tier.description}</p>
                  <ul className="mb-6 flex-1 space-y-2">
                    {tier.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                        <span style={{ color: '#2ABFBF' }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/contractor/register"
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 px-4 text-sm font-semibold transition-all hover:opacity-90"
                    style={{
                      backgroundColor: tier.highlight ? '#2ABFBF' : 'transparent',
                      color: tier.highlight ? '#FFFFFF' : '#2ABFBF',
                      border: tier.highlight ? 'none' : '2px solid #2ABFBF',
                    }}
                  >
                    Join the Marketplace <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            Cancel anytime. 14-day free trial included. Verify your account to unlock full features.
          </p>
        </div>
      </section>

      <RoleBenefits
        badge="Why Contractors Choose Kealee"
        headline="Built for Builders, Not Bureaucrats"
        subhead="Every feature is designed around how contractors actually work — in the field, on the go, managing multiple projects."
        benefits={BENEFITS}
      />
      <RoleWorkflow
        headline="From Application to First Project in Days"
        steps={WORKFLOW}
        accent="#E8793A"
      />
      <RoleFAQ
        items={[
          {
            question: 'How does the contractor verification process work?',
            answer: 'Submit your license, insurance, and references. Our team verifies your credentials within 48 hours. Once verified, your profile goes live and you start receiving AI-matched leads.',
          },
          {
            question: 'What is the difference between the Starter, Growth, and Pro plans?',
            answer: 'Starter ($99/mo) gets you listed and receiving matched leads with up to 10 bid responses per month. Growth ($199/mo) adds priority matching, unlimited bids, KeaBot GC, and CRM tools. Pro ($499/mo) adds full Construction OS access, top-of-feed placement, and enterprise integrations.',
          },
          {
            question: 'Does Kealee offer onsite services or supervision?',
            answer: 'No. All onsite services — including inspections, site visits, and construction supervision — must be performed by the contractor of record. Kealee is a platform and advisory service only.',
          },
          {
            question: 'How does KeaBot GC help with bids?',
            answer: 'KeaBot GC analyzes project scope and specs, pulls line-item costs, and helps you prepare competitive proposals in a fraction of the time. Available on Growth and Pro plans.',
          },
          {
            question: 'Can I cancel my plan anytime?',
            answer: 'Yes. All plans are month-to-month and can be cancelled at any time. A 14-day free trial is included when you first join.',
          },
        ]}
      />
      <RoleCTA
        headline="Ready to Grow Your Business?"
        subhead="Join hundreds of licensed contractors winning more projects with Kealee's AI-powered platform."
        cta={{ label: 'Join as Contractor', href: '/contractor/register' }}
        secondaryCta={{ label: 'Learn More', href: '/contact' }}
      />
    </>
  )
}
