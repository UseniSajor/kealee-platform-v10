import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { sectionImages } from '@kealee/ui'

export const metadata: Metadata = {
  title: 'Finance & Trust | Kealee',
  description: 'Secure escrow management, milestone payments, and clear financial tracking for construction projects.',
}

export default function FinanceServicePage() {
  const features = [
    { title: 'Escrow Accounts', description: 'Funds held securely in FDIC-insured escrow accounts until milestones are approved.' },
    { title: 'Milestone Payments', description: 'Release payments only when work is completed and approved by all parties.' },
    { title: 'ACH & Wire Transfers', description: 'Fast, secure fund transfers with ACH (1-3 days) or same-day wire options.' },
    { title: 'Financial Reporting', description: 'Real-time dashboards showing cash flow, releases, and project financials.' },
    { title: 'Automated Alerts', description: 'Get notified when funds are deposited, requested, or released.' },
    { title: 'Audit Trail', description: 'Complete transaction history with timestamps and approvals for compliance.' },
  ]

  const howItWorks = [
    { step: 1, title: 'Project Owner Deposits', description: 'Owner funds the escrow account based on the agreed project budget and milestones.' },
    { step: 2, title: 'Contractor Completes Work', description: 'Contractor completes a milestone and submits a release request with documentation.' },
    { step: 3, title: 'Owner Approves', description: 'Owner reviews the work and approves the release request.' },
    { step: 4, title: 'Funds Released', description: 'Funds are automatically released to the contractor within 1-3 business days.' },
  ]

  const protections = [
    { title: 'For Project Owners', items: ['Funds only released when you approve', 'Documentation required for each release', 'Dispute resolution support', 'Cancel anytime with remaining funds returned'] },
    { title: 'For Contractors', items: ['Guaranteed payment for approved work', 'No more chasing payments', 'Clear milestone definitions', 'Fast ACH or wire transfers'] },
  ]

  const fees = [
    { service: 'Escrow Account Setup', fee: 'Free' },
    { service: 'ACH Deposit', fee: 'Free' },
    { service: 'Wire Deposit', fee: '$25' },
    { service: 'ACH Release', fee: '$5' },
    { service: 'Same-Day Wire Release', fee: '$35' },
    { service: 'Monthly Statement', fee: 'Free' },
  ]

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/services" className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-8 text-sm">&larr; All Services</Link>

        <div className="relative text-center mb-16 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-16 overflow-hidden">
          <Image
            src={sectionImages.financialPlanning.src}
            alt={sectionImages.financialPlanning.alt}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
          <div className="relative">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Finance & Trust</h1>
            <p className="mt-4 text-xl text-white/85 max-w-3xl mx-auto">
              Secure, clear financial management for construction projects. Escrow-backed milestone payments protect everyone.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">Open Escrow Account</Link>
              <Link href="/portals" className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-white/20">Go to Portal</Link>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <section className="mb-16">
          <div className="flex flex-wrap justify-center gap-8 text-center">
            {[{ label: 'FDIC Insured', sub: 'Up to $250,000' }, { label: 'SOC 2', sub: 'Type II Compliant' }, { label: '256-bit', sub: 'Encryption' }, { label: '$100M+', sub: 'Processed' }].map((b) => (
              <div key={b.label}>
                <div className="text-2xl font-bold text-emerald-600">{b.label}</div>
                <div className="text-sm text-gray-500">{b.sub}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-10 text-gray-900">Platform Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="font-bold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-10 text-gray-900">How Escrow Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => (
              <div key={item.step} className="relative">
                {index < howItWorks.length - 1 && <div className="hidden md:block absolute top-6 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-emerald-200" />}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 font-bold mb-4">{item.step}</div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-10 text-gray-900">Built-in Protections</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {protections.map((group) => (
              <div key={group.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{group.title}</h3>
                <ul className="space-y-3">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <div className="rounded-2xl bg-gray-50 p-8">
            <h2 className="text-xl font-bold text-center mb-6 text-gray-900">Clear Fees</h2>
            <div className="max-w-md mx-auto space-y-3">
              {fees.map((item) => (
                <div key={item.service} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                  <span className="text-gray-700">{item.service}</span>
                  <span className={`font-bold ${item.fee === 'Free' ? 'text-emerald-600' : 'text-gray-900'}`}>{item.fee}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-emerald-600 p-8 text-white text-center">
          <h2 className="text-2xl font-bold">Protect Your Construction Payments</h2>
          <p className="mt-2 opacity-95 max-w-xl mx-auto">Open an escrow account in minutes. No monthly fees, no hidden costs.</p>
          <Link href="/contact" className="mt-6 inline-flex items-center justify-center rounded-xl bg-white px-8 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50">Get Started Free</Link>
        </section>
      </div>
    </div>
  )
}
