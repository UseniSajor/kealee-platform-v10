import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { RoleHero } from '@/components/roles/RoleHero'
import { RoleBenefits } from '@/components/roles/RoleBenefits'
import { RoleWorkflow } from '@/components/roles/RoleWorkflow'
import { RoleCTA } from '@/components/roles/RoleCTA'
import { RoleFAQ } from '@/components/roles/RoleFAQ'

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

      {/* Developer Products */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold font-display sm:text-3xl" style={{ color: '#1A2B4A' }}>
              Developer products
            </h2>
            <p className="mt-3 text-gray-500">AI-powered tools for every phase of the development lifecycle.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: '🏢',
                name: 'Developer Portal',
                price: 'Free to start',
                features: ['Portfolio dashboard', 'AI project analytics', 'Multi-project reporting'],
                cta: 'Open portal',
                href: process.env.NEXT_PUBLIC_DEVELOPER_PORTAL_URL ?? '/auth/sign-in',
                accent: '#2ABFBF',
              },
              {
                icon: '📊',
                name: 'OS-Land + OS-Feas',
                price: '$499/mo',
                features: ['AI parcel scoring', 'Pro forma modeling', 'Go/no-go scenario analysis'],
                cta: 'Start feasibility',
                href: '/developers/start',
                accent: '#C8521A',
                highlight: true,
              },
              {
                icon: '🔮',
                name: 'Digital Twin Platform',
                price: 'Enterprise',
                features: ['Live project model', 'Milestone + draw tracking', 'Investor report generation'],
                cta: 'Schedule demo',
                href: '/contact',
                accent: '#1A2B4A',
              },
            ].map(p => (
              <div
                key={p.name}
                className="flex flex-col rounded-2xl p-6"
                style={{
                  border: p.highlight ? '2px solid #C8521A' : '1px solid #E2E1DC',
                  background: 'white',
                }}
              >
                <div className="mb-4 text-3xl">{p.icon}</div>
                <h3 className="font-bold font-display" style={{ color: '#1A1C1B' }}>{p.name}</h3>
                <p className="mt-1 text-sm font-semibold" style={{ color: p.accent }}>{p.price}</p>
                <ul className="my-4 flex-1 space-y-1.5">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <span style={{ color: p.accent }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.href}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: p.accent }}
                >
                  {p.cta} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Developer portal CTA banner */}
      <section className="py-14" style={{ background: '#0F1A2E' }}>
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold font-display text-white sm:text-3xl">
            Start your first feasibility
          </h2>
          <p className="mt-3 text-gray-400">
            AI-powered pro forma in days. Land, capital stack, digital twin — one integrated platform.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={process.env.NEXT_PUBLIC_DEVELOPER_PORTAL_URL ?? '/developers/start'}
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: '#C8521A' }}
            >
              Open Developer Portal <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/contact"
              className="text-sm font-semibold text-gray-300 underline hover:text-white"
            >
              Schedule a consultation
            </Link>
          </div>
        </div>
      </section>

      <RoleFAQ
        items={[
          {
            question: 'What is included in a Kealee feasibility study?',
            answer: 'Our feasibility packages include pro forma modeling, IRR and cash-on-cash analysis, unit mix optimization, scenario modeling, and a go/no-go recommendation. Pricing ranges from $4,500 to $12,000 based on project size and complexity.',
          },
          {
            question: 'Does Kealee support commercial and mixed-use development?',
            answer: 'Yes. Office, retail, industrial, mixed-use, and multifamily projects are all supported. See our Commercial Projects page for the full list of project types.',
          },
          {
            question: 'What is the Digital Development Twin System (DDTS)?',
            answer: 'The DDTS is a live digital model of every project — tracking milestones, payments, change orders, inspection records, and lender draws in real time. Available to all developer and Ops OS accounts.',
          },
          {
            question: 'How does commercial IT infrastructure work under developer services?',
            answer: 'Managed network installation, security systems, AV, EV charging, and building technology (BMS) are available as part of commercial project coordination for developers and property managers.',
          },
          {
            question: 'Does Kealee offer onsite construction services?',
            answer: 'No. All onsite construction must be performed by your licensed contractor of record. Kealee provides advisory, feasibility, permitting, contractor matching, and platform management services only.',
          },
        ]}
      />
      <RoleCTA
        headline="Ready to Scale Your Development Business?"
        subhead="Kealee's developer platform gives you institutional-grade tools without the institutional complexity."
        cta={{ label: 'Schedule a Demo', href: '/contact' }}
        secondaryCta={{ label: 'View Pricing', href: '/pricing' }}
      />
    </>
  )
}
