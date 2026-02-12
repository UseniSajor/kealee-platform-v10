import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { heroImages } from '@kealee/ui'

export const metadata: Metadata = {
  title: 'Operations Services | Kealee',
  description: 'Outsource your construction operations — PM managed service packages, individual services, and dedicated teams for general contractors.',
}

export default function OpsServicePage() {
  const packages = [
    { name: 'Package A', subtitle: 'Starter', price: '$1,750', period: '/mo', hours: '5-10 hrs/week', projects: '1 project', features: ['Permit tracking', 'Basic vendor follow-up', 'Weekly status email', 'Document management'], bestFor: 'Solo GCs with 1-2 active projects' },
    { name: 'Package B', subtitle: 'Professional', price: '$3,750', period: '/mo', hours: '15-20 hrs/week', projects: '3 projects', features: ['Everything in A', 'Sub coordination', 'Client communication', 'Schedule management', 'Change order support'], bestFor: 'Growing teams with 3-5 projects', popular: true },
    { name: 'Package C', subtitle: 'Premium', price: '$9,500', period: '/mo', hours: '30-40 hrs/week', projects: 'Up to 20 projects', features: ['Everything in B', 'Dedicated PM team', 'Budget tracking', 'Quality control', 'Custom reporting'], bestFor: 'Established firms managing multiple projects' },
    { name: 'Package D', subtitle: 'Enterprise', price: '$16,500', period: '/mo', hours: '40+ hrs/week', projects: 'Portfolio', features: ['Everything in C', 'Portfolio management', 'Executive reporting', 'Custom SLAs', 'On-site support'], bestFor: 'Enterprise builders and developers' },
  ]

  const individualServices = [
    { category: 'Permits & Field Ops', services: ['Site visit coordination ($200)', 'Inspection scheduling ($250)', 'Permit follow-up ($300)', 'Code review prep ($400)'] },
    { category: 'Coordination & Admin', services: ['Vendor management ($250)', 'Weekly reporting ($300)', 'Schedule updates ($350)', 'Change order processing ($500)'] },
    { category: 'Estimating & Pre-Con', services: ['Scope review ($300/hr)', 'Material takeoff ($500)', 'Bid tabulation ($750)', 'Value engineering ($1,250)'] },
  ]

  const benefits = [
    { title: 'Save 22+ Hours/Week', description: 'Free up time by offloading admin, coordination, and reporting to our team.' },
    { title: 'Scale Without Hiring', description: 'Get a full operations team without the overhead of W-2 employees.' },
    { title: 'Improve Margins', description: 'Reduce cost overruns and change orders with professional project oversight.' },
    { title: '14-Day Free Trial', description: 'Try any package risk-free. No contracts, cancel anytime.' },
  ]

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/services" className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-8 text-sm">&larr; All Services</Link>

        <div className="relative text-center mb-16 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-16 overflow-hidden">
          <Image
            src={heroImages.constructionSite.src}
            alt={heroImages.constructionSite.alt}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
          <div className="relative">
            <span className="inline-block rounded-full bg-sky-100 px-4 py-1.5 text-sm font-bold text-sky-700 mb-4">MANAGED SERVICES</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Operations Services</h1>
            <p className="mt-4 text-xl text-white/85 max-w-3xl mx-auto">
              Your operations department, on demand. Professional PM teams handle permits, coordination, reporting, and admin so you can focus on building.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a href="https://ops.kealee.com" className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600">Learn More at ops.kealee.com</a>
              <Link href="/contact" className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-white/20">Contact Sales</Link>
            </div>
          </div>
        </div>

        <section className="mb-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-center">
                <h3 className="font-bold text-gray-900">{b.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{b.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-900">PM Managed Service Packages</h2>
          <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">Choose the package that matches your workload. All packages include a 14-day free trial.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg) => (
              <div key={pkg.name} className={`rounded-2xl border bg-white p-6 shadow-sm ${pkg.popular ? 'border-sky-500 ring-1 ring-sky-500/20' : 'border-gray-200'}`}>
                {pkg.popular && <span className="inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700 mb-3">MOST POPULAR</span>}
                <h3 className="text-lg font-bold text-gray-900">{pkg.name}</h3>
                <p className="text-sm text-gray-500">{pkg.subtitle}</p>
                <div className="mt-2 text-3xl font-bold text-gray-900">{pkg.price}<span className="text-base font-normal text-gray-500">{pkg.period}</span></div>
                <p className="text-xs text-gray-500 mt-1">{pkg.hours} · {pkg.projects}</p>
                <ul className="mt-4 space-y-2">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-gray-500">Best for: {pkg.bestFor}</p>
                <a href="https://ops.kealee.com/pricing" className={`mt-4 block text-center py-2.5 rounded-lg font-semibold transition ${pkg.popular ? 'bg-sky-500 text-white hover:bg-sky-600' : 'border border-gray-200 hover:bg-gray-50'}`}>Get Started</a>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-10 text-gray-900">Individual Services</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {individualServices.map((cat) => (
              <div key={cat.category} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">{cat.category}</h3>
                <ul className="space-y-2">
                  {cat.services.map((s) => (
                    <li key={s} className="flex items-start gap-2 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-sky-500 p-8 text-white text-center">
          <h2 className="text-2xl font-bold">Ready to Outsource Your Ops?</h2>
          <p className="mt-2 opacity-95 max-w-xl mx-auto">Start your 14-day free trial. No contracts, cancel anytime.</p>
          <a href="https://ops.kealee.com" className="mt-6 inline-flex items-center justify-center rounded-xl bg-white px-8 py-3 text-sm font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50">Visit ops.kealee.com</a>
        </section>
      </div>
    </div>
  )
}
