import type { Metadata } from 'next'
import { RoleHero } from '@/components/roles/RoleHero'
import { RoleBenefits } from '@/components/roles/RoleBenefits'
import { RoleWorkflow } from '@/components/roles/RoleWorkflow'
import { RoleCTA } from '@/components/roles/RoleCTA'
import { RoleFAQ } from '@/components/roles/RoleFAQ'

export const metadata: Metadata = {
  title: 'For Architects & Design Professionals',
  description:
    'Collaborate with owners and contractors, manage submittals and RFIs, and track design intent through construction — all in one platform.',
}

const BENEFITS = [
  {
    emoji: '📐',
    title: 'Design Phase Coordination',
    description:
      'Manage schematic design through construction documents with integrated milestone tracking and client approval workflows.',
  },
  {
    emoji: '📋',
    title: 'Submittal & RFI Management',
    description:
      'Track submittals, shop drawings, and RFIs with automated routing and response time tracking. Full audit trail.',
  },
  {
    emoji: '🔍',
    title: 'Construction Observation',
    description:
      'Conduct site visits, issue field reports, and manage punch lists directly in the project timeline.',
  },
  {
    emoji: '🤝',
    title: 'Owner & Contractor Collaboration',
    description:
      'Share drawings, specifications, and decisions with all project stakeholders in a single, coordinated workspace.',
  },
  {
    emoji: '💡',
    title: 'KeaBot Permit Assistant',
    description:
      'AI-powered permit navigation helps you prepare submissions, track jurisdictional requirements, and monitor approvals.',
  },
  {
    emoji: '📊',
    title: 'Project Fee Tracking',
    description:
      'Track design fee utilization against your contract, manage additional services, and invoice from the platform.',
  },
]

const WORKFLOW = [
  {
    title: 'Onboard to the Project',
    description:
      'The owner invites you to the project. You get a dedicated design professional workspace with access to project data, owner, and contractor communications.',
  },
  {
    title: 'Manage Design Milestones',
    description:
      'Set schematic, DD, and CD milestones with owner approval gates. Upload deliverables directly to the project twin.',
  },
  {
    title: 'Coordinate Permit Submissions',
    description:
      'KeaBot Permit helps you prepare jurisdiction-specific submission packages, track review status, and manage resubmittals.',
  },
  {
    title: 'Support Construction',
    description:
      'Process RFIs and submittals, issue ASIs, and respond to contractor questions — all logged in the construction OS.',
  },
  {
    title: 'Conduct Site Observations',
    description:
      'Create field reports and punch lists from the mobile app during site visits. Issues are automatically assigned and tracked.',
  },
  {
    title: 'Close Out Design Services',
    description:
      'Issue final certificates, deliver as-built documents, and close out your contract — all in the project archive.',
  },
]

export default function DesignProfessionalsPage() {
  return (
    <>
      <RoleHero
        badge="For Architects & Design Professionals"
        badgeColor="#1A2B4A"
        headline='Design Coordination,<br /><span style="color:#2ABFBF">Finally Simplified</span>'
        subheadline="Manage the full design-to-construction workflow — from schematic design through punch list closeout — in a platform built for how architects and engineers actually work."
        primaryCTA={{ label: 'Request Access', href: '/contact' }}
        secondaryCTA={{ label: 'See the Platform', href: '/features' }}
        trustItems={['RFI & submittal tracking', 'Permit navigation AI', 'Site observation tools', 'Owner-contractor collaboration']}
        dark
      />
      <RoleBenefits
        eyebrow="Platform Features"
        headline="Everything a Design Professional Needs"
        subheadline="From pre-design through post-construction, Kealee gives architects and engineers the tools to coordinate, document, and deliver."
        benefits={BENEFITS}
      />
      <RoleWorkflow
        eyebrow="How It Works"
        headline="Design-to-Construction in 6 Phases"
        steps={WORKFLOW}
        accentColor="#1A2B4A"
      />
      <RoleFAQ
        items={[
          {
            question: 'What design professional types does Kealee support?',
            answer: 'Architects, structural engineers, MEP engineers, landscape architects, interior designers, and specialty consultants can all coordinate through the Kealee platform.',
          },
          {
            question: 'How does document version control work for design professionals?',
            answer: 'All drawing sets and specifications are versioned with full history. Every revision is stamped, tracked, and linked to the relevant RFI, submittal, or change order.',
          },
          {
            question: 'Can design professionals be matched to projects through Kealee?',
            answer: 'Yes. Register your firm and credentials on the platform. Kealee will match you to projects that fit your specialization, project size, and geography.',
          },
          {
            question: 'Does Kealee offer onsite services?',
            answer: 'No. All onsite construction activities must be performed by the contractor of record. Kealee provides coordination, document management, and advisory services only.',
          },
        ]}
      />
      <RoleCTA
        headline="Bring Clarity to Every Project"
        subheadline="Join the Kealee professional network and streamline your design-to-construction workflow."
        primaryCTA={{ label: 'Request Access', href: '/contact' }}
        secondaryCTA={{ label: 'View Demo', href: '/contact' }}
        accentColor="#2ABFBF"
      />
    </>
  )
}
