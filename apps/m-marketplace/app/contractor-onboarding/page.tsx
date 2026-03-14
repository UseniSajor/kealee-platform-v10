'use client'

/**
 * /contractor-onboarding
 *
 * Multi-step contractor onboarding wizard.
 * Calls the existing POST /marketplace/contractors/register endpoint on submit,
 * then advances the onboarding funnel stage as the user progresses.
 *
 * Steps:
 *   1. Account creation (email + password)
 *   2. Business basics (name, contact, address)
 *   3. Specialties + service area
 *   4. Document upload instructions + checklist
 *   5. Review + submit
 */

import { useState, useRef } from 'react'
import { useRouter }        from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormData {
  // Step 1
  email:     string
  password:  string
  firstName: string
  lastName:  string
  // Step 2
  businessName:    string
  phone:           string
  address:         string
  city:            string
  state:           string
  zipCode:         string
  yearsInBusiness: number
  // Step 3
  specialties:    string[]
  serviceStates:  string[]
  serviceRadius:  number
  licenseNumber:  string
  licenseState:   string
  insuranceInfo:  string
  // Step 4 (checklist acknowledgement)
  docsAcknowledged: boolean
  inviteCode?: string
}

const INITIAL_FORM: FormData = {
  email: '', password: '', firstName: '', lastName: '',
  businessName: '', phone: '', address: '', city: '', state: '', zipCode: '', yearsInBusiness: 1,
  specialties: [], serviceStates: [], serviceRadius: 50, licenseNumber: '', licenseState: '', insuranceInfo: '',
  docsAcknowledged: false,
}

const SPECIALTIES_OPTIONS = [
  'General Contracting', 'Residential Renovation', 'Commercial Build-Out',
  'New Construction', 'Kitchen & Bath', 'Roofing', 'Electrical', 'Plumbing',
  'HVAC', 'Flooring', 'Painting', 'Landscaping', 'Decks & Outdoor',
  'Basement Finishing', 'ADU / In-Law Suite', 'Historic Renovation',
]

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
  'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT',
  'VT','VA','WA','WV','WI','WY',
]

const STEPS = [
  { id: 1, label: 'Account',     icon: '👤' },
  { id: 2, label: 'Business',    icon: '🏢' },
  { id: 3, label: 'Specialties', icon: '🔧' },
  { id: 4, label: 'Documents',   icon: '📄' },
  { id: 5, label: 'Review',      icon: '✅' },
]

// ── Sub-forms ─────────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center">
          <div className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold transition-all ${
            s.id < current  ? 'bg-teal-500 text-white' :
            s.id === current ? 'bg-[#1A2B4A] border-2 border-teal-400 text-teal-400' :
                              'bg-gray-100 text-gray-400'
          }`}>
            {s.id < current ? '✓' : s.icon}
          </div>
          <span className={`ml-1.5 text-xs hidden sm:block ${
            s.id === current ? 'text-[#1A2B4A] font-semibold' : 'text-gray-400'
          }`}>{s.label}</span>
          {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-200 mx-2" />}
        </div>
      ))}
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ContractorOnboardingPage() {
  const router            = useRouter()
  const [step,    setStep]    = useState(1)
  const [form,    setForm]    = useState<FormData>(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)

  const set = (field: keyof FormData, value: unknown) =>
    setForm(f => ({ ...f, [field]: value }))

  const toggleSpecialty = (s: string) =>
    set('specialties', form.specialties.includes(s)
      ? form.specialties.filter(x => x !== s)
      : [...form.specialties, s])

  const toggleState = (s: string) =>
    set('serviceStates', form.serviceStates.includes(s)
      ? form.serviceStates.filter(x => x !== s)
      : [...form.serviceStates, s])

  function scrollTop() {
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function goNext() { setStep(s => s + 1); scrollTop() }
  function goBack() { setStep(s => s - 1); scrollTop() }

  // Step validation
  function canAdvance(): boolean {
    if (step === 1) return !!(form.email && form.password.length >= 8 && form.firstName && form.lastName)
    if (step === 2) return !!(form.businessName && form.phone && form.city && form.state)
    if (step === 3) return form.specialties.length > 0 && form.serviceStates.length > 0 && !!form.licenseNumber
    if (step === 4) return form.docsAcknowledged
    return true
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      const payload = {
        email:    form.email,
        password: form.password,
        profile: {
          firstName:       form.firstName,
          lastName:        form.lastName,
          businessName:    form.businessName,
          phone:           form.phone,
          address:         form.address,
          city:            form.city,
          state:           form.state,
          zipCode:         form.zipCode,
          yearsInBusiness: form.yearsInBusiness,
          licenseNumber:   form.licenseNumber,
          licenseState:    form.licenseState,
          insuranceInfo:   form.insuranceInfo ? { provider: form.insuranceInfo } : undefined,
          specialties:     form.specialties,
          serviceStates:   form.serviceStates,
          serviceRadius:   form.serviceRadius,
          serviceArea:     { states: form.serviceStates, radius: form.serviceRadius },
        },
        ...(form.inviteCode ? { inviteCode: form.inviteCode } : {}),
      }

      const res = await fetch(`${API_URL}/marketplace/contractors/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })

      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Registration failed')

      // Mark onboarding stage as DOCUMENTS_UPLOADED (they'll upload docs after redirecting to portal)
      // Fire-and-forget: the registration handler already creates the basic profile
      setSuccess(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ─────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-[#1A2B4A] mb-3">You're registered!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Your application is under review. We typically approve contractors within 1–3 business days.
            You'll receive an email when your account is approved and leads are ready.
          </p>
          <div className="bg-amber-50 rounded-xl border border-amber-100 p-4 text-left mb-6">
            <p className="text-sm font-semibold text-amber-800 mb-2">Next: Upload your documents</p>
            <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
              <li>Contractor's license (state-issued)</li>
              <li>General liability insurance certificate</li>
              <li>Proof of workers' comp (if applicable)</li>
            </ul>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3 bg-[#2ABFBF] hover:bg-[#22a8a8] text-white font-semibold rounded-xl transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ── Wizard ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto" ref={topRef}>

        {/* Logo + heading */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1A2B4A]">Join Kealee</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Get matched with permit-ready construction leads in your area.
          </p>
        </div>

        <StepIndicator current={step} />

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
              {error}
            </div>
          )}

          {/* ── STEP 1: Account ── */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#1A2B4A] mb-1">Create your account</h2>
              <p className="text-gray-500 text-sm mb-6">Start with your basic contact info and login credentials.</p>

              <div className="grid grid-cols-2 gap-4">
                <FieldRow label="First Name">
                  <input type="text" className={inputCls} value={form.firstName}
                    onChange={e => set('firstName', e.target.value)} placeholder="John" />
                </FieldRow>
                <FieldRow label="Last Name">
                  <input type="text" className={inputCls} value={form.lastName}
                    onChange={e => set('lastName', e.target.value)} placeholder="Smith" />
                </FieldRow>
              </div>
              <FieldRow label="Email Address">
                <input type="email" className={inputCls} value={form.email}
                  onChange={e => set('email', e.target.value)} placeholder="john@company.com" />
              </FieldRow>
              <FieldRow label="Password (min 8 chars)">
                <input type="password" className={inputCls} value={form.password}
                  onChange={e => set('password', e.target.value)} placeholder="••••••••" />
              </FieldRow>
              <FieldRow label="Invite Code (optional)">
                <input type="text" className={inputCls} value={form.inviteCode ?? ''}
                  onChange={e => set('inviteCode', e.target.value)}
                  placeholder="KEALEE-XXXX (if you have one)" />
              </FieldRow>
            </div>
          )}

          {/* ── STEP 2: Business ── */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#1A2B4A] mb-1">Business information</h2>
              <p className="text-gray-500 text-sm mb-6">Tell us about your company.</p>

              <FieldRow label="Business Name">
                <input type="text" className={inputCls} value={form.businessName}
                  onChange={e => set('businessName', e.target.value)} placeholder="Smith Construction LLC" />
              </FieldRow>
              <FieldRow label="Phone">
                <input type="tel" className={inputCls} value={form.phone}
                  onChange={e => set('phone', e.target.value)} placeholder="(202) 555-0100" />
              </FieldRow>
              <FieldRow label="Business Address">
                <input type="text" className={inputCls} value={form.address}
                  onChange={e => set('address', e.target.value)} placeholder="123 Main St" />
              </FieldRow>
              <div className="grid grid-cols-3 gap-3">
                <FieldRow label="City">
                  <input type="text" className={inputCls} value={form.city}
                    onChange={e => set('city', e.target.value)} placeholder="Arlington" />
                </FieldRow>
                <FieldRow label="State">
                  <select className={inputCls} value={form.state} onChange={e => set('state', e.target.value)}>
                    <option value="">—</option>
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FieldRow>
                <FieldRow label="ZIP">
                  <input type="text" className={inputCls} value={form.zipCode}
                    onChange={e => set('zipCode', e.target.value)} placeholder="22201" maxLength={10} />
                </FieldRow>
              </div>
              <FieldRow label="Years in Business">
                <input type="number" className={inputCls} value={form.yearsInBusiness} min={0} max={100}
                  onChange={e => set('yearsInBusiness', Number(e.target.value))} />
              </FieldRow>
            </div>
          )}

          {/* ── STEP 3: Specialties ── */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#1A2B4A] mb-1">Your specialties</h2>
              <p className="text-gray-500 text-sm mb-4">Select all that apply. This determines which leads you receive.</p>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Project types (select all that apply)</p>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES_OPTIONS.map(s => (
                    <button key={s} type="button"
                      onClick={() => toggleSpecialty(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        form.specialties.includes(s)
                          ? 'bg-[#2ABFBF] border-[#2ABFBF] text-white'
                          : 'border-gray-200 text-gray-600 hover:border-teal-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Service states <span className="text-gray-400">(min 1)</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['DC', 'MD', 'VA', 'WA', 'GA', 'IL', 'TX', 'CA', 'NY', 'FL', 'CO', 'OR', 'NC', 'PA', 'OH'].map(s => (
                    <button key={s} type="button"
                      onClick={() => toggleState(s)}
                      className={`w-10 h-8 rounded text-xs font-bold border transition-colors ${
                        form.serviceStates.includes(s)
                          ? 'bg-[#1A2B4A] border-[#1A2B4A] text-white'
                          : 'border-gray-200 text-gray-600 hover:border-[#1A2B4A]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FieldRow label="Contractor License #">
                  <input type="text" className={inputCls} value={form.licenseNumber}
                    onChange={e => set('licenseNumber', e.target.value)} placeholder="CR-123456" />
                </FieldRow>
                <FieldRow label="License State">
                  <select className={inputCls} value={form.licenseState} onChange={e => set('licenseState', e.target.value)}>
                    <option value="">—</option>
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FieldRow>
              </div>
              <FieldRow label="Insurance Provider (optional)">
                <input type="text" className={inputCls} value={form.insuranceInfo}
                  onChange={e => set('insuranceInfo', e.target.value)} placeholder="Travelers, Hartford, etc." />
              </FieldRow>
            </div>
          )}

          {/* ── STEP 4: Documents ── */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#1A2B4A] mb-1">Document requirements</h2>
              <p className="text-gray-500 text-sm">
                You'll upload these in your dashboard after creating your account.
                They're required before we can route leads to you.
              </p>

              <div className="space-y-3">
                {[
                  { icon: '📋', title: "Contractor's License", desc: "State-issued contractor license (JPEG, PNG, or PDF)", required: true },
                  { icon: '🛡️', title: 'General Liability Insurance', desc: 'Certificate of insurance, min $1M per occurrence', required: true },
                  { icon: '👷', title: "Workers' Compensation", desc: 'Required if you have employees', required: false },
                  { icon: '🔖', title: 'Surety Bond', desc: 'If applicable in your state', required: false },
                ].map(doc => (
                  <div key={doc.title} className={`flex gap-3 p-4 rounded-xl border ${
                    doc.required ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-gray-50'
                  }`}>
                    <span className="text-2xl">{doc.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {doc.title}
                        {doc.required && <span className="ml-1.5 text-xs text-amber-600 font-normal">(required)</span>}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{doc.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.docsAcknowledged}
                  onChange={e => set('docsAcknowledged', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-600">
                  I understand I need to upload my contractor license and insurance certificate
                  within 7 days to activate lead distribution.
                </span>
              </label>
            </div>
          )}

          {/* ── STEP 5: Review ── */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#1A2B4A] mb-1">Review & submit</h2>
              <p className="text-gray-500 text-sm">Confirm your information before submitting.</p>

              <div className="space-y-4 text-sm">
                {[
                  {
                    title: 'Account',
                    rows: [
                      ['Name', `${form.firstName} ${form.lastName}`],
                      ['Email', form.email],
                    ],
                  },
                  {
                    title: 'Business',
                    rows: [
                      ['Company', form.businessName],
                      ['Phone', form.phone],
                      ['Location', `${form.city}, ${form.state} ${form.zipCode}`],
                      ['Experience', `${form.yearsInBusiness} years`],
                    ],
                  },
                  {
                    title: 'Specialties',
                    rows: [
                      ['Services', form.specialties.join(', ') || '—'],
                      ['States', form.serviceStates.join(', ') || '—'],
                      ['License', `${form.licenseNumber} (${form.licenseState})`],
                    ],
                  },
                ].map(section => (
                  <div key={section.title} className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {section.title}
                    </div>
                    <div className="divide-y divide-gray-50">
                      {section.rows.map(([label, value]) => (
                        <div key={label} className="flex gap-3 px-4 py-2.5">
                          <span className="text-gray-400 w-24 shrink-0">{label}</span>
                          <span className="text-gray-800 font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400">
                By submitting, you agree to Kealee's{' '}
                <a href="/terms" className="text-teal-600 underline">Terms of Service</a> and{' '}
                <a href="/privacy" className="text-teal-600 underline">Privacy Policy</a>.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 1 ? (
              <button onClick={goBack} className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm hover:bg-gray-50 transition-colors">
                ← Back
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                onClick={goNext}
                disabled={!canAdvance()}
                className="px-6 py-2.5 bg-[#1A2B4A] hover:bg-[#243852] text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-colors"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-2.5 bg-[#2ABFBF] hover:bg-[#22a8a8] text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors"
              >
                {loading ? 'Submitting…' : 'Submit Application'}
              </button>
            )}
          </div>

        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Already have an account?{' '}
          <a href="/auth/login" className="text-teal-600 underline">Sign in</a>
        </p>
      </div>
    </div>
  )
}
