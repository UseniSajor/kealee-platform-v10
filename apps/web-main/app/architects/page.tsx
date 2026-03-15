import type { Metadata } from 'next'
import { RoleHero } from '@/components/roles/RoleHero'
import { RoleBenefits } from '@/components/roles/RoleBenefits'
import { RoleWorkflow } from '@/components/roles/RoleWorkflow'
import { RoleCTA } from '@/components/roles/RoleCTA'

export const metadata: Metadata = {
  title: 'For Architects',
  description:
    'Manage design coordination, submittals, RFIs, and permit applications — all integrated with the owner and contractor on one platform.',
}

const BENEFITS = [
  {
    emoji: '📐',
    title: 'Design Phase Management',
    description:
      'Track SD, DD, and CD milestones with client approval gates, version history, and automated notifications.',
  },
  {
    emoji: '📋',
    title: 'Submittal & RFI Workflows',
    description:
      'Route submittals and RFIs to reviewers automatically. Full audit trail, response-time tracking, and resubmittal history.',
  },
  {
    emoji: '🔍',
    title: 'Construction Observation',
    description:
      'Issue field reports, create punch lists from site visits, and track finding resolution through to closeout.',
  },
  {
    emoji: '📦',
    title: 'Document Management',
    description:
      'Version-controlled drawing sets, specs, and ASIs shared with the entire project team in real time.',
  },
  {
    emoji: '💡',
    title: 'KeaBot Permit Navigation',
    description:
      'AI-assisted permit preparation for your jurisdiction. KeaBot tracks requirements, review status, and resubmittal windows.',
  },
  {
    emoji: '💰',
    title: 'Fee Tracking',
    description:
      'Monitor design fee utilization against your contract, track additional services, and invoice directly from the platform.',
  },
]

const WORKFLOW = [
  {
    title: 'Accept Project Invitation',
    description:
      'The project owner invites you to the project. Your architect workspace activates with access to owner and contractor communications, documents, and project timeline.',
  },
  {
    title: 'Manage Design Milestones',
    description:
      'Set SD, DD, and CD milestones with owner review gates. Upload deliverables and collect digital approvals — all time-stamped and logged.',
  },
  {
    title: 'Coordinate Permit Submission',
    description:
      'KeaBot Permit prepares jurisdiction-specific submission packages, tracks plan review status, and manages resubmittals with automated follow-up.',
  },
  {
    title: 'Administer Construction',
    description:
      'Process RFIs and submittals with one-click routing. Issue ASIs and field orders — all integrated with the contractor\'s Construction OS.',
  },
  {
    title: 'Conduct Site Observations',
    description:
      'Complete field reports and punch lists from the mobile app during site visits. Issues are automatically assigned to the responsible party.',
  },
  {
    title: 'Close Out & Archive',
    description:
      'Issue final certificates, deliver as-builts, and close your contract scope — all preserved in the project\'s digital twin archive.',
  },
]

export default function ArchitectsPage() {
  return (
    <>
      <RoleHero
        badge="For Architects"
        badgeColor="#1A2B4A"
        headline='Design Coordination,<br /><span style="color:#2ABFBF">Built Into the Platform</span>'
        subheadline="Kealee connects architects with owners and contractors in a single workflow — from schematic design through permit approval and construction closeout. No more chasing emails."
        primaryCTA={{ label: 'Apply as Architect', href: '/architect/register' }}
        secondaryCTA={{ label: 'View Demo', href: '/contact' }}
        trustItems={['RFI & submittal management', 'AI permit navigation', 'Field observation tools', 'Integrated with owner + contractor']}
        dark
      />
      <RoleBenefits
        eyebrow="Platform Features"
        headline="Everything Architects Need on One Platform"
        subheadline="From design phase through construction administration, Kealee gives you the tools to coordinate, document, and deliver."
        benefits={BENEFITS}
      />
      <RoleWorkflow
        eyebrow="How It Works"
        headline="Design-to-Closeout in 6 Steps"
        steps={WORKFLOW}
        accentColor="#1A2B4A"
      />
      <RoleCTA
        headline="Join the Kealee Professional Network"
        subheadline="Architects on Kealee manage more projects with less administrative overhead."
        primaryCTA={{ label: 'Apply Now', href: '/architect/register' }}
        secondaryCTA={{ label: 'Contact Us', href: '/contact' }}
        accentColor="#2ABFBF"
      />
    </>
  )
}
