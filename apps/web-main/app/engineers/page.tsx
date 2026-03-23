import type { Metadata } from 'next'
import { RoleHero } from '@/components/roles/RoleHero'
import { RoleBenefits } from '@/components/roles/RoleBenefits'
import { RoleWorkflow } from '@/components/roles/RoleWorkflow'
import { RoleCTA } from '@/components/roles/RoleCTA'
import { RoleFAQ } from '@/components/roles/RoleFAQ'

export const metadata: Metadata = {
  title: 'For Engineers',
  description:
    'Structural, MEP, civil, and other engineering disciplines — coordinate with the full project team from design through construction.',
}

const BENEFITS = [
  {
    emoji: '🏗️',
    title: 'Structural Coordination',
    description:
      'Share structural drawings, respond to RFIs, and track field observations — all integrated with the architect and contractor.',
  },
  {
    emoji: '⚡',
    title: 'MEP Systems Coordination',
    description:
      'Mechanical, electrical, and plumbing drawings with version control, submittal routing, and clash resolution tracking.',
  },
  {
    emoji: '📐',
    title: 'Engineering Submittals',
    description:
      'Shop drawing review, product approval tracking, and resubmittal history with automated response deadlines.',
  },
  {
    emoji: '🔍',
    title: 'Site Observations',
    description:
      'Issue engineering field reports and non-conformance notices directly from the mobile app during site visits.',
  },
  {
    emoji: '📊',
    title: 'Calculations & Reports',
    description:
      'Upload and version-control engineering calculations, energy reports, and geotechnical data in the project document library.',
  },
  {
    emoji: '🤖',
    title: 'AI Engineering Assistance',
    description:
      'KeaBot surfaces relevant code sections, spec requirements, and coordination issues — reducing research time on every project.',
  },
]

const WORKFLOW = [
  {
    title: 'Receive Project Invitation',
    description:
      'The architect or owner invites you to the project. Your engineering workspace gives you access to relevant documents, RFIs, and the coordination log.',
  },
  {
    title: 'Submit Engineering Documents',
    description:
      'Upload calculations, drawings, and reports with version control. Notify the team when new documents are available.',
  },
  {
    title: 'Respond to RFIs',
    description:
      'Receive RFIs routed to your discipline automatically. Respond with drawings, calculations, or written clarifications — all time-stamped.',
  },
  {
    title: 'Review & Approve Submittals',
    description:
      'Shop drawings and product data are automatically routed to your discipline for review. Approve, reject, or request resubmittal with one click.',
  },
  {
    title: 'Conduct Site Observations',
    description:
      'Issue engineering field reports during site visits. Non-conformance notices are automatically assigned to the contractor for resolution.',
  },
  {
    title: 'Issue Final Certifications',
    description:
      'Complete engineering closeout documents, issue certifications, and archive as-built drawings in the project\'s digital twin.',
  },
]

export default function EngineersPage() {
  return (
    <>
      <RoleHero
        badge="For Engineers"
        badgeColor="#38A169"
        headline='Engineering Coordination<br /><span style="color:#2ABFBF">Without the Friction</span>'
        subheadline="Structural, MEP, civil, and geotechnical engineers on Kealee stay coordinated with architects and contractors through a single platform — from design review to construction closeout."
        primaryCTA={{ label: 'Apply as Engineer', href: '/engineer/register' }}
        secondaryCTA={{ label: 'Learn More', href: '/contact' }}
        trustItems={['RFI & submittal management', 'Multi-discipline coordination', 'Field observation tools', 'Version-controlled documents']}
        dark
      />
      <RoleBenefits
        eyebrow="Platform Capabilities"
        headline="Built for Every Engineering Discipline"
        subheadline="Whether you're structural, MEP, civil, or geotechnical — Kealee's coordination tools adapt to your workflow."
        benefits={BENEFITS}
      />
      <RoleWorkflow
        eyebrow="How It Works"
        headline="From Design Documents to Final Certification"
        steps={WORKFLOW}
        accentColor="#38A169"
      />
      <RoleFAQ
        items={[
          {
            question: 'What engineering disciplines does Kealee support?',
            answer: 'Structural, civil, MEP (mechanical, electrical, plumbing), geotechnical, and specialty engineering. All disciplines can coordinate on the same project through the Kealee platform.',
          },
          {
            question: 'How does Kealee manage RFIs and submittals for engineers?',
            answer: 'RFIs and submittals are tracked with full version control, routing, and response deadlines — linked directly to the relevant drawing or specification section.',
          },
          {
            question: 'Does Kealee offer onsite services?',
            answer: 'No. All onsite construction activities must be performed by the contractor of record. Kealee provides coordination, platform tools, and advisory services only.',
          },
          {
            question: 'Can engineers apply to join the Kealee professional network?',
            answer: 'Yes. Licensed engineers can apply to join the Kealee network and be matched to projects requiring their specialty. Submit your application via the Engineer Register page.',
          },
        ]}
      />
      <RoleCTA
        headline="Join the Kealee Engineering Network"
        subheadline="Engineers on Kealee spend less time on coordination overhead and more time on engineering."
        primaryCTA={{ label: 'Apply Now', href: '/engineer/register' }}
        secondaryCTA={{ label: 'Contact Us', href: '/contact' }}
        accentColor="#38A169"
      />
    </>
  )
}
