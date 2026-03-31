import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Calculator } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Get a Project Estimate — Kealee',
  description: 'AI-powered cost estimates for your renovation, addition, or new build. From rough budgets to certified estimates — find the right level for your project.',
}

const PRODUCTS = [
  {
    slug: 'ai-design',
    name: 'AI Design Estimate',
    price: 'From $395',
    turnaround: '48 hours',
    description: 'AI-generated cost range and design brief based on your project scope and location. Ideal for early budgeting before committing to architectural drawings.',
    items: [
      'AI cost range estimate for your project type',
      'Scope breakdown by trade',
      'Market-based cost benchmarks (DC-Baltimore region)',
      'Design direction brief included',
      '30-min consultation call',
    ],
    cta: 'Start Design Estimate',
    accent: '#2ABFBF',
    badge: 'Most Popular',
  },
  {
    slug: 'cost-estimate',
    name: 'Detailed Cost Estimate',
    price: 'From $695',
    turnaround: '5–7 business days',
    description: 'Line-item cost estimate prepared from your project plans or concept package. Suitable for contractor bid comparison and lender pre-approval packages.',
    items: [
      'Line-item cost breakdown by trade + phase',
      'Material and labor split',
      'Regional cost adjustments applied',
      'Contractor bid-ready format',
      'Suitable for lender use (non-certified)',
    ],
    cta: 'Start Detailed Estimate',
    accent: '#E8793A',
  },
  {
    slug: 'certified-estimate',
    name: 'Certified Cost Estimate',
    price: 'From $1,200',
    turnaround: '7–10 business days',
    description: 'Professionally certified cost estimate for permitting, financing, insurance claims, or legal proceedings. Stamped and signed by a qualified estimator.',
    items: [
      'Everything in Detailed Estimate',
      'Certified estimator review and sign-off',
      'Suitable for permit applications',
      'Acceptable for construction loan draws',
      'Insurance claim and legal proceeding use',
    ],
    cta: 'Start Certified Estimate',
    accent: '#7C3AED',
  },
]

const FAQ = [
  {
    q: 'What is the difference between an AI estimate and a certified estimate?',
    a: 'An AI estimate gives you a fast, data-driven cost range for early planning. A certified estimate is reviewed and signed by a qualified estimator — suitable for permits, lender submissions, and legal proceedings.',
  },
  {
    q: 'Do I need plans to get an estimate?',
    a: 'Not for an AI Design Estimate — we work from your project description and scope. For Detailed and Certified estimates, we work best from an existing concept package, architectural drawings, or a detailed scope document.',
  },
  {
    q: 'Can I use an estimate to get contractor bids?',
    a: "Yes — that's the point of the Detailed Estimate. It puts every contractor on the same page with a standard scope, making bids directly comparable and easier to evaluate.",
  },
]

export default function EstimatePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section
        className="py-20 md:py-28"
        style={{ background: 'linear-gradient(135deg, #1A2B4A 0%, #0F1D34 60%, #1A3B3B 100%)' }}
      >
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest mb-5"
            style={{ backgroundColor: 'rgba(42,191,191,0.15)', color: '#2ABFBF' }}
          >
            <Calculator className="h-3.5 w-3.5" />
            Project Estimation
          </div>
          <h1 className="text-4xl font-bold text-white font-display sm:text-5xl">
            Know your numbers before you commit
          </h1>
          <p className="mt-5 text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            AI-powered cost estimates to certified budget packages — find the right level for your
            project, from early concept through permit application.
          </p>
        </div>
      </section>

      {/* Product cards */}
      <section className="py-20" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {PRODUCTS.map(product => (
              <div
                key={product.slug}
                className="relative flex flex-col rounded-2xl bg-white p-7"
                style={{
                  border: product.badge ? `2px solid ${product.accent}` : '1px solid #E5E7EB',
                  boxShadow: product.badge
                    ? `0 10px 25px -5px ${product.accent}30`
                    : '0 1px 3px 0 rgb(0 0 0 / 0.08)',
                }}
              >
                {product.badge && (
                  <span
                    className="absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: product.accent }}
                  >
                    {product.badge}
                  </span>
                )}
                <h2 className="text-lg font-bold font-display" style={{ color: '#1A2B4A' }}>
                  {product.name}
                </h2>
                <div className="mt-3 mb-1">
                  <span className="text-3xl font-bold font-mono" style={{ color: product.accent }}>
                    {product.price}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3">Delivery: {product.turnaround}</p>
                <p className="text-sm text-gray-600 leading-relaxed mb-5">{product.description}</p>
                <ul className="flex-1 space-y-2.5 mb-6">
                  {product.items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/products/${product.slug}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all hover:opacity-90"
                  style={{
                    backgroundColor: product.badge ? product.accent : 'transparent',
                    color: product.badge ? '#fff' : product.accent,
                    border: product.badge ? 'none' : `2px solid ${product.accent}`,
                  }}
                >
                  {product.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-2xl font-bold font-display text-center" style={{ color: '#1A2B4A' }}>
            Common Questions
          </h2>
          <div className="space-y-4">
            {FAQ.map(item => (
              <details key={item.q} className="group rounded-xl border border-gray-200 bg-white">
                <summary
                  className="flex cursor-pointer items-center justify-between gap-4 px-6 py-4 text-sm font-semibold select-none"
                  style={{ color: '#1A2B4A' }}
                >
                  {item.q}
                  <span className="shrink-0 rounded-full p-1 text-gray-400 transition-transform group-open:rotate-45" style={{ transition: 'transform 200ms' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                </summary>
                <div className="border-t border-gray-100 px-6 py-4">
                  <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ backgroundColor: '#1A2B4A' }}>
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-white font-display">
            Not sure which estimate you need?
          </h2>
          <p className="mt-3 text-gray-300">
            Start with a free consultation and we&apos;ll recommend the right level for your project and stage.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#E8793A' }}
            >
              Talk to Our Team <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/concept-engine"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-500 px-6 py-3 text-sm font-semibold text-gray-300 transition-colors hover:border-gray-300 hover:text-white"
            >
              Start with AI Concept
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
