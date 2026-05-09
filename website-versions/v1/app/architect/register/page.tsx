'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle, Upload } from 'lucide-react'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
]

const SPECIALTIES = [
  'Residential', 'Multifamily', 'Commercial', 'Mixed-Use', 'Historic Preservation',
  'Sustainable Design', 'Healthcare', 'Education', 'Hospitality', 'Industrial',
]

interface FormData {
  firmName: string
  firstName: string
  lastName: string
  email: string
  phone: string
  licenseNumber: string
  licenseState: string
  yearsExperience: string
  bio: string
  portfolioUrl: string
  specialties: string[]
  jurisdictions: string[]
  agreeToTerms: boolean
}

const INITIAL: FormData = {
  firmName: '', firstName: '', lastName: '', email: '', phone: '',
  licenseNumber: '', licenseState: 'MD', yearsExperience: '',
  bio: '', portfolioUrl: '', specialties: [], jurisdictions: [],
  agreeToTerms: false,
}

export default function ArchitectRegisterPage() {
  const [form, setForm] = useState<FormData>(INITIAL)
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  function update(key: keyof FormData, value: unknown) {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  function toggleSpecialty(s: string) {
    setForm(prev => ({
      ...prev,
      specialties: prev.specialties.includes(s)
        ? prev.specialties.filter(x => x !== s)
        : [...prev.specialties, s],
    }))
  }

  function validateStep1() {
    const errs: Partial<Record<keyof FormData, string>> = {}
    if (!form.firstName.trim()) errs.firstName = 'Required'
    if (!form.lastName.trim()) errs.lastName = 'Required'
    if (!form.email.includes('@')) errs.email = 'Valid email required'
    if (!form.firmName.trim()) errs.firmName = 'Required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function validateStep2() {
    const errs: Partial<Record<keyof FormData, string>> = {}
    if (!form.licenseNumber.trim()) errs.licenseNumber = 'Required'
    if (!form.yearsExperience) errs.yearsExperience = 'Required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.agreeToTerms) {
      setErrors(prev => ({ ...prev, agreeToTerms: 'You must agree to the terms' }))
      return
    }
    setSubmitting(true)
    // TODO: POST /design-professionals/register with role=ARCHITECT
    await new Promise(r => setTimeout(r, 1200)) // simulate API call
    setSubmitting(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
            <CheckCircle className="h-8 w-8" style={{ color: '#2ABFBF' }} />
          </div>
          <h1 className="text-2xl font-bold font-display" style={{ color: '#1A2B4A' }}>
            Application Submitted!
          </h1>
          <p className="mt-3 text-gray-500">
            Thank you, {form.firstName}. Our team will review your credentials and get back to you within 2 business days.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
              style={{ backgroundColor: '#1A2B4A' }}
            >
              Back to Home <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-16" style={{ backgroundColor: '#F7FAFC' }}>
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        {/* Back link */}
        <Link
          href="/architects"
          className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Architects
        </Link>

        {/* Header */}
        <div className="mb-8 text-center">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#2ABFBF' }}>
            Join Kealee
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold" style={{ color: '#1A2B4A' }}>
            Architect Application
          </h1>
          <p className="mt-2 text-gray-500">
            Join the Kealee professional network and manage projects alongside owners and contractors.
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-center gap-4">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
                style={{
                  backgroundColor: s <= step ? '#1A2B4A' : '#E5E7EB',
                  color: s <= step ? '#FFF' : '#9CA3AF',
                }}
              >
                {s}
              </div>
              {s < 3 && <div className="h-0.5 w-8" style={{ backgroundColor: s < step ? '#1A2B4A' : '#E5E7EB' }} />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold" style={{ color: '#1A2B4A' }}>Personal & Firm Information</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">First Name *</label>
                    <input
                      value={form.firstName}
                      onChange={e => update('firstName', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none"
                      placeholder="Jane"
                    />
                    {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Last Name *</label>
                    <input
                      value={form.lastName}
                      onChange={e => update('lastName', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none"
                      placeholder="Smith"
                    />
                    {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Firm Name *</label>
                  <input
                    value={form.firmName}
                    onChange={e => update('firmName', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none"
                    placeholder="Smith & Associates Architecture"
                  />
                  {errors.firmName && <p className="mt-1 text-xs text-red-500">{errors.firmName}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none"
                    placeholder="jane@firmname.com"
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => update('phone', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none"
                    placeholder="(301) 555-0100"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => validateStep1() && setStep(2)}
                  className="w-full rounded-xl py-3 text-sm font-semibold text-white"
                  style={{ backgroundColor: '#1A2B4A' }}
                >
                  Continue <ArrowRight className="ml-2 inline h-4 w-4" />
                </button>
              </div>
            )}

            {/* Step 2: Credentials */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold" style={{ color: '#1A2B4A' }}>License & Credentials</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">License # *</label>
                    <input
                      value={form.licenseNumber}
                      onChange={e => update('licenseNumber', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none"
                      placeholder="ARC-12345"
                    />
                    {errors.licenseNumber && <p className="mt-1 text-xs text-red-500">{errors.licenseNumber}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">State *</label>
                    <select
                      value={form.licenseState}
                      onChange={e => update('licenseState', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none"
                    >
                      {US_STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Years of Experience *</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={form.yearsExperience}
                    onChange={e => update('yearsExperience', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none"
                  />
                  {errors.yearsExperience && <p className="mt-1 text-xs text-red-500">{errors.yearsExperience}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Portfolio URL</label>
                  <input
                    type="url"
                    value={form.portfolioUrl}
                    onChange={e => update('portfolioUrl', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none"
                    placeholder="https://yourfirm.com/portfolio"
                  />
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-gray-700">Specialties (select all that apply)</label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALTIES.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSpecialty(s)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          form.specialties.includes(s)
                            ? 'border-teal-400 bg-teal-50 text-teal-700'
                            : 'border-gray-200 text-gray-600'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600">
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => validateStep2() && setStep(3)}
                    className="flex-1 rounded-xl py-3 text-sm font-semibold text-white"
                    style={{ backgroundColor: '#1A2B4A' }}
                  >
                    Continue <ArrowRight className="ml-2 inline h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Bio + Submit */}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold" style={{ color: '#1A2B4A' }}>About You</h2>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Professional Bio</label>
                  <textarea
                    value={form.bio}
                    onChange={e => update('bio', e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none"
                    placeholder="Describe your design philosophy, project types you specialize in, and what makes your practice unique..."
                  />
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    <Upload className="mr-1.5 inline h-4 w-4" />
                    License Documentation
                  </p>
                  <p className="text-xs text-gray-500">
                    Upload your AIA license, E&O insurance certificate, and any relevant certifications.
                    Our team will review them as part of the verification process.
                  </p>
                  <button type="button" className="mt-3 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-xs text-gray-500 hover:border-teal-400">
                    + Upload Documents (PDF, JPG, PNG)
                  </button>
                </div>

                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.agreeToTerms}
                    onChange={e => update('agreeToTerms', e.target.checked)}
                    className="mt-0.5 rounded"
                  />
                  <span className="text-xs text-gray-600">
                    I agree to Kealee's{' '}
                    <Link href="/terms" className="underline" style={{ color: '#2ABFBF' }}>Terms of Service</Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="underline" style={{ color: '#2ABFBF' }}>Privacy Policy</Link>,
                    and confirm that all information provided is accurate.
                  </span>
                </label>
                {errors.agreeToTerms && <p className="text-xs text-red-500">{errors.agreeToTerms}</p>}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)} className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600">
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60"
                    style={{ backgroundColor: '#1A2B4A' }}
                  >
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
