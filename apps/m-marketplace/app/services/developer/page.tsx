import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Developer Services | Kealee',
  description: 'Real estate development services — feasibility studies, pro forma analysis, entitlement support, and end-to-end project development management.',
}

export default function DeveloperServicePage() {
  const services = [
    { title: 'Feasibility Studies', description: 'Market analysis, site evaluation, and financial viability assessment before you commit capital.' },
    { title: 'Pro Forma Modeling', description: 'Detailed financial projections including construction costs, financing, revenue, and ROI analysis.' },
    { title: 'Entitlement Support', description: 'Navigate zoning, variances, site plan approvals, and environmental reviews with expert guidance.' },
    { title: 'Design Management', description: 'Coordinate architects, engineers, and consultants through the design and permitting process.' },
    { title: 'Construction Oversight', description: 'Professional project management from groundbreaking to certificate of occupancy.' },
    { title: 'Budget & Schedule Control', description: 'Track costs against pro forma, manage change orders, and maintain schedule integrity.' },
  ]

  const projectTypes = [
    'Multi-Family Residential', 'Mixed-Use Development', 'Commercial Office', 'Retail & Hospitality',
    'Industrial & Warehouse', 'Townhome Communities', 'Senior Living', 'Student Housing',
    'Adaptive Reuse', 'Land Development', 'Affordable Housing', 'Build-to-Rent',
  ]

  const phases = [
    { number: '01', title: 'Concept & Feasibility', description: 'Site analysis, market research, preliminary pro forma, and go/no-go recommendation.', deliverables: ['Market study', 'Site constraints analysis', 'Preliminary budget', 'Financial model'] },
    { number: '02', title: 'Pre-Development', description: 'Entitlements, design coordination, financing strategy, and contractor selection.', deliverables: ['Entitlement package', 'Design documents', 'Financing plan', 'GC bid packages'] },
    { number: '03', title: 'Construction', description: 'Manage GC, track budget, maintain schedule, and provide investor reporting.', deliverables: ['Monthly draw reports', 'Schedule updates', 'Budget tracking', 'Investor updates'] },
    { number: '04', title: 'Closeout & Delivery', description: 'Punch list management, CO acquisition, lease-up or sales support.', deliverables: ['Punch list tracking', 'Warranty management', 'Final accounting', 'Asset transition'] },
  ]

  const packages = [
    { name: 'Feasibility Only', price: 'From $2,500', description: 'Go/no-go analysis', features: ['Site evaluation', 'Market research', 'Preliminary pro forma', 'Recommendation report'] },
    { name: 'Pre-Development', price: 'From $7,500/mo', description: 'Through entitlement & permitting', features: ['Everything in Feasibility', 'Entitlement management', 'Design coordination', 'Financing support', 'GC selection'], popular: true },
    { name: 'Full Development', price: 'Custom', description: 'Concept to closeout', features: ['Everything in Pre-Dev', 'Construction oversight', 'Budget management', 'Investor reporting', 'Lease-up support', 'Dedicated dev manager'] },
  ]

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/services" className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-8 text-sm">&larr; All Services</Link>

        <div className="text-center mb-16">
          <span className="inline-block rounded-full bg-violet-100 px-4 py-1.5 text-sm font-bold text-violet-700 mb-4">DEVELOPMENT</span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">Developer Services</h1>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            End-to-end real estate development support — from feasibility and pro forma modeling through construction oversight and asset delivery.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700">Schedule Consultation</Link>
            <Link href="/portals" className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50">Go to Portal</Link>
          </div>
        </div>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-10 text-gray-900">What We Offer</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <div key={s.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="font-bold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{s.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-xl font-bold text-center mb-6 text-gray-900">Project Types</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {projectTypes.map((t) => (
              <span key={t} className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm">{t}</span>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-10 text-gray-900">Development Phases</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {phases.map((phase) => (
              <div key={phase.number} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="text-3xl font-bold text-violet-600 mb-3">{phase.number}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{phase.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{phase.description}</p>
                <div className="flex flex-wrap gap-2">
                  {phase.deliverables.map((d) => (
                    <span key={d} className="px-2 py-1 bg-violet-50 text-violet-700 text-xs rounded">{d}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-900">Service Packages</h2>
          <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">Flexible engagement models — from a single feasibility study to full development management.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div key={pkg.name} className={`rounded-2xl border bg-white p-6 shadow-sm ${pkg.popular ? 'border-violet-500 ring-1 ring-violet-500/20' : 'border-gray-200'}`}>
                {pkg.popular && <span className="inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700 mb-3">MOST POPULAR</span>}
                <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
                <div className="mt-1 text-2xl font-bold text-violet-600">{pkg.price}</div>
                <p className="text-sm text-gray-500 mt-1">{pkg.description}</p>
                <ul className="mt-4 space-y-2">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/contact" className={`mt-6 block text-center py-2.5 rounded-lg font-semibold transition ${pkg.popular ? 'bg-violet-600 text-white hover:bg-violet-700' : 'border border-gray-200 hover:bg-gray-50'}`}>Get Started</Link>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-violet-600 p-8 text-white text-center">
          <h2 className="text-2xl font-bold">Ready to Develop Your Next Project?</h2>
          <p className="mt-2 opacity-95 max-w-xl mx-auto">Schedule a free consultation to discuss your development goals and how we can help.</p>
          <Link href="/contact" className="mt-6 inline-flex items-center justify-center rounded-xl bg-white px-8 py-3 text-sm font-semibold text-violet-700 shadow-sm transition hover:bg-violet-50">Schedule Consultation</Link>
        </section>
      </div>
    </div>
  )
}
