import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { sectionImages } from '@kealee/ui'

export const metadata: Metadata = {
  title: 'Contractor Network | Kealee',
  description: 'Connect with verified contractors, vendors, and suppliers. Quality leads and clear bidding for construction projects.',
}

export default function MarketplaceNetworkServicePage() {
  const forContractors = [
    { title: 'Quality Leads', description: 'Get matched with serious project owners ready to hire.' },
    { title: 'Build Your Profile', description: 'Showcase your work, certifications, and reviews.' },
    { title: 'Clear Pricing', description: 'All fees clearly displayed — no surprises.' },
    { title: 'Grow Your Business', description: 'Access tools to manage bids, contracts, and payments.' },
  ]

  const subscriptionPlans = [
    { name: 'Basic Listing', price: '$299/mo', features: ['Profile listing', '5 leads per month', 'Basic analytics', 'Email support'] },
    { name: 'Pro Listing', price: '$599/mo', features: ['Featured profile', '15 leads per month', 'Priority matching', 'Advanced analytics', 'Phone support'], popular: true },
    { name: 'Enterprise', price: '$999/mo', features: ['Premium placement', 'Priority project matching', 'Dedicated account manager', 'Custom branding', 'API access', 'Multi-location support'] },
  ]

  const leadPricing = [
    { projectSize: 'Under $25K', price: '$50' },
    { projectSize: '$25K - $75K', price: '$150' },
    { projectSize: '$75K - $250K', price: '$300' },
    { projectSize: 'Over $250K', price: '$500' },
  ]

  const stats = [
    { value: '5,000+', label: 'Verified Contractors' },
    { value: '$250M+', label: 'Projects Completed' },
    { value: '4.8/5', label: 'Average Rating' },
    { value: '48hr', label: 'Avg Response Time' },
  ]

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/services" className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-8 text-sm">&larr; All Services</Link>

        <div className="relative text-center mb-16 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-16 overflow-hidden">
          <Image
            src={sectionImages.teamwork.src}
            alt={sectionImages.teamwork.alt}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
          <div className="relative">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Contractor Network</h1>
            <p className="mt-4 text-xl text-white/85 max-w-3xl mx-auto">
              Connect with verified contractors for your project, or find quality leads to grow your construction business.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/network" className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">Find Contractors</Link>
              <Link href="/contact" className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-white/20">Join as Contractor</Link>
            </div>
          </div>
        </div>

        <section className="mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
                <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-gray-900">For Contractors</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {forContractors.map((item) => (
              <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-900">Contractor Subscriptions</h2>
          <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">Choose a plan that fits your business. All plans include basic profile features.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {subscriptionPlans.map((plan) => (
              <div key={plan.name} className={`rounded-2xl border bg-white p-6 shadow-sm ${plan.popular ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-gray-200'}`}>
                {plan.popular && <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 mb-3">MOST POPULAR</span>}
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-2 text-3xl font-bold text-blue-600">{plan.price}</div>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/contact" className={`mt-6 block text-center py-2.5 rounded-lg font-semibold transition ${plan.popular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-gray-200 hover:bg-gray-50'}`}>Get Started</Link>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <div className="rounded-2xl bg-gray-50 p-8">
            <h2 className="text-xl font-bold text-center mb-6 text-gray-900">Pay-Per-Lead Pricing</h2>
            <p className="text-center text-gray-600 mb-8 max-w-xl mx-auto">Only pay for leads you are interested in. No subscription required.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {leadPricing.map((item) => (
                <div key={item.projectSize} className="text-center p-4 bg-white rounded-xl border border-gray-200">
                  <div className="text-xl font-bold text-blue-600">{item.price}</div>
                  <div className="text-sm text-gray-600 mt-1">{item.projectSize}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-blue-600 p-8 text-white text-center">
          <h2 className="text-2xl font-bold">Ready to Get Started?</h2>
          <p className="mt-2 opacity-95 max-w-xl mx-auto">Whether you are looking for contractors or looking to grow your business, the Kealee Network has you covered.</p>
          <Link href="/contact" className="mt-6 inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50">Get Started</Link>
        </section>
      </div>
    </div>
  )
}
