'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { SERVICE_MAP } from '@/lib/services-config'

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#E8724B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E8724B]/20 transition'

function DetailsInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const serviceSlug = searchParams.get('service') ?? ''
  const service = SERVICE_MAP[serviceSlug]

  const [scope, setScope] = useState('')
  const [budget, setBudget] = useState('')
  const [zip, setZip] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (scope.trim().length < 20) e.scope = 'Please describe your project in at least 20 characters.'
    if (!budget.trim()) e.budget = 'Please enter an estimated budget.'
    if (!/^\d{5}$/.test(zip)) e.zip = 'Please enter a valid 5-digit ZIP code.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleNext() {
    if (!validate()) return
    const params = new URLSearchParams({
      service: serviceSlug,
      scope,
      budget,
      zip,
    })
    router.push(`/concept/contact?${params.toString()}`)
  }

  if (!serviceSlug) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">No service selected.</p>
        <Link href="/concept" className="text-[#E8724B] font-semibold">← Start over</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#E8724B] mb-2">Step 2 of 4</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Tell Us About Your Project</h1>
        <p className="text-slate-500">
          Selected: <span className="font-semibold text-slate-700">{service?.label ?? serviceSlug}</span>
        </p>
      </div>

      <div className="space-y-6 max-w-xl">
        {/* Scope */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1.5">
            Project Description <span className="text-[#E8724B]">*</span>
          </label>
          <textarea
            className={`${inputClass} h-32 resize-none`}
            placeholder="E.g., Open-concept kitchen with quartz island, new cabinetry floor-to-ceiling, LED lighting, and a professional range..."
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          />
          {errors.scope && <p className="text-xs text-red-500 mt-1">{errors.scope}</p>}
          <p className="text-xs text-slate-400 mt-1">{scope.length} characters — min 20</p>
        </div>

        {/* Budget */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1.5">
            Estimated Budget <span className="text-[#E8724B]">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">$</span>
            <input
              type="number"
              className={`${inputClass} pl-7`}
              placeholder="50000"
              min="0"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>
          {errors.budget && <p className="text-xs text-red-500 mt-1">{errors.budget}</p>}
          <p className="text-xs text-slate-400 mt-1">Approximate total project budget</p>
        </div>

        {/* ZIP */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1.5">
            ZIP Code <span className="text-[#E8724B]">*</span>
          </label>
          <input
            type="text"
            className={inputClass}
            placeholder="20001"
            maxLength={5}
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, ''))}
          />
          {errors.zip && <p className="text-xs text-red-500 mt-1">{errors.zip}</p>}
          {zip.length === 5 && !errors.zip && (
            <p className="text-xs text-green-600 mt-1">✓ Location confirmed</p>
          )}
          <p className="text-xs text-slate-400 mt-1">Used for zoning and permit analysis</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-10">
        <Link
          href={`/concept?service=${serviceSlug}`}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <button
          onClick={handleNext}
          className="flex items-center gap-2 bg-[#E8724B] hover:bg-[#D45C33] text-white font-bold px-8 py-4 rounded-xl transition-all duration-200"
        >
          Continue to Contact <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function ConceptDetailsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-4 border-[#E8724B] border-t-transparent animate-spin" /></div>}>
      <DetailsInner />
    </Suspense>
  )
}
