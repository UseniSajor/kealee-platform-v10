import type { Metadata } from 'next'
import { RoleHero } from '@/components/roles/RoleHero'
import { RoleBenefits } from '@/components/roles/RoleBenefits'
import { RoleWorkflow } from '@/components/roles/RoleWorkflow'
import { RoleCTA } from '@/components/roles/RoleCTA'

export const metadata: Metadata = {
  title: 'For Real Estate Developers',
  description:
    'Full-lifecycle development platform with feasibility modeling, capital stack management, investor reporting, and AI-powered portfolio analytics.',
}

const BENEFITS = [
  {
    emoji: '🌍',
    title: 'Land Intelligence (OS-Land)',
    description:
      'Parcel scoring, zoning analysis, environmental assessments, and development readiness reporting — all in one workflow.',
  },
  {
    emoji: '📊',
    title: 'Feasibility Modeling (OS-Feas)',
    description:
      'Run pro formas, model scenarios, analyze returns, and make data-driven go/no-go decisions with KeaBot Feasibility.',
  },
  {
    emoji: '💰',
    title: 'Capital Stack (OS-Dev)',
    description:
      'Build and manage your capital stack, track draw schedules, generate investor reports, and monitor entitlements.',
  },
  {
    emoji: '🏗️',
    title: 'Construction OS (OS-PM)',
    description:
      'Full construction oversight: scheduling, RFIs, change orders, inspections, and milestone payments in one system.',
  },
  {
    emoji: '📈',
    title: 'Portfolio Analytics',
    description:
      'Aggregate health scores, KPIs, and distribution waterfalls across your entire portfolio with KeaBot Developer.',
  },
  {
    emoji: '🤝',
    title: 'Investor Reporting',
    description:
      'Auto-generate investor reports with real-time data from your digital twins. Scheduled delivery, custom branding.',
  },
]

const WORKFLOW = [
  {
    title: 'Identify & Score the Parcel',
    description:
      'OS-Land runs automated parcel intake, zoning analysis, and development readiness scoring. KeaBot Land synthesizes the data for instant go/no-go signals.',
  },
  {
    title: 'Model Feasibility',
    description:
      'OS-Feas generates pro formas from your inputs, runs scenario sensitivity analysis, and surfaces comparable sales — all in minutes.',
  },
  {
    title: 'Assemble the Capital Stack',
    description:
      'OS-Dev builds your capital structure, tracks debt and equity sources, and aligns the draw schedule with construction milestones.',
  },
  {
    title: 'Manage Construction',
    description:
      'The Digital Twin activates across OS-PM, OS-Pay, and Marketplace. Every milestone, payment, and inspection is tracked against the plan.',
  },
  {
    title: 'Distribute & Report',
    description:
      'Waterfall calculations run automatically at each distribution event. Investor reports are generated from live twin data.',
  },
  {
    title: 'Stabilize & Archive',
    description:
      'OS-Ops handles post-construction warranty and maintenance. The twin archives as a permanent record of the development.',
  },
]

export default function DevelopersPage() {
  return (
    <>
      <RoleHero
        badge="For Real Estate Developers"
        badgeColor="#E8793A"
        headline='7 Operating Systems.<br /><span style="color:#2ABFBF">One Development Platform.</span>'
        subheadline="From identifying a parcel to delivering a stabilized asset, Kealee's integrated OS modules give developers data, AI insights, and automated workflows at every phase of the development lifecycle."
        primaryCTA={{ label: 'Developer Platform Overview', href: '/contact' }}
        secondaryCTA={{ label: 'See Feasibility Demo', href: '/contact' }}
        trustItems={['Pro forma in minutes', 'Capital stack builder', 'Investor-grade reporting', 'Portfolio analytics']}
        dark
      />
      <RoleBenefits
        eyebrow="Platform Capabilities"
        headline="Every Phase of Development — Covered"
        subheadline="7 specialized operating systems work together to give developers complete command of their projects from land to operations."
        benefits={BENEFITS}
      />
      <RoleWorkflow
        eyebrow="Development Lifecycle"
        headline="From Parcel to Stabilized Asset"
        steps={WORKFLOW}
        accentColor="#E8793A"
      />
      <RoleCTA
        headline="Ready to Scale Your Development Business?"
        subheadline="Kealee's developer platform gives you institutional-grade tools without the institutional complexity."
        primaryCTA={{ label: 'Schedule a Demo', href: '/contact' }}
        secondaryCTA={{ label: 'View Pricing', href: '/pricing' }}
        accentColor="#2ABFBF"
      />
    </>
  )
}
