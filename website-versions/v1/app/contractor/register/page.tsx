'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { CheckCircle2, ChevronRight, ChevronLeft, Building2, User, Wrench, Shield } from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const TRADE_SPECIALTIES = [
  'General Contracting', 'Concrete', 'Masonry', 'Steel / Structural', 'Framing / Rough Carpentry',
  'Roofing', 'Windows & Doors', 'Plumbing', 'Electrical', 'HVAC / Mechanical',
  'Insulation', 'Drywall / Plaster', 'Flooring', 'Tile & Stone', 'Painting',
  'Cabinets & Millwork', 'Landscaping / Grading', 'Excavation', 'Utilities',
  'Fire Protection', 'Elevators', 'Solar / Renewable', 'Low Voltage / AV',
]

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
]

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Account',  icon: User },
  { id: 2, label: 'Business', icon: Building2 },
  { id: 3, label: 'Trades',   icon: Wrench },
  { id: 4, label: 'Insurance',icon: Shield },
]

// ─── Form state type ──────────────────────────────────────────────────────────

interface FormState {
  // Step 1 — Account
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  // Step 2 — Business
  companyName: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  website: string
  description: string
  // Step 3 — Trades
  tradeSpecialties: string[]
  serviceAreas: string[]
  licenseNumbers: string
  // Step 4 — Insurance
  insuranceCarrier: string
  insuranceExpiration: string
  professionalType: 'CONTRACTOR' | 'DESIGN_BUILD'
}

const INITIAL: FormState = {
  email: '', password: '', confirmPassword: '', firstName: '', lastName: '',
  companyName: '', phone: '', address: '', city: '', state: '', zip: '', website: '', description: '',
  tradeSpecialties: [], serviceAreas: [], licenseNumbers: '',
  insuranceCarrier: '', insuranceExpiration: '', professionalType: 'CONTRACTOR',
}

// ─── Validation per step ──────────────────────────────────────────────────────

function validateStep(step: number, f: FormState): string | null {
  if (step === 1) {
    if (!f.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return 'Enter a valid email address.'
    if (f.password.length < 8) return 'Password must be at least 8 characters.'
    if (f.password !== f.confirmPassword) return 'Passwords do not match.'
    if (!f.firstName.trim()) return 'First name is required.'
    if (!f.lastName.trim()) return 'Last name is required.'
  }
  if (step === 2) {
    if (!f.companyName.trim()) return 'Company name is required.'
    if (f.phone.replace(/\D/g, '').length < 10) return 'Enter a valid 10-digit phone number.'
    if (!f.address.trim()) return 'Address is required.'
    if (!f.city.trim()) return 'City is required.'
    if (!f.state) return 'Select a state.'
    if (!/^\d{5}(-\d{4})?$/.test(f.zip)) return 'Enter a valid ZIP code (e.g. 90210).'
    if (f.website && !/^https?:\/\/.+/.test(f.website)) return 'Website must start with http:// or https://'
  }
  if (step === 3) {
    if (f.tradeSpecialties.length === 0) return 'Select at least one trade specialty.'
    if (f.serviceAreas.length === 0) return 'Enter at least one service area (city or state).'
  }
  return null
}

// ─── Multi-select toggle ──────────────────────────────────────────────────────

function ToggleChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
        selected
          ? 'border-teal bg-teal/10 text-teal'
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
      }`}
    >
      {selected && <span className="mr-1">✓</span>}
      {label}
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ContractorRegisterPage() {
  const router = useRouter()
  const [step, setStep]   = useState(1)
  const [form, setForm]   = useState<FormState>(INITIAL)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // ── service areas input (comma-delimited) ──
  const [serviceAreaInput, setServiceAreaInput] = useState('')

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
    setError(null)
  }

  function toggleTrade(trade: string) {
    setForm(prev => ({
      ...prev,
      tradeSpecialties: prev.tradeSpecialties.includes(trade)
        ? prev.tradeSpecialties.filter(t => t !== trade)
        : [...prev.tradeSpecialties, trade],
    }))
    setError(null)
  }

  function handleServiceAreaKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = serviceAreaInput.trim()
      if (val && !form.serviceAreas.includes(val)) {
        set('serviceAreas', [...form.serviceAreas, val])
      }
      setServiceAreaInput('')
    }
  }

  function removeServiceArea(area: string) {
    set('serviceAreas', form.serviceAreas.filter(a => a !== area))
  }

  function handleNext() {
    const err = validateStep(step, form)
    if (err) { setError(err); return }
    setError(null)
    setStep(s => s + 1)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validateStep(4, form)
    if (err) { setError(err); return }

    setLoading(true)
    setError(null)

    // Parse license numbers (newline or comma separated)
    const licenseNumbers = form.licenseNumbers
      .split(/[\n,]/)
      .map(l => l.trim())
      .filter(Boolean)

    const body = {
      email:            form.email,
      password:         form.password,
      firstName:        form.firstName.trim(),
      lastName:         form.lastName.trim(),
      companyName:      form.companyName.trim(),
      phone:            form.phone.replace(/\D/g, ''),
      address:          form.address.trim(),
      city:             form.city.trim(),
      state:            form.state,
      zip:              form.zip,
      website:          form.website || undefined,
      description:      form.description || undefined,
      tradeSpecialties: form.tradeSpecialties,
      serviceAreas:     form.serviceAreas,
      licenseNumbers,
      insuranceCarrier:    form.insuranceCarrier || undefined,
      insuranceExpiration: form.insuranceExpiration || undefined,
      professionalType:    form.professionalType,
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? ''
      const res = await fetch(`${apiUrl}/marketplace/contractors/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'Registration failed. Please try again.')
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ──
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle2 className="h-16 w-16" style={{ color: '#2ABFBF' }} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Application Submitted!</h1>
          <p className="text-gray-500 mb-2">
            Welcome to Kealee, <span className="font-semibold text-gray-700">{form.firstName}</span>.
          </p>
          <p className="text-gray-500 mb-8 text-sm">
            Your contractor profile is under review. You&apos;ll receive an email at{' '}
            <span className="font-medium text-gray-700">{form.email}</span> once your credentials
            are verified — typically within 1 business day.
          </p>
          <Button
            variant="teal"
            size="lg"
            className="w-full"
            onClick={() => router.push('/')}
          >
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  // ── Progress stepper ──
  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: '#E8793A' }}>
            Contractor Network
          </p>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Kealee as a Contractor</h1>
          <p className="text-gray-500">Complete the application below. Verification takes less than 1 business day.</p>
        </div>

        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s) => {
              const Icon = s.icon
              const isComplete = step > s.id
              const isCurrent  = step === s.id
              return (
                <div key={s.id} className="flex flex-col items-center gap-1.5 flex-1">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                      isComplete ? 'text-white' :
                      isCurrent  ? 'text-white' :
                      'bg-gray-100 text-gray-400'
                    }`}
                    style={isComplete ? { backgroundColor: '#2ABFBF' } : isCurrent ? { backgroundColor: '#1A2B4A' } : {}}
                  >
                    {isComplete ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, backgroundColor: '#2ABFBF' }}
            />
          </div>
          <p className="text-right text-xs text-gray-400 mt-1">Step {step} of {STEPS.length}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} noValidate>

            {/* ── Step 1: Account ── */}
            {step === 1 && (
              <div className="space-y-5">
                <SectionTitle>Account Credentials</SectionTitle>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="First Name" required>
                    <Input
                      type="text"
                      placeholder="Jane"
                      value={form.firstName}
                      onChange={e => set('firstName', e.target.value)}
                      autoFocus
                    />
                  </Field>
                  <Field label="Last Name" required>
                    <Input
                      type="text"
                      placeholder="Smith"
                      value={form.lastName}
                      onChange={e => set('lastName', e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="Email Address" required>
                  <Input
                    type="email"
                    placeholder="jane@smithconstruction.com"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                  />
                </Field>
                <Field label="Password" required hint="Minimum 8 characters">
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                  />
                </Field>
                <Field label="Confirm Password" required>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={e => set('confirmPassword', e.target.value)}
                  />
                </Field>
              </div>
            )}

            {/* ── Step 2: Business ── */}
            {step === 2 && (
              <div className="space-y-5">
                <SectionTitle>Business Information</SectionTitle>
                <Field label="Company Name" required>
                  <Input
                    type="text"
                    placeholder="Smith Construction LLC"
                    value={form.companyName}
                    onChange={e => set('companyName', e.target.value)}
                    autoFocus
                  />
                </Field>
                <Field label="Business Phone" required>
                  <Input
                    type="tel"
                    placeholder="(555) 000-0000"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                  />
                </Field>
                <Field label="Street Address" required>
                  <Input
                    type="text"
                    placeholder="123 Main St"
                    value={form.address}
                    onChange={e => set('address', e.target.value)}
                  />
                </Field>
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label="City" required className="sm:col-span-1">
                    <Input
                      type="text"
                      placeholder="Austin"
                      value={form.city}
                      onChange={e => set('city', e.target.value)}
                    />
                  </Field>
                  <Field label="State" required>
                    <Select value={form.state} onChange={e => set('state', e.target.value)}>
                      <option value="">Select</option>
                      {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </Field>
                  <Field label="ZIP Code" required>
                    <Input
                      type="text"
                      placeholder="78701"
                      maxLength={10}
                      value={form.zip}
                      onChange={e => set('zip', e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="Website" hint="Optional">
                  <Input
                    type="url"
                    placeholder="https://smithconstruction.com"
                    value={form.website}
                    onChange={e => set('website', e.target.value)}
                  />
                </Field>
                <Field label="Company Description" hint="Optional — shown to project owners">
                  <Textarea
                    placeholder="Tell project owners about your company, experience, and what makes you stand out..."
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    rows={3}
                  />
                </Field>
              </div>
            )}

            {/* ── Step 3: Trades ── */}
            {step === 3 && (
              <div className="space-y-6">
                <SectionTitle>Trade Specialties & Service Areas</SectionTitle>

                <Field label="Trade Specialties" required hint="Select all that apply">
                  <div className="flex flex-wrap gap-2 mt-1">
                    {TRADE_SPECIALTIES.map(t => (
                      <ToggleChip
                        key={t}
                        label={t}
                        selected={form.tradeSpecialties.includes(t)}
                        onClick={() => toggleTrade(t)}
                      />
                    ))}
                  </div>
                  {form.tradeSpecialties.length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">{form.tradeSpecialties.length} selected</p>
                  )}
                </Field>

                <Field
                  label="Service Areas"
                  required
                  hint='Type a city or state and press Enter or comma to add. E.g. "Austin, TX"'
                >
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Austin, TX — press Enter to add"
                      value={serviceAreaInput}
                      onChange={e => setServiceAreaInput(e.target.value)}
                      onKeyDown={handleServiceAreaKeyDown}
                    />
                    {form.serviceAreas.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {form.serviceAreas.map(area => (
                          <span
                            key={area}
                            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border"
                            style={{ borderColor: '#2ABFBF', color: '#2ABFBF', background: 'rgba(42,191,191,0.08)' }}
                          >
                            {area}
                            <button
                              type="button"
                              onClick={() => removeServiceArea(area)}
                              className="ml-0.5 hover:text-red-500 transition-colors"
                              aria-label={`Remove ${area}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Field>

                <Field
                  label="License Numbers"
                  hint="Optional — one per line, or comma-separated"
                >
                  <Textarea
                    placeholder={`General Contractor: TX-GC-123456\nElectrical: TX-EC-789012`}
                    value={form.licenseNumbers}
                    onChange={e => set('licenseNumbers', e.target.value)}
                    rows={3}
                  />
                </Field>
              </div>
            )}

            {/* ── Step 4: Insurance ── */}
            {step === 4 && (
              <div className="space-y-5">
                <SectionTitle>Insurance & Final Details</SectionTitle>

                <Field label="Contractor Type" required>
                  <Select
                    value={form.professionalType}
                    onChange={e => set('professionalType', e.target.value as 'CONTRACTOR' | 'DESIGN_BUILD')}
                  >
                    <option value="CONTRACTOR">General Contractor / Trade Contractor</option>
                    <option value="DESIGN_BUILD">Design-Build Firm</option>
                  </Select>
                </Field>

                <Field label="Insurance Carrier" hint="Optional — required for verification">
                  <Input
                    type="text"
                    placeholder="Travelers Insurance"
                    value={form.insuranceCarrier}
                    onChange={e => set('insuranceCarrier', e.target.value)}
                    autoFocus
                  />
                </Field>

                <Field label="Policy Expiration Date" hint="Optional">
                  <Input
                    type="date"
                    value={form.insuranceExpiration}
                    onChange={e => set('insuranceExpiration', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </Field>

                {/* Summary */}
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-5 space-y-2 text-sm">
                  <p className="font-semibold text-gray-700 mb-3">Application Summary</p>
                  <SummaryRow label="Name"    value={`${form.firstName} ${form.lastName}`} />
                  <SummaryRow label="Email"   value={form.email} />
                  <SummaryRow label="Company" value={form.companyName} />
                  <SummaryRow label="Location" value={`${form.city}, ${form.state} ${form.zip}`} />
                  <SummaryRow label="Trades"  value={form.tradeSpecialties.slice(0, 3).join(', ') + (form.tradeSpecialties.length > 3 ? ` +${form.tradeSpecialties.length - 3} more` : '')} />
                  <SummaryRow label="Areas"   value={form.serviceAreas.join(', ')} />
                </div>

                <p className="text-xs text-gray-400">
                  By submitting this application, you agree to Kealee&apos;s{' '}
                  <a href="/terms" className="underline hover:text-gray-600">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" className="underline hover:text-gray-600">Privacy Policy</a>.
                  Your credentials will be verified before your profile goes live.
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between gap-3">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  leftIcon={<ChevronLeft className="h-4 w-4" />}
                  onClick={() => { setError(null); setStep(s => s - 1) }}
                  disabled={loading}
                >
                  Back
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  href="/contractors"
                >
                  Cancel
                </Button>
              )}

              {step < STEPS.length ? (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                  onClick={handleNext}
                  className="ml-auto"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  className="ml-auto"
                >
                  Submit Application
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Sign-in link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already a member?{' '}
          <a
            href={`${process.env.NEXT_PUBLIC_PORTAL_CONTRACTOR_URL ?? 'http://localhost:3021'}/login`}
            className="font-medium hover:underline"
            style={{ color: '#2ABFBF' }}
          >
            Sign in to your contractor portal
          </a>
        </p>
      </div>
    </div>
  )
}

// ─── Small helper components ──────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold text-gray-900 pb-1 border-b border-gray-100">
      {children}
    </h2>
  )
}

function Field({
  label,
  required,
  hint,
  children,
  className = '',
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
        {hint && <span className="ml-2 font-normal text-gray-400 text-xs">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-20 shrink-0 text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium">{value || '—'}</span>
    </div>
  )
}
