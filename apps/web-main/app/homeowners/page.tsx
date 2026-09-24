import type { Metadata } from 'next'
import {
  CONCEPT_FROM,
  CONCEPT_WHOLE_HOME_FROM,
  DRAWINGS_FROM,
  ESTIMATE_FROM,
  PERMIT_ASSESSMENT_FROM,
  PERMIT_FILING_FROM,
  PERMIT_MANAGED_FROM,
  PM_ADVISORY_FROM,
  PM_OVERSIGHT_FROM,
} from '@/lib/marketing/price-copy'
import { RoleHero } from '@/components/roles/RoleHero'
import { RoleBenefits } from '@/components/roles/RoleBenefits'
import { RoleWorkflow } from '@/components/roles/RoleWorkflow'
import { RoleCTA } from '@/components/roles/RoleCTA'
import { RoleFAQ } from '@/components/roles/RoleFAQ'

export const metadata: Metadata = {
  title: 'For Project Owners & Professionals — Kealee',
  description:
    'Plan, price, permit, and control your renovation or new build. Transparent pricing at every step — pay only for what your project needs.',
}

const BENEFITS = [
  {
    icon: '📋',
    title: 'Full Project Visibility',
    desc: 'See every milestone, payment, and inspection in real time. No more chasing updates from your contractor.',
  },
  {
    icon: '💳',
    title: 'Escrow-Protected Payments',
    desc: "Funds are held securely until each milestone is verified complete. You never pay for work that hasn't been done.",
  },
  {
    icon: '🤖',
    title: 'KeaBot Owner Assistant',
    desc: 'Your dedicated AI advisor answers questions about budget, schedule, and decisions — 24/7 on any device.',
  },
  {
    icon: '🔨',
    title: 'Vetted Contractor Network',
    desc: 'Every contractor is licensed, insured, background-checked, and reputation-scored before entering the Kealee network.',
  },
  {
    icon: '📊',
    title: 'Budget Tracking',
    desc: 'Track spending vs. budget with automatic variance alerts. Know exactly where every dollar is going.',
  },
  {
    icon: '✅',
    title: 'Inspection Coordination',
    desc: 'Schedule and track code inspections automatically. Punch lists ensure nothing slips through the cracks.',
  },
]

const WORKFLOW = [
  {
    number: 1,
    title: 'Get Your Concept + Validation',
    desc: `From ${CONCEPT_FROM}, get a structured, property-specific Concept Design Package with three directions, six views, a floor plan, zoning, permit guidance, and a basic planning estimate. One revision is included; video, consultation, extra views, CAD, and extra revisions are add-ons.`,
  },
  {
    number: 2,
    title: 'Handle Your Permits',
    desc: `Move into permit-set building plans with a detailed construction estimate included, then add assessment, filing, or managed coordination as required.`,
  },
  {
    number: 3,
    title: 'Get Matched to Contractors',
    desc: 'AI matching surfaces verified contractors in your area with the right trade, license, and capacity for your project.',
  },
  {
    number: 4,
    title: 'Review Bids & Sign Contracts',
    desc: 'Compare AI-analyzed bids side by side. Add PM Advisory ($950) or PM Oversight ($2,950) for professional oversight.',
  },
  {
    number: 5,
    title: 'Track Every Milestone',
    desc: 'Escrow-protected payments release only when you approve each milestone. Full project visibility from day one.',
  },
]

// Revisions are an add-on, not a tier: one round comes with every package and
// more are priced individually at checkout.
const REVISION_OPTIONS = [
  { tier: 'Included', price: '1 round', note: 'Every concept package includes one revision round.', highlight: true },
  { tier: 'Additional rounds', price: 'Add-on', note: 'Add as many rounds as you want at checkout — each is priced before you pay.' },
  { tier: 'Professional review', price: 'Scoped', note: 'A licensed professional review or stamp is scoped by discipline and jurisdiction.' },
]

const PRICING = [
  {
    section: 'Plan Your Project',
    items: [
      { name: 'Design Concept Package', price: `From ${CONCEPT_FROM}`, note: 'Three concept directions with a recommendation, floor plan, views, materials, zoning and permit scope. One revision round included; extra views, video and revisions are optional add-ons.', highlight: true },
      { name: 'Permit-Ready Drawings', price: `From ${DRAWINGS_FROM}`, note: 'Prepared by the licensed professional the jurisdiction requires, with a detailed construction estimate included. Final fee set after review.' },
    ],
    note: 'Projects over $65,000 or with structural complexity are connected with a licensed architect.',
  },
  {
    section: 'Estimating Included With Plans',
    items: [
      { name: 'Basic Planning Estimate', price: 'Included', note: 'Included with every design concept and preliminary site plan' },
      { name: 'Detailed Construction Estimate', price: 'Included', note: 'Included with permit-set building plans and full detailed site plans' },
    ],
  },
  {
    section: 'Permit Your Project',
    items: [
      { name: 'Permit Guidance', price: 'Free', note: 'AI checklist + jurisdiction info' },
      { name: 'Permit Assessment', price: `From ${PERMIT_ASSESSMENT_FROM}`, note: 'Which permits this scope needs, fees, timeline and the AHJ checklist' },
      { name: 'Permit Preparation and Filing', price: `From ${PERMIT_FILING_FROM}`, note: 'Application prepared, submitted and comment responses handled', highlight: true },
      { name: 'Managed Permit Coordination', price: `From ${PERMIT_MANAGED_FROM}`, note: 'End-to-end coordination through to issuance' },
    ],
  },
  {
    section: 'Control Your Project',
    items: [
      { name: 'Self-Managed', price: 'Free', note: 'Platform tools included' },
      { name: 'PM Advisory', price: `From ${PM_ADVISORY_FROM}/mo`, note: 'Milestone reviews + budget oversight', highlight: true },
      { name: 'Active Project Oversight', price: `From ${PM_OVERSIGHT_FROM}/mo`, note: 'Site oversight, draw and change-order review through closeout' },
    ],
    note: 'Monthly while the engagement is active — cancel any time.',
  },
]

export default function HomeownersPage() {
  return (
    <>
      <RoleHero
        badge="For Project Owners & Professionals"
        headline="Build with Confidence"
        highlight="Confidence"
        subhead="Plan, price, permit, and control your project. Transparent pricing at every step — pay only for what your project needs."
        cta={{ label: `Start from ${CONCEPT_FROM}`, href: '/intake/whole_home_concept' }}
        secondaryCta={{ label: 'Browse Contractors', href: '/marketplace' }}
        trustItems={['No surprise invoices', 'Escrow-protected payments', 'Licensed & insured contractors', 'AI advisor included']}
        dark
      />

      {/* Pricing Section */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold" style={{ color: '#1A2B4A' }}>
            Transparent pricing at every step
          </h2>
          <p className="mt-3 text-gray-500">Pay only for what your project needs. No required subscription for project owners.</p>
        </div>

        <div className="space-y-12">
          {PRICING.map(section => (
            <div key={section.section}>
              <h3 className="mb-4 text-lg font-bold" style={{ color: '#1A2B4A' }}>{section.section}</h3>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                {section.items.map((item, i) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between px-5 py-4"
                    style={{
                      backgroundColor: item.highlight ? 'rgba(42,191,191,0.04)' : i % 2 === 0 ? 'white' : '#FAFAFA',
                      borderBottom: i < section.items.length - 1 ? '1px solid #F3F4F6' : undefined,
                    }}
                  >
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>
                        {item.name}
                        {item.highlight && (
                          <span className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{ backgroundColor: 'rgba(42,191,191,0.1)', color: '#2ABFBF' }}>
                            Popular
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">{item.note}</p>
                    </div>
                    <span className="ml-4 flex-shrink-0 text-sm font-bold" style={{ color: '#E8793A' }}>
                      {item.price}
                    </span>
                  </div>
                ))}
              </div>
              {section.note && (
                <p className="mt-2 text-xs text-gray-400">{section.note}</p>
              )}
            </div>
          ))}
        </div>

        {/* Revision options */}
        <div className="mt-10">
          <h3 className="mb-4 text-lg font-bold" style={{ color: '#1A2B4A' }}>Design Revision Rounds by Package</h3>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            {REVISION_OPTIONS.map((r, i) => (
              <div
                key={r.tier}
                className="flex items-center justify-between px-5 py-4"
                style={{
                  backgroundColor: r.highlight ? 'rgba(42,191,191,0.04)' : i % 2 === 0 ? 'white' : '#FAFAFA',
                  borderBottom: i < REVISION_OPTIONS.length - 1 ? '1px solid #F3F4F6' : undefined,
                }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>{r.tier}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{r.note}</p>
                </div>
                <span className="ml-4 flex-shrink-0 text-sm font-bold" style={{ color: '#E8793A' }}>{r.price}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-400">Any additional revision or professional review is priced clearly before purchase.</p>
        </div>

        {/* Onsite services disclaimer */}
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#1A2B4A' }}>Important — Onsite Services</p>
          <p className="mt-2 text-sm text-gray-600">
            All services requiring onsite support (inspections, site visits, construction oversight) must be performed by your contractor of record.
            Kealee is a platform and advisory service — we do not offer direct onsite services at this time.
          </p>
        </div>

        {/* Typical path callout */}
        <div className="mt-10 rounded-2xl p-8" style={{ backgroundColor: 'rgba(26,43,74,0.03)' }}>
          <p className="text-center text-sm font-medium text-gray-600">
            Typical fully-managed project:
            <span className="ml-2 font-bold" style={{ color: '#1A2B4A' }}>
              {CONCEPT_WHOLE_HOME_FROM} + {ESTIMATE_FROM} + {PERMIT_FILING_FROM} + {PM_OVERSIGHT_FROM}/mo
            </span>
          </p>
          <p className="mt-2 text-center text-xs text-gray-400">
            Whole-home concept · Detailed estimate · Permit filing · Active oversight. Each is quoted from your project at intake.
          </p>
        </div>
      </section>

      {/* Garden & Farming callout */}
      <section className="mx-auto max-w-5xl px-4 pb-4">
        <div
          className="flex flex-col gap-5 rounded-2xl border-2 p-7 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: '#38A169', backgroundColor: 'rgba(56,161,105,0.04)' }}
        >
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-xl"
              style={{ backgroundColor: 'rgba(56,161,105,0.12)' }}
            >
              🌱
            </div>
            <div>
              <p className="text-base font-bold" style={{ color: '#1A2B4A' }}>
                Growing a garden or food garden?
              </p>
              <p className="mt-1 text-sm text-gray-600">
                AI garden design, raised beds, backyard farming, irrigation, and greenhouse build — all under one roof.
                From $395 · Contractor matching included.
              </p>
            </div>
          </div>
          <a
            href="/homeowners/garden-farming"
            className="flex-shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: '#38A169' }}
          >
            Explore Garden + Farming →
          </a>
        </div>
      </section>

      <RoleBenefits
        badge="What You Get"
        headline="Everything You Need to Build Smarter"
        subhead="From finding the right contractor to final walkthrough — Kealee handles the complexity so you can focus on the outcome."
        benefits={BENEFITS}
      />
      <RoleWorkflow
        headline="From Idea to Completion in 6 Steps"
        steps={WORKFLOW}
        accent="#2ABFBF"
      />
      <RoleFAQ
        items={[
          {
            question: 'What is included in the Design Concept Package?',
            answer: '3 property-specific concept visuals, design direction summary, layout and flow recommendations, property analysis, path-to-approval plan, rough scope direction, a downloadable digital package, and an included design consultation call. 1 round of feedback is included.',
          },
          {
            question: 'Can I request more design revisions?',
            answer: 'The package includes one revision round. Additional rounds are an optional add-on you can choose at checkout, priced before you pay.',
          },
          {
            question: 'Does Kealee provide onsite services?',
            answer: 'No. All services requiring onsite support — such as inspections, site visits, and construction oversight — must be performed by your contractor of record. Kealee is a platform and advisory service and does not offer direct onsite services.',
          },
          {
            question: 'How are project-owner fees structured?',
            answer: 'Project-owner service fees are one-time per project. There is no required monthly subscription. You pay only for the services your project needs.',
          },
          {
            question: 'How does contractor matching work?',
            answer: "Kealee's AI matches you with licensed, insured, background-checked contractors based on your trade type, geography, project scope, and budget. You review bids and select your contractor on the platform.",
          },
          {
            question: 'What are escrow-protected payments?',
            answer: 'Funds are held securely in escrow and released only when you verify each milestone is complete. You never pay for work that has not been done.',
          },
        ]}
      />
      <RoleCTA
        headline="Ready to Start Your Project?"
        subhead="Join project owners and professionals who plan and build smarter with Kealee's AI-assisted platform."
        cta={{ label: 'Get My Concept Package', href: '/intake/whole_home_concept' }}
        secondaryCta={{ label: 'Browse Contractors', href: '/marketplace' }}
      />
    </>
  )
}
