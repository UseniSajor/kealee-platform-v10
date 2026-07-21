import type { Metadata } from 'next'
import { RoleHero } from '@/components/roles/RoleHero'
import { RoleBenefits } from '@/components/roles/RoleBenefits'
import { RoleWorkflow } from '@/components/roles/RoleWorkflow'
import { RoleCTA } from '@/components/roles/RoleCTA'
import { RoleFAQ } from '@/components/roles/RoleFAQ'

export const metadata: Metadata = {
  title: 'For Government & Public Agencies',
  description:
    'Municipal dashboards, permit automation, affordable housing compliance, and public works project management — built for government agencies.',
}

const BENEFITS = [
  {
    emoji: '🏛️',
    title: 'Municipal Project Dashboard',
    description:
      'Aggregate view of all active public works projects, budget vs. actuals, milestones, and contractor performance — in real time.',
  },
  {
    emoji: '📋',
    title: 'Permit Automation',
    description:
      'AI-assisted permit intake, plan review routing, and status tracking reduces review times and improves applicant experience.',
  },
  {
    emoji: '🏠',
    title: 'Affordable Housing Compliance',
    description:
      'Track AMI compliance, inclusionary zoning requirements, and Housing Act alignment across your housing pipeline.',
  },
  {
    emoji: '💰',
    title: 'Grant & Fund Tracking',
    description:
      'Manage CDBG, HOME, HUD, and infrastructure grant compliance with draw tracking and reporting built for federal requirements.',
  },
  {
    emoji: '🔍',
    title: 'Contractor Accountability',
    description:
      'MBE/WBE utilization tracking, apprenticeship compliance, certified payroll, and performance scoring for all public contracts.',
  },
  {
    emoji: '📊',
    title: 'Community Impact Reporting',
    description:
      'Auto-generate community benefit reports, job creation metrics, and housing delivery statistics for elected officials and the public.',
  },
]

const WORKFLOW = [
  {
    title: 'Onboard Your Agency',
    description:
      'Configure your jurisdiction, project types, and compliance requirements. Import existing projects from your legacy systems.',
  },
  {
    title: 'Manage the Project Pipeline',
    description:
      'Track all active public works and housing projects from procurement through closeout with a unified municipal dashboard.',
  },
  {
    title: 'Automate Permit Intake',
    description:
      'KeaBot Permit handles permit intake, routes for review, sends status updates, and tracks resubmittals — cutting staff time by hours per application.',
  },
  {
    title: 'Monitor Contractor Compliance',
    description:
      'Certified payroll, MBE/WBE reporting, and apprenticeship hours tracked automatically and flagged when thresholds are missed.',
  },
  {
    title: 'Track Federal Compliance',
    description:
      'CDBG, HOME, and HUD draw schedules with automated eligibility checks and reporting templates built for federal timelines.',
  },
  {
    title: 'Report to Stakeholders',
    description:
      'Publish community dashboards, generate council reports, and deliver federal compliance documentation — all from one system.',
  },
]

export default function GovernmentPage() {
  return (
    <>
      <RoleHero
        badge="For Government & Public Agencies"
        badgeColor="#38A169"
        headline='Public Works, Managed<br /><span style="color:#2ABFBF">with Precision</span>'
        subheadline="Kealee gives government agencies and housing authorities the tools to manage public projects, automate permit workflows, and meet federal compliance requirements — from a single platform."
        primaryCTA={{ label: 'Request a Demo', href: '/contact' }}
        secondaryCTA={{ label: 'Download Overview', href: '/contact' }}
        trustItems={['HUD & CDBG compliance', 'MBE/WBE tracking', 'Permit automation', 'Community impact reporting']}
        dark
      />
      <RoleBenefits
        eyebrow="Platform Capabilities"
        headline="Built for the Public Sector"
        subheadline="Kealee's government module aligns with Housing Act priorities: reducing barriers, speeding approvals, and strengthening public finance accountability."
        benefits={BENEFITS}
      />
      <RoleWorkflow
        eyebrow="Implementation Path"
        headline="From Onboarding to Community Impact"
        steps={WORKFLOW}
        accentColor="#38A169"
      />
      <RoleFAQ
        items={[
          {
            question: 'What government agency types use Kealee?',
            answer: 'Municipal permit offices, housing authorities, redevelopment agencies, and public works departments use Kealee for permit tracking, project oversight, and affordable housing program coordination.',
          },
          {
            question: 'Does Kealee support affordable housing programs?',
            answer: 'Yes. Kealee supports LIHTC, CDBG, HOME, and other housing finance programs with compliance tracking, draw coordination, and investor-ready reporting.',
          },
          {
            question: 'How does Kealee integrate with existing permit systems?',
            answer: 'Kealee can be configured to connect with existing AHJ permit management systems via API. Contact our government solutions team for integration details.',
          },
          {
            question: 'Does Kealee offer onsite inspection services?',
            answer: 'No. All onsite inspections must be performed by licensed public inspectors or the contractor of record. Kealee provides tracking, coordination, and reporting tools only.',
          },
        ]}
      />
      <RoleCTA
        headline="Modernize Your Public Works Program"
        subheadline="Join the municipalities and housing authorities using Kealee to deliver better outcomes for their communities."
        primaryCTA={{ label: 'Request a Demo', href: '/contact' }}
        secondaryCTA={{ label: 'Contact Our Team', href: '/contact' }}
        accentColor="#38A169"
      />
    </>
  )
}
