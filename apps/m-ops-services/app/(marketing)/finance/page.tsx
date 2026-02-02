import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Finance & Trust | Kealee',
  description: 'Secure escrow management, milestone payments, and transparent financial tracking for all parties.',
};

export default function FinancePage() {
  const features = [
    {
      icon: '🔒',
      title: 'Escrow Accounts',
      description: 'Funds held securely in FDIC-insured escrow accounts until milestones are approved.',
    },
    {
      icon: '📊',
      title: 'Milestone Payments',
      description: 'Release payments only when work is completed and approved by all parties.',
    },
    {
      icon: '💸',
      title: 'ACH & Wire Transfers',
      description: 'Fast, secure fund transfers with ACH (1-3 days) or same-day wire options.',
    },
    {
      icon: '📈',
      title: 'Financial Reporting',
      description: 'Real-time dashboards showing cash flow, releases, and project financials.',
    },
    {
      icon: '🔔',
      title: 'Automated Alerts',
      description: 'Get notified when funds are deposited, requested, or released.',
    },
    {
      icon: '📋',
      title: 'Audit Trail',
      description: 'Complete transaction history with timestamps and approvals for compliance.',
    },
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Project Owner Deposits',
      description: 'Owner funds the escrow account based on the agreed project budget and milestones.',
    },
    {
      step: 2,
      title: 'Contractor Completes Work',
      description: 'Contractor completes a milestone and submits a release request with documentation.',
    },
    {
      step: 3,
      title: 'Owner Approves',
      description: 'Owner reviews the work and approves the release request.',
    },
    {
      step: 4,
      title: 'Funds Released',
      description: 'Funds are automatically released to the contractor within 1-3 business days.',
    },
  ];

  const protections = [
    {
      title: 'For Project Owners',
      items: [
        'Funds only released when you approve',
        'Documentation required for each release',
        'Dispute resolution support',
        'Cancel anytime with remaining funds returned',
      ],
    },
    {
      title: 'For Contractors',
      items: [
        'Guaranteed payment for approved work',
        'No more chasing payments',
        'Clear milestone definitions',
        'Fast ACH or wire transfers',
      ],
    },
  ];

  const fees = [
    { service: 'Escrow Account Setup', fee: 'Free' },
    { service: 'ACH Deposit', fee: 'Free' },
    { service: 'Wire Deposit', fee: '$25' },
    { service: 'ACH Release', fee: '$5' },
    { service: 'Same-Day Wire Release', fee: '$35' },
    { service: 'Monthly Statement', fee: 'Free' },
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
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
          Finance & Trust
        </h1>
        <p className="mt-4 text-xl text-zinc-600 max-w-3xl mx-auto">
          Secure, transparent financial management for construction projects.
          Escrow-backed milestone payments protect everyone.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Open Escrow Account
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-6 py-3 text-sm font-bold text-zinc-900 shadow-sm transition hover:bg-zinc-50"
          >
            See Demo
          </Link>
        </div>
      </div>

      {/* Trust Badges */}
      <section className="mb-16">
        <div className="flex flex-wrap justify-center gap-8 text-center">
          <div>
            <div className="text-2xl font-black text-emerald-600">FDIC Insured</div>
            <div className="text-sm text-zinc-500">Up to $250,000</div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">SOC 2</div>
            <div className="text-sm text-zinc-500">Type II Compliant</div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">256-bit</div>
            <div className="text-sm text-zinc-500">Encryption</div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">$100M+</div>
            <div className="text-sm text-zinc-500">Processed</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mb-16">
        <h2 className="text-2xl font-black text-center mb-10">Platform Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
            >
              <span className="text-2xl">{feature.icon}</span>
              <h3 className="mt-3 font-bold">{feature.title}</h3>
              <p className="mt-2 text-sm text-zinc-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-16">
        <h2 className="text-2xl font-black text-center mb-10">How Escrow Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {howItWorks.map((item, index) => (
            <div key={item.step} className="relative">
              {index < howItWorks.length - 1 && (
                <div className="hidden md:block absolute top-6 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-emerald-200" />
              )}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 font-black mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Protections */}
      <section className="mb-16">
        <h2 className="text-2xl font-black text-center mb-10">Built-in Protections</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {protections.map((group) => (
            <div
              key={group.title}
              className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
            >
              <h3 className="text-lg font-black mb-4">{group.title}</h3>
              <ul className="space-y-3">
                {group.items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-zinc-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Fees */}
      <section className="mb-16">
        <div className="rounded-2xl bg-zinc-50 p-8">
          <h2 className="text-xl font-black text-center mb-6">Transparent Fees</h2>
          <div className="max-w-md mx-auto">
            <div className="space-y-3">
              {fees.map((item) => (
                <div key={item.service} className="flex items-center justify-between py-2 border-b border-zinc-200 last:border-0">
                  <span className="text-zinc-700">{item.service}</span>
                  <span className={`font-bold ${item.fee === 'Free' ? 'text-emerald-600' : 'text-zinc-900'}`}>
                    {item.fee}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs text-center text-zinc-500">
              All applicable fees are displayed at checkout for complete transparency.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl bg-emerald-600 p-8 text-white text-center">
        <h2 className="text-2xl font-black">Protect Your Construction Payments</h2>
        <p className="mt-2 opacity-95 max-w-xl mx-auto">
          Open an escrow account in minutes. No monthly fees, no hidden costs.
        </p>
        <Link
          href="/signup"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-white px-8 py-3 text-sm font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
        >
          Get Started Free
        </Link>
      </section>
    </main>
  );
}
