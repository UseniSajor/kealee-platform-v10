import type { Metadata } from 'next'
import { RoleHero } from '@/components/roles/RoleHero'
import { RoleBenefits } from '@/components/roles/RoleBenefits'
import { RoleWorkflow } from '@/components/roles/RoleWorkflow'
import { RoleCTA } from '@/components/roles/RoleCTA'

export const metadata: Metadata = {
  title: 'For Homeowners',
  description:
    'Manage your renovation or new build with full transparency. Track milestones, control payments, and get AI guidance — all from one place.',
}

const BENEFITS = [
  {
    emoji: '📋',
    title: 'Full Project Visibility',
    description:
      'See every milestone, payment, and inspection in real time. No more chasing updates from your contractor.',
  },
  {
    emoji: '💳',
    title: 'Escrow-Protected Payments',
    description:
      'Funds are held securely until each milestone is verified complete. You never pay for work that hasn't been done.',
  },
  {
    emoji: '🤖',
    title: 'KeaBot Owner Assistant',
    description:
      'Your dedicated AI advisor answers questions about budget, schedule, and decisions — 24/7 on any device.',
  },
  {
    emoji: '🔨',
    title: 'Vetted Contractor Network',
    description:
      'Every contractor is licensed, insured, background-checked, and reputation-scored before entering the Kealee network.',
  },
  {
    emoji: '📊',
    title: 'Budget Tracking',
    description:
      'Track spending vs. budget with automatic variance alerts. Know exactly where every dollar is going.',
  },
  {
    emoji: '✅',
    title: 'Inspection Coordination',
    description:
      'Schedule and track code inspections automatically. Punch lists ensure nothing slips through the cracks.',
  },
]

const WORKFLOW = [
  {
    title: 'Describe Your Project',
    description:
      'Tell us what you want to build — renovation, addition, or new construction. Kealee matches you to the right project type and Digital Twin tier.',
  },
  {
    title: 'Get Matched to Contractors',
    description:
      'AI matching surfaces verified contractors in your area with the right trade, license, and capacity for your project.',
  },
  {
    title: 'Review Bids & Sign Contracts',
    description:
      'Compare AI-analyzed bids side by side. Digital contracts are signed and stored automatically.',
  },
  {
    title: 'Fund Escrow',
    description:
      'Deposit project funds into a secure escrow account. Payments are released only when you approve each milestone.',
  },
  {
    title: 'Track Every Milestone',
    description:
      'Watch your project advance through the 12-phase lifecycle with photos, daily logs, and inspection results in real time.',
  },
  {
    title: 'Close Out & Move In',
    description:
      'Final inspection, certificate of occupancy, and warranty handover — all managed in one place. Your digital twin stays active for operations.',
  },
]

export default function HomeownersPage() {
  return (
    <>
      <RoleHero
        badge="For Homeowners & Renovation Projects"
        badgeColor="#2ABFBF"
        headline='Build with <span style="color:#E8793A">Confidence</span> — Not Chaos'
        subheadline="Kealee gives homeowners full transparency into their renovation or new build. Track milestones, control payments, and get AI-powered guidance — without needing a construction degree."
        primaryCTA={{ label: 'Start Your Project', href: '/contact' }}
        secondaryCTA={{ label: 'Browse Contractors', href: '/marketplace' }}
        trustItems={['No surprise invoices', 'Escrow-protected payments', 'Licensed & insured contractors', 'AI advisor included']}
        dark
      />
      <RoleBenefits
        eyebrow="What You Get"
        headline="Everything You Need to Build Smarter"
        subheadline="From finding the right contractor to final walkthrough — Kealee handles the complexity so you can focus on the outcome."
        benefits={BENEFITS}
      />
      <RoleWorkflow
        eyebrow="How It Works"
        headline="From Idea to Completion in 6 Steps"
        steps={WORKFLOW}
        accentColor="#2ABFBF"
      />
      <RoleCTA
        headline="Ready to Start Your Project?"
        subheadline="Join thousands of homeowners who have built smarter with Kealee's AI-powered platform."
        primaryCTA={{ label: 'Start Your Project', href: '/contact' }}
        secondaryCTA={{ label: 'Browse Contractors', href: '/marketplace' }}
        accentColor="#E8793A"
      />
    </>
  )
}
