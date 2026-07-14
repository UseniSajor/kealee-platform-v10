import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2, Clock, ArrowRight, Shield, Video, FileText, Image as ImageIcon, Table2, Layers, Star, LayoutTemplate, Zap, PlayCircle, Phone, Lock } from 'lucide-react'
import { SERVICES, SERVICE_MAP } from '@/lib/services-config'
import { SERVICE_DELIVERABLES } from '@/lib/service-deliverables'
import {
  getIncludedSectionBlurb,
  getServicePricingBlurb,
  getServiceProcessSteps,
  getServiceVideoFallbackCopy,
} from '@/lib/service-page-copy'
import { getServiceMedia } from '@/lib/marketing/service-media'
import { ServiceHeroMedia } from '@/components/marketing/ServiceHeroMedia'
import {
  getServiceTierItemsForUi,
  withConsultationIcon,
} from '@/lib/concept-package-deliverables-ui'

interface Params {
  serviceType: string
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { serviceType } = await params
  const svc = SERVICE_MAP[serviceType]
  if (!svc) return { title: 'Service Not Found' }
  const media = await getServiceMedia(serviceType)
  const heroImage = media?.heroImage ?? svc.heroImage
  return {
    title: `${svc.label} — Kealee`,
    description: svc.description,
    openGraph: {
      title: `${svc.label} — Kealee`,
      description: svc.description,
      images: [{ url: heroImage }],
    },
  }
}

export function generateStaticParams() {
  return SERVICES.map((s) => ({ serviceType: s.slug }))
}

function TierCard({
  tier,
  serviceSlug,
  deliverableLabel,
  deliveryDays,
}: {
  tier: { tier: number; name: string; price: number; available: boolean; video: boolean; badge?: string }
  serviceSlug: string
  deliverableLabel: string
  deliveryDays: string
}) {
  if (!tier.available) return null

  const isPremium = tier.tier === 2
  const tierKey = tier.tier as 1 | 2 | 3
  const deliverables =
    tierKey === 3
      ? withConsultationIcon(getServiceTierItemsForUi(serviceSlug)[3])
      : getServiceTierItemsForUi(serviceSlug)[tierKey]

  return (
    <div
      className={`relative rounded-2xl border flex flex-col overflow-hidden ${
        isPremium
          ? 'border-[#E8724B] shadow-lg shadow-orange-100 bg-white ring-2 ring-[#E8724B]/20'
          : 'border-slate-200 bg-white shadow-sm'
      }`}
    >
      {tier.badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#E8724B] text-white text-xs font-bold px-3 py-1 z-10">
          {tier.badge}
        </span>
      )}

      {/* Header */}
      <div className="px-6 pt-7 pb-5 border-b border-slate-100">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{tier.name}</p>
        <p className="text-3xl font-black text-slate-900 mt-1">
          ${tier.price.toLocaleString()}
          <span className="text-sm font-normal text-slate-400 ml-1">one-time</span>
        </p>
        <p className="text-xs text-slate-500 mt-1">{deliverableLabel} · Delivered in {deliveryDays}</p>
      </div>

      {/* Deliverables */}
      <div className="px-6 py-5 flex-1 space-y-3">
        {deliverables.map((item, i) => {
          const Icon = item.icon
          return (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full ${item.color} flex items-center justify-center shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-sm text-slate-700 leading-snug">{item.label}</p>
            </div>
          )
        })}
      </div>

      {/* CTA */}
      <div className="px-6 pb-6">
        <Link
          href={`/concept?service=${serviceSlug}&tier=${tier.tier}`}
          className={`flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-bold transition-all duration-200 ${
            isPremium
              ? 'bg-[#E8724B] hover:bg-[#D45C33] text-white shadow-md shadow-orange-200'
              : 'bg-slate-900 hover:bg-slate-700 text-white'
          }`}
        >
          Get Started <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-xs text-slate-400 text-center mt-3">Pricing revealed at checkout — no commitment until then</p>
      </div>
    </div>
  )
}

export default async function ServicePage({
  params,
}: {
  params: Promise<Params>
}) {
  const { serviceType } = await params
  const svc = SERVICE_MAP[serviceType]
  if (!svc) notFound()

  const media = await getServiceMedia(serviceType)
  const heroImage = media?.heroImage ?? svc.heroImage
  const heroVideo = media?.heroVideo
  const heroVideoWebM = media?.heroVideoWebM
  const beforeImage = media?.beforeImage

  const deliverable = SERVICE_DELIVERABLES[svc.intakePath]
  const includes = deliverable?.includes ?? svc.features
  const availableTiers = svc.tiers.filter((t) => t.available)
  const processSteps = getServiceProcessSteps(svc.slug)
  const videoFallback = getServiceVideoFallbackCopy(svc.slug, svc.label)
  const pricingBlurb = getServicePricingBlurb(svc.slug)
  const includedBlurb = getIncludedSectionBlurb(svc.slug)

  // Per-service AI-generated showcase video (grounded in each service type via
  // the Kealee platform pipeline). Keyed by slug so every service page has its
  // own clip; falls back to category footage if a per-service file is absent.
  // Only slugs with a rendered file are listed; the rest fall back to category
  // footage. deck / design-services / new-construction are pending a Replicate
  // credit top-up and will be added here once generated.
  const SERVICE_VIDEO: Record<string, string> = {
    kitchen:       '/media/service-videos/kitchen.mp4',
    bathroom:      '/media/service-videos/bathroom.mp4',
    garden:        '/media/service-videos/garden.mp4',
    addition:      '/media/service-videos/addition.mp4',
    'whole-house': '/media/service-videos/whole-house.mp4',
    interior:      '/media/service-videos/interior.mp4',
    facade:        '/media/service-videos/facade.mp4',
  }
  // Real construction footage fallback by category — ensures every service page
  // has playing video marketing even without a per-service promo clip.
  const CATEGORY_VIDEO: Record<string, string> = {
    design:       '/media/service-videos/home-design-video.mp4',
    remodel:      '/media/service-videos/home-design-video.mp4',
    addition:     '/media/service-videos/home-build-video.mp4',
    construction: '/media/service-videos/home-build-video.mp4',
    landscape:    '/media/service-videos/home-build-video.mp4',
  }
  const showcaseVideo = heroVideo ?? SERVICE_VIDEO[svc.slug] ?? CATEGORY_VIDEO[svc.category]

  // If New Construction, redirect to its custom flow
  if (!svc.usesConceptIntake) {
    return (
      <>
        {/* Hero for New Construction */}
        <section className="relative bg-[#1A2B4A] py-24 px-4 overflow-hidden">
          <div className="absolute inset-0">
            <Image src={heroImage} alt={svc.label} fill className="object-cover opacity-20" />
          </div>
          <div className="relative mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-4">{svc.category}</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-5">{svc.label}</h1>
            <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto">{svc.description}</p>
            <Link
              href={svc.customIntakePath ?? '/contact'}
              className="inline-flex items-center gap-2 bg-[#E8724B] hover:bg-[#D45C33] text-white font-bold px-8 py-4 rounded-xl shadow-lg transition-all duration-200"
            >
              Get a Custom Quote <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-4 bg-white">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">What's Included</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {svc.features.map((f) => (
                <div key={f} className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 border border-slate-100">
                  <CheckCircle2 className="w-5 h-5 text-[#E8724B] shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      {/* ── 1. Hero ────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#1A2B4A] py-24 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <ServiceHeroMedia
            heroImage={heroImage}
            beforeImage={beforeImage}
            heroVideo={heroVideo}
            heroVideoWebM={heroVideoWebM}
            alt={svc.label}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A2B4A]/90 via-[#1A2B4A]/80 to-[#E8724B]/30" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-4">
            {svc.deliverableLabel} · {svc.deliveryDays}
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight">
            {svc.label}
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
            {svc.description}
          </p>

          {/* Chips */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">
              <Clock className="w-4 h-4" /> {svc.deliverableLabel} in {svc.deliveryDays}
            </span>
            {svc.timeline && svc.timeline !== 'Custom' && svc.timeline !== 'Design fee only' && (
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm text-white/70">
                Renovation: {svc.timeline}
              </span>
            )}
            {svc.permits > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">
                <Shield className="w-4 h-4" /> Permit scope included
              </span>
            )}
          </div>

          <Link
            href={`/concept?service=${svc.slug}`}
            className="inline-flex items-center gap-2 bg-[#E8724B] hover:bg-[#D45C33] text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-orange-500/30 transition-all duration-200 hover:-translate-y-0.5"
          >
            Get Your {svc.shortLabel} Concept <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── 2. Tier Pricing ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-[#E8724B] mb-3">Pricing</p>
            <h2 className="text-3xl font-bold text-slate-900">Choose Your Package</h2>
            <p className="mt-3 text-slate-500">{pricingBlurb}</p>
          </div>

          <div className={`grid gap-6 ${availableTiers.length === 3 ? 'md:grid-cols-3' : availableTiers.length === 2 ? 'md:grid-cols-2 max-w-2xl mx-auto' : 'max-w-sm mx-auto'}`}>
            {svc.tiers.map((tier) => (
              <TierCard key={tier.tier} tier={tier} serviceSlug={svc.slug} deliverableLabel={svc.deliverableLabel} deliveryDays={svc.deliveryDays} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. What's Included ─────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">What's Included</h2>
          <p className="text-slate-500 mb-8">{includedBlurb}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {includes.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 border border-slate-100"
              >
                <CheckCircle2 className="w-5 h-5 text-[#E8724B] shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3.5 Video Advertisement ──────────────────────────────────────── */}
      <section className="relative bg-[#0f1c30] py-16 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <Image src={svc.heroImage} alt="" fill className="object-cover opacity-10" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f1c30]/95 to-[#1A2B4A]/80" />
        </div>
        <div className="relative mx-auto max-w-4xl">
          {svc.promoVideoId ? (
            <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <iframe
                src={`https://www.youtube.com/embed/${svc.promoVideoId}?rel=0&modestbranding=1&color=white`}
                title={`${svc.label} — Kealee Design Overview`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : showcaseVideo ? (
            <div>
              <div className="text-center mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-2">Video Overview</p>
                <h2 className="text-2xl font-bold text-white">{videoFallback.headline}</h2>
                <p className="text-slate-400 max-w-lg mx-auto text-sm mt-2 leading-relaxed">{videoFallback.body}</p>
              </div>
              <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-black">
                <video
                  src={showcaseVideo}
                  poster={heroImage}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
                <Link
                  href={`/concept?service=${svc.slug}`}
                  className="inline-flex items-center gap-2 bg-[#E8724B] hover:bg-[#D45C33] text-white font-bold px-6 py-3 rounded-xl transition text-sm"
                >
                  Start Your Design <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/gallery"
                  className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white/70 hover:text-white font-semibold px-6 py-3 rounded-xl transition text-sm"
                >
                  Browse Project Gallery
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-5">
                <PlayCircle className="w-10 h-10 text-white/70" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-3">Video Overview</p>
              <h2 className="text-2xl font-bold text-white mb-3">{videoFallback.headline}</h2>
              <p className="text-slate-400 max-w-lg mx-auto text-sm mb-6 leading-relaxed">{videoFallback.body}</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href={`/concept?service=${svc.slug}`}
                  className="inline-flex items-center gap-2 bg-[#E8724B] hover:bg-[#D45C33] text-white font-bold px-6 py-3 rounded-xl transition text-sm"
                >
                  Start Your Design <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/gallery"
                  className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white/70 hover:text-white font-semibold px-6 py-3 rounded-xl transition text-sm"
                >
                  Browse Project Gallery
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 4. Cost & Timeline ─────────────────────────────────────────────── */}
      <section id="build" className="py-16 px-4 bg-slate-50">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Project Cost &amp; Timeline</h2>
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
            <div className="grid sm:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Typical Cost</p>
                <p className="text-2xl font-black text-[#E8724B]">{svc.costRange}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Build Timeline</p>
                <p className="text-2xl font-black text-slate-900">{svc.timeline}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Permits Needed</p>
                <p className="text-2xl font-black text-slate-900">
                  {svc.permits > 0 ? `~${svc.permits}` : 'None'}
                </p>
              </div>
            </div>
            {svc.permits > 0 && (
              <p className="mt-5 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700">
                This project typically requires {svc.permits} permit{svc.permits !== 1 ? 's' : ''}. Your package includes a permit scope brief.{' '}
                <Link href="/intake/permit_path_only" className="font-semibold underline">
                  Need full permit filing? →
                </Link>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── 5. Process ─────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-10 text-center">How It Works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step) => (
              <div key={step.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#1A2B4A] text-sm font-black text-white">
                  {step.step}
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">{step.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Final CTA ───────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#E8724B] to-[#D45C33] text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready to get your {svc.label}?
        </h2>
        <p className="text-orange-100 text-lg mb-8 max-w-xl mx-auto">
          Your {svc.deliverableLabel.toLowerCase()}
          {' — '}
          assisted by AI tools with renders
          {svc.permits > 0 ? ', cost estimate, and permit scope' : ' and documented design direction'}
          {' — '}
          delivered in {svc.deliveryDays}.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/concept?service=${svc.slug}`}
            className="inline-flex items-center justify-center gap-2 bg-white text-[#E8724B] hover:bg-orange-50 font-bold px-8 py-4 rounded-xl shadow-lg transition-all duration-200 hover:-translate-y-0.5"
          >
            Start My {svc.shortLabel} Concept <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/services"
            className="inline-flex items-center justify-center gap-2 border-2 border-white/50 hover:border-white text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200"
          >
            Explore all services
          </Link>
        </div>
      </section>
    </>
  )
}
