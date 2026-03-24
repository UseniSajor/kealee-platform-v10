import type { Metadata } from 'next'
import { RoleHero } from '@/components/roles/RoleHero'
import { RoleBenefits } from '@/components/roles/RoleBenefits'
import { RoleWorkflow } from '@/components/roles/RoleWorkflow'
import { RoleCTA } from '@/components/roles/RoleCTA'
import { RoleFAQ } from '@/components/roles/RoleFAQ'

export const metadata: Metadata = {
  title: 'For Property Managers — Kealee',
  description:
    'Manage capital improvement projects, maintenance upgrades, and tenant improvement work across your portfolio. AI-powered oversight, contractor matching, and escrow payments.',
}

const BENEFITS = [
  {
    icon: '🏢',
    title: 'Portfolio-Wide Visibility',
    desc: 'Track every capital project, maintenance upgrade, and tenant improvement across your entire portfolio from a single dashboard.',
  },
  {
    icon: '🤖',
    title: 'AI Project Scoping',
    desc: 'KeaBot instantly generates scopes, estimates, and permit requirements for any improvement project — saving hours of prep time.',
  },
  {
    icon: '🔨',
    title: 'Vetted Contractor Network',
    desc: 'Every contractor is licensed, insured, background-checked, and scored. AI matching finds the right trade for each job.',
  },
  {
    icon: '💳',
    title: 'Escrow-Protected Payments',
    desc: 'Funds release only when milestones are verified. Protect your client\'s capital on every project, every time.',
  },
  {
    icon: '📊',
    title: 'Budget & Variance Tracking',
    desc: 'Real-time budget vs. actual across all active projects. Variance alerts before costs get out of hand.',
  },
  {
    icon: '📋',
    title: 'Permit & Compliance Coordination',
    desc: 'Track permit status, inspection requirements, and compliance deadlines automatically — across all jurisdictions.',
  },
]

const WORKFLOW = [
  {
    number: 1,
    title: 'Submit Your Improvement Project',
    desc: 'Use our intake to describe the scope — whether it\'s a unit renovation, HVAC replacement, roof repair, or full building improvement.',
  },
  {
    number: 2,
    title: 'AI Scoping + Estimate',
    desc: 'Kealee generates a property-specific scope, cost estimate, and permit requirements in minutes — not days.',
  },
  {
    number: 3,
    title: 'Contractor Matching',
    desc: 'AI matches you with vetted contractors who have the right trade, license, and capacity for your project type.',
  },
  {
    number: 4,
    title: 'Review Bids + Award Contract',
    desc: 'Compare AI-analyzed bids side by side. Digital contracts are signed and escrow is funded on the platform.',
  },
  {
    number: 5,
    title: 'Milestone Oversight',
    desc: 'Track progress by milestone. Payments release only when verified. Punch lists ensure quality at every phase.',
  },
  {
    number: 6,
    title: 'Close Out + Document',
    desc: 'Lien waivers, closeout documents, and warranty records are stored in the platform and exportable for your owners.',
  },
]

const SERVICES = [
  { name: 'Capital Improvement Planning',         note: 'AI-assisted 5-year CIP modeling and prioritization' },
  { name: 'Unit Renovation Coordination',          note: 'Turnover, TI, and full gut renovation management' },
  { name: 'HVAC / Mechanical Upgrades',           note: 'Scope, match, permit, and oversee system replacements' },
  { name: 'Exterior & Envelope Improvements',     note: 'Roof, siding, windows, parking, and common area upgrades' },
  { name: 'Permit Coordination',                  note: 'Filing, tracking, inspection, and compliance across jurisdictions' },
  { name: 'Vendor & Contractor Management',       note: 'Pre-vetted contractor pool with escrow-backed payment control' },
  { name: 'Commercial IT & Infrastructure',       note: 'Managed network, security, AV, and building tech upgrades' },
]

export default function PropertyManagersPage() {
  return (
    <>
      <RoleHero
        badge="For Property Managers"
        headline="Manage Every Improvement Project with Confidence"
        highlight="with Confidence"
        subhead="Capital improvements, tenant work, maintenance upgrades, and building renovations — all coordinated through one platform. AI scoping, vetted contractors, escrow-protected payments."
        cta={{ label: 'Start a Project', href: '/intake' }}
        secondaryCta={{ label: 'Talk to Our Team', href: '/contact' }}
        trustItems={['Portfolio-wide visibility', 'Escrow-protected payments', 'Vetted contractor network', 'AI scoping included']}
        dark
      />

      {/* Services */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold" style={{ color: '#1A2B4A' }}>What we handle for property managers</h2>
            <p className="mt-3 text-gray-500">From single-unit renovations to building-wide capital improvements.</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            {SERVICES.map((s, i) => (
              <div
                key={s.name}
                className="flex items-center justify-between px-5 py-4"
                style={{
                  backgroundColor: i % 2 === 0 ? 'white' : '#FAFAFA',
                  borderBottom: i < SERVICES.length - 1 ? '1px solid #F3F4F6' : undefined,
                }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>{s.name}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{s.note}</p>
                </div>
                <span className="ml-4 flex-shrink-0 rounded-full px-2 py-1 text-xs font-medium" style={{ backgroundColor: 'rgba(42,191,191,0.08)', color: '#2ABFBF' }}>
                  Available
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-400">
            All services requiring onsite support are performed by your contractor of record. Kealee provides advisory, coordination, and platform services only.
          </p>
        </div>
      </section>

      <RoleBenefits
        badge="Platform Benefits"
        headline="Built for Property Management Operations"
        subhead="Every feature is designed around how property managers actually work — across properties, with multiple contractors, under budget pressure."
        benefits={BENEFITS}
      />

      <RoleWorkflow
        headline="From Request to Closeout in 6 Steps"
        steps={WORKFLOW}
        accent="#2ABFBF"
      />

      <RoleFAQ
        items={[
          {
            question: 'Can I manage multiple properties and projects at once?',
            answer: 'Yes. The Kealee dashboard supports portfolio-wide visibility across all active projects, properties, and contractors. Upgrade to Ops OS for enterprise-scale management with full reporting.',
          },
          {
            question: 'Does Kealee handle commercial IT and infrastructure upgrades?',
            answer: 'Yes. Commercial IT infrastructure (managed networks, security systems, AV, and building technology upgrades) is available under property manager and developer services.',
          },
          {
            question: 'Does Kealee provide onsite services?',
            answer: 'No. All onsite services must be performed by your licensed contractor of record. Kealee provides platform coordination, advisory, and contractor matching services only.',
          },
          {
            question: 'How does escrow-protected payment work for my clients?',
            answer: "Funds are held in escrow and released only when you verify each milestone is complete. Your clients' capital is never released without your approval.",
          },
          {
            question: 'What contractor types are in the Kealee network?',
            answer: 'General contractors, specialty trades (electrical, plumbing, HVAC, roofing, structural), IT/tech installers, and commercial renovation specialists — all licensed, insured, and background-checked.',
          },
        ]}
      />

      <RoleCTA
        headline="Ready to Streamline Your Portfolio Projects?"
        subhead="From single renovations to building-wide capital programs — Kealee has you covered."
        cta={{ label: 'Start a Project', href: '/intake' }}
        secondaryCta={{ label: 'Talk to Our Team', href: '/contact' }}
      />
    </>
  )
}
