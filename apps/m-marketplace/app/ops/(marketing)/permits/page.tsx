import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Permits & Inspections | Kealee',
  description: 'Automated permit tracking, inspection scheduling, and AI-powered document review for compliance.',
};

export default function PermitsPage() {
  const features = [
    {
      icon: '📝',
      title: 'Permit Tracking',
      description: 'Real-time status updates for all your permit applications across multiple jurisdictions.',
    },
    {
      icon: '📅',
      title: 'Inspection Scheduling',
      description: 'Book and manage inspections directly through our platform with automatic reminders.',
    },
    {
      icon: '🤖',
      title: 'AI Document Review',
      description: 'AI-powered review catches common errors before submission to reduce rejections.',
    },
    {
      icon: '🔔',
      title: 'Status Alerts',
      description: 'Get notified instantly when permits are approved, need revision, or inspections are scheduled.',
    },
    {
      icon: '📊',
      title: 'Compliance Dashboard',
      description: 'Track all compliance requirements and expiration dates in one central view.',
    },
    {
      icon: '📁',
      title: 'Document Storage',
      description: 'Secure storage for permits, inspection reports, and compliance certificates.',
    },
  ];

  const jurisdictions = [
    'Washington, DC',
    'Montgomery County, MD',
    'Prince George\'s County, MD',
    'Fairfax County, VA',
    'Arlington County, VA',
    'Alexandria, VA',
    'Anne Arundel County, MD',
    'Howard County, MD',
    'Baltimore City, MD',
    'Baltimore County, MD',
    'Loudoun County, VA',
    'Prince William County, VA',
  ];

  const permitTypes = [
    { type: 'Building Permits', icon: '🏗️' },
    { type: 'Electrical Permits', icon: '⚡' },
    { type: 'Plumbing Permits', icon: '🔧' },
    { type: 'HVAC Permits', icon: '❄️' },
    { type: 'Demolition Permits', icon: '🔨' },
    { type: 'Fire Permits', icon: '🔥' },
    { type: 'Zoning Permits', icon: '📐' },
    { type: 'Environmental Permits', icon: '🌿' },
    { type: 'Historic Preservation', icon: '🏛️' },
  ];

  const services = [
    {
      name: 'Permit Tracking Only',
      price: '$99/mo',
      features: ['Up to 10 active permits', 'Status tracking', 'Email alerts', 'Document storage'],
    },
    {
      name: 'Full Service',
      price: '$325/permit',
      features: ['Application assistance', 'Document preparation', 'Submission handling', 'Status tracking', 'Revision management'],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      features: ['Unlimited permits', 'Dedicated coordinator', 'Priority processing', 'API access', 'Custom reporting'],
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
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
          Permits & Inspections
        </h1>
        <p className="mt-4 text-xl text-zinc-600 max-w-3xl mx-auto">
          Stop chasing permit statuses. Automated tracking, AI-powered reviews,
          and seamless inspection scheduling for compliance.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/ops/permits/new"
            className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-amber-600"
          >
            Start New Permit Application
          </Link>
          <Link
            href="/ops/permits/schedule-inspection"
            className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-6 py-3 text-sm font-bold text-zinc-900 shadow-sm transition hover:bg-zinc-50"
          >
            Schedule Inspection
          </Link>
        </div>
      </div>

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

      {/* Permit Types */}
      <section className="mb-16">
        <h2 className="text-xl font-black text-center mb-6">Permit Types We Track</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {permitTypes.map((permit) => (
            <span
              key={permit.type}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-black/10 rounded-lg text-sm"
            >
              <span>{permit.icon}</span>
              {permit.type}
            </span>
          ))}
        </div>
      </section>

      {/* Jurisdictions */}
      <section className="mb-16">
        <div className="rounded-2xl bg-amber-50 p-8">
          <h2 className="text-xl font-black text-center mb-6">Supported Jurisdictions</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {jurisdictions.map((jurisdiction) => (
              <span
                key={jurisdiction}
                className="px-3 py-1.5 bg-white border border-amber-200 rounded-full text-sm font-medium"
              >
                {jurisdiction}
              </span>
            ))}
          </div>
          <p className="text-center text-sm text-zinc-600 mt-6">
            Don't see your jurisdiction? <Link href="/ops/contact" className="text-amber-600 hover:underline">Contact us</Link> to add it.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="mb-16">
        <h2 className="text-2xl font-black text-center mb-4">Pricing Options</h2>
        <p className="text-center text-zinc-600 mb-10 max-w-2xl mx-auto">
          Choose tracking only or let us handle the entire permit process for you.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.name}
              className={`rounded-2xl border bg-white p-6 shadow-sm ${
                service.popular
                  ? 'border-amber-500 ring-1 ring-amber-500/20'
                  : 'border-black/10'
              }`}
            >
              {service.popular && (
                <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 mb-3">
                  MOST POPULAR
                </span>
              )}
              <h3 className="text-xl font-black">{service.name}</h3>
              <div className="mt-2 text-3xl font-black text-amber-600">{service.price}</div>
              <ul className="mt-4 space-y-2">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-zinc-700">
                    <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`mt-6 block text-center py-2.5 rounded-lg font-bold transition ${
                  service.popular
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'border border-black/10 hover:bg-zinc-50'
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Ops Integration */}
      <section className="mb-16">
        <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-cyan-50 p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-xl font-black">
                Included in Ops Packages
              </h2>
              <p className="mt-2 text-zinc-700">
                Full permit tracking and follow-up is included in all our GC Operations packages.
                Let us handle the admin while you build.
              </p>
            </div>
            <Link
              href="/ops/pricing"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-95 whitespace-nowrap"
            >
              View Ops Packages →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl bg-amber-500 p-8 text-white text-center">
        <h2 className="text-2xl font-black">Never Miss a Permit Status Again</h2>
        <p className="mt-2 opacity-95 max-w-xl mx-auto">
          Start tracking your permits today. Setup takes less than 5 minutes.
        </p>
        <Link
          href="/ops/permits/track"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-white px-8 py-3 text-sm font-bold text-amber-700 shadow-sm transition hover:bg-amber-50"
        >
          Start Tracking
        </Link>
      </section>
    </main>
  );
}
