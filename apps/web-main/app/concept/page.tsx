'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, Clock, PlayCircle, FileCheck } from 'lucide-react'
import { getConceptServices } from '@/lib/services-config'
import { V30ConceptRedirect } from '@/components/v30/V30TrafficGate'
import { useCardMediaManifest, productHeroFromManifest } from '@/hooks/useCardMediaManifest'

function ConceptStep1Inner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selected, setSelected] = useState(searchParams.get('service') ?? '')
  const services = getConceptServices()
  const manifest = useCardMediaManifest()

  function goToService(slug: string) {
    if (!slug) return
    setSelected(slug)
    router.push(`/concept/details?service=${slug}`)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-[#E8724B]">Self-serve concept intake · Step 1 of 4</p>
          <Link href="/get-started" className="text-xs font-semibold text-slate-500 underline-offset-4 hover:text-[#E8724B] hover:underline">
            Not sure where to start?
          </Link>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">What are you designing?</h1>
        <p className="text-slate-500">
          Choose a project type to get started. Your design package — AI-generated renders, cost estimate, and permit scope — delivered in 2–6 days.{' '}
          <span className="text-slate-400">This is your planning package. Construction starts after permitting.</span>
        </p>
      </div>

      {/* Service grid — image-first cards with video overlay */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {services.map((svc) => {
          const isSelected = selected === svc.slug
          return (
            <div
              key={svc.slug}
              role="button"
              tabIndex={0}
              onClick={() => goToService(svc.slug)}
              onKeyDown={(e) => e.key === 'Enter' && goToService(svc.slug)}
              className={`group flex flex-col rounded-2xl border-2 overflow-hidden cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E8724B] focus:ring-offset-2 ${
                isSelected
                  ? 'border-[#E8724B] shadow-xl shadow-orange-100/60'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg shadow-sm'
              }`}
            >
              {/* Image / Video zone */}
              <div className="relative h-48 shrink-0 overflow-hidden bg-slate-100">
                <Image
                  src={productHeroFromManifest(manifest, svc.slug, svc.heroImage)}
                  alt={svc.label}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                {/* Deliverable badge — top left */}
                <span className="absolute top-3 left-3 rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-semibold text-white">
                  {svc.deliverableLabel}
                </span>

                {/* Selected checkmark — top right */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[#E8724B] flex items-center justify-center shadow-md">
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                )}

                {/* Watch overview — appears on hover, links to service page */}
                <Link
                  href={`/services/${svc.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 px-3 py-1.5 text-white text-xs font-semibold hover:bg-white/35 transition-all opacity-0 group-hover:opacity-100 duration-200 z-10"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  Watch Overview
                </Link>
              </div>

              {/* Content */}
              <div className={`flex-1 p-4 ${isSelected ? 'bg-orange-50' : 'bg-white'}`}>
                <h3 className={`font-bold text-sm mb-1 leading-tight ${isSelected ? 'text-[#E8724B]' : 'text-slate-900'}`}>
                  {svc.label}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">
                  {svc.description}
                </p>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-500">
                    {svc.deliverableLabel} · {svc.deliveryDays}
                  </span>
                </div>
                {svc.timeline && svc.timeline !== 'Custom' && svc.timeline !== 'Design fee only' && (
                  <p className="text-[11px] text-slate-400 mt-0.5 pl-5">Renovation: {svc.timeline}</p>
                )}
              </div>

              {/* Select footer */}
              <div className="px-4 py-3 border-t flex items-center justify-between bg-slate-50 border-slate-100 group-hover:bg-[#E8724B]/5 group-hover:border-[#E8724B]/20 transition-colors">
                <span className="text-xs font-bold text-slate-400 group-hover:text-[#E8724B] transition-colors">
                  Start this project
                </span>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#E8724B] group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Professional design note — shown below the service grid */}
      <div className="mb-8 rounded-xl bg-slate-50 border border-slate-200 px-5 py-4 flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-[#1A2B4A] flex items-center justify-center shrink-0 mt-0.5">
          <FileCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#1A2B4A] mb-1">Need Permit-Ready Plans?</p>
          <p className="text-sm text-slate-600 leading-relaxed">
            Start with a Concept Package — then upgrade to{' '}
            <strong className="text-slate-800">Professional Design</strong> (stamped drawings, engineer certification, permit-ready plan set) from{' '}
            <strong className="text-slate-800">$4,995</strong>.
            Your concept fee is credited toward the design package.
          </p>
          <Link href="/intake/professional_drawings" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#E8724B] hover:text-[#D45C33] transition-colors">
            Learn about Professional Design <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* CTA — selecting a project card takes you straight to the next step */}
      <p className="text-sm text-slate-400">Select a project above to continue to details.</p>
    </div>
  )
}

export default function ConceptPage() {
  return (
    <V30ConceptRedirect>
      <Suspense fallback={
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-[#E8724B] border-t-transparent animate-spin" />
        </div>
      }>
        <ConceptStep1Inner />
      </Suspense>
    </V30ConceptRedirect>
  )
}
