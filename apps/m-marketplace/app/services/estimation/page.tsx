import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'AI Estimation Engine | Kealee',
  description: 'AI-powered cost estimation with labor, materials, and timeline projections for accurate project bidding.',
}

export default function EstimationServicePage() {
  const estimationTiers = [
    {
      name: 'Basic',
      price: '$299',
      turnaround: '24 hours',
      features: ['Labor cost breakdown', 'Material quantity takeoff', 'Basic timeline estimate', 'PDF report'],
      bestFor: 'Small residential projects',
    },
    {
      name: 'Standard',
      price: '$799',
      turnaround: '48 hours',
      features: ['Detailed labor analysis', 'Material pricing with suppliers', 'Phased timeline projection', 'Profit margin analysis', 'Excel + PDF deliverables'],
      bestFor: 'Mid-size residential & light commercial',
      popular: true,
    },
    {
      name: 'Premium',
      price: '$1,999',
      turnaround: '3-5 days',
      features: ['Comprehensive BOQ', 'Multi-vendor pricing comparison', 'Resource allocation plan', 'Risk contingency analysis', 'Cash flow projection', 'Dedicated estimator review'],
      bestFor: 'Large commercial projects',
    },
    {
      name: 'Enterprise',
      price: '$4,999',
      turnaround: 'Custom',
      features: ['Everything in Premium', 'Value engineering options', 'Alternative material analysis', 'Subcontractor bid packages', 'On-site consultation', 'Ongoing support'],
      bestFor: 'Multi-phase & complex builds',
    },
  ]

  const aiFeatures = [
    { title: 'AI-Powered Analysis', description: 'Machine learning models trained on thousands of real projects for accurate predictions.' },
    { title: 'Market Data Integration', description: 'Real-time material pricing and labor rates from your local market.' },
    { title: 'Fast Turnaround', description: 'Get estimates in as little as 24 hours — no more waiting weeks for quotes.' },
    { title: 'Accuracy Commitment', description: 'Estimates backed by real market data and expert validation for reliable projections.' },
  ]

  const processSteps = [
    { step: 1, title: 'Submit Project Details', description: 'Upload plans, photos, and project requirements through our secure portal.' },
    { step: 2, title: 'AI Analysis', description: 'Our engine analyzes your project using historical data and current market rates.' },
    { step: 3, title: 'Expert Review', description: 'A human estimator reviews and validates the AI-generated estimate.' },
    { step: 4, title: 'Receive Report', description: 'Get a detailed cost breakdown with actionable insights for your bid.' },
  ]

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/services" className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-8 text-sm">
          &larr; All Services
        </Link>

        {/* Hero */}
        <div className="text-center mb-16">
          <span className="inline-block rounded-full bg-blue-100 px-4 py-1.5 text-sm font-bold text-blue-700 mb-4">
            AI-POWERED
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            AI Estimation Engine
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Get accurate cost estimates powered by AI and validated by expert estimators.
            Labor, materials, timeline, and profit analysis — delivered fast.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
              Get an Estimate
            </Link>
            <Link href="/portals" className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50">
              Go to Portal
            </Link>
          </div>
        </div>

        {/* AI Features */}
        <section className="mb-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiFeatures.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-center">
                <h3 className="text-lg font-bold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Process */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-10 text-gray-900">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {processSteps.map((step, index) => (
              <div key={step.step} className="relative">
                {index < processSteps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-blue-200" />
                )}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-700 font-bold text-xl mb-4">
                    {step.step}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-900">Estimation Packages</h2>
          <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
            Choose the right level of detail for your project. All estimates include AI analysis + expert review.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {estimationTiers.map((tier) => (
              <div key={tier.name} className={`rounded-2xl border bg-white p-6 shadow-sm ${tier.popular ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-gray-200'}`}>
                {tier.popular && (
                  <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 mb-3">MOST POPULAR</span>
                )}
                <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                <div className="mt-2 text-3xl font-bold text-blue-600">{tier.price}</div>
                <p className="text-sm text-gray-500 mt-1">Turnaround: {tier.turnaround}</p>
                <ul className="mt-4 space-y-2">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-gray-500">Best for: {tier.bestFor}</p>
                <Link href="/contact" className={`mt-4 block text-center py-2.5 rounded-lg font-semibold transition ${tier.popular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-gray-200 hover:bg-gray-50'}`}>
                  Order Now
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl bg-blue-600 p-8 text-white text-center">
          <h2 className="text-2xl font-bold">Ready to Get an Accurate Estimate?</h2>
          <p className="mt-2 opacity-95 max-w-xl mx-auto">
            Submit your project details and get a professional estimate powered by AI.
          </p>
          <Link href="/contact" className="mt-6 inline-flex items-center justify-center rounded-xl bg-white px-8 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50">
            Get Started
          </Link>
        </section>
      </div>
    </div>
  )
}
