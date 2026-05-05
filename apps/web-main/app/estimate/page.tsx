import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle, FileText, Award, Package } from 'lucide-react'
import { SERVICE_PRICING, formatPrice } from '@kealee/shared/pricing'

export const metadata: Metadata = {
  title: 'Get a Cost Estimate — Kealee',
  description: 'Trade-by-trade cost estimates validated against RSMeans data for the DMV market. Lender-ready. Licensed estimator sign-off.',
}

// Build tiers from shared pricing configuration
const buildEstimateTiers = () => {
  const pricing = SERVICE_PRICING.estimation

  return [
    {
      icon: FileText,
      slug: 'cost-estimate',
      name: pricing.cost_estimate.name,
      price: formatPrice(pricing.cost_estimate.amount, 'display'),
      turnaround: `${pricing.cost_estimate.turnaround}–5 business days`,
      desc: pricing.cost_estimate.description,
      bullets: pricing.cost_estimate.features,
      cta: 'Order Detailed Estimate',
      href: '/intake/cost_estimate',
      accent: '#4A8FA8',
      popular: false,
    },
    {
      icon: Award,
      slug: 'certified-estimate',
      name: pricing.certified_estimate.name,
      price: formatPrice(pricing.certified_estimate.amount, 'display'),
      turnaround: `${pricing.certified_estimate.turnaround}–7 business days`,
      desc: pricing.certified_estimate.description,
      bullets: pricing.certified_estimate.features,
      cta: 'Order Certified Estimate',
      href: '/intake/certified_estimate',
      accent: '#E8793A',
      popular: true,
    },
    {
      icon: Package,
      slug: 'bundle',
      name: pricing.bundle.name,
      price: `From ${formatPrice(pricing.bundle.amount, 'display')}`,
      turnaround: `${pricing.bundle.turnaround}–7 business days`,
      desc: pricing.bundle.description,
      bullets: pricing.bundle.features,
      cta: 'Order Estimate + Permit Bundle',
      href: '/intake/cost_estimate?bundle=true',
      accent: '#4A8FA8',
      popular: false,
    },
  ]
}

const TIERS = buildEstimateTiers()

const FAQS = [
  {
    q: 'Do I need drawings to get an estimate?',
    a: 'Not always. For scopes under $150K, a written scope description is often sufficient. For larger or more complex projects, schematic drawings are preferred for accuracy.',
  },
  {
    q: 'What is the difference between the Detailed and Certified estimate?',
    a: 'The Detailed Estimate ($595) covers most residential and small commercial needs. The Certified Estimate ($1,850) adds notarized sign-off and is accepted by virtually all DMV lenders for construction loan draw schedules.',
  },
  {
    q: 'Can I use the estimate to evaluate contractor bids?',
    a: 'Yes. Contractors often use our estimates as a baseline when scoping their own bids. Significant deviations from your estimate are a signal to ask questions.',
  },
  {
    q: 'How accurate are the estimates?',
    a: 'All estimates are validated against current RSMeans unit cost data for the DMV market, reviewed by a licensed estimator. Accuracy depends on the completeness of scope provided.',
  },
]

export default function EstimatePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="py-20 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #1A2B4A 0%, #2d4a72 100%)' }}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4"
              style={{ backgroundColor: 'rgba(74,143,168,0.25)', color: '#90CDF4' }}
            >
              Cost Estimation
            </span>
            <h1 className="text-4xl font-bold text-white font-display leading-tight sm:text-5xl">
              Know your costs<br />before you commit.
            </h1>
            <p className="mt-5 text-lg text-gray-300 leading-relaxed">
              RSMeans-validated, trade-by-trade cost breakdowns for DMV construction projects. Human-reviewed. Lender-ready. Pricing confirmed after intake.
            </p>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-gray-300">
              {['RSMeans unit cost data', 'Licensed estimator review', 'Lender-ready PDF', 'DMV market rates'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-blue-300" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing tiers */}
      <section className="py-20" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold font-display sm:text-3xl" style={{ color: '#1A2B4A' }}>
              Choose your estimate
            </h2>
            <p className="mt-3 text-gray-500">All estimates include RSMeans validation and licensed estimator review.</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {TIERS.map(tier => (
              <div
                key={tier.name}
                className="relative flex flex-col rounded-xl bg-white p-6"
                style={{
                  boxShadow: tier.popular ? `0 10px 25px -5px ${tier.accent}40` : '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                  border: tier.popular ? `2px solid ${tier.accent}` : '1px solid #E5E7EB',
                }}
              >
                {tier.popular && (
                  <span
                    className="absolute right-4 top-4 rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: tier.accent }}
                  >
                    Most Popular
                  </span>
                )}
                <div className="flex h-10 w-10 items-center justify-center rounded-xl mb-4" style={{ backgroundColor: `${tier.accent}14` }}>
                  <tier.icon className="h-5 w-5" style={{ color: tier.accent }} />
                </div>
                <h3 className="font-bold font-display" style={{ color: '#1A2B4A' }}>{tier.name}</h3>
                <div className="my-3">
                  <span className="text-3xl font-black" style={{ color: '#1A2B4A' }}>{tier.price}</span>
                  <span className="text-sm text-gray-500 ml-1">one-time</span>
                </div>
                <p className="text-xs text-gray-500 mb-1">{tier.turnaround}</p>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">{tier.desc}</p>
                <ul className="flex-1 space-y-2 mb-6">
                  {tier.bullets.map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.href}
                  className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-all hover:opacity-90"
                  style={{
                    backgroundColor: tier.popular ? tier.accent : 'transparent',
                    color: tier.popular ? '#fff' : tier.accent,
                    border: tier.popular ? 'none' : `2px solid ${tier.accent}`,
                  }}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-gray-100">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold font-display text-center mb-10" style={{ color: '#1A2B4A' }}>Common questions</h2>
          <div className="space-y-5">
            {FAQS.map(faq => (
              <div key={faq.q} className="rounded-xl bg-white border border-gray-200 p-5">
                <h3 className="font-semibold text-sm mb-2" style={{ color: '#1A2B4A' }}>{faq.q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ backgroundColor: '#1A2B4A' }}>
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white font-display">Ready to know your project cost?</h2>
          <p className="mt-4 text-gray-300">Submit your scope and we'll deliver a trade-by-trade estimate with licensed estimator sign-off.</p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/intake/cost_estimate"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#4A8FA8' }}
            >
              Order Detailed Estimate <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/intake/certified_estimate" className="text-sm text-gray-400 hover:text-white transition-colors">
              Order Certified Estimate →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
