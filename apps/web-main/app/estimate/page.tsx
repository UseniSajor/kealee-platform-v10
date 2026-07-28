import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle, FileText, Award, Package, ChevronDown, Play, Sparkles } from 'lucide-react'
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
      accent: '#2ABFBF', // Premium Teal
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
      accent: '#E8724B', // Premium Orange
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
      accent: '#805AD5', // Premium Purple
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
    a: 'The Detailed Estimate covers most residential and small commercial needs. The Certified Estimate adds notarized sign-off and is accepted by virtually all DMV lenders for construction loan draw schedules.',
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
    <div className="min-h-screen bg-slate-50/50">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 overflow-hidden bg-gradient-to-br from-[#1A2B4A] via-[#111E36] to-[#0A1222] border-b border-slate-900">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 40px)' }} />
        
        {/* Colorful background glows */}
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#2ABFBF] opacity-[0.08] blur-3xl pointer-events-none" />
        <div className="absolute top-40 -left-40 w-96 h-96 rounded-full bg-[#E8724B] opacity-[0.08] blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-[1200px] px-6 lg:px-8 relative z-10">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left: copywriting */}
            <div className="lg:col-span-7 text-left space-y-6">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-[0.15em]"
                style={{ backgroundColor: 'rgba(42,191,191,0.15)', color: '#2ABFBF' }}
              >
                <Sparkles className="h-3.5 w-3.5" /> Cost Estimation · DMV Region
              </span>
              <h1 className="font-home-serif text-4xl font-extrabold text-white leading-tight sm:text-5xl lg:text-[54px] tracking-tight">
                Know your costs<br />
                <span className="text-[#E8724B]">before you commit.</span>
              </h1>
              <p className="font-home-sans text-lg text-slate-300 leading-relaxed max-w-xl">
                RSMeans-validated, trade-by-trade cost breakdowns for residential and commercial construction. Verified by licensed estimators. Lender-ready PDF reports.
              </p>
              
              <div className="pt-2 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
                {['RSMeans unit cost data', 'Licensed estimator review', 'Lender-ready PDF', 'DMV market rates'].map(t => (
                  <span key={t} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-[#2ABFBF]" />
                    {t}
                  </span>
                ))}
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Link
                  href="/intake/cost_estimate"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#E8724B] hover:bg-[#b3451a] text-white font-bold px-7 py-4 transition shadow-lg shadow-orange-950/45 text-base"
                >
                  Start Detailed Estimate <ArrowRight className="h-5 w-5" />
                </Link>
                <Link href="#pricing" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors py-3 px-4 border border-slate-700 hover:border-slate-500 rounded-xl">
                  View Pricing Packages
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <span className="text-slate-500">Built for your role:</span>
                <Link href="/intake/cost_estimate?client=contractor" className="font-semibold text-[#2ABFBF] hover:text-white transition-colors">
                  Contractor / GC intake →
                </Link>
                <Link href="/intake/cost_estimate?client=developer" className="font-semibold text-[#2ABFBF] hover:text-white transition-colors">
                  Developer intake →
                </Link>
                <Link href="/intake/cost_estimate?client=service-provider" className="font-semibold text-[#2ABFBF] hover:text-white transition-colors">
                  Trade / service firm intake →
                </Link>
              </div>
            </div>

            {/* Right: Interactive media showcase */}
            <div className="lg:col-span-5 flex items-center justify-center">
              <div className="relative w-full aspect-[16/10] max-w-[480px] bg-slate-950 rounded-[2rem] overflow-hidden shadow-2xl border border-slate-800 ring-8 ring-white/5">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src="/media/service-videos/cost-estimation.mp4" type="video/mp4" />
                </video>
                
                {/* Video Play Indicator */}
                <div
                  className="absolute bottom-4 right-4 z-10 rounded-full bg-slate-950/60 p-2 backdrop-blur-sm border border-white/10"
                  aria-label="Video preview playing"
                >
                  <Play className="h-3.5 w-3.5 fill-white text-white" aria-hidden />
                </div>

                {/* Scrim Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

                {/* Subtitle badge */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md rounded-xl px-3 py-1.5 flex items-center gap-2 border border-white/10">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">RSMeans Estimator Tool</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tiers Section */}
      <section id="pricing" className="py-20 lg:py-28 px-6 bg-slate-50">
        <div className="mx-auto max-w-[1200px]">
          <div className="text-center mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#E8724B]">Packages</span>
            <h2 className="font-home-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Choose your estimate tier
            </h2>
            <p className="font-home-sans text-slate-500 max-w-xl mx-auto">
              All packages feature complete material and labor breakdowns validated against local DMV regional data.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3 items-stretch">
            {TIERS.map(tier => (
              <div
                key={tier.name}
                className="relative flex flex-col rounded-3xl bg-white p-8 border border-slate-200/60 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl group"
                style={{
                  borderColor: tier.popular ? tier.accent : undefined,
                  boxShadow: tier.popular ? `0 20px 40px -15px ${tier.accent}25` : undefined,
                }}
              >
                {tier.popular && (
                  <span
                    className="absolute right-6 top-6 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white"
                    style={{ backgroundColor: tier.accent }}
                  >
                    Most Popular
                  </span>
                )}

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl mb-6 transition-transform group-hover:scale-110" style={{ backgroundColor: `${tier.accent}14` }}>
                  <tier.icon className="h-6 w-6" style={{ color: tier.accent }} />
                </div>

                <h3 className="font-home-serif text-xl font-bold text-slate-900 mb-2">{tier.name}</h3>
                
                <div className="my-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-slate-950 tracking-tight">{tier.price}</span>
                  <span className="text-xs font-semibold text-slate-400 ml-1.5">one-time</span>
                </div>
                
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 inline-block">{tier.turnaround}</span>
                <p className="font-home-sans text-sm text-slate-500 mb-6 leading-relaxed flex-1">{tier.desc}</p>
                
                <ul className="space-y-3 mb-8 border-t border-slate-100 pt-6">
                  {tier.bullets.map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.href}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 border"
                  style={{
                    backgroundColor: tier.popular ? tier.accent : 'transparent',
                    color: tier.popular ? '#fff' : tier.accent,
                    borderColor: tier.accent,
                  }}
                >
                  {tier.cta} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-20 lg:py-28 px-6 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2ABFBF]">Information</span>
            <h2 className="font-home-serif text-3xl font-bold text-slate-900">Common questions</h2>
            <p className="font-home-sans text-slate-500 text-sm">Everything you need to know about our RSMeans validation process.</p>
          </div>

          <div className="space-y-4">
            {FAQS.map(faq => (
              <details
                key={faq.q}
                className="group rounded-2xl bg-white border border-slate-200/60 p-5 [&_summary::-webkit-details-marker]:hidden transition-all duration-300 open:shadow-md open:border-slate-300"
              >
                <summary className="flex cursor-pointer items-center justify-between font-bold text-slate-900 text-sm sm:text-base list-none focus:outline-none select-none">
                  <span>{faq.q}</span>
                  <span className="transition-transform duration-300 group-open:-rotate-180 bg-slate-50 rounded-lg p-1 group-open:bg-[#2ABFBF]/10">
                    <ChevronDown className="h-4 w-4 text-slate-400 group-open:text-[#2ABFBF]" />
                  </span>
                </summary>
                <p className="font-home-sans mt-3 text-xs sm:text-sm text-slate-500 leading-relaxed pl-1">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-24 px-6 bg-gradient-to-br from-[#1A2B4A] to-[#0D1627] text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full opacity-10 blur-3xl pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #E8724B 0%, transparent 60%)' }} />
        <div className="mx-auto max-w-3xl relative z-10 space-y-6">
          <h2 className="font-home-serif text-3xl font-bold text-white sm:text-4xl">Ready to know your project costs?</h2>
          <p className="font-home-sans text-slate-300 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
            Submit your project details and receive a certified, trade-by-trade estimation sheet ready for lenders and bids.
          </p>
          <div className="pt-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/intake/cost_estimate"
              className="inline-flex items-center gap-2 rounded-xl bg-[#2ABFBF] hover:bg-[#1fa1a1] text-white font-bold px-8 py-4 transition shadow-lg shadow-teal-950/45 text-sm uppercase tracking-wider"
            >
              Order Detailed Estimate <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/intake/certified_estimate" className="text-sm font-bold text-white hover:text-[#E8724B] transition-colors py-3 px-6 rounded-xl border border-white/10 hover:border-[#E8724B]/35">
              Order Certified Estimate →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
