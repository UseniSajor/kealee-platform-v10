import type { Metadata } from 'next'
import { RoleHero } from '@/components/roles/RoleHero'
import { RoleBenefits } from '@/components/roles/RoleBenefits'
import { RoleWorkflow } from '@/components/roles/RoleWorkflow'
import { RoleCTA } from '@/components/roles/RoleCTA'
import { RoleFAQ } from '@/components/roles/RoleFAQ'

export const metadata: Metadata = {
  title: 'Commercial Projects — Kealee',
  description:
    'Commercial construction, tenant improvements, mixed-use development, and capital projects. AI-powered scoping, feasibility, permitting, contractor matching, and project oversight.',
}

const COMMERCIAL_PROJECT_TYPES = [
  { category: 'Office & Professional', types: ['Office TI', 'Medical office build-out', 'Co-working space', 'Professional suite renovation'] },
  { category: 'Retail & Hospitality', types: ['Restaurant & food service build-out', 'Retail fit-out', 'Hotel/motel renovation', 'Bar & entertainment venue'] },
  { category: 'Industrial & Warehouse', types: ['Warehouse conversion', 'Distribution center fit-out', 'Manufacturing facility upgrade', 'Cold storage build-out'] },
  { category: 'Mixed-Use Development', types: ['Ground-floor retail + residential above', 'Live/work units', 'Mixed-use new construction', 'Adaptive reuse'] },
  { category: 'Multifamily', types: ['Apartment complex renovation', 'Condo conversion', 'Affordable housing development', 'Senior living fit-out'] },
  { category: 'Infrastructure & IT', types: ['Commercial IT infrastructure', 'Managed network installation', 'Security & access systems', 'Building technology (AV, BMS, EV charging)'] },
]

const BENEFITS = [
  {
    icon: '📐',
    title: 'AI Concept + Feasibility',
    desc: 'AI-generated commercial concept packages with pro forma modeling, IRR analysis, and go/no-go recommendations — delivered in days.',
  },
  {
    icon: '📋',
    title: 'Permit & Entitlement Support',
    desc: 'Commercial permitting, zoning variances, and entitlement coordination across all jurisdictions. From simple TI to complex regulatory approvals.',
  },
  {
    icon: '🔨',
    title: 'Vetted Commercial Contractors',
    desc: 'Commercial GCs, specialty trades, and tenant improvement specialists — all licensed, insured, and performance-scored.',
  },
  {
    icon: '💰',
    title: 'Capital Stack Modeling',
    desc: 'Debt/equity structure, draw schedules, waterfall projections, and investor-ready financial models for any deal size.',
  },
  {
    icon: '📊',
    title: 'Project Dashboard Tracking',
    desc: 'Live dashboard of every commercial project — milestone status, payment progress, change orders, and inspection records in one place.',
  },
  {
    icon: '🏗️',
    title: 'Construction OS',
    desc: 'Full operations system for commercial GCs and developers — schedule, RFIs, submittals, change orders, and lender draw coordination.',
  },
]

const WORKFLOW = [
  {
    number: 1,
    title: 'Submit Your Commercial Project',
    desc: 'Describe your project type, scope, location, and goals. Our intake handles TI, ground-up, renovation, and development projects.',
  },
  {
    number: 2,
    title: 'AI Concept + Feasibility Package',
    desc: 'Receive a commercial concept package with design direction, space planning options, zoning brief, and a preliminary pro forma.',
  },
  {
    number: 3,
    title: 'Permitting & Entitlement Coordination',
    desc: 'Our team handles permit applications, AHJ coordination, variance requests, and inspection tracking across all required agencies.',
  },
  {
    number: 4,
    title: 'Commercial Contractor Matching',
    desc: 'AI matches you with the right commercial GC or specialty contractor — vetted, licensed, and sized for your project.',
  },
  {
    number: 5,
    title: 'Construction + Lender Draw Management',
    desc: 'Escrow-protected draw schedule tied to verified milestones. Change orders, RFIs, and lender reports handled on the platform.',
  },
  {
    number: 6,
    title: 'Closeout + Portfolio Management',
    desc: 'Final walkthrough, punch list completion, lien waiver collection, and certificate of occupancy support. All documents stored and exportable.',
  },
]

export default function CommercialPage() {
  return (
    <>
      <RoleHero
        badge="Commercial Projects"
        headline="Commercial Construction, Simplified"
        highlight="Simplified"
        subhead="Office, retail, industrial, mixed-use, multifamily, and IT infrastructure — AI-powered scoping, permitting, contractor matching, and full lifecycle management. Built for developers, investors, and property managers."
        cta={{ label: 'Start a Commercial Project', href: '/intake' }}
        secondaryCta={{ label: 'Schedule a Consultation', href: '/contact' }}
        trustItems={['AI feasibility + pro forma', 'Commercial GC matching', 'Permit coordination', 'Lender draw management']}
        dark
      />

      {/* Project Types */}
      <section className="py-20" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold" style={{ color: '#1A2B4A' }}>Commercial project types we support</h2>
            <p className="mt-3 text-gray-500">From tenant improvements to ground-up development — all project types, all industries.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {COMMERCIAL_PROJECT_TYPES.map(cat => (
              <div key={cat.category} className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="mb-3 text-sm font-bold" style={{ color: '#1A2B4A' }}>{cat.category}</h3>
                <ul className="space-y-1.5">
                  {cat.types.map(t => (
                    <li key={t} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: '#2ABFBF' }} />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-gray-500">
            Not sure which category fits? <a href="/contact" className="font-medium hover:underline" style={{ color: '#2ABFBF' }}>Talk to our team.</a>
          </p>
        </div>
      </section>

      <RoleBenefits
        badge="Platform Capabilities"
        headline="End-to-End Commercial Construction Management"
        subhead="From concept to closeout — AI scoping, permitting, contractor matching, draw management, and portfolio oversight in one platform."
        benefits={BENEFITS}
      />

      <RoleWorkflow
        headline="From Project Submission to Closeout in 6 Steps"
        steps={WORKFLOW}
        accent="#805AD5"
      />

      {/* Pricing callout */}
      <section className="py-16 border-t border-gray-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'rgba(26,43,74,0.03)' }}>
            <h2 className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>Commercial pricing</h2>
            <p className="mt-3 text-gray-600">
              Commercial services are priced per project or by portfolio subscription. Contact our team for a custom quote based on your project type and scale.
            </p>
            <p className="mt-3 text-sm text-gray-400">
              All services requiring onsite support are performed by your licensed contractor of record. Kealee provides advisory, coordination, and platform services only.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a href="/pricing" className="text-sm font-semibold" style={{ color: '#2ABFBF' }}>View platform pricing →</a>
              <span className="hidden text-gray-300 sm:block">|</span>
              <a href="/contact" className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>Request a custom quote →</a>
            </div>
          </div>
        </div>
      </section>

      <RoleFAQ
        items={[
          {
            question: 'What types of commercial projects does Kealee support?',
            answer: 'Office TI, retail fit-out, restaurant build-out, industrial/warehouse, mixed-use development, multifamily, and commercial IT infrastructure. See the full list above.',
          },
          {
            question: 'Is commercial IT and infrastructure included?',
            answer: 'Yes. Managed network installation, security systems, AV, EV charging, and building management systems (BMS) are available under commercial services for developers, property managers, and investors.',
          },
          {
            question: 'How does commercial permitting work on Kealee?',
            answer: 'Our team handles the full permitting process — AHJ coordination, plan check, variance requests, inspections, and certificate of occupancy support across all required agencies.',
          },
          {
            question: 'Does Kealee handle lender draw coordination?',
            answer: 'Yes. Our Construction OS includes milestone-based draw requests, inspector coordination, lien waiver tracking, and lender report generation — all on the platform.',
          },
          {
            question: 'Does Kealee offer onsite construction services?',
            answer: 'No. All onsite construction must be performed by your licensed contractor of record. Kealee provides advisory, coordination, contractor matching, and platform management services only.',
          },
          {
            question: 'How is commercial pricing structured?',
            answer: 'Concept packages, feasibility studies, and permit coordination are priced per engagement. Portfolio-wide management is available via Ops OS subscription tiers. Contact us for a custom quote.',
          },
        ]}
      />

      <RoleCTA
        headline="Start Your Commercial Project Today"
        subhead="AI-powered scoping, permitting, contractor matching, and lifecycle management — all in one platform."
        cta={{ label: 'Start a Commercial Project', href: '/intake' }}
        secondaryCta={{ label: 'Schedule a Consultation', href: '/contact' }}
      />
    </>
  )
}
