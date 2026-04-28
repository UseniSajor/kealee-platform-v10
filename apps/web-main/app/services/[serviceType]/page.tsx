import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2, Clock, ArrowRight, Shield, DollarSign, Video, Play } from 'lucide-react'
import { SERVICES, SERVICE_MAP } from '@/lib/services-config'
import { SERVICE_DELIVERABLES } from '@/lib/service-deliverables'

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
  return {
    title: `${svc.label} — Kealee`,
    description: svc.description,
    openGraph: {
      title: `${svc.label} — Kealee`,
      description: svc.description,
      images: [{ url: svc.heroImage }],
    },
  }
}

export function generateStaticParams() {
  return SERVICES.map((s) => ({ serviceType: s.slug }))
}

const PROCESS_STEPS = [
  { step: '01', title: 'Choose Your Package', desc: 'Select Basic, Premium, or Premium+ based on your goals.' },
  { step: '02', title: 'Submit Intake', desc: 'Fill out a short form about your project — takes 3 minutes.' },
  { step: '03', title: 'AI + Staff Review', desc: 'AI generates renders and specs, then a Kealee specialist reviews.' },
  { step: '04', title: 'Delivery & Consult', desc: 'Receive your full package with a 30-min consultation call.' },
]

function TierCard({
  tier,
  serviceSlug,
  isNew,
}: {
  tier: { tier: number; name: string; price: number; available: boolean; video: boolean; badge?: string; videoDeliverables?: string[] }
  serviceSlug: string
  isNew?: boolean
}) {
  if (!tier.available) return null

  const isPremium = tier.tier === 2
  const isPremiumPlus = tier.tier === 3

  return (
    <div
      className={`relative rounded-2xl border p-6 flex flex-col ${
        isPremium
          ? 'border-[#E8724B] shadow-lg shadow-orange-100 bg-white ring-2 ring-[#E8724B]/20'
          : 'border-slate-200 bg-white shadow-sm'
      }`}
    >
      {tier.badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#E8724B] text-white text-xs font-bold px-3 py-1">
          {tier.badge}
        </span>
      )}

      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{tier.name}</p>
        <p className="text-4xl font-black text-slate-900">
          ${tier.price.toLocaleString()}
        </p>
        <p className="text-sm text-slate-500 mt-1">one-time</p>
      </div>

      {/* Video badge */}
      {tier.video && (
        <div className="flex items-center gap-1.5 rounded-lg bg-orange-50 border border-orange-100 px-3 py-2 mb-4">
          <Video className="w-4 h-4 text-[#E8724B]" />
          <span className="text-xs font-semibold text-[#E8724B]">Includes AI Video</span>
        </div>
      )}

      {/* Video deliverables */}
      {tier.videoDeliverables && (
        <ul className="space-y-1.5 mb-5">
          {tier.videoDeliverables.map((d) => (
            <li key={d} className="flex items-start gap-2 text-xs text-slate-600">
              <Play className="w-3 h-3 text-[#E8724B] shrink-0 mt-0.5" />
              {d}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-4">
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

  const deliverable = SERVICE_DELIVERABLES[svc.intakePath]
  const includes = deliverable?.includes ?? svc.features
  const availableTiers = svc.tiers.filter((t) => t.available)
  const minPrice = availableTiers[0]?.price ?? 0

  // If New Construction, redirect to its custom flow
  if (!svc.usesConceptIntake) {
    return (
      <>
        {/* Hero for New Construction */}
        <section className="relative bg-[#1A2B4A] py-24 px-4 overflow-hidden">
          <div className="absolute inset-0">
            <Image src={svc.heroImage} alt={svc.label} fill className="object-cover opacity-20" />
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
          <Image
            src={svc.heroImage}
            alt={svc.label}
            fill
            className="object-cover opacity-25"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A2B4A]/90 via-[#1A2B4A]/80 to-[#E8724B]/30" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-4">
            {svc.category} · {svc.deliveryDays}
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
              <Clock className="w-4 h-4" /> {svc.deliveryDays}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">
              <DollarSign className="w-4 h-4" /> From ${minPrice.toLocaleString()}
            </span>
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
            <p className="mt-3 text-slate-500">All packages include staff review and 30-min consultation.</p>
          </div>

          <div className={`grid gap-6 ${availableTiers.length === 3 ? 'md:grid-cols-3' : availableTiers.length === 2 ? 'md:grid-cols-2 max-w-2xl mx-auto' : 'max-w-sm mx-auto'}`}>
            {svc.tiers.map((tier) => (
              <TierCard key={tier.tier} tier={tier} serviceSlug={svc.slug} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. What's Included ─────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">What's Included</h2>
          <p className="text-slate-500 mb-8">Every deliverable reviewed by a Kealee specialist before delivery.</p>
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

      {/* ── 4. Cost & Timeline ─────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-slate-50">
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
            {PROCESS_STEPS.map((step) => (
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
          AI-designed concept with professional video, cost estimate, and permit roadmap — delivered in {svc.deliveryDays}.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/concept?service=${svc.slug}`}
            className="inline-flex items-center justify-center gap-2 bg-white text-[#E8724B] hover:bg-orange-50 font-bold px-8 py-4 rounded-xl shadow-lg transition-all duration-200 hover:-translate-y-0.5"
          >
            Start My {svc.shortLabel} Concept <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/gallery"
            className="inline-flex items-center justify-center gap-2 border-2 border-white/50 hover:border-white text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200"
          >
            Browse All Services
          </Link>
        </div>
      </section>
    </>
  )
}
