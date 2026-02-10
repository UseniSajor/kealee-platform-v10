import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contractor Marketplace | Kealee',
  description: 'Connect with verified contractors, vendors, and suppliers. Quality leads and clear bidding.',
};

export default function MarketplacePage() {
  const forContractors = [
    {
      icon: '🎯',
      title: 'Quality Leads',
      description: 'Get matched with serious project owners ready to hire.',
    },
    {
      icon: '💼',
      title: 'Build Your Profile',
      description: 'Showcase your work, certifications, and reviews.',
    },
    {
      icon: '💰',
      title: 'Clear Pricing',
      description: 'All fees clearly displayed at checkout—no surprises.',
    },
    {
      icon: '📈',
      title: 'Grow Your Business',
      description: 'Access tools to manage bids, contracts, and payments.',
    },
  ];

  const subscriptionPlans = [
    {
      name: 'Basic Listing',
      price: '$299/mo',
      features: ['Profile listing', '5 leads per month', 'Basic analytics', 'Email support'],
    },
    {
      name: 'Pro Listing',
      price: '$599/mo',
      features: ['Featured profile', '15 leads per month', 'Priority matching', 'Advanced analytics', 'Phone support'],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: '$999/mo',
      features: ['Premium placement', 'Priority project matching', 'Dedicated account manager', 'Custom branding', 'API access', 'Performance analytics', 'Multi-location support'],
    },
  ];

  const leadPricing = [
    { projectSize: 'Under $25K', price: '$50' },
    { projectSize: '$25K - $75K', price: '$150' },
    { projectSize: '$75K - $250K', price: '$300' },
    { projectSize: 'Over $250K', price: '$500' },
  ];

  const stats = [
    { value: '5,000+', label: 'Verified Contractors' },
    { value: '$250M+', label: 'Projects Completed' },
    { value: '4.8/5', label: 'Average Rating' },
    { value: '48hr', label: 'Avg Response Time' },
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
          Contractor Marketplace
        </h1>
        <p className="mt-4 text-xl text-zinc-600 max-w-3xl mx-auto">
          Connect with verified contractors for your project, or find quality leads
          to grow your construction business.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-95"
          >
            Find Contractors
          </Link>
          <Link
            href="/contractors"
            className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-6 py-3 text-sm font-bold text-zinc-900 shadow-sm transition hover:bg-zinc-50"
          >
            Join as Contractor
          </Link>
        </div>
      </div>

      {/* Stats */}
      <section className="mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-black text-[var(--primary)]">{stat.value}</div>
              <div className="text-sm text-zinc-600 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* For Contractors */}
      <section className="mb-16">
        <h2 className="text-2xl font-black mb-8">For Contractors</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {forContractors.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
            >
              <div className="text-2xl mb-3">{item.icon}</div>
              <h3 className="font-bold mb-2">{item.title}</h3>
              <p className="text-sm text-zinc-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Subscription Plans */}
      <section className="mb-16">
        <h2 className="text-2xl font-black text-center mb-4">Contractor Subscriptions</h2>
        <p className="text-center text-zinc-600 mb-10 max-w-2xl mx-auto">
          Choose a plan that fits your business. All plans include basic profile features.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {subscriptionPlans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border bg-white p-6 shadow-sm ${
                plan.popular
                  ? 'border-[var(--primary)] ring-1 ring-[var(--primary)]/20'
                  : 'border-black/10'
              }`}
            >
              {plan.popular && (
                <span className="inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700 mb-3">
                  MOST POPULAR
                </span>
              )}
              <h3 className="text-xl font-black">{plan.name}</h3>
              <div className="mt-2 text-3xl font-black text-[var(--primary)]">{plan.price}</div>
              <ul className="mt-4 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-zinc-700">
                    <svg className="w-4 h-4 text-[var(--primary)]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/contractors"
                className={`mt-6 block text-center py-2.5 rounded-lg font-bold transition ${
                  plan.popular
                    ? 'bg-[var(--primary)] text-white hover:opacity-95'
                    : 'border border-black/10 hover:bg-zinc-50'
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Lead Pricing */}
      <section className="mb-16">
        <div className="rounded-2xl bg-zinc-50 p-8">
          <h2 className="text-xl font-black text-center mb-6">Pay-Per-Lead Pricing</h2>
          <p className="text-center text-zinc-600 mb-8 max-w-xl mx-auto">
            Only pay for leads you're interested in. No subscription required.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {leadPricing.map((item) => (
              <div key={item.projectSize} className="text-center p-4 bg-white rounded-xl border border-black/10">
                <div className="text-xl font-black text-[var(--primary)]">{item.price}</div>
                <div className="text-sm text-zinc-600 mt-1">{item.projectSize}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-zinc-500 mt-6">
            Plus 3.5% platform commission on awarded contracts (deducted from first milestone)
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl bg-[var(--primary)] p-8 text-white text-center">
        <h2 className="text-2xl font-black">Ready to Get Started?</h2>
        <p className="mt-2 opacity-95 max-w-xl mx-auto">
          Whether you're looking for contractors or looking to grow your business,
          Kealee Marketplace has you covered.
        </p>
        <div className="mt-6">
          <Link
            href="/contractors"
            className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-zinc-900 shadow-sm transition hover:bg-zinc-50"
          >
            Get Started
          </Link>
        </div>
      </section>
    </main>
  );
}
