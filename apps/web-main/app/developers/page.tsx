import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { RoleHero } from '@/components/roles/RoleHero'
import { RoleBenefits } from '@/components/roles/RoleBenefits'
import { RoleWorkflow } from '@/components/roles/RoleWorkflow'
import { RoleCTA } from '@/components/roles/RoleCTA'

export const metadata: Metadata = {
  title: 'For Real Estate Developers — Kealee',
  description:
    'Full-lifecycle development platform with feasibility modeling, capital stack management, investor reporting, and AI-powered portfolio analytics.',
}

const BENEFITS = [
  {
    icon: '🌍',
    title: 'Land Intelligence (OS-Land)',
    desc: 'Parcel scoring, zoning analysis, environmental assessments, and development readiness reporting — all in one workflow.',
  },
  {
    icon: '📊',
    title: 'Feasibility Modeling (OS-Feas)',
    desc: 'Run pro formas, model scenarios, analyze returns, and make data-driven go/no-go decisions with KeaBot Feasibility.',
  },
  {
    icon: '💰',
    title: 'Capital Stack (OS-Dev)',
    desc: 'Build and manage your capital stack, track draw schedules, generate investor reports, and monitor entitlements.',
  },
  {
    icon: '🏗️',
    title: 'Construction OS (OS-PM)',
    desc: 'Full construction oversight: scheduling, RFIs, change orders, inspections, and milestone payments in one system.',
  },
  {
    icon: '📈',
    title: 'Portfolio Analytics',
    desc: 'Aggregate health scores, KPIs, and distribution waterfalls across your entire portfolio with KeaBot Developer.',
  },
  {
    icon: '🤝',
    title: 'Investor Reporting',
    desc: 'Auto-generate investor reports with real-time data from your digital twins. Scheduled delivery, custom branding.',
  },
]

const WORKFLOW = [
  {
    number: 1,
    title: 'Identify & Score the Parcel',
    desc: 'OS-Land runs automated parcel intake, zoning analysis, and development readiness scoring. KeaBot Land synthesizes the data for instant go/no-go signals.',
  },
  {
    number: 2,
    title: 'Model Feasibility',
    desc: 'OS-Feas generates pro formas from your inputs, runs scenario sensitivity analysis, and surfaces comparable sales — all in minutes.',
  },
  {
    number: 3,
    title: 'Assemble the Capital Stack',
    desc: 'OS-Dev builds your capital structure, tracks debt and equity sources, and aligns the draw schedule with construction milestones.',
  },
  {
    number: 4,
    title: 'Manage Construction',
    desc: 'The Digital Twin activates across OS-PM, OS-Pay, and Marketplace. Every milestone, payment, and inspection is tracked against the plan.',
  },
  {
    number: 5,
    title: 'Distribute & Report',
    desc: 'Waterfall calculations run automatically at each distribution event. Investor reports are generated from live twin data.',
  },
  {
    number: 6,
    title: 'Stabilize & Archive',
    desc: 'OS-Ops handles post-construction warranty and maintenance. The twin archives as a permanent record of the development.',
  },
]

const DEVELOPER_SERVICES = [
  {
    name: 'Feasibility Study',
    price: '$4,500–$12,000',
    note: 'Pro forma, scenario modeling, IRR/cash-on-cash, go/no-go recommendation',
  },
  {
    name: 'Pro Forma Analysis',
    price: '$2,500–$6,000',
    note: 'Unit mix, cost + revenue assumptions, sensitivity analysis',
  },
  {
    name: 'Capital Stack Modeling',
    price: '$3,500–$8,000',
    note: 'Debt/equity structure, draw schedule, waterfall projections',
  },
  {
    name: 'Entitlement Support',
    price: '$7,500–$20,000',
    note: 'Zoning, variance, regulatory filing coordination',
  },
]

export default function DevelopersPage() {
  return (
    <>
      <RoleHero
        badge="For Real Estate Developers"
        headline="7 Operating Systems. One Development Platform."
        highlight="One Development Platform."
        subhead="From identifying a parcel to delivering a stabilized asset, Kealee's integrated OS modules give developers data, AI insights, and automated workflows at every phase of the development lifecycle."
        cta={{ label: 'Schedule a Developer Consultation', href: '/developers/start' }}
        secondaryCta={{ label: 'See Feasibility Demo', href: '/contact' }}
        trustItems={['Pro forma in minutes', 'Capital stack builder', 'Investor-grade reporting', 'Portfolio analytics']}
        dark
      />

      <RoleBenefits
        badge="Platform Capabilities"
        headline="Every Phase of Development — Covered"
        subhead="7 specialized operating systems work together to give developers complete command of their projects from land to operations."
        benefits={BENEFITS}
      />

      <RoleWorkflow
        headline="From Parcel to Stabilized Asset"
        steps={WORKFLOW}
        accent="#E8793A"
      />

      {/* Developer Services Pricing */}
      <section className="py-20" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <span className="section-label">Developer Services</span>
            <h2 className="mt-3 text-2xl font-bold font-display sm:text-3xl" style={{ color: '#1A2B4A' }}>
              Professional advisory engagements
            </h2>
            <p className="mt-4 text-gray-600">
              One-time project fees — powered by OS-Land, OS-Feas, and OS-Dev. Pricing varies with project size and complexity.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            {DEVELOPER_SERVICES.map((item, i) => (
              <div
                key={item.name}
                className="flex items-center justify-between px-6 py-5"
                style={{
                  backgroundColor: i % 2 === 0 ? 'white' : '#FAFAFA',
                  borderBottom: i < DEVELOPER_SERVICES.length - 1 ? '1px solid #F3F4F6' : undefined,
                }}
              >
                <div>
                  <p className="text-base font-semibold" style={{ color: '#1A2B4A' }}>{item.name}</p>
                  <p className="mt-0.5 text-sm text-gray-400">{item.note}</p>
                </div>
                <span className="ml-6 flex-shrink-0 text-base font-bold" style={{ color: '#E8793A' }}>
                  {item.price}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/developers/start"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#E8793A' }}
            >
              Schedule a developer consultation <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <RoleCTA
        headline="Ready to Scale Your Development Business?"
        subhead="Kealee's developer platform gives you institutional-grade tools without the institutional complexity."
        cta={{ label: 'Schedule a Demo', href: '/contact' }}
        secondaryCta={{ label: 'View Pricing', href: '/pricing' }}
      />
    </>
  )
}
