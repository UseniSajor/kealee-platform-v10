import type { Metadata } from 'next'
import { RoleHero } from '@/components/roles/RoleHero'
import { RoleBenefits } from '@/components/roles/RoleBenefits'
import { RoleWorkflow } from '@/components/roles/RoleWorkflow'
import { RoleCTA } from '@/components/roles/RoleCTA'

export const metadata: Metadata = {
  title: 'For Contractors',
  description:
    'Win more projects, manage your pipeline, and get paid faster. Join the Kealee contractor network with AI-powered lead matching.',
}

const BENEFITS = [
  {
    emoji: '🎯',
    title: 'Smart Lead Matching',
    description:
      'AI matches you to projects that fit your trade, license, geography, and capacity — no cold outreach, no wasted bids.',
  },
  {
    emoji: '📋',
    title: 'AI Bid Assistant',
    description:
      'KeaBot GC helps you prepare competitive bids from plans and specs. Reduces quote time by 60% on average.',
  },
  {
    emoji: '🏗️',
    title: 'Construction OS',
    description:
      'Built-in scheduling, daily logs, RFI tracking, punch lists, and change orders — everything your crew needs in the field.',
  },
  {
    emoji: '💳',
    title: 'Milestone Payments',
    description:
      'Escrow-backed payments are released automatically when milestones are verified. No more chasing invoices.',
  },
  {
    emoji: '⭐',
    title: 'Reputation Scoring',
    description:
      'Build your verified reputation with every completed project. Strong scores unlock premium project opportunities.',
  },
  {
    emoji: '📊',
    title: 'Business Analytics',
    description:
      'Track win rates, revenue pipeline, utilization, and profitability across all your active projects in one dashboard.',
  },
]

const WORKFLOW = [
  {
    title: 'Apply & Get Verified',
    description:
      'Submit your license, insurance, and references. Our verification team confirms your credentials within 48 hours.',
  },
  {
    title: 'Build Your Profile',
    description:
      'Upload portfolio photos, describe your specialties, and set your capacity and service area to start attracting matched leads.',
  },
  {
    title: 'Receive Matched Leads',
    description:
      'Kealee\'s AI surfaces project opportunities that match your trade, license, geography, and available capacity.',
  },
  {
    title: 'Submit AI-Assisted Bids',
    description:
      'KeaBot GC helps you analyze scope, pull line-item costs, and prepare competitive proposals — fast.',
  },
  {
    title: 'Win & Execute',
    description:
      'Digital contracts are signed on the platform. Construction OS activates with your schedule, crew assignments, and daily log.',
  },
  {
    title: 'Get Paid on Milestones',
    description:
      'Escrow funds are released automatically when each milestone is verified. Lien waivers handled digitally.',
  },
]

export default function ContractorsPage() {
  return (
    <>
      <RoleHero
        badge="For Contractors & Specialty Trades"
        badgeColor="#E8793A"
        headline='Win More Projects.<br /><span style="color:#E8793A">Build More Efficiently.</span>'
        subheadline="Kealee's smart lead matching connects you with projects that fit your trade, license, capacity, and geography. The Construction OS handles schedule, daily logs, RFIs, and payments."
        primaryCTA={{ label: 'Join the Network', href: '/contractor/register' }}
        secondaryCTA={{ label: 'Browse Open Projects', href: '/marketplace' }}
        trustItems={['AI-matched leads', 'Verified credentials', 'Escrow-backed payments', 'Field-ready OS']}
        dark={false}
      />
      <RoleBenefits
        eyebrow="Why Contractors Choose Kealee"
        headline="Built for Builders, Not Bureaucrats"
        subheadline="Every feature is designed around how contractors actually work — in the field, on the go, managing multiple projects."
        benefits={BENEFITS}
        light
      />
      <RoleWorkflow
        eyebrow="Getting Started"
        headline="From Application to First Project in Days"
        steps={WORKFLOW}
        accentColor="#E8793A"
      />
      <RoleCTA
        headline="Ready to Grow Your Business?"
        subheadline="Join hundreds of licensed contractors winning more projects with Kealee's AI-powered platform."
        primaryCTA={{ label: 'Join as Contractor', href: '/contractor/register' }}
        secondaryCTA={{ label: 'Learn More', href: '/contact' }}
        accentColor="#E8793A"
      />
    </>
  )
}
