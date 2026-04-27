import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle, Clock, Zap, ArrowRight, Shield, Wrench } from 'lucide-react'
import { SERVICES, SERVICE_BY_SLUG } from '@/config/services'
import { MediaShowcase } from '@/components/MediaShowcase'
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
  const svc = SERVICE_BY_SLUG[serviceType]
  if (!svc) return { title: 'Service Not Found' }
  return {
    title: `${svc.label} — Kealee`,
    description: svc.description,
    openGraph: {
      title: svc.label,
      description: svc.tagline,
      images: svc.media.galleryImages[0]
        ? [{ url: svc.media.galleryImages[0].src }]
        : [],
    },
  }
}

export function generateStaticParams() {
  return SERVICES.map((s) => ({ serviceType: s.slug }))
}

const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Submit Intake',
    desc: 'Fill out a short form about your project. Takes 3 minutes.',
  },
  {
    step: '02',
    title: 'AI Concept Generation',
    desc: 'Our AI engine generates renders, BOM, and MEP specs within hours.',
  },
  {
    step: '03',
    title: 'Staff Review',
    desc: 'A Kealee design specialist reviews and refines every deliverable.',
  },
  {
    step: '04',
    title: 'Delivery & Consultation',
    desc: 'Receive your package and a 30-min consultation call.',
  },
]

const MEP_ICONS: Record<string, string> = {
  electrical: '⚡',
  plumbing: '🔧',
  hvac: '❄️',
  lighting: '💡',
}

export default async function ServicePage({
  params,
}: {
  params: Promise<Params>
}) {
  const { serviceType } = await params
  const svc = SERVICE_BY_SLUG[serviceType]
  if (!svc) notFound()

  const deliverable = SERVICE_DELIVERABLES[svc.key]

  return (
    <>
      {/* ── 1. Hero ────────────────────────────────────────────────────────── */}
      <section
        className={`bg-gradient-to-br ${svc.heroColor} py-20 px-4`}
      >
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white/80 mb-5">
            {svc.category} · {svc.deliveryDays}
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
            {svc.label}
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8">
            {svc.tagline}
          </p>

          {/* Chips */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">
              <Clock className="h-4 w-4" /> {svc.deliveryDays}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">
              <Zap className="h-4 w-4" /> {svc.priceDisplay}
            </span>
            {svc.permitRequired && (
              <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">
                <Shield className="h-4 w-4" /> Permit scope included
              </span>
            )}
          </div>

          <Link
            href={svc.intakePath}
            className="inline-flex items-center gap-2 rounded-xl bg-[#E8793A] px-8 py-4 text-base font-bold text-white shadow-lg hover:bg-orange-500 transition"
          >
            Get Your {svc.label} <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ── 2. Media ───────────────────────────────────────────────────────── */}
      <section className="bg-white py-14 px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">See the Work</h2>
          <MediaShowcase
            serviceKey={svc.key}
            media={svc.media}
            projectTitle={svc.label}
            layout="stacked"
          />
        </div>
      </section>

      {/* ── 3. What's Included ─────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-14 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">What's Included</h2>
          <p className="text-gray-500 mb-8">Every deliverable, reviewed by a Kealee specialist before delivery.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {(deliverable?.includes ?? svc.features).map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-xl bg-white p-4 border border-gray-100 shadow-sm"
              >
                <CheckCircle className="h-5 w-5 text-[#2ABFBF] shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-gray-800">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Process ─────────────────────────────────────────────────────── */}
      <section className="bg-white py-14 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-8 text-center">How It Works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROCESS_STEPS.map((step) => (
              <div key={step.step} className="text-center">
                <div
                  className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full text-sm font-black text-white"
                  style={{ backgroundColor: '#1A2B4A' }}
                >
                  {step.step}
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{step.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Cost & Timeline ─────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-14 px-4">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Cost &amp; Timeline</h2>
          <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm">
            <div className="grid sm:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Package Price</p>
                <p className="text-3xl font-black" style={{ color: '#E8793A' }}>{svc.priceDisplay}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Delivery</p>
                <p className="text-3xl font-black text-gray-900">{svc.deliveryDays}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Permit Required</p>
                <p className="text-3xl font-black" style={{ color: svc.permitRequired ? '#2563EB' : '#38A169' }}>
                  {svc.permitRequired ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
            {svc.permitRequired && (
              <p className="mt-5 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700">
                This project typically requires a building permit. Your package includes a permit scope brief.
                Need full permit filing?{' '}
                <Link href="/intake/permit_path_only" className="font-semibold underline">
                  Add permit services →
                </Link>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── 6. MEP Highlights ──────────────────────────────────────────────── */}
      <section className="bg-white py-14 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">MEP Highlights</h2>
          <p className="text-gray-500 mb-8">Key mechanical, electrical, plumbing, and lighting items covered in your package.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {svc.mepHighlights.map((item) => {
              const category = item.toLowerCase().includes('electric') || item.toLowerCase().includes('panel') || item.toLowerCase().includes('circuit') || item.toLowerCase().includes('outlet')
                ? 'electrical'
                : item.toLowerCase().includes('plumb') || item.toLowerCase().includes('valve') || item.toLowerCase().includes('hose') || item.toLowerCase().includes('water')
                ? 'plumbing'
                : item.toLowerCase().includes('hvac') || item.toLowerCase().includes('heat') || item.toLowerCase().includes('cool') || item.toLowerCase().includes('mini') || item.toLowerCase().includes('zone')
                ? 'hvac'
                : 'lighting'
              return (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3"
                >
                  <span className="text-xl">{MEP_ICONS[category]}</span>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-400 mr-2">
                      {category}
                    </span>
                    <span className="text-sm text-gray-800">{item}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 7. CTA Banner ──────────────────────────────────────────────────── */}
      <section className="bg-[#E8793A] py-16 px-4 text-center">
        <Wrench className="mx-auto h-10 w-10 text-white/60 mb-4" />
        <h2 className="text-3xl font-extrabold text-white mb-3">
          Ready to get your {svc.label}?
        </h2>
        <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
          {svc.description}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href={svc.intakePath}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-[#E8793A] shadow-lg hover:bg-orange-50 transition"
          >
            Start Your Project <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-white/40 px-8 py-4 text-base font-semibold text-white hover:bg-white/10 transition"
          >
            Browse Gallery
          </Link>
        </div>
      </section>
    </>
  )
}
