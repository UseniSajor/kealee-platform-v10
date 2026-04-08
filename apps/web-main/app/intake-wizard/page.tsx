'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface IntakeFormState {
  // Screen 1
  projectType: string
  // Screen 2
  squareFeet: number
  // Screen 3
  currentPains: string[]
  // Screen 4
  stylePreferences: string[]
  // Screen 5
  budget: number
  // Screen 6
  priorities: string[]
  // Screen 7
  constraints: string[]
  // Screen 8
  jurisdiction: string
  // Screen 9
  timeline: string
  email: string
  phone: string
  name: string
}

const INITIAL_STATE: IntakeFormState = {
  projectType: '',
  squareFeet: 400,
  currentPains: [],
  stylePreferences: [],
  budget: 40000,
  priorities: [],
  constraints: [],
  jurisdiction: '',
  timeline: '',
  email: '',
  phone: '',
  name: '',
}

// ── Screen configs ────────────────────────────────────────────────────────────

const PROJECT_TYPES = [
  { key: 'kitchen', emoji: '🍳', label: 'Kitchen', desc: 'Full kitchen renovation or refresh' },
  { key: 'bathroom', emoji: '🛁', label: 'Bathroom', desc: 'Bath remodel, add-a-bath, master suite' },
  { key: 'addition', emoji: '🏗️', label: 'Addition', desc: 'Room addition, ADU, second floor' },
  { key: 'basement', emoji: '🪵', label: 'Basement', desc: 'Basement finish or conversion' },
  { key: 'living_room', emoji: '🛋️', label: 'Living Room', desc: 'Living, dining, or open concept' },
  { key: 'whole_home', emoji: '🏡', label: 'Whole House', desc: 'Full home renovation' },
]

const CURRENT_PAINS = [
  'Small & cramped',
  'Dark & dated',
  'Awkward layout',
  'Lacks storage',
  'Poor lighting',
  'All of the above',
]

const STYLES = [
  { key: 'Modern', desc: 'Clean lines, minimal, contemporary' },
  { key: 'Traditional', desc: 'Classic, timeless, detailed' },
  { key: 'Contemporary', desc: 'Current trends, mixed materials' },
  { key: 'Transitional', desc: 'Modern meets traditional' },
  { key: 'Rustic', desc: 'Warm, natural materials, farmhouse' },
]

const PRIORITIES = [
  'Island', 'Pantry', 'Natural Light', 'Open Concept',
  'Storage', 'Entertainment Space', 'Home Office', 'Accessibility',
]

const CONSTRAINTS = [
  'All white', 'Too modern', 'Too traditional', 'Dark colors',
  'Open concept', 'Closed-off feel', 'Expensive-looking', 'Busy patterns',
]

const JURISDICTIONS = [
  'DC',
  'Montgomery County MD',
  "Prince George's County MD",
  'Arlington VA',
  'Fairfax VA',
  'Alexandria VA',
]

const TIMELINES = [
  { key: 'ASAP', label: 'ASAP', desc: 'I want to start immediately' },
  { key: '3-6 months', label: '3–6 months', desc: 'Planning to start soon' },
  { key: '6-12 months', label: '6–12 months', desc: 'Still in research phase' },
  { key: 'Just exploring', label: 'Just exploring', desc: 'No firm timeline yet' },
]

// ── Helper: determine tier ────────────────────────────────────────────────────

function determineTier(sqft: number): { tier: string; price: string; label: string } {
  if (sqft <= 800) return { tier: 'starter', price: '$599', label: 'Starter' }
  if (sqft <= 3000) return { tier: 'professional', price: '$1,299', label: 'Professional' }
  return { tier: 'enterprise', price: 'Contact us', label: 'Enterprise' }
}

// ── MultiSelect helper ────────────────────────────────────────────────────────

function MultiSelect({
  options, value, onChange, max,
}: {
  options: string[]; value: string[]; onChange: (v: string[]) => void; max?: number
}) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt))
    } else if (!max || value.length < max) {
      onChange([...value, opt])
    }
  }
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => {
        const active = value.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold border transition-all"
            style={{
              backgroundColor: active ? '#1A2B4A' : 'white',
              color: active ? 'white' : '#374151',
              borderColor: active ? '#1A2B4A' : '#D1D5DB',
            }}
          >
            {active && <span className="mr-1.5">✓</span>}{opt}
          </button>
        )
      })}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function IntakeWizardPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<IntakeFormState>(INITIAL_STATE)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const update = (key: keyof IntakeFormState, value: any) =>
    setForm((f) => ({ ...f, [key]: value }))

  const canContinue = () => {
    switch (step) {
      case 1: return !!form.projectType
      case 2: return form.squareFeet > 0
      case 3: return form.currentPains.length > 0
      case 4: return form.stylePreferences.length >= 1
      case 5: return form.budget > 0
      case 6: return form.priorities.length > 0
      case 7: return true // constraints optional
      case 8: return !!form.jurisdiction
      case 9: return !!form.timeline && !!form.email
      default: return false
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/ai-concept/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          phone: form.phone || undefined,
          name: form.name || undefined,
          projectType: form.projectType,
          squareFeet: form.squareFeet,
          jurisdiction: form.jurisdiction,
          currentPains: form.currentPains,
          stylePreferences: form.stylePreferences,
          budget: form.budget,
          priorities: form.priorities,
          constraints: form.constraints,
          timeline: form.timeline,
          bundleType: 'design_only',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Submission failed')

      // Redirect to tier selection / checkout
      router.push(`/intake-wizard/confirm?intakeId=${data.intakeId}&tier=${data.recommendedTier}&price=${data.enterpriseRequired ? 'cfq' : (data.recommendedTier === 'starter' ? '599' : '1299')}`)
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const tier = determineTier(form.squareFeet)
  const progress = Math.round((step / 9) * 100)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-lg px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-sm font-bold" style={{ color: '#1A2B4A' }}>Kealee</a>
          <span className="text-xs text-gray-400">Step {step} of 9</span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${progress}%`, backgroundColor: '#E8793A' }}
          />
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-10">

        {/* ── Screen 1: Project type ──────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#1A2B4A' }}>What are you renovating?</h2>
            <p className="text-gray-500 text-sm mb-6">Choose the primary area or project type.</p>
            <div className="grid grid-cols-2 gap-3">
              {PROJECT_TYPES.map((pt) => (
                <button
                  key={pt.key}
                  type="button"
                  onClick={() => update('projectType', pt.key)}
                  className="flex flex-col items-start rounded-2xl border p-5 text-left transition-all hover:shadow-sm"
                  style={{
                    borderColor: form.projectType === pt.key ? '#E8793A' : '#E5E7EB',
                    borderWidth: form.projectType === pt.key ? 2 : 1,
                    backgroundColor: form.projectType === pt.key ? 'rgba(232,121,58,0.04)' : 'white',
                  }}
                >
                  <span className="text-3xl mb-2">{pt.emoji}</span>
                  <span className="font-bold text-sm" style={{ color: '#1A2B4A' }}>{pt.label}</span>
                  <span className="text-xs text-gray-400 mt-0.5">{pt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Screen 2: Square footage ────────────────────────────────── */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#1A2B4A' }}>How big is your space?</h2>
            <p className="text-gray-500 text-sm mb-8">This determines your concept tier and pricing.</p>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
              <div className="text-center mb-6">
                <span className="text-5xl font-bold" style={{ color: '#E8793A' }}>{form.squareFeet.toLocaleString()}</span>
                <span className="text-xl text-gray-500 ml-2">sqft</span>
              </div>
              <input
                type="range"
                min={50}
                max={5000}
                step={50}
                value={form.squareFeet}
                onChange={(e) => update('squareFeet', Number(e.target.value))}
                className="w-full accent-orange-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>50 sqft</span>
                <span>5,000 sqft</span>
              </div>
            </div>

            {/* Tier preview */}
            <div
              className="rounded-xl p-4 text-sm"
              style={{ backgroundColor: 'rgba(26,43,74,0.05)', border: '1px solid rgba(26,43,74,0.1)' }}
            >
              <p className="font-semibold" style={{ color: '#1A2B4A' }}>
                Recommended tier: <span style={{ color: '#E8793A' }}>{tier.label}</span>
              </p>
              <p className="text-gray-500 text-xs mt-1">
                {tier.tier === 'starter' && '0–800 sqft — 3 concepts, specs, 1 revision'}
                {tier.tier === 'professional' && '800–3,000 sqft — 3 concepts + zoning analysis, 2 revisions'}
                {tier.tier === 'enterprise' && '3,000+ sqft — custom scope, enterprise quote'}
              </p>
              <p className="font-bold mt-2" style={{ color: '#E8793A' }}>{tier.price}</p>
            </div>
          </div>
        )}

        {/* ── Screen 3: Current pains ──────────────────────────────────── */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#1A2B4A' }}>What&apos;s your current space like?</h2>
            <p className="text-gray-500 text-sm mb-6">Select all that apply.</p>
            <MultiSelect
              options={CURRENT_PAINS}
              value={form.currentPains}
              onChange={(v) => update('currentPains', v)}
            />
          </div>
        )}

        {/* ── Screen 4: Style ─────────────────────────────────────────── */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#1A2B4A' }}>What style appeals to you?</h2>
            <p className="text-gray-500 text-sm mb-6">Pick up to 2 styles. We&apos;ll create distinct concepts for each.</p>
            <div className="space-y-3">
              {STYLES.map((style) => {
                const active = form.stylePreferences.includes(style.key)
                const atMax = form.stylePreferences.length >= 2 && !active
                return (
                  <button
                    key={style.key}
                    type="button"
                    disabled={atMax}
                    onClick={() => {
                      if (active) {
                        update('stylePreferences', form.stylePreferences.filter((s) => s !== style.key))
                      } else if (!atMax) {
                        update('stylePreferences', [...form.stylePreferences, style.key])
                      }
                    }}
                    className="w-full flex items-center justify-between rounded-xl border px-5 py-4 text-left transition-all"
                    style={{
                      borderColor: active ? '#1A2B4A' : '#E5E7EB',
                      borderWidth: active ? 2 : 1,
                      backgroundColor: active ? 'rgba(26,43,74,0.04)' : atMax ? '#F9FAFB' : 'white',
                      opacity: atMax ? 0.5 : 1,
                    }}
                  >
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#1A2B4A' }}>{style.key}</p>
                      <p className="text-xs text-gray-400">{style.desc}</p>
                    </div>
                    {active && <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Screen 5: Budget ────────────────────────────────────────── */}
        {step === 5 && (
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#1A2B4A' }}>What&apos;s your budget range?</h2>
            <p className="text-gray-500 text-sm mb-8">This helps us suggest realistic materials and scoping.</p>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
              <div className="text-center mb-6">
                <span className="text-5xl font-bold" style={{ color: '#E8793A' }}>
                  ${form.budget >= 200000 ? '200K+' : `${(form.budget / 1000).toFixed(0)}K`}
                </span>
              </div>
              <input
                type="range"
                min={5000}
                max={200000}
                step={5000}
                value={form.budget}
                onChange={(e) => update('budget', Number(e.target.value))}
                className="w-full accent-orange-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>$5K</span>
                <span>$200K+</span>
              </div>
            </div>
            <p className="text-xs text-center text-gray-400">Construction cost estimate — separate from Kealee service fees</p>
          </div>
        )}

        {/* ── Screen 6: Priorities ────────────────────────────────────── */}
        {step === 6 && (
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#1A2B4A' }}>What&apos;s most important to you?</h2>
            <p className="text-gray-500 text-sm mb-6">Select all that matter for your design.</p>
            <MultiSelect
              options={PRIORITIES}
              value={form.priorities}
              onChange={(v) => update('priorities', v)}
            />
          </div>
        )}

        {/* ── Screen 7: Must-nots ──────────────────────────────────────── */}
        {step === 7 && (
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#1A2B4A' }}>What should we avoid?</h2>
            <p className="text-gray-500 text-sm mb-6">Optional — skip if nothing applies.</p>
            <MultiSelect
              options={CONSTRAINTS}
              value={form.constraints}
              onChange={(v) => update('constraints', v)}
            />
          </div>
        )}

        {/* ── Screen 8: Jurisdiction ──────────────────────────────────── */}
        {step === 8 && (
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#1A2B4A' }}>Where is your home?</h2>
            <p className="text-gray-500 text-sm mb-6">We load jurisdiction-specific permit rules and cost data.</p>
            <div className="space-y-3">
              {JURISDICTIONS.map((j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => update('jurisdiction', j)}
                  className="w-full rounded-xl border px-5 py-4 text-left text-sm font-semibold transition-all"
                  style={{
                    borderColor: form.jurisdiction === j ? '#1A2B4A' : '#E5E7EB',
                    borderWidth: form.jurisdiction === j ? 2 : 1,
                    backgroundColor: form.jurisdiction === j ? 'rgba(26,43,74,0.04)' : 'white',
                    color: '#1A2B4A',
                  }}
                >
                  {form.jurisdiction === j && <span className="mr-2">✓</span>}{j}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Screen 9: Timeline + contact ────────────────────────────── */}
        {step === 9 && (
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#1A2B4A' }}>When do you want to start?</h2>
            <p className="text-gray-500 text-sm mb-6">Plus your contact details to receive your concept package.</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {TIMELINES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => update('timeline', t.key)}
                  className="rounded-xl border p-4 text-left transition-all"
                  style={{
                    borderColor: form.timeline === t.key ? '#E8793A' : '#E5E7EB',
                    borderWidth: form.timeline === t.key ? 2 : 1,
                    backgroundColor: form.timeline === t.key ? 'rgba(232,121,58,0.04)' : 'white',
                  }}
                >
                  <p className="font-bold text-sm" style={{ color: '#1A2B4A' }}>{t.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Name <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-orange-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Email address *</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-orange-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="tel"
                  placeholder="(202) 555-1234"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-orange-400"
                />
              </div>
            </div>

            {/* Price summary */}
            <div className="mt-6 rounded-xl p-4 text-sm" style={{ backgroundColor: 'rgba(26,43,74,0.05)' }}>
              <p className="font-bold mb-1" style={{ color: '#1A2B4A' }}>Your package</p>
              <p className="text-gray-600">{tier.label} — {form.projectType} · {form.squareFeet} sqft · {form.jurisdiction}</p>
              <p className="text-xl font-bold mt-1" style={{ color: '#E8793A' }}>{tier.price}</p>
            </div>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          </div>
        )}

        {/* ── Navigation ─────────────────────────────────────────────── */}
        <div className="mt-8 flex items-center gap-4">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          )}

          <button
            type="button"
            onClick={step === 9 ? handleSubmit : () => setStep(step + 1)}
            disabled={!canContinue() || submitting}
            className="ml-auto flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: '#E8793A' }}
          >
            {submitting ? 'Submitting…' : step === 9 ? 'See my pricing' : 'Continue'}
            {!submitting && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>

        {/* Step indicators */}
        <div className="mt-6 flex justify-center gap-1.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i + 1 === step ? 20 : 6,
                backgroundColor: i + 1 <= step ? '#E8793A' : '#E5E7EB',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
