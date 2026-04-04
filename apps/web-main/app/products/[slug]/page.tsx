import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle, Clock, ShieldCheck, Star, Users } from 'lucide-react'
import { getProduct, getAllProductSlugs } from '@/lib/products'
import ProductCheckoutButton from '@/components/ProductCheckoutButton'

export function generateStaticParams() {
  return getAllProductSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = getProduct(params.slug)
  if (!product) return { title: 'Product not found' }
  return {
    title: `${product.name} — Kealee`,
    description: product.tagline,
  }
}

const AI_DESIGN_CATEGORIES = ['ai-design', 'landscape']
const NEEDS_DISCLAIMER = ['ai-design', 'landscape', 'architectural']

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProduct(params.slug)
  if (!product) notFound()

  const hasCheckout = !!product.stripeEnvVar
  const showDisclaimer = NEEDS_DISCLAIMER.includes(product.category)
  const showJourney = product.showJourney ?? false
  const accentColor = product.accentColor ?? '#E8793A'
  const isAiProduct = AI_DESIGN_CATEGORIES.includes(product.category)

  // Hero gradient: darken accent color for start
  const heroGradient = `linear-gradient(135deg, ${darkenColor(accentColor)} 0%, ${accentColor} 100%)`

  return (
    <div className="min-h-screen bg-white">

      {/* Back nav */}
      <div className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6 flex items-center justify-between">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> All Products
          </Link>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
          >
            {product.label}
          </span>
        </div>
      </div>

      {/* Disclaimer banner — AI/design products only */}
      {showDisclaimer && (
        <div className="border-b border-amber-200 bg-amber-50 py-2.5 px-4 text-center">
          <p className="text-xs text-amber-800">
            <strong>Pre-design service only</strong> — AI concept packages are not permit-ready plans.
            Need permit-ready drawings?{' '}
            <Link href="/design-services" className="underline font-medium">See Design Services →</Link>
          </p>
        </div>
      )}

      {/* Hero */}
      <section className="py-16 border-b border-gray-100" style={{ background: heroGradient }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-16">
            <div className="flex-1">
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' }}
              >
                {product.badge}
              </span>
              <h1 className="text-4xl font-bold text-white font-display leading-tight sm:text-5xl">
                {product.name}
              </h1>
              <p className="mt-5 text-lg text-white/80 leading-relaxed max-w-xl">
                {product.tagline}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href={product.ctaHref}
                  className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                >
                  {product.cta} <ArrowRight className="h-5 w-5" />
                </Link>
                {product.category === 'ai-design' && (
                  <Link
                    href="/concept-engine"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-7 py-3.5 text-base font-semibold text-white/80 hover:text-white hover:border-white/40 transition-all"
                  >
                    Browse All Design Paths
                  </Link>
                )}
              </div>
              {isAiProduct && (
                <p className="mt-4 text-xs text-white/50">
                  All onsite installation and build work is performed by your contractor of record. Kealee provides AI design, final design packages, permit filing, advisory, and contractor matching services only.
                </p>
              )}
            </div>

            {/* Price sidebar card */}
            <div className="lg:w-72 shrink-0">
              <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4">Package includes</p>
                <ul className="space-y-2.5">
                  {product.includes.slice(0, 7).map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-white/80">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-white/60" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 border-t border-white/10 pt-4 flex items-baseline justify-between">
                  <span className="text-sm text-white/50">{product.priceNote.split('·')[0].trim()}</span>
                  <span className="text-3xl font-bold text-white">{product.price.replace('Starting at ', '')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Journey steps — concept → permits → contractor */}
      {showJourney && (
        <section className="py-12 border-b border-gray-100 bg-gray-50">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-sm font-bold uppercase tracking-widest text-gray-400 mb-8">Your Project Journey</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center px-6 py-4 rounded-xl bg-white border-2 border-gray-200 flex-1 max-w-xs" style={{ borderColor: accentColor }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold mb-3" style={{ backgroundColor: accentColor }}>1</div>
                <h3 className="font-bold text-sm" style={{ color: '#1A2B4A' }}>AI Concept Package</h3>
                <p className="text-xs text-gray-500 mt-1">Start here. See your project before anything is built.</p>
                <span className="mt-2 text-xs font-semibold" style={{ color: accentColor }}>{product.price}</span>
              </div>

              <ArrowRight className="h-5 w-5 text-gray-300 shrink-0 rotate-90 sm:rotate-0" />

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center px-6 py-4 rounded-xl bg-white border border-gray-200 flex-1 max-w-xs">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold mb-3 bg-gray-400">2</div>
                <h3 className="font-bold text-sm text-gray-700">Permits</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {product.permitRequired === 'always' ? 'Required for this project type.' : product.permitRequired === 'sometimes' ? 'May be required depending on scope.' : 'Rarely required — confirmed in concept report.'}
                </p>
                <Link href="/permits" className="mt-2 text-xs font-semibold text-gray-500 hover:text-gray-700">See permit services →</Link>
              </div>

              <ArrowRight className="h-5 w-5 text-gray-300 shrink-0 rotate-90 sm:rotate-0" />

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center px-6 py-4 rounded-xl bg-white border border-gray-200 flex-1 max-w-xs">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold mb-3 bg-gray-400">3</div>
                <h3 className="font-bold text-sm text-gray-700">Contractor Match</h3>
                <p className="text-xs text-gray-500 mt-1">Optional. Match with verified contractors who bid on your scope.</p>
                <Link href="/marketplace" className="mt-2 text-xs font-semibold text-gray-500 hover:text-gray-700">See contractor network →</Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Before / After */}
      {product.beforeImage && product.afterImage && (
        <section className="py-16 border-b border-gray-100">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accentColor }}>Transformation</span>
              <h2 className="mt-2 text-2xl font-bold font-display" style={{ color: '#1A2B4A' }}>
                {product.beforeAfterLabel ?? 'Before & After'}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4 rounded-2xl overflow-hidden">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.beforeImage}
                  alt="Before"
                  className="w-full h-72 object-cover"
                />
                <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white uppercase tracking-wide">Before</span>
              </div>
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.afterImage}
                  alt="After"
                  className="w-full h-72 object-cover"
                />
                <span className="absolute bottom-3 right-3 rounded-full px-3 py-1 text-xs font-bold text-white uppercase tracking-wide" style={{ backgroundColor: accentColor }}>After</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Package tiers */}
      {product.packages && product.packages.length > 0 && (
        <section className="py-20" style={{ backgroundColor: '#F7FAFC' }}>
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accentColor }}>Packages</span>
              <h2 className="mt-3 text-2xl font-bold font-display sm:text-3xl" style={{ color: '#1A2B4A' }}>
                Choose your package
              </h2>
              <p className="mt-3 text-gray-500">All packages start with AI concept. Upgrade or add services at any step.</p>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {product.packages.map(tier => (
                <div
                  key={tier.name}
                  className="relative flex flex-col rounded-xl bg-white p-6"
                  style={{
                    boxShadow: tier.popular ? `0 10px 25px -5px ${accentColor}40` : '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                    border: tier.popular ? `2px solid ${accentColor}` : '1px solid #E5E7EB',
                  }}
                >
                  {tier.popular && (
                    <span
                      className="absolute right-4 top-4 rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                      style={{ backgroundColor: accentColor }}
                    >
                      Most Popular
                    </span>
                  )}
                  <h3 className="font-bold font-display" style={{ color: '#1A2B4A' }}>{tier.name}</h3>
                  <div className="my-3">
                    <span className="text-3xl font-bold font-mono" style={{ color: accentColor }}>{tier.price}</span>
                  </div>
                  {(tier.rounds || tier.turnaround) && (
                    <p className="text-xs text-gray-500 mb-1">
                      {[tier.rounds, tier.turnaround].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mb-4">{tier.desc}</p>
                  <ul className="flex-1 space-y-2 mb-6">
                    {tier.items.map(item => (
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
                      backgroundColor: tier.popular ? accentColor : 'transparent',
                      color: tier.popular ? '#fff' : accentColor,
                      border: tier.popular ? 'none' : `2px solid ${accentColor}`,
                    }}
                  >
                    {tier.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="py-20" style={{ backgroundColor: product.packages ? '#fff' : '#F7FAFC' }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accentColor }}>Process</span>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl" style={{ color: '#1A2B4A' }}>
              How it works
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {product.steps.map(step => (
              <div key={step.n} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {step.n}
                </div>
                <h3 className="font-semibold" style={{ color: '#1A2B4A' }}>{step.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="border-t border-gray-100 py-10 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              No subscription required
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              Staff reviewed before delivery
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              Fast delivery included
            </span>
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              DMV-specific expertise
            </span>
          </div>
        </div>
      </section>

      {/* Description + FAQ */}
      <section className="py-20 border-t border-gray-100" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2">
            {/* Description */}
            <div>
              <h2 className="text-2xl font-bold font-display mb-4" style={{ color: '#1A2B4A' }}>About this service</h2>
              <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>
              <div className="rounded-xl bg-white border border-gray-200 p-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Who this is for</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{product.forWho}</p>
              </div>
            </div>
            {/* FAQ */}
            <div>
              <h2 className="text-2xl font-bold font-display mb-6" style={{ color: '#1A2B4A' }}>Common questions</h2>
              <div className="space-y-4">
                {product.faq.map((item, i) => (
                  <div key={i} className="rounded-xl bg-white border border-gray-200 p-5">
                    <h3 className="font-semibold text-sm mb-2" style={{ color: '#1A2B4A' }}>{item.q}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16" style={{ backgroundColor: '#1A2B4A' }}>
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white font-display">Ready to get started?</h2>
          <p className="mt-4 text-gray-300 leading-relaxed">
            No commitment beyond this order. Every service is separate and optional. Stop at any step.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href={product.ctaHref}
              className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: accentColor }}
            >
              {product.cta} <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/products" className="text-sm text-gray-400 hover:text-white transition-colors">
              Browse all services
            </Link>
          </div>
          <p className="mt-6 text-xs text-gray-500">
            {product.price} · {product.priceNote}
          </p>
        </div>
      </section>

    </div>
  )
}

/** Darkens a hex color by ~25% for gradient start */
function darkenColor(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return hex
  const r = Math.max(0, parseInt(result[1], 16) - 60)
  const g = Math.max(0, parseInt(result[2], 16) - 60)
  const b = Math.max(0, parseInt(result[3], 16) - 60)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}
