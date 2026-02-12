import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { heroImages } from '@kealee/ui'

export const metadata: Metadata = {
  title: 'Pre-Construction Services | Kealee',
  description: 'Streamlined pre-con workflow from design to contractor bidding with guaranteed escrow-backed contracts.',
}

export default function PreconServicePage() {
  const phases = [
    { number: '01', title: 'Design Intake', description: 'Submit your project requirements and receive a tailored design package.', features: ['Project questionnaire', 'Site analysis', 'Budget alignment'] },
    { number: '02', title: 'Concept Development', description: 'Work with our design team to develop initial concepts and plans.', features: ['2D floor plans', 'Design revisions', 'Material selections'] },
    { number: '03', title: 'SRP Generation', description: 'Generate a detailed Scope of Requirements Package for bidding.', features: ['Trade specifications', 'Material schedules', 'Quality standards'] },
    { number: '04', title: 'Contractor Matching', description: 'Get matched with verified contractors from our marketplace.', features: ['Verified contractors', 'License verification', 'Insurance validation'] },
    { number: '05', title: 'Bid Collection', description: 'Receive competitive bids with clear pricing breakdowns.', features: ['Standardized bids', 'Side-by-side comparison', 'Direct messaging'] },
    { number: '06', title: 'Contract Award', description: 'Award the contract and set up escrow-backed milestone payments.', features: ['Contract generation', 'Escrow setup', 'Payment schedule'] },
  ]

  const designPackages = [
    { name: 'Basic', price: '$199', features: ['2 design concepts', '2 revision rounds', 'Floor plans', 'Basic SRP'] },
    { name: 'Standard', price: '$499', features: ['4 design concepts', '4 revision rounds', 'Floor plans + elevations', 'Detailed SRP', 'Material board'], recommended: true },
    { name: 'Premium', price: '$999', features: ['Unlimited concepts', 'Unlimited revisions', 'Full drawing set', 'Comprehensive SRP', '3D renderings', 'Dedicated designer'] },
  ]

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/services" className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-8 text-sm">&larr; All Services</Link>

        <div className="relative text-center mb-16 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-16 overflow-hidden">
          <Image
            src={heroImages.constructionWorkers.src}
            alt={heroImages.constructionWorkers.alt}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
          <div className="relative">
            <span className="inline-block rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-bold text-emerald-700 mb-4">END-TO-END</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Pre-Construction Workflow</h1>
            <p className="mt-4 text-xl text-white/85 max-w-3xl mx-auto">
              From initial design to contractor award — all with guaranteed escrow-backed payments. Start your project right with clear pricing and verified contractors.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">Start Your Project</Link>
              <Link href="/portals" className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-white/20">Go to Portal</Link>
            </div>
          </div>
        </div>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-10 text-gray-900">The Pre-Con Process</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {phases.map((phase) => (
              <div key={phase.number} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="text-3xl font-bold text-emerald-600 mb-3">{phase.number}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{phase.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{phase.description}</p>
                <ul className="space-y-1">
                  {phase.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-900">Design Packages</h2>
          <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">Choose the design package that fits your project needs. All packages include SRP generation.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {designPackages.map((pkg) => (
              <div key={pkg.name} className={`rounded-2xl border bg-white p-6 shadow-sm ${pkg.recommended ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-gray-200'}`}>
                {pkg.recommended && <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 mb-3">RECOMMENDED</span>}
                <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
                <div className="mt-2 text-3xl font-bold text-emerald-600">{pkg.price}</div>
                <ul className="mt-4 space-y-2">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/contact" className={`mt-6 block text-center py-2.5 rounded-lg font-semibold transition ${pkg.recommended ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'border border-gray-200 hover:bg-gray-50'}`}>Get Started</Link>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-emerald-600 p-8 text-white text-center">
          <h2 className="text-2xl font-bold">Start Your Project the Right Way</h2>
          <p className="mt-2 opacity-95 max-w-xl mx-auto">Escrow-backed contracts, verified contractors, and clear pricing from day one.</p>
          <Link href="/contact" className="mt-6 inline-flex items-center justify-center rounded-xl bg-white px-8 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50">Get Started</Link>
        </section>
      </div>
    </div>
  )
}
