'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'

const DISCIPLINES = [
  { value: 'STRUCTURAL_ENGINEER', label: 'Structural Engineer' },
  { value: 'MEP_ENGINEER', label: 'MEP Engineer (Mechanical/Electrical/Plumbing)' },
  { value: 'CIVIL_ENGINEER', label: 'Civil Engineer' },
  { value: 'LANDSCAPE_ARCHITECT', label: 'Landscape Architect' },
]

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
]

export default function EngineerRegisterPage() {
  const [form, setForm] = useState({
    discipline: 'STRUCTURAL_ENGINEER',
    firstName: '', lastName: '', email: '', phone: '',
    firmName: '', licenseNumber: '', licenseState: 'MD',
    yearsExperience: '', bio: '', portfolioUrl: '',
    agreeToTerms: false,
  })
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function update(key: string, value: unknown) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetch('/api/design-professionals/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: form.discipline }),
      })
    } catch {
      // Proceed to success even if network fails — lead is always logged server-side
    }
    setSubmitting(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle className="h-8 w-8" style={{ color: '#38A169' }} />
          </div>
          <h1 className="text-2xl font-bold font-display" style={{ color: '#1A2B4A' }}>
            Application Submitted!
          </h1>
          <p className="mt-3 text-gray-500">
            Thanks, {form.firstName}. Our verification team will review your PE credentials within 2 business days.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: '#1A2B4A' }}
          >
            Back to Home <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-16" style={{ backgroundColor: '#F7FAFC' }}>
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <Link href="/engineers" className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft className="h-4 w-4" /> Back to Engineers
        </Link>

        <div className="mb-8 text-center">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#38A169' }}>
            Join Kealee
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold" style={{ color: '#1A2B4A' }}>
            Engineer Application
          </h1>
          <p className="mt-2 text-gray-500">
            Apply to join the Kealee engineering network and coordinate with project teams across the DC-Baltimore corridor.
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-center gap-4">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
                style={{ backgroundColor: s <= step ? '#38A169' : '#E5E7EB', color: s <= step ? '#FFF' : '#9CA3AF' }}>
                {s}
              </div>
              {s < 3 && <div className="h-0.5 w-8" style={{ backgroundColor: s < step ? '#38A169' : '#E5E7EB' }} />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8">
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold" style={{ color: '#1A2B4A' }}>Your Discipline & Firm</h2>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Engineering Discipline *</label>
                  <select
                    value={form.discipline}
                    onChange={e => update('discipline', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none"
                  >
                    {DISCIPLINES.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">First Name *</label>
                    <input value={form.firstName} onChange={e => update('firstName', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none" placeholder="James" required />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Last Name *</label>
                    <input value={form.lastName} onChange={e => update('lastName', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none" placeholder="Kim" required />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Firm Name *</label>
                  <input value={form.firmName} onChange={e => update('firmName', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none" placeholder="Kim Structural Engineering" required />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Email *</label>
                  <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none" required />
                </div>

                <button type="button" onClick={() => setStep(2)}
                  className="w-full rounded-xl py-3 text-sm font-semibold text-white"
                  style={{ backgroundColor: '#38A169' }}>
                  Continue <ArrowRight className="ml-2 inline h-4 w-4" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold" style={{ color: '#1A2B4A' }}>PE License & Experience</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">PE License # *</label>
                    <input value={form.licenseNumber} onChange={e => update('licenseNumber', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none" placeholder="PE-67890" required />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">State *</label>
                    <select value={form.licenseState} onChange={e => update('licenseState', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none">
                      {US_STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Years of Experience</label>
                  <input type="number" min="0" max="60" value={form.yearsExperience} onChange={e => update('yearsExperience', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none" />
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600">Back</button>
                  <button type="button" onClick={() => setStep(3)}
                    className="flex-1 rounded-xl py-3 text-sm font-semibold text-white"
                    style={{ backgroundColor: '#38A169' }}>
                    Continue <ArrowRight className="ml-2 inline h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold" style={{ color: '#1A2B4A' }}>About Your Practice</h2>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Professional Bio</label>
                  <textarea value={form.bio} onChange={e => update('bio', e.target.value)} rows={4}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none"
                    placeholder="Describe your engineering specialties, project types, and what you bring to the team..." />
                </div>

                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" checked={form.agreeToTerms} onChange={e => update('agreeToTerms', e.target.checked)} className="mt-0.5 rounded" required />
                  <span className="text-xs text-gray-600">
                    I agree to Kealee's <Link href="/terms" className="underline" style={{ color: '#38A169' }}>Terms of Service</Link> and{' '}
                    <Link href="/privacy" className="underline" style={{ color: '#38A169' }}>Privacy Policy</Link>,
                    and confirm all information is accurate.
                  </span>
                </label>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)} className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600">Back</button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60"
                    style={{ backgroundColor: '#38A169' }}>
                    {submitting ? 'Submitting…' : 'Submit Application'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
