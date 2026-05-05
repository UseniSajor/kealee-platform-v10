'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, Clock, PlayCircle } from 'lucide-react'
import { getConceptServices } from '@/lib/services-config'

function ConceptStep1Inner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selected, setSelected] = useState(searchParams.get('service') ?? '')
  const services = getConceptServices()

  function handleNext() {
    if (!selected) return
    router.push(`/concept/details?service=${selected}`)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#E8724B] mb-2">Step 1 of 4</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">What are you designing?</h1>
        <p className="text-slate-500">
          Choose a project type to get started. Your design package — AI-generated renders, cost estimate, and permit scope — delivered in 2–6 days.
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
              onClick={() => setSelected(svc.slug)}
              onKeyDown={(e) => e.key === 'Enter' && setSelected(svc.slug)}
              className={`group flex flex-col rounded-2xl border-2 overflow-hidden cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E8724B] focus:ring-offset-2 ${
                isSelected
                  ? 'border-[#E8724B] shadow-xl shadow-orange-100/60'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg shadow-sm'
              }`}
            >
              {/* Image / Video zone */}
              <div className="relative h-48 shrink-0 overflow-hidden bg-slate-100">
                <Image
                  src={svc.heroImage}
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
              <div className={`px-4 py-3 border-t flex items-center justify-between ${
                isSelected ? 'bg-[#E8724B]/5 border-[#E8724B]/20' : 'bg-slate-50 border-slate-100'
              }`}>
                <span className={`text-xs font-bold ${isSelected ? 'text-[#E8724B]' : 'text-slate-400'}`}>
                  {isSelected ? 'Selected' : 'Select this project'}
                </span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected ? 'border-[#E8724B] bg-[#E8724B]' : 'border-slate-300 group-hover:border-slate-400'
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* CTA */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleNext}
          disabled={!selected}
          className="flex items-center gap-2 bg-[#E8724B] hover:bg-[#D45C33] active:bg-[#C04820] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold px-8 py-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg shadow-orange-200 disabled:shadow-none"
        >
          Continue to Details <ArrowRight className="w-4 h-4" />
        </button>
        {!selected && (
          <p className="text-sm text-slate-400">Select a project type to continue</p>
        )}
      </div>
    </div>
  )
}

export default function ConceptPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-4 border-[#E8724B] border-t-transparent animate-spin" />
      </div>
    }>
      <ConceptStep1Inner />
    </Suspense>
  )
}
