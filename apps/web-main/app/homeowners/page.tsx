import type { Metadata } from 'next'
import { RoleHero } from '@/components/roles/RoleHero'
import { RoleBenefits } from '@/components/roles/RoleBenefits'
import { RoleWorkflow } from '@/components/roles/RoleWorkflow'
import { RoleCTA } from '@/components/roles/RoleCTA'
import { RoleFAQ } from '@/components/roles/RoleFAQ'

export const metadata: Metadata = {
  title: 'For Homeowners — Kealee',
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
    desc: 'For $585, get a structured, property-specific AI Concept Design Package — 3 concept options, 1 round of feedback, design direction, zoning brief, path-to-approval plan, and an included design consultation. Additional revision rounds available as a paid add-on (Unlimited Package includes unlimited rounds).',
  },
  {
    number: 2,
    title: 'Price Your Project',
    desc: 'AI cost estimate included with all projects. Upgrade to a Detailed Estimate ($595) or Certified Estimate ($1,850) for lender-ready reports.',
  },
  {
    number: 3,
    title: 'Handle Your Permits',
    desc: 'Permit guidance is free. Let us file ($149), package ($950), coordinate ($2,750), or expedite ($5,500) for you.',
  },
  {
    number: 4,
    title: 'Get Matched to Contractors',
    desc: 'AI matching surfaces verified contractors in your area with the right trade, license, and capacity for your project.',
  },
  {
    number: 5,
    title: 'Review Bids & Sign Contracts',
    desc: 'Compare AI-analyzed bids side by side. Add PM Advisory ($950) or PM Oversight ($2,950) for professional oversight.',
  },
  {
    number: 6,
    title: 'Track Every Milestone',
    desc: 'Escrow-protected payments release only when you approve each milestone. Full project visibility from day one.',
  },
]

const REVISION_TIERS = [
  { tier: 'Starter', price: 'No revisions', note: 'Concept package is final as delivered. Additional rounds available as add-on.' },
  { tier: 'Standard (Advanced AI)', price: 'Up to 3 rounds', note: 'Three revision rounds included. Upgrade to Full Design Package to unlock Premium tier.', highlight: true },
  { tier: 'Premium (Full Design)', price: 'Up to 5 rounds', note: 'Five revision rounds. Requires Full Design Package ($4,499) minimum tier to access.' },
]

const PRICING = [
  {
    section: 'Plan Your Project',
    items: [
      { name: 'AI Concept Design Package', price: '$585', note: '3 concept options, 1 round of feedback. Design direction, zoning brief, path-to-approval + consultation included.', highlight: true },
      { name: 'Advanced AI Concept', price: '$899', note: '3 floor plan options, 3D views, material suggestions — up to 3 revision rounds' },
      { name: 'Full Design Package', price: '$4,499', note: 'Permit-ready drawing set — up to 5 revision rounds' },
    ],
    note: 'Projects over $65,000 or with structural complexity are connected with a licensed architect.',
  },
  {
    section: 'Price Your Project',
    items: [
      { name: 'AI Estimate', price: 'Free', note: 'Included with all projects' },
      { name: 'Detailed Estimate', price: '$595', note: 'Professional cost analyst review' },
      { name: 'Certified Estimate', price: '$1,850', note: 'Lender-ready certified report' },
    ],
  },
  {
    section: 'Permit Your Project',
    items: [
      { name: 'Permit Guidance', price: 'Free', note: 'AI checklist + jurisdiction info' },
      { name: 'Simple Permit Filing', price: '$149', note: 'Single-trade permits' },
      { name: 'Permit Package', price: '$950', note: 'Full application prep + submission', highlight: true },
      { name: 'Permit Coordination', price: '$2,750', note: 'Submission, tracking + comment response' },
      { name: 'Permit Expediting', price: '$5,500', note: 'Priority approval service' },
    ],
  },
  {
    section: 'Control Your Project',
    items: [
      { name: 'Self-Managed', price: 'Free', note: 'Platform tools included' },
      { name: 'PM Advisory', price: '$950', note: 'Milestone reviews + budget oversight', highlight: true },
      { name: 'PM Oversight', price: '$2,950', note: 'Full PM from groundbreaking to closeout' },
    ],
    note: 'One-time per project fee — not a subscription.',
  },
]

export default function HomeownersPage() {
  return (
    <>
      <RoleHero
        badge="For Homeowners & Renovation Projects"
        headline="Build with Confidence"
        highlight="Confidence"
        subhead="Plan, price, permit, and control your project. Transparent pricing at every step — pay only for what your project needs."
        cta={{ label: 'Start with $585 AI Concept Package', href: '/homeowners/start' }}
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
          <p className="mt-3 text-gray-500">Pay only for what your project needs. No subscriptions for homeowners.</p>
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

        {/* Revision Tiers */}
        <div className="mt-10">
          <h3 className="mb-4 text-lg font-bold" style={{ color: '#1A2B4A' }}>Design Revision Rounds by Package</h3>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            {REVISION_TIERS.map((r, i) => (
              <div
                key={r.tier}
                className="flex items-center justify-between px-5 py-4"
                style={{
                  backgroundColor: r.highlight ? 'rgba(42,191,191,0.04)' : i % 2 === 0 ? 'white' : '#FAFAFA',
                  borderBottom: i < REVISION_TIERS.length - 1 ? '1px solid #F3F4F6' : undefined,
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
          <p className="mt-2 text-xs text-gray-400">Premium revision credit only applies when upgrading to Full Design Package tier or higher.</p>
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
              $585 + $595 + $950 + $2,950 = $5,080
            </span>
          </p>
          <p className="mt-2 text-center text-xs text-gray-400">
            Concept + Validation · Detailed Estimate · Permit Package · PM Oversight
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
            question: 'What is included in the $585 AI Concept Design Package?',
            answer: '3 property-specific concept visuals, design direction summary, layout and flow recommendations, property analysis, path-to-approval plan, rough scope direction, a downloadable digital package, and an included design consultation call. 1 round of feedback is included.',
          },
          {
            question: 'Can I request more design revisions?',
            answer: 'The Starter package ($585) includes 1 round of feedback. Additional revision rounds are available as a paid add-on. Upgrading to Advanced AI Concept ($899) includes up to 3 rounds. The Full Design Package ($4,499) includes up to 5 rounds.',
          },
          {
            question: 'Does Kealee provide onsite services?',
            answer: 'No. All services requiring onsite support — such as inspections, site visits, and construction oversight — must be performed by your contractor of record. Kealee is a platform and advisory service and does not offer direct onsite services.',
          },
          {
            question: 'How are homeowner fees structured?',
            answer: 'All homeowner project fees are one-time per project. There are no monthly subscriptions for homeowners. You pay only for the services your project needs.',
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
        subhead="Join thousands of homeowners who have built smarter with Kealee's AI-powered platform."
        cta={{ label: 'Get My $585 Concept Package', href: '/homeowners/start' }}
        secondaryCta={{ label: 'Browse Contractors', href: '/marketplace' }}
      />
    </>
  )
}
