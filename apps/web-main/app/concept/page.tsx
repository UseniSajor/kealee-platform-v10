'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { ArrowRight, Check } from 'lucide-react'
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
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-widest text-[#E8724B] mb-2">Step 1 of 4</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">What are you designing?</h1>
        <p className="text-slate-500">Choose a project type to get started. AI concept delivered in 3–5 days.</p>
      </div>

      {/* Service grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
        {services.map((svc) => {
          const isSelected = selected === svc.slug
          return (
            <button
              key={svc.slug}
              type="button"
              onClick={() => setSelected(svc.slug)}
              className={`group relative flex items-center gap-5 rounded-2xl border-2 p-5 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E8724B] focus:ring-offset-2 ${
                isSelected
                  ? 'border-[#E8724B] bg-orange-50 shadow-md shadow-orange-100/50'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md shadow-sm'
              }`}
            >
              {/* Round image */}
              <div className={`relative w-14 h-14 rounded-full overflow-hidden shrink-0 ring-2 transition-all ${
                isSelected ? 'ring-[#E8724B]' : 'ring-slate-200 group-hover:ring-slate-300'
              }`}>
                <Image
                  src={svc.heroImage}
                  alt={svc.label}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm mb-0.5 ${isSelected ? 'text-[#E8724B]' : 'text-slate-900'}`}>
                  {svc.label}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {svc.description.slice(0, 72)}…
                </p>
              </div>

              {/* Check circle */}
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                isSelected ? 'border-[#E8724B] bg-[#E8724B]' : 'border-slate-200 group-hover:border-slate-300'
              }`}>
                {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </div>
            </button>
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
