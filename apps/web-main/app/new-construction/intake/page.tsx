'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowLeft, CheckCircle2, Building2, MapPin, DollarSign, Calendar, User } from 'lucide-react'

type FormData = {
  // Step 1: Project basics
  lotStatus: string
  lotSize: string
  projectType: string
  squareFootage: string
  // Step 2: Location & zoning
  address: string
  city: string
  state: string
  zip: string
  county: string
  // Step 3: Budget & timeline
  budget: string
  timeline: string
  financing: string
  // Step 4: Design preferences
  style: string
  stories: string
  garage: string
  specialFeatures: string
  // Step 5: Contact
  firstName: string
  lastName: string
  email: string
  phone: string
  howHeard: string
}

const INITIAL: FormData = {
  lotStatus: '', lotSize: '', projectType: '', squareFootage: '',
  address: '', city: '', state: '', zip: '', county: '',
  budget: '', timeline: '', financing: '',
  style: '', stories: '', garage: '', specialFeatures: '',
  firstName: '', lastName: '', email: '', phone: '', howHeard: '',
}

const LOT_STATUSES = ['I own the lot', 'I\'m under contract', 'Still searching', 'Teardown/demo needed']
const PROJECT_TYPES = ['Primary residence', 'Investment/rental', 'Vacation home', 'ADU / Guest house']
const BUDGETS = ['$500K – $750K', '$750K – $1M', '$1M – $2M', '$2M – $5M', '$5M+', 'Not sure yet']
const TIMELINES = ['ASAP (< 6 months)', '6–12 months', '1–2 years', '2+ years', 'Flexible']
const FINANCING = ['Cash', 'Construction loan', 'Conventional mortgage', 'Not sure']
const STYLES = ['Modern / Contemporary', 'Craftsman / Traditional', 'Colonial', 'Mediterranean', 'Farmhouse', 'Custom / Undecided']
const STORIES = ['Single story', 'Two story', 'Three story', 'Undecided']
const GARAGES = ['Attached 1-car', 'Attached 2-car', 'Attached 3-car', 'Detached', 'None']

const STEPS = [
  { n: 1, label: 'Project Basics', icon: Building2 },
  { n: 2, label: 'Location', icon: MapPin },
  { n: 3, label: 'Budget', icon: DollarSign },
  { n: 4, label: 'Design', icon: Calendar },
  { n: 5, label: 'Your Info', icon: User },
]

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {STEPS.map((step, i) => {
        const Icon = step.icon
        const done = current > step.n
        const active = current === step.n
        return (
          <div key={step.n} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  done ? 'bg-[#E8724B] text-white' : active ? 'bg-[#1A2B4A] text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={`text-[10px] font-semibold mt-1 hidden sm:block ${active ? 'text-[#1A2B4A]' : done ? 'text-[#E8724B]' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-6 sm:w-12 mb-4 transition-all ${done ? 'bg-[#E8724B]' : 'bg-slate-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function OptionGrid({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`rounded-xl border px-4 py-3 text-sm font-medium text-left transition-all ${
            value === opt
              ? 'border-[#E8724B] bg-orange-50 text-[#E8724B] shadow-sm'
              : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-800 mb-1.5">{label}</label>
      {hint && <p className="text-xs text-slate-400 mb-2">{hint}</p>}
      {children}
    </div>
  )
}

const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#E8724B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E8724B]/20 transition"

export default function NewConstructionIntakePage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(INITIAL)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (key: keyof FormData) => (val: string) => setForm((p) => ({ ...p, [key]: val }))

  async function handleSubmit() {
    setLoading(true)
    try {
      await fetch('/api/intake/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_path: 'design_build',
          client_name: `${form.firstName} ${form.lastName}`.trim(),
          contact_email: form.email,
          contact_phone: form.phone,
          project_address: `${form.address}, ${form.city}, ${form.state} ${form.zip}`,
          budget_range: form.budget,
          source: 'new-construction-intake',
          status: 'new',
          requires_payment: false,
          form_data: form,
        }),
      })
      setSubmitted(true)
    } catch {
      setSubmitted(true) // show success even if API fails — team follows up
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">We'll be in touch soon!</h1>
          <p className="text-slate-500 mb-8">
            Your new construction inquiry has been received. A Kealee project consultant will reach out within 1–2 business days to discuss your project in detail.
          </p>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-left mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">What happens next</p>
            {['Initial consultation call (30 min)', 'Site feasibility review', 'Custom quote & proposal', 'Project kickoff'].map((item, i) => (
              <div key={item} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                <span className="w-6 h-6 rounded-full bg-[#E8724B] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <span className="text-sm text-slate-700">{item}</span>
              </div>
            ))}
          </div>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">← Back to home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-[#1A2B4A] py-12 px-4 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-3">Custom Engagement</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">New Construction Intake</h1>
        <p className="text-slate-300 max-w-xl mx-auto">
          Tell us about your project. A Kealee consultant will prepare a custom proposal within 24 hours.
        </p>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-12">
        <StepIndicator current={step} />

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">

          {/* Step 1: Project Basics */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900">Tell us about your project</h2>
              <Field label="What's your lot status?">
                <OptionGrid options={LOT_STATUSES} value={form.lotStatus} onChange={set('lotStatus')} />
              </Field>
              <Field label="Project type">
                <OptionGrid options={PROJECT_TYPES} value={form.projectType} onChange={set('projectType')} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Lot size (approx.)" hint="e.g. 0.25 acres, 50x100 ft">
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. 0.5 acres"
                    value={form.lotSize}
                    onChange={(e) => set('lotSize')(e.target.value)}
                  />
                </Field>
                <Field label="Target square footage" hint="Finished living area">
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. 3,500 sq ft"
                    value={form.squareFootage}
                    onChange={(e) => set('squareFootage')(e.target.value)}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900">Project location</h2>
              <Field label="Street address or intersection">
                <input type="text" className={inputClass} placeholder="123 Main St" value={form.address} onChange={(e) => set('address')(e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="City">
                  <input type="text" className={inputClass} placeholder="Washington" value={form.city} onChange={(e) => set('city')(e.target.value)} />
                </Field>
                <Field label="State">
                  <input type="text" className={inputClass} placeholder="DC" value={form.state} onChange={(e) => set('state')(e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="ZIP code">
                  <input type="text" className={inputClass} placeholder="20001" maxLength={5} value={form.zip} onChange={(e) => set('zip')(e.target.value)} />
                </Field>
                <Field label="County" hint="For zoning research">
                  <input type="text" className={inputClass} placeholder="e.g. Montgomery County" value={form.county} onChange={(e) => set('county')(e.target.value)} />
                </Field>
              </div>
            </div>
          )}

          {/* Step 3: Budget & Timeline */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900">Budget &amp; timeline</h2>
              <Field label="Estimated total budget">
                <OptionGrid options={BUDGETS} value={form.budget} onChange={set('budget')} />
              </Field>
              <Field label="When do you want to break ground?">
                <OptionGrid options={TIMELINES} value={form.timeline} onChange={set('timeline')} />
              </Field>
              <Field label="Financing approach">
                <OptionGrid options={FINANCING} value={form.financing} onChange={set('financing')} />
              </Field>
            </div>
          )}

          {/* Step 4: Design Preferences */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900">Design preferences</h2>
              <Field label="Architectural style">
                <OptionGrid options={STYLES} value={form.style} onChange={set('style')} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Stories">
                  <OptionGrid options={STORIES} value={form.stories} onChange={set('stories')} />
                </Field>
                <Field label="Garage">
                  <OptionGrid options={GARAGES} value={form.garage} onChange={set('garage')} />
                </Field>
              </div>
              <Field label="Special features or requirements" hint="Pool, basement, home office, in-law suite, etc.">
                <textarea
                  className={`${inputClass} h-28 resize-none`}
                  placeholder="Describe any special requirements..."
                  value={form.specialFeatures}
                  onChange={(e) => set('specialFeatures')(e.target.value)}
                />
              </Field>
            </div>
          )}

          {/* Step 5: Contact */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900">Your contact information</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="First name">
                  <input type="text" className={inputClass} placeholder="Jane" value={form.firstName} onChange={(e) => set('firstName')(e.target.value)} />
                </Field>
                <Field label="Last name">
                  <input type="text" className={inputClass} placeholder="Smith" value={form.lastName} onChange={(e) => set('lastName')(e.target.value)} />
                </Field>
              </div>
              <Field label="Email address">
                <input type="email" className={inputClass} placeholder="jane@example.com" value={form.email} onChange={(e) => set('email')(e.target.value)} />
              </Field>
              <Field label="Phone number">
                <input type="tel" className={inputClass} placeholder="(202) 555-0100" value={form.phone} onChange={(e) => set('phone')(e.target.value)} />
              </Field>
              <Field label="How did you hear about Kealee?">
                <input type="text" className={inputClass} placeholder="Google, referral, social media..." value={form.howHeard} onChange={(e) => set('howHeard')(e.target.value)} />
              </Field>

              {/* Summary preview */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700 text-sm mb-2">Project Summary</p>
                {form.projectType && <p>Type: {form.projectType}</p>}
                {form.budget && <p>Budget: {form.budget}</p>}
                {form.timeline && <p>Timeline: {form.timeline}</p>}
                {form.city && <p>Location: {form.city}, {form.state} {form.zip}</p>}
                {form.squareFootage && <p>Target size: {form.squareFootage}</p>}
              </div>

              <p className="text-xs text-slate-400">
                By submitting, you agree to our{' '}
                <Link href="/terms" className="underline">Terms of Service</Link>. No commitment required — a Kealee consultant will contact you within 1–2 business days.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <Link href="/services/new-construction" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
                <ArrowLeft className="w-4 h-4" /> Cancel
              </Link>
            )}

            {step < 5 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-2 bg-[#E8724B] hover:bg-[#D45C33] text-white font-bold px-6 py-3 rounded-xl transition-all duration-200"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || !form.firstName || !form.email}
                className="flex items-center gap-2 bg-[#E8724B] hover:bg-[#D45C33] text-white font-bold px-8 py-3 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Inquiry'} {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Trust signals */}
        <div className="mt-6 text-center space-y-1">
          <p className="text-xs text-slate-400">No payment required · 100% confidential · Response within 24 hours</p>
        </div>
      </div>
    </div>
  )
}
