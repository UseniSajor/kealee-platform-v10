'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, ArrowLeft } from 'lucide-react'

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#E8724B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E8724B]/20 transition'

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

function ContactInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!firstName.trim()) e.firstName = 'Required'
    if (!lastName.trim()) e.lastName = 'Required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Please enter a valid email address.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleNext() {
    if (!validate()) return
    const existing = Object.fromEntries(searchParams.entries())
    const params = new URLSearchParams({
      ...existing,
      firstName,
      lastName,
      email,
      phone: phone.replace(/\D/g, ''),
      address,
    })
    router.push(`/concept/confirm?${params.toString()}`)
  }

  const backParams = new URLSearchParams()
  ;['service', 'scope', 'budget', 'zip', 'style', 'priority', 'timeline', 'sqft'].forEach((k) => {
    const v = searchParams.get(k)
    if (v) backParams.set(k, v)
  })

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#E8724B] mb-2">Step 3 of 4</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">How Should We Reach You?</h1>
        <p className="text-slate-500">Your information is kept private and never shared.</p>
      </div>

      <div className="space-y-5 max-w-xl">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">First Name <span className="text-[#E8724B]">*</span></label>
            <input type="text" className={inputClass} placeholder="Jane" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">Last Name <span className="text-[#E8724B]">*</span></label>
            <input type="text" className={inputClass} placeholder="Smith" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1.5">Email Address <span className="text-[#E8724B]">*</span></label>
          <input type="email" className={inputClass} placeholder="jane@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1.5">Phone Number</label>
          <input
            type="tel"
            className={inputClass}
            placeholder="(202) 555-0123"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
          />
          <p className="text-xs text-slate-400 mt-1">Optional — for consultation scheduling</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1.5">Project Address</label>
          <input type="text" className={inputClass} placeholder="123 Main St, Washington, DC" value={address} onChange={(e) => setAddress(e.target.value)} />
          <p className="text-xs text-slate-400 mt-1">Optional — helps us tailor permit research</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-10">
        <Link
          href={`/concept/details?${backParams.toString()}`}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <button
          onClick={handleNext}
          className="flex items-center gap-2 bg-[#E8724B] hover:bg-[#D45C33] text-white font-bold px-8 py-4 rounded-xl transition-all duration-200"
        >
          Review My Concept <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function ConceptContactPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-4 border-[#E8724B] border-t-transparent animate-spin" /></div>}>
      <ContactInner />
    </Suspense>
  )
}
