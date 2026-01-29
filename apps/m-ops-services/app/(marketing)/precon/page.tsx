import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pre-Construction Services | Kealee Platform',
  description: 'Streamlined pre-con workflow from design to contractor bidding with guaranteed escrow-backed contracts.',
};

export default function PreconPage() {
  const phases = [
    {
      number: '01',
      title: 'Design Intake',
      description: 'Submit your project requirements and receive a tailored design package.',
      features: ['Project questionnaire', 'Site analysis', 'Budget alignment'],
    },
    {
      number: '02',
      title: 'Concept Development',
      description: 'Work with our design team to develop initial concepts and plans.',
      features: ['2D floor plans', 'Design revisions', 'Material selections'],
    },
    {
      number: '03',
      title: 'SRP Generation',
      description: 'Generate a detailed Scope of Requirements Package for bidding.',
      features: ['Trade specifications', 'Material schedules', 'Quality standards'],
    },
    {
      number: '04',
      title: 'Contractor Matching',
      description: 'Get matched with verified contractors from our marketplace.',
      features: ['Verified contractors', 'License verification', 'Insurance validation'],
    },
    {
      number: '05',
      title: 'Bid Collection',
      description: 'Receive competitive bids with transparent pricing breakdowns.',
      features: ['Standardized bids', 'Side-by-side comparison', 'Direct messaging'],
    },
    {
      number: '06',
      title: 'Contract Award',
      description: 'Award the contract and set up escrow-backed milestone payments.',
      features: ['Contract generation', 'Escrow setup', 'Payment schedule'],
    },
  ];

  const designPackages = [
    {
      name: 'Basic',
      price: '$199',
      features: ['2 design concepts', '2 revision rounds', 'Floor plans', 'Basic SRP'],
      recommended: false,
    },
    {
      name: 'Standard',
      price: '$499',
      features: ['4 design concepts', '4 revision rounds', 'Floor plans + elevations', 'Detailed SRP', 'Material board'],
      recommended: true,
    },
    {
      name: 'Premium',
      price: '$999',
      features: ['Unlimited concepts', 'Unlimited revisions', 'Full drawing set', 'Comprehensive SRP', '3D renderings', 'Dedicated designer'],
      recommended: false,
    },
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-[var(--primary)] hover:underline mb-8"
      >
        ← Back to Home
      </Link>

      {/* Hero */}
      <div className="text-center mb-16">
        <span className="inline-block rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-bold text-emerald-700 mb-4">
          NEW FEATURE
        </span>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
          Pre-Construction Workflow
        </h1>
        <p className="mt-4 text-xl text-zinc-600 max-w-3xl mx-auto">
          From initial design to contractor award—all with guaranteed escrow-backed
          payments. Start your project right with transparent pricing and verified contractors.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Start Your Project
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-6 py-3 text-sm font-bold text-zinc-900 shadow-sm transition hover:bg-zinc-50"
          >
            See Demo
          </Link>
        </div>
      </div>

      {/* Process Flow */}
      <section className="mb-16">
        <h2 className="text-2xl font-black text-center mb-10">The Pre-Con Process</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {phases.map((phase) => (
            <div
              key={phase.number}
              className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
            >
              <div className="text-3xl font-black text-emerald-600 mb-3">{phase.number}</div>
              <h3 className="text-lg font-bold mb-2">{phase.title}</h3>
              <p className="text-sm text-zinc-600 mb-4">{phase.description}</p>
              <ul className="space-y-1">
                {phase.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-zinc-700">
                    <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Design Packages */}
      <section className="mb-16">
        <h2 className="text-2xl font-black text-center mb-4">Design Packages</h2>
        <p className="text-center text-zinc-600 mb-10 max-w-2xl mx-auto">
          Choose the design package that fits your project needs. All packages include SRP generation.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {designPackages.map((pkg) => (
            <div
              key={pkg.name}
              className={`rounded-2xl border bg-white p-6 shadow-sm ${
                pkg.recommended
                  ? 'border-emerald-500 ring-1 ring-emerald-500/20'
                  : 'border-black/10'
              }`}
            >
              {pkg.recommended && (
                <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 mb-3">
                  RECOMMENDED
                </span>
              )}
              <h3 className="text-xl font-black">{pkg.name}</h3>
              <div className="mt-2 text-3xl font-black text-emerald-600">{pkg.price}</div>
              <ul className="mt-4 space-y-2">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-zinc-700">
                    <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`mt-6 block text-center py-2.5 rounded-lg font-bold transition ${
                  pkg.recommended
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'border border-black/10 hover:bg-zinc-50'
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Fee */}
      <section className="rounded-2xl bg-zinc-50 p-8 text-center">
        <h2 className="text-xl font-black mb-4">Transparent Platform Fee</h2>
        <div className="text-5xl font-black text-emerald-600 mb-2">3.5%</div>
        <p className="text-zinc-600 max-w-xl mx-auto">
          Platform commission (paid by contractor from first milestone payment).
          No hidden fees. Escrow-backed protection for all parties.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Escrow Protected
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Verified Contractors
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Milestone-Based Payments
          </div>
        </div>
      </section>
    </main>
  );
}
