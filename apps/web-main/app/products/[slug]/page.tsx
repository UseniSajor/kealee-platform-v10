import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, CheckCircle, Clock, FileInput, ShieldCheck, Star, Users } from 'lucide-react'
import {
  PUBLIC_PRODUCT_CATALOG,
  PURCHASE_CREDIT_POLICY,
  getPublicCatalogProduct,
  type PublicCatalogProduct,
} from '@kealee/core-rules'
import { getProduct, getAllProductSlugs } from '@/lib/products'
import { getRevenueProduct, REVENUE_PRODUCT_CATALOG, type RevenueProductConfig } from '@/lib/revenue-product-catalog'
import { getProductAvailability, serviceRequestHref } from '@/lib/product-availability'
import { EditorialVideoHero } from '@/components/marketing/EditorialVideoHero'
import { ServiceExamplesGallery } from '@/components/marketing/ServiceExamplesGallery'

export function generateStaticParams() {
  return [...new Set([
    ...getAllProductSlugs(),
    ...Object.keys(REVENUE_PRODUCT_CATALOG),
    ...PUBLIC_PRODUCT_CATALOG.map(product => product.key),
  ])].map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const catalogProduct = getPublicCatalogProduct(slug)
  if (catalogProduct) return {
    title: `${catalogProduct.name} — Kealee`,
    description: catalogProduct.shortDescription,
  }
  const revenueProduct = getRevenueProduct(slug)
  if (revenueProduct) return {
    title: `${revenueProduct.name} — Kealee`,
    description: `Plain-language project planning for ${revenueProduct.customerType}s, including preliminary analysis and clearly stated professional boundaries.`,
  }
  const product = getProduct(slug)
  if (!product) return { title: 'Product not found' }
  return {
    title: `${product.name} — Kealee`,
    description: product.tagline,
  }
}

const AI_DESIGN_CATEGORIES = ['ai-design', 'landscape']
const NEEDS_DISCLAIMER = ['ai-design', 'landscape', 'architectural']

type HeroMedia = { videoSrc: string; poster: string }

function getProductHeroMedia(key: string, name: string, category: string, fallbackPoster?: string): HeroMedia {
  const subject = `${key} ${name} ${category}`.toLowerCase()
  if (/preliminary_site_plan|verified_site_feasibility|developer_feasibility|permit_site_plan|site plan|site intelligence|site feasibility/.test(subject)) return { videoSrc: '/media/service-heroes/preliminary-site-plan.mp4', poster: '/media/service-heroes/preliminary-site-plan.jpg' }
  if (/professional_design|professional drawing|permit-ready|design drawing/.test(subject)) return { videoSrc: '/media/service-heroes/professional-drawings.mp4', poster: '/media/service-heroes/professional-drawings.jpg' }
  if (/permit_coordination|permit application|permit package|expedited permit|coordination/.test(subject)) return { videoSrc: '/media/service-heroes/permit-coordination.mp4', poster: '/media/service-heroes/permit-coordination.jpg' }
  if (/permit_assessment|permit research|permit path|historic assessment|coa submission/.test(subject)) return { videoSrc: '/media/service-heroes/permit-assessment.mp4', poster: '/media/service-heroes/permit-assessment.jpg' }
  if (/estimate|cost/.test(subject)) return { videoSrc: '/media/service-videos/cost-estimation.mp4', poster: fallbackPoster ?? '/media/service-photos/home-estimate.jpg' }
  if (/contractor|construction consultation|owner support|project management|pm advisory|pm oversight/.test(subject)) return { videoSrc: '/media/portal-phase4/contractor-site.mp4', poster: '/media/portal-phase4/contractor-site.jpg' }
  if (/landscape|garden|water mitigation|drainage/.test(subject)) return { videoSrc: '/media/service-heroes/garden-concept-request.mp4', poster: fallbackPoster ?? '/media/service-heroes/garden-concept-request.jpg' }
  if (/addition|adu|new build|new construction|tiny home/.test(subject)) return { videoSrc: '/media/service-videos/addition.mp4', poster: fallbackPoster ?? '/media/service-videos/addition.jpg' }
  return { videoSrc: '/media/service-heroes/project-planning-request.mp4', poster: fallbackPoster ?? '/media/service-heroes/project-planning-request.jpg' }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const catalogProduct = getPublicCatalogProduct(slug)
  if (catalogProduct) return <CatalogProductPage product={catalogProduct} />
  const revenueProduct = getRevenueProduct(slug)
  if (revenueProduct) return <RevenueProductPage product={revenueProduct} />
  const product = getProduct(slug)
  if (!product) notFound()

  const requestHref = serviceRequestHref(slug, product.name)
  const showDisclaimer = NEEDS_DISCLAIMER.includes(product.category)
  const showJourney = product.showJourney ?? false
  const accentColor = product.accentColor ?? '#E8793A'
  const isAiProduct = AI_DESIGN_CATEGORIES.includes(product.category)
  const heroMedia = getProductHeroMedia(slug, product.name, product.category, product.afterImage ?? product.beforeImage)

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

      <EditorialVideoHero eyebrow={product.label} title={product.name} description={product.tagline} videoSrc={heroMedia.videoSrc} poster={heroMedia.poster} primary={{ label: 'Request this service', href: requestHref }} secondary={{ label: 'See project examples', href: '/gallery' }} />

      {/* Hero */}
      <section className="hidden py-16 border-b border-gray-100" style={{ background: heroGradient }}>
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
                  href={requestHref}
                  className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                >
                  Request this service <ArrowRight className="h-5 w-5" />
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
                  <span className="text-sm text-white/60">Scope and price</span>
                  <span className="text-lg font-bold text-white">Confirmed first</span>
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
                <span className="mt-2 text-xs font-semibold" style={{ color: accentColor }}>Scope confirmed before purchase</span>
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
                <p className="text-xs text-gray-500 mt-1">Optional. Request contractor availability; credentials are reviewed for a proposed engagement before introduction.</p>
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
                Explore possible scopes
              </h2>
              <p className="mt-3 text-gray-500">These examples help frame the conversation. Kealee confirms suitability, scope, timing, and price before purchase.</p>
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
                    <span className="text-sm font-bold" style={{ color: accentColor }}>Custom scope</span>
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
                    href={requestHref}
                    className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-all hover:opacity-90"
                    style={{
                      backgroundColor: tier.popular ? accentColor : 'transparent',
                      color: tier.popular ? '#fff' : accentColor,
                      border: tier.popular ? 'none' : `2px solid ${accentColor}`,
                    }}
                  >
                    Request this scope
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
              Release review tracked
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              Timing confirmed with scope
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

      <ServiceExamplesGallery serviceKey={slug} />

      {/* Bottom CTA */}
      <section className="border-t border-[#ded8cc] bg-[#ebe5d9] py-16">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-[#263831] font-display">Ready to get started?</h2>
          <p className="mt-4 text-[#68746f] leading-relaxed">
            Tell us what you are planning. We will confirm the right starting point and a path toward construction.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href={requestHref}
              className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: accentColor }}
            >
              Request this service <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/products" className="text-sm text-[#52645d] hover:text-[#263831] transition-colors">
              Browse all services
            </Link>
          </div>
          <p className="mt-6 text-xs text-[#78827e]">
            No payment is taken until Kealee confirms fit, scope, price, and timing.
          </p>
          <p className="mx-auto mt-3 max-w-xl text-xs leading-relaxed text-emerald-800">{PURCHASE_CREDIT_POLICY.shortCopy} {PURCHASE_CREDIT_POLICY.terms}</p>
        </div>
      </section>

    </div>
  )
}

function CatalogProductPage({ product }: { product: PublicCatalogProduct }) {
  const requestHref = serviceRequestHref(product.key, product.name)
  const availability = getProductAvailability(product.key)
  const startHref = availability === 'online' ? product.startHref : requestHref
  const isDetailedEstimate = product.key === 'detailed_estimate'
  const heroMedia = getProductHeroMedia(product.key, product.name, product.categoryId, product.sampleAsset)
  const price = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format((product.priceCents ?? 0) / 100)

  return (
    <main className="min-h-screen bg-white pb-24 lg:pb-0">
      <EditorialVideoHero eyebrow={product.categoryId.replaceAll('-', ' ')} title={product.name} description={product.outcome} videoSrc={heroMedia.videoSrc} poster={heroMedia.poster} primary={{ label: availability === 'online' ? `Start online · ${price}` : 'Request this service', href: startHref }} secondary={{ label: isDetailedEstimate ? 'See platform estimate examples' : 'See project examples', href: isDetailedEstimate ? '#platform-estimate-examples' : '/gallery' }} />
      <section className="hidden border-b border-slate-800 bg-[#10213d] px-4 py-16 text-white sm:px-6 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <Link href={`/products#${product.categoryId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-white/65 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back to catalog
            </Link>
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-orange-300">{product.categoryId.replaceAll('-', ' ')}</p>
            <h1 className="mt-3 max-w-3xl font-display text-4xl font-black sm:text-5xl">{product.name}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/75">{product.outcome}</p>
            <div className="mt-7 flex flex-wrap items-center gap-5">
              <span className="font-display text-xl font-black text-orange-300">Scope confirmation required</span>
              <span className="inline-flex items-center gap-2 text-sm text-white/65"><Clock className="h-4 w-4" /> Timing confirmed after review</span>
            </div>
            <Link href={requestHref} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#E8724B] px-7 py-3.5 font-bold text-white transition hover:bg-[#d65f39]">
              Request this service <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/15 bg-white p-3 shadow-2xl">
            <Image src={product.sampleAsset} alt={product.sampleAlt} width={1200} height={760} priority className="h-auto w-full rounded-xl" />
            <p className="px-2 pb-1 pt-3 text-xs leading-relaxed text-slate-500">Representative sample format—not a customer-specific result. Final content depends on submitted information, available sources, and purchased scope.</p>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border-2 border-teal-200 bg-gradient-to-br from-white to-teal-50 p-7 shadow-sm">
            <h2 className="font-display text-2xl font-bold text-slate-950">What you receive</h2>
            <ul className="mt-5 space-y-3">
              {product.includes.map(item => <li key={item} className="flex gap-3 text-sm leading-relaxed text-slate-600"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />{item}</li>)}
            </ul>
          </div>
          <div className="rounded-2xl border-2 border-yellow-300 bg-gradient-to-br from-white to-yellow-50 p-7 shadow-sm">
            <h2 className="font-display text-2xl font-bold text-slate-950">What we need</h2>
            <ul className="mt-5 space-y-3">
              {product.customerProvides.map(item => <li key={item} className="flex gap-3 text-sm leading-relaxed text-slate-600"><FileInput className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />{item}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Three steps</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-slate-950">From intake to a usable decision</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              ['01', 'Submit project information', product.customerProvides.join(', ') + '.'],
              ['02', 'Kealee prepares and reviews', `We organize the purchased scope and prepare the ${product.name.toLowerCase()} with stated assumptions and source labels.`],
              ['03', 'Download and advance', product.nextStep],
            ].map(([number, title, copy]) => (
              <article key={number} className="rounded-2xl border border-slate-200 bg-white p-6">
                <span className="text-sm font-black text-orange-600">{number}</span>
                <h3 className="mt-3 font-display text-lg font-bold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {isDetailedEstimate ? <DetailedEstimateExamples /> : <ServiceExamplesGallery serviceKey={product.key} />}

      <section className="px-4 py-16 text-center sm:px-6">
        <h2 className="font-display text-3xl font-bold text-slate-950">Ready to begin?</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">{availability === 'online' ? 'Complete the online intake, pay securely, and receive the finished estimate through your Kealee portal.' : 'No payment is taken. Kealee will confirm suitability, scope, timing, and price before sending a private intake.'}</p>
        <Link href={startHref} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#E8724B] px-7 py-3.5 font-bold text-white hover:bg-[#d65f39]">
          {availability === 'online' ? `Start online · ${price}` : `Request ${product.name}`} <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="mx-auto mt-4 max-w-2xl text-xs leading-relaxed text-emerald-800">{PURCHASE_CREDIT_POLICY.shortCopy} {PURCHASE_CREDIT_POLICY.terms}</p>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(15,23,42,.08)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
          <div><p className="text-xs text-slate-500">{product.name}</p><p className="font-bold text-slate-950">{availability === 'online' ? price : 'Scope confirmation required'}</p></div>
          <Link href={startHref} className="rounded-xl bg-[#E8724B] px-5 py-3 text-sm font-bold text-white">{availability === 'online' ? 'Start online' : 'Request service'}</Link>
        </div>
      </div>
    </main>
  )
}

const ESTIMATE_EXAMPLES = [
  {
    title: 'Kitchen renovation estimate',
    scope: 'Existing kitchen demolition, new cabinetry, counters, finishes, plumbing and electrical allowances',
    total: '$78,400–$92,600',
    rows: [['Selective demolition', '1 LS', '$6,800'], ['Cabinetry and millwork', '32 LF', '$24,960'], ['Electrical and lighting', '1 LS', '$9,450'], ['Plumbing and fixtures', '1 LS', '$8,900']],
  },
  {
    title: 'Rear addition estimate',
    scope: 'Foundation, framing, envelope, MEP extensions and interior finish planning',
    total: '$186,000–$224,000',
    rows: [['Sitework and concrete', '420 SF', '$38,600'], ['Structural framing', '420 SF', '$46,200'], ['Exterior envelope', '1 LS', '$31,800'], ['MEP extensions', '1 LS', '$27,500']],
  },
  {
    title: 'Whole-home renovation estimate',
    scope: 'Trade-organized planning range with quantities, allowances, exclusions and risk notes',
    total: '$312,000–$378,000',
    rows: [['Interior construction', '2,450 SF', '$84,300'], ['Mechanical systems', '1 LS', '$42,700'], ['Electrical systems', '1 LS', '$36,900'], ['Finish allowance', '2,450 SF', '$96,500']],
  },
] as const

function DetailedEstimateExamples() {
  return <section id="platform-estimate-examples" className="scroll-mt-20 border-y border-slate-200 bg-slate-50 px-4 py-16 sm:px-6">
    <div className="mx-auto max-w-6xl">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Platform-generated sample output</p>
      <h2 className="mt-3 max-w-3xl font-display text-3xl font-bold text-slate-950">See the estimate structure customers receive.</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Representative, anonymized examples showing Kealee’s trade breakdown, measured basis, planning cost and scope assumptions. These are sample outputs—not bids or guaranteed prices.</p>
      <div className="mt-9 grid gap-5 lg:grid-cols-3">
        {ESTIMATE_EXAMPLES.map(example => <article key={example.title} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-[#10213d] p-5 text-white">
            <h3 className="font-display text-lg font-bold">{example.title}</h3>
            <p className="mt-2 text-xs leading-5 text-slate-300">{example.scope}</p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 border-b border-slate-200 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400"><span>Trade</span><span>Basis</span><span>Planning cost</span></div>
            {example.rows.map(row => <div key={row[0]} className="grid grid-cols-[1fr_auto_auto] gap-x-3 border-b border-slate-100 py-3 text-xs text-slate-600"><span className="font-semibold text-slate-800">{row[0]}</span><span>{row[1]}</span><span>{row[2]}</span></div>)}
            <div className="mt-4 flex items-end justify-between gap-4"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total planning range</span><strong className="text-lg text-emerald-700">{example.total}</strong></div>
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-[11px] leading-5 text-amber-900">Includes explicit assumptions, allowances, exclusions, regional source basis and risk notes in the delivered report.</p>
          </div>
        </article>)}
      </div>
    </div>
  </section>
}

const CAPABILITY_LABELS: Record<string, string> = {
  design: 'Design direction and concept options',
  estimate: 'Expected cost range and major cost groups',
  zoning: 'Property and zoning considerations',
  permit: 'Plain-language permit roadmap',
  contractor: 'Contractor-selection guidance',
  sales: 'Scope and decision support',
  project: 'Prioritized homeowner next steps',
}

const CUSTOMER_TYPE_COPY: Record<RevenueProductConfig['customerType'], { eyebrow: string; subtitle: string; cta: string; steps: string[]; recipientLabel: string }> = {
  homeowner: {
    eyebrow: 'Preliminary project planning',
    subtitle: 'Bring design, cost, property, and approval questions into one understandable homeowner plan before committing to construction.',
    cta: 'Plan my project',
    steps: ['Tell us about your property and goals', 'Review your recommended scope before payment', 'Receive one homeowner report with prioritized next steps'],
    recipientLabel: 'homeowner report',
  },
  contractor: {
    eyebrow: 'Bid-ready project intelligence',
    subtitle: 'Get a scoped estimate, zoning check, and permit roadmap for a client project so you can bid with confidence and move straight to submission.',
    cta: 'Order project package',
    steps: ['Tell us about the client property and scope', 'Review the recommended workflow before payment', 'Receive one contractor package with estimate, zoning, and permit roadmap'],
    recipientLabel: 'contractor package',
  },
  developer: {
    eyebrow: 'Development feasibility intelligence',
    subtitle: 'Get zoning, cost, and permit feasibility on a property or portfolio before you commit capital or submit an entitlement application.',
    cta: 'Order feasibility package',
    steps: ['Tell us about the property or portfolio and goals', 'Review the recommended workflow before payment', 'Receive one feasibility package with prioritized next steps'],
    recipientLabel: 'feasibility package',
  },
}

function revenueProductIntakeHref(productKey: RevenueProductConfig['productKey']) {
  if (productKey === 'home-project-readiness-review') {
    return '/request-service?service=home-project-readiness-review&name=Project+Clarity+Review'
  }
  const paths: Record<RevenueProductConfig['productKey'], string> = {
    'home-project-readiness-review': '/intake/whole_home_concept',
    'project-launch-package': '/intake/design_build',
    'contractor-estimate-permit-package': '/intake/contractor_match',
    'developer-feasibility-express': '/intake/development_feasibility',
  }
  return `${paths[productKey]}?product=${encodeURIComponent(productKey)}`
}

function RevenueProductPage({ product }: { product: RevenueProductConfig }) {
  const price = product.priceCents === 0
    ? 'Free'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(product.priceCents / 100)
  const copy = CUSTOMER_TYPE_COPY[product.customerType]
  const intakeHref = revenueProductIntakeHref(product.productKey)
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Service', name: product.name,
    provider: { '@type': 'Organization', name: 'Kealee', url: 'https://kealee.com' },
    audience: { '@type': 'Audience', audienceType: product.customerType },
    offers: { '@type': 'Offer', price: (product.priceCents / 100).toFixed(2), priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
  }
  return <main className="min-h-screen bg-slate-50">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <EditorialVideoHero eyebrow={copy.eyebrow} title={product.name} description={copy.subtitle} videoSrc={product.customerType === 'developer' ? '/media/service-heroes/developer-feasibility-request.mp4' : product.customerType === 'contractor' ? '/media/portal-phase4/contractor-site.mp4' : '/media/service-heroes/project-planning-request.mp4'} poster={product.customerType === 'developer' ? '/media/service-heroes/developer-feasibility-request.jpg' : product.customerType === 'contractor' ? '/media/portal-phase4/contractor-site.jpg' : '/media/service-heroes/project-planning-request.jpg'} primary={{ label: copy.cta, href: intakeHref }} secondary={{ label: 'See project examples', href: '/gallery' }}>
      <p className="mt-7 text-xl font-black text-[#263831]">{price}</p>
    </EditorialVideoHero>
    <section className="hidden bg-[#10213f] px-4 py-16 text-white sm:py-20">
      <div className="mx-auto max-w-4xl">
        <Link href="/products" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"><ArrowLeft className="h-4 w-4" /> All planning services</Link>
        <p className="mt-10 text-xs font-bold uppercase tracking-[0.2em] text-orange-300">{copy.eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-black sm:text-5xl">{product.name}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">{copy.subtitle}</p>
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <Link href={intakeHref} className="rounded-xl bg-[#f36b2b] px-6 py-3.5 text-base font-extrabold text-white">{copy.cta}</Link>
          <span className="text-2xl font-black">{price}</span>
          <span className="text-sm text-slate-300">Complete the intake first; payment follows the submitted project details.</span>
        </div>
      </div>
    </section>
    <div className="mx-auto max-w-4xl px-4 py-12">
      <section aria-labelledby="included-heading" className="rounded-2xl border-2 border-teal-200 bg-gradient-to-br from-white to-teal-50 p-6 shadow-sm">
        <h2 id="included-heading" className="text-xl font-bold text-slate-900">What you receive</h2>
        <ul className="mt-5 space-y-3">{product.botTypes.map(capability => <li key={capability} className="flex gap-3 text-sm leading-6 text-slate-700"><CheckCircle className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />{CAPABILITY_LABELS[capability] ?? 'Project planning support'}</li>)}</ul>
      </section>
      <section aria-labelledby="next-heading" className="mt-6 rounded-2xl border-2 border-yellow-300 bg-gradient-to-br from-white to-yellow-50 p-6 shadow-sm">
        <h2 id="next-heading" className="text-xl font-bold text-slate-900">What happens next</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-3">
          {copy.steps.map((step, index) => <li key={step} className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700"><span className="mb-2 block font-bold text-orange-600">Step {index + 1}</span>{step}</li>)}
        </ol>
      </section>
    </div>
    <ServiceExamplesGallery serviceKey={product.productKey} />
  </main>
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
