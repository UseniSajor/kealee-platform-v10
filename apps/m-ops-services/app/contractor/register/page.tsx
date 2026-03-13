'use client'

/**
 * /contractor/register
 *
 * Contractor marketplace registration form.
 * Collects account credentials, business info, and professional credentials.
 * Submits to POST /marketplace/contractors/register (public endpoint).
 * On success, redirects to /contractor/register/success (pending verification).
 *
 * Stack: react-hook-form + zod, Tailwind CSS, Lucide icons, Sonner toasts.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Loader2,
  Eye,
  EyeOff,
  Building2,
  User,
  MapPin,
  Wrench,
  Shield,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { registerContractor, RegistrationError } from '../../../lib/api/contractor-registration'

// ─── Zod schema (mirrors backend) ────────────────────────────────────────────

const schema = z
  .object({
    // Step 1 — Account
    email:           z.string().email('Enter a valid email address'),
    password:        z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    firstName:       z.string().min(1, 'First name is required').max(100),
    lastName:        z.string().min(1, 'Last name is required').max(100),

    // Step 2 — Business
    companyName: z.string().min(1, 'Company name is required').max(200),
    phone:       z.string().min(10, 'Enter a valid phone number').max(20),
    address:     z.string().min(1, 'Street address is required').max(300),
    city:        z.string().min(1, 'City is required').max(100),
    state:       z.string().length(2, 'Select a state'),
    zip:         z.string().regex(/^\d{5}(-\d{4})?$/, 'Enter a valid ZIP code'),
    website:     z.string().url('Enter a valid URL (include https://)').optional().or(z.literal('')),
    description: z.string().max(2000).optional(),

    // Step 3 — Credentials
    tradeSpecialties:    z.array(z.string()).min(1, 'Select at least one trade specialty'),
    serviceAreas:        z.array(z.string()).min(1, 'Add at least one service area'),
    licenseNumbers:      z.array(z.string()).optional().default([]),
    insuranceCarrier:    z.string().max(200).optional(),
    insuranceExpiration: z.string().optional(),
    professionalType:    z.enum(['CONTRACTOR', 'DESIGN_BUILD']).default('CONTRACTOR'),

    // Legal
    agreeToTerms: z.boolean().refine((v) => v, 'You must agree to the terms'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

// ─── Constants ────────────────────────────────────────────────────────────────

const TRADE_SPECIALTIES = [
  'General Contracting',
  'Residential Construction',
  'Commercial Construction',
  'Custom Home Building',
  'Renovation & Remodeling',
  'Design-Build',
  'Concrete & Masonry',
  'Framing & Structural',
  'Roofing',
  'Plumbing',
  'Electrical',
  'HVAC',
  'Drywall & Painting',
  'Flooring',
  'Tile & Stone',
  'Cabinetry & Millwork',
  'Landscaping & Hardscape',
  'Site Work & Excavation',
  'Demolition',
  'Sustainable / Green Building',
]

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]

const STEPS = [
  { id: 1, label: 'Account',     icon: User },
  { id: 2, label: 'Business',    icon: Building2 },
  { id: 3, label: 'Credentials', icon: Shield },
]

function passwordStrength(pw: string): number {
  let s = 0
  if (pw.length >= 8)  s++
  if (pw.length >= 12) s++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++
  if (/\d/.test(pw))   s++
  if (/[^a-zA-Z\d]/.test(pw)) s++
  return Math.min(s, 4)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
      <AlertCircle size={12} />
      {message}
    </p>
  )
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  )
}

const inputCls = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all text-sm disabled:bg-gray-50 disabled:text-gray-500'

// ─── Tag input (service areas, license numbers) ────────────────────────────

function TagInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  disabled?: boolean
}) {
  const [input, setInput] = useState('')

  const add = () => {
    const trimmed = input.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInput('')
  }

  const remove = (tag: string) => onChange(value.filter((v) => v !== tag))

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); add() }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={inputCls}
        />
        <button
          type="button"
          onClick={add}
          disabled={disabled || !input.trim()}
          className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-sm text-gray-700 disabled:opacity-40 transition-colors flex-shrink-0"
        >
          <Plus size={16} />
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-medium"
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(tag)}
                  className="hover:text-blue-900 ml-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Step progress indicator ──────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, idx) => {
        const done    = currentStep > step.id
        const active  = currentStep === step.id
        const Icon    = step.icon
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  done
                    ? 'bg-green-500 border-green-500 text-white'
                    : active
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {done ? <CheckCircle2 size={18} /> : <Icon size={18} />}
              </div>
              <span
                className={`mt-1.5 text-xs font-medium ${
                  active ? 'text-blue-600' : done ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`w-16 h-0.5 mx-2 mb-5 ${
                  currentStep > step.id ? 'bg-green-400' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ContractorRegisterPage() {
  const router  = useRouter()
  const [step, setStep]     = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPw, setShowPw] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      professionalType: 'CONTRACTOR',
      tradeSpecialties: [],
      serviceAreas:     [],
      licenseNumbers:   [],
    },
    mode: 'onBlur',
  })

  const pw = watch('password')
  const pwStrength = passwordStrength(pw ?? '')

  // Fields per step — used for partial validation before advancing
  const STEP_FIELDS: Record<number, (keyof FormData)[]> = {
    1: ['firstName', 'lastName', 'email', 'password', 'confirmPassword'],
    2: ['companyName', 'phone', 'address', 'city', 'state', 'zip'],
    3: ['tradeSpecialties', 'serviceAreas', 'agreeToTerms'],
  }

  const advance = async () => {
    const valid = await trigger(STEP_FIELDS[step])
    if (valid) setStep((s) => s + 1)
  }

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    setServerError(null)
    try {
      await registerContractor({
        email:               data.email,
        password:            data.password,
        firstName:           data.firstName,
        lastName:            data.lastName,
        companyName:         data.companyName,
        phone:               data.phone,
        address:             data.address,
        city:                data.city,
        state:               data.state,
        zip:                 data.zip,
        website:             data.website || undefined,
        description:         data.description || undefined,
        tradeSpecialties:    data.tradeSpecialties,
        serviceAreas:        data.serviceAreas,
        licenseNumbers:      data.licenseNumbers ?? [],
        insuranceCarrier:    data.insuranceCarrier || undefined,
        insuranceExpiration: data.insuranceExpiration || undefined,
        professionalType:    data.professionalType,
      })

      toast.success('Registration submitted!')
      router.push('/contractor/register/success')
    } catch (err) {
      if (err instanceof RegistrationError) {
        if (err.isEmailConflict) {
          setServerError('An account with this email already exists. Please sign in or use a different email.')
          setStep(1)
        } else {
          setServerError(err.message)
        }
      } else {
        setServerError('Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="/kealee-logo-600w.png"
            alt="Kealee"
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-900">Join the Kealee Marketplace</h1>
          <p className="mt-2 text-gray-600 text-base">
            Create your contractor profile and start receiving permit-ready project leads.
          </p>
        </div>

        <StepIndicator currentStep={step} />

        {/* Server error banner */}
        {serverError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

            {/* ── STEP 1: Account ────────────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="pb-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User size={20} className="text-blue-600" />
                    Account Credentials
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Create your login to access the contractor dashboard.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label required>First Name</Label>
                    <input {...register('firstName')} placeholder="Jane" autoFocus className={inputCls} />
                    <FieldError message={errors.firstName?.message} />
                  </div>
                  <div>
                    <Label required>Last Name</Label>
                    <input {...register('lastName')} placeholder="Smith" className={inputCls} />
                    <FieldError message={errors.lastName?.message} />
                  </div>
                </div>

                <div>
                  <Label required>Work Email</Label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="you@yourcompany.com"
                    autoComplete="email"
                    className={inputCls}
                  />
                  <FieldError message={errors.email?.message} />
                </div>

                <div>
                  <Label required>Password</Label>
                  <div className="relative">
                    <input
                      {...register('password')}
                      type={showPw ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className={`${inputCls} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {pw && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[1,2,3,4].map((l) => (
                          <div
                            key={l}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              l <= pwStrength
                                ? pwStrength <= 2 ? 'bg-red-500'
                                  : pwStrength === 3 ? 'bg-yellow-500'
                                  : 'bg-green-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {pwStrength <= 2 ? 'Weak — add uppercase, numbers, or symbols'
                          : pwStrength === 3 ? 'Good — consider adding a symbol'
                          : 'Strong password'}
                      </p>
                    </div>
                  )}
                  <FieldError message={errors.password?.message} />
                </div>

                <div>
                  <Label required>Confirm Password</Label>
                  <input
                    {...register('confirmPassword')}
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={inputCls}
                  />
                  <FieldError message={errors.confirmPassword?.message} />
                </div>
              </div>
            )}

            {/* ── STEP 2: Business ───────────────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="pb-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Building2 size={20} className="text-blue-600" />
                    Business Information
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Tell us about your company so we can match you with the right projects.</p>
                </div>

                <div>
                  <Label required>Company Name</Label>
                  <input
                    {...register('companyName')}
                    placeholder="Smith Construction LLC"
                    autoFocus
                    className={inputCls}
                  />
                  <FieldError message={errors.companyName?.message} />
                </div>

                <div>
                  <Label required>Primary Phone</Label>
                  <input
                    {...register('phone')}
                    type="tel"
                    placeholder="(555) 000-0000"
                    autoComplete="tel"
                    className={inputCls}
                  />
                  <FieldError message={errors.phone?.message} />
                </div>

                <div>
                  <Label required>Business Address</Label>
                  <input
                    {...register('address')}
                    placeholder="123 Main Street"
                    autoComplete="street-address"
                    className={inputCls}
                  />
                  <FieldError message={errors.address?.message} />
                </div>

                <div className="grid grid-cols-6 gap-3">
                  <div className="col-span-3">
                    <Label required>City</Label>
                    <input {...register('city')} placeholder="Phoenix" autoComplete="address-level2" className={inputCls} />
                    <FieldError message={errors.city?.message} />
                  </div>
                  <div className="col-span-1">
                    <Label required>State</Label>
                    <select {...register('state')} className={inputCls} defaultValue="">
                      <option value="" disabled>—</option>
                      {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <FieldError message={errors.state?.message} />
                  </div>
                  <div className="col-span-2">
                    <Label required>ZIP</Label>
                    <input {...register('zip')} placeholder="85001" autoComplete="postal-code" className={inputCls} />
                    <FieldError message={errors.zip?.message} />
                  </div>
                </div>

                <div>
                  <Label>Website <span className="text-gray-400 font-normal text-xs">(optional)</span></Label>
                  <input
                    {...register('website')}
                    type="url"
                    placeholder="https://yourcompany.com"
                    className={inputCls}
                  />
                  <FieldError message={errors.website?.message} />
                </div>

                <div>
                  <Label>Company Description <span className="text-gray-400 font-normal text-xs">(optional)</span></Label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    placeholder="Tell us about your experience, project types, and what sets your company apart..."
                    className={`${inputCls} resize-none`}
                  />
                  <p className="mt-1 text-xs text-gray-400">Shown on your public contractor profile.</p>
                  <FieldError message={errors.description?.message} />
                </div>
              </div>
            )}

            {/* ── STEP 3: Credentials ────────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="pb-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Shield size={20} className="text-blue-600" />
                    Professional Credentials
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Your license and insurance will be reviewed by our team before you receive leads.
                  </p>
                </div>

                {/* Professional type */}
                <div>
                  <Label required>Business Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['CONTRACTOR', 'DESIGN_BUILD'] as const).map((type) => (
                      <label
                        key={type}
                        className="relative flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all"
                      >
                        <Controller
                          name="professionalType"
                          control={control}
                          render={({ field }) => (
                            <input
                              type="radio"
                              value={type}
                              checked={field.value === type}
                              onChange={() => field.onChange(type)}
                              className="w-4 h-4 text-blue-600"
                            />
                          )}
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {type === 'CONTRACTOR' ? 'General Contractor' : 'Design-Build Firm'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {type === 'CONTRACTOR'
                              ? 'Build from approved plans'
                              : 'Design and build under one contract'}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Trade specialties */}
                <div>
                  <Label required>Trade Specialties</Label>
                  <p className="text-xs text-gray-500 mb-2">Select all trades that apply to your company.</p>
                  <Controller
                    name="tradeSpecialties"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-2 gap-2">
                        {TRADE_SPECIALTIES.map((trade) => {
                          const checked = field.value.includes(trade)
                          return (
                            <label
                              key={trade}
                              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer text-sm transition-all ${
                                checked
                                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    field.onChange([...field.value, trade])
                                  } else {
                                    field.onChange(field.value.filter((v: string) => v !== trade))
                                  }
                                }}
                                className="w-3.5 h-3.5 text-blue-600 rounded"
                              />
                              {trade}
                            </label>
                          )
                        })}
                      </div>
                    )}
                  />
                  <FieldError message={errors.tradeSpecialties?.message} />
                </div>

                {/* Service areas */}
                <div>
                  <Label required>Service Areas</Label>
                  <p className="text-xs text-gray-500 mb-2">Enter cities, counties, or ZIP codes where you operate.</p>
                  <Controller
                    name="serviceAreas"
                    control={control}
                    render={({ field }) => (
                      <TagInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="e.g. Phoenix AZ, Scottsdale, 85001"
                      />
                    )}
                  />
                  <FieldError message={errors.serviceAreas?.message} />
                </div>

                {/* License numbers */}
                <div>
                  <Label>Contractor License Numbers</Label>
                  <p className="text-xs text-gray-500 mb-2">Add one or more state license numbers (required for verification).</p>
                  <Controller
                    name="licenseNumbers"
                    control={control}
                    render={({ field }) => (
                      <TagInput
                        value={field.value ?? []}
                        onChange={field.onChange}
                        placeholder="e.g. ROC-123456"
                      />
                    )}
                  />
                </div>

                {/* Insurance */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Insurance Carrier</Label>
                    <input
                      {...register('insuranceCarrier')}
                      placeholder="e.g. State Farm"
                      className={inputCls}
                    />
                    <FieldError message={errors.insuranceCarrier?.message} />
                  </div>
                  <div>
                    <Label>Policy Expiration</Label>
                    <input
                      {...register('insuranceExpiration')}
                      type="date"
                      className={inputCls}
                    />
                    <FieldError message={errors.insuranceExpiration?.message} />
                  </div>
                </div>

                {/* Verification notice */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                  <Shield size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Verification required before receiving leads</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Our team will verify your license and insurance within 1–2 business days.
                      You will receive an email when your account is approved.
                    </p>
                  </div>
                </div>

                {/* Terms */}
                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      {...register('agreeToTerms')}
                      type="checkbox"
                      className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">
                      I agree to the{' '}
                      <a href="/terms" target="_blank" rel="noopener" className="text-blue-600 hover:text-blue-700 underline">
                        Contractor Terms of Service
                      </a>
                      {' '}and{' '}
                      <a href="/privacy" target="_blank" rel="noopener" className="text-blue-600 hover:text-blue-700 underline">
                        Privacy Policy
                      </a>
                      . I confirm that all information provided is accurate.
                    </span>
                  </label>
                  <FieldError message={errors.agreeToTerms?.message} />
                </div>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className={`mt-6 flex gap-3 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all"
              >
                <ChevronLeft size={16} />
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={advance}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
              >
                Continue
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Creating account...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Submit Registration
                  </>
                )}
              </button>
            )}
          </div>

          {/* Sign-in link */}
          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}
