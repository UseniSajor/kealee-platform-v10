'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
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
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#E8724B] mb-2">Step 1 of 4</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Choose Your Project</h1>
        <p className="text-slate-500">What would you like to design or renovate?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {services.map((svc) => {
          const isSelected = selected === svc.slug
          return (
            <button
              key={svc.slug}
              type="button"
              onClick={() => setSelected(svc.slug)}
              className={`flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all duration-150 ${
                isSelected
                  ? 'border-[#E8724B] bg-orange-50'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                <Image
                  src={svc.heroImage}
                  alt={svc.label}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-bold ${isSelected ? 'text-[#E8724B]' : 'text-slate-900'}`}>
                    {svc.label}
                  </p>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-[#E8724B] shrink-0" />}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                  {svc.description.slice(0, 75)}…
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <button
        onClick={handleNext}
        disabled={!selected}
        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#E8724B] hover:bg-[#D45C33] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold px-8 py-4 rounded-xl transition-all duration-200"
      >
        Continue to Details <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function ConceptPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-4 border-[#E8724B] border-t-transparent animate-spin" /></div>}>
      <ConceptStep1Inner />
    </Suspense>
  )
}
