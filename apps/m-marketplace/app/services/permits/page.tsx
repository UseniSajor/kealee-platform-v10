import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Permits & Inspections | Kealee',
  description: 'Automated permit tracking, inspection scheduling, and AI-powered document review for construction compliance.',
}

export default function PermitsServicePage() {
  const features = [
    { title: 'Permit Tracking', description: 'Real-time status updates for all your permit applications across multiple jurisdictions.' },
    { title: 'Inspection Scheduling', description: 'Book and manage inspections directly through our platform with automatic reminders.' },
    { title: 'AI Document Review', description: 'AI-powered review catches common errors before submission to reduce rejections.' },
    { title: 'Status Alerts', description: 'Get notified instantly when permits are approved, need revision, or inspections are scheduled.' },
    { title: 'Compliance Dashboard', description: 'Track all compliance requirements and expiration dates in one central view.' },
    { title: 'Document Storage', description: 'Secure storage for permits, inspection reports, and compliance certificates.' },
  ]

  const permitTypes = [
    'Building Permits', 'Electrical Permits', 'Plumbing Permits', 'HVAC Permits',
    'Demolition Permits', 'Fire Permits', 'Zoning Permits', 'Environmental Permits', 'Historic Preservation',
  ]

  const jurisdictions = [
    'Washington, DC', 'Montgomery County, MD', "Prince George's County, MD", 'Fairfax County, VA',
    'Arlington County, VA', 'Alexandria, VA', 'Anne Arundel County, MD', 'Howard County, MD',
    'Baltimore City, MD', 'Baltimore County, MD', 'Loudoun County, VA', 'Prince William County, VA',
  ]

  const services = [
    { name: 'Permit Tracking Only', price: '$99/mo', features: ['Up to 10 active permits', 'Status tracking', 'Email alerts', 'Document storage'] },
    { name: 'Full Service', price: '$325/permit', features: ['Application assistance', 'Document preparation', 'Submission handling', 'Status tracking', 'Revision management'], popular: true },
    { name: 'Enterprise', price: 'Custom', features: ['Unlimited permits', 'Dedicated coordinator', 'Priority processing', 'API access', 'Custom reporting'] },
  ]

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/services" className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-8 text-sm">
          &larr; All Services
        </Link>

        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            Permits & Inspections
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Stop chasing permit statuses. Automated tracking, AI-powered reviews, and seamless inspection scheduling for construction compliance.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600">
              Start New Permit
            </Link>
            <Link href="/portals" className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50">
              Go to Portal
            </Link>
          </div>
        </div>

        {/* Features */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-10 text-gray-900">Platform Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="font-bold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Permit Types */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-center mb-6 text-gray-900">Permit Types We Track</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {permitTypes.map((type) => (
              <span key={type} className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm">
                {type}
              </span>
            ))}
          </div>
        </section>

        {/* Jurisdictions */}
        <section className="mb-16">
          <div className="rounded-2xl bg-amber-50 p-8">
            <h2 className="text-xl font-bold text-center mb-6 text-gray-900">Supported Jurisdictions</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {jurisdictions.map((j) => (
                <span key={j} className="px-3 py-1.5 bg-white border border-amber-200 rounded-full text-sm font-medium">
                  {j}
                </span>
              ))}
            </div>
            <p className="text-center text-sm text-gray-600 mt-6">
              Don&apos;t see your jurisdiction? <Link href="/contact" className="text-amber-600 hover:underline">Contact us</Link> to add it.
            </p>
          </div>
        </section>

        {/* Pricing */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-900">Pricing Options</h2>
          <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
            Choose tracking only or let us handle the entire permit process for you.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service.name} className={`rounded-2xl border bg-white p-6 shadow-sm ${service.popular ? 'border-amber-500 ring-1 ring-amber-500/20' : 'border-gray-200'}`}>
                {service.popular && (
                  <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 mb-3">MOST POPULAR</span>
                )}
                <h3 className="text-xl font-bold text-gray-900">{service.name}</h3>
                <div className="mt-2 text-3xl font-bold text-amber-600">{service.price}</div>
                <ul className="mt-4 space-y-2">
                  {service.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/contact" className={`mt-6 block text-center py-2.5 rounded-lg font-semibold transition ${service.popular ? 'bg-amber-500 text-white hover:bg-amber-600' : 'border border-gray-200 hover:bg-gray-50'}`}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl bg-amber-500 p-8 text-white text-center">
          <h2 className="text-2xl font-bold">Never Miss a Permit Status Again</h2>
          <p className="mt-2 opacity-95 max-w-xl mx-auto">Start tracking your permits today. Setup takes less than 5 minutes.</p>
          <Link href="/contact" className="mt-6 inline-flex items-center justify-center rounded-xl bg-white px-8 py-3 text-sm font-semibold text-amber-700 shadow-sm transition hover:bg-amber-50">
            Start Tracking
          </Link>
        </section>
      </div>
    </div>
  )
}
