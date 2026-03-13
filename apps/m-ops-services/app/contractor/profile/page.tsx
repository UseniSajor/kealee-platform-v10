'use client'

/**
 * /contractor/profile
 *
 * Authenticated contractor profile editor.
 * Loads the contractor's existing profile on mount and allows editing of:
 *   - Business Info (name, description, phone, email, website, years, team size)
 *   - Services (trade specialties, service categories, focus, project sizes)
 *   - Coverage (service radius, states, cities/counties)
 *   - Credentials ⚠️ (license, insurance — triggers reverification)
 *
 * Uses react-hook-form + zod. Unsaved changes detected via isDirty.
 * Credential field edits show a pre-submit reverification warning.
 *
 * Stack: react-hook-form, zod, Tailwind, Sonner, Lucide icons.
 */

import { useEffect, useState, useCallback } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import {
  Loader2,
  Save,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Building2,
  Wrench,
  MapPin,
  Shield,
  Globe,
  Phone,
  Mail,
  Clock,
  Users,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getMyProfile,
  updateMyProfile,
  ContractorProfile,
  ProfileApiError,
} from '../../../lib/api/contractor-profile'
import { createBrowserClient } from '@supabase/ssr'

// ─── Zod schema (mirrors backend) ────────────────────────────────────────────

const schema = z.object({
  businessName:     z.string().min(1, 'Company name is required').max(200),
  description:      z.string().max(2000).optional(),
  phone:            z.string().max(20).optional(),
  email:            z.string().email('Invalid email').optional().or(z.literal('')),
  website:          z.string().url('Enter a valid URL (include https://)').optional().or(z.literal('')),
  yearsInBusiness:  z.coerce.number().int().min(0).max(100).optional(),
  teamSize:         z.coerce.number().int().min(1).max(10000).optional(),
  emergencyServices: z.boolean().optional(),

  tradeSpecialties:      z.array(z.string()).min(1, 'Select at least one specialty'),
  serviceCategories:     z.array(z.string()).optional().default([]),
  commercialFocus:       z.boolean().optional(),
  residentialFocus:      z.boolean().optional(),
  preferredProjectSizes: z.array(z.string()).optional().default([]),

  serviceRadius: z.coerce.number().int().min(0).max(500).optional(),
  serviceStates: z.array(z.string()).optional().default([]),
  serviceCities: z.array(z.string()).optional().default([]),

  // Credentials — trigger reverification
  licenseNumber:       z.string().max(200).optional(),
  allLicenses:         z.array(z.string()).optional().default([]),
  insuranceCarrier:    z.string().max(200).optional(),
  insuranceExpiration: z.string().optional(),

  acceptingLeads: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

// ─── Constants ────────────────────────────────────────────────────────────────

const TRADE_SPECIALTIES = [
  'General Contracting',
  'Residential Construction',
  'Commercial Construction',
  'Electrical',
  'Plumbing',
  'HVAC',
  'Roofing',
  'Framing',
  'Concrete & Masonry',
  'Drywall & Insulation',
  'Flooring',
  'Painting',
  'Landscaping',
  'Excavation & Grading',
  'Steel & Structural',
  'Tile & Stone',
  'Cabinets & Millwork',
  'Windows & Doors',
  'Waterproofing',
  'Design-Build',
]

const SERVICE_CATEGORIES = [
  'Residential New Build',
  'Residential Remodel',
  'Residential Repair',
  'Commercial New Build',
  'Commercial TI / Tenant Improvement',
  'Commercial Remodel',
  'Industrial',
  'Mixed-Use',
  'Multi-Family',
  'Accessory Dwelling Units (ADU)',
  'Historic Renovation',
  'Disaster Restoration',
  'Pre-Construction Services',
  'Design-Build Services',
]

const PROJECT_SIZES = [
  { value: 'micro',   label: 'Micro  (< $25K)'       },
  { value: 'small',   label: 'Small  ($25K – $250K)'  },
  { value: 'medium',  label: 'Medium ($250K – $1M)'   },
  { value: 'large',   label: 'Large  ($1M – $10M)'    },
  { value: 'major',   label: 'Major  ($10M+)'         },
]

const US_STATES: Array<{ abbr: string; name: string }> = [
  { abbr: 'AL', name: 'Alabama' },       { abbr: 'AK', name: 'Alaska' },
  { abbr: 'AZ', name: 'Arizona' },       { abbr: 'AR', name: 'Arkansas' },
  { abbr: 'CA', name: 'California' },    { abbr: 'CO', name: 'Colorado' },
  { abbr: 'CT', name: 'Connecticut' },   { abbr: 'DE', name: 'Delaware' },
  { abbr: 'FL', name: 'Florida' },       { abbr: 'GA', name: 'Georgia' },
  { abbr: 'HI', name: 'Hawaii' },        { abbr: 'ID', name: 'Idaho' },
  { abbr: 'IL', name: 'Illinois' },      { abbr: 'IN', name: 'Indiana' },
  { abbr: 'IA', name: 'Iowa' },          { abbr: 'KS', name: 'Kansas' },
  { abbr: 'KY', name: 'Kentucky' },      { abbr: 'LA', name: 'Louisiana' },
  { abbr: 'ME', name: 'Maine' },         { abbr: 'MD', name: 'Maryland' },
  { abbr: 'MA', name: 'Massachusetts' }, { abbr: 'MI', name: 'Michigan' },
  { abbr: 'MN', name: 'Minnesota' },     { abbr: 'MS', name: 'Mississippi' },
  { abbr: 'MO', name: 'Missouri' },      { abbr: 'MT', name: 'Montana' },
  { abbr: 'NE', name: 'Nebraska' },      { abbr: 'NV', name: 'Nevada' },
  { abbr: 'NH', name: 'New Hampshire' }, { abbr: 'NJ', name: 'New Jersey' },
  { abbr: 'NM', name: 'New Mexico' },    { abbr: 'NY', name: 'New York' },
  { abbr: 'NC', name: 'North Carolina' },{ abbr: 'ND', name: 'North Dakota' },
  { abbr: 'OH', name: 'Ohio' },          { abbr: 'OK', name: 'Oklahoma' },
  { abbr: 'OR', name: 'Oregon' },        { abbr: 'PA', name: 'Pennsylvania' },
  { abbr: 'RI', name: 'Rhode Island' },  { abbr: 'SC', name: 'South Carolina' },
  { abbr: 'SD', name: 'South Dakota' },  { abbr: 'TN', name: 'Tennessee' },
  { abbr: 'TX', name: 'Texas' },         { abbr: 'UT', name: 'Utah' },
  { abbr: 'VT', name: 'Vermont' },       { abbr: 'VA', name: 'Virginia' },
  { abbr: 'WA', name: 'Washington' },    { abbr: 'WV', name: 'West Virginia' },
  { abbr: 'WI', name: 'Wisconsin' },     { abbr: 'WY', name: 'Wyoming' },
]

// Credential fields that trigger reverification when changed
const CREDENTIAL_FIELDS: (keyof FormValues)[] = [
  'licenseNumber',
  'allLicenses',
  'insuranceCarrier',
  'insuranceExpiration',
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContractorProfilePage() {
  const router = useRouter()

  const [authChecked,  setAuthChecked]  = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [loadError,    setLoadError]    = useState<string | null>(null)
  const [saving,       setSaving]       = useState(false)
  const [profile,      setProfile]      = useState<ContractorProfile | null>(null)

  // Section collapse state
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    credentials: false,
  })

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessName:          '',
      tradeSpecialties:      [],
      serviceCategories:     [],
      preferredProjectSizes: [],
      serviceStates:         [],
      serviceCities:         [],
      allLicenses:           [],
      commercialFocus:       false,
      residentialFocus:      true,
      emergencyServices:     false,
    },
  })

  // Watch credential fields to show warning banner
  const watchedLicense    = watch('licenseNumber')
  const watchedAllLicenses = watch('allLicenses')
  const watchedCarrier    = watch('insuranceCarrier')
  const watchedExpiry     = watch('insuranceExpiration')

  const credentialsDirty =
    !!dirtyFields.licenseNumber    ||
    !!dirtyFields.allLicenses      ||
    !!dirtyFields.insuranceCarrier ||
    !!dirtyFields.insuranceExpiration

  // ─── Auth check ─────────────────────────────────────────────────────────

  useEffect(() => {
    async function checkAuth() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/contractor/login')
        return
      }
      setAuthChecked(true)
    }
    checkAuth()
  }, [router])

  // ─── Load profile ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!authChecked) return
    loadProfile()
  }, [authChecked])

  async function loadProfile() {
    try {
      const p = await getMyProfile()
      setProfile(p)
      reset(profileToFormValues(p))
      setProfileLoaded(true)
    } catch (err: any) {
      if (err instanceof ProfileApiError && err.isUnauthenticated) {
        router.replace('/contractor/login')
        return
      }
      setLoadError(err.message ?? 'Failed to load profile')
    }
  }

  function profileToFormValues(p: ContractorProfile): FormValues {
    return {
      businessName:          p.businessName,
      description:           p.description ?? '',
      phone:                 p.phone ?? '',
      email:                 p.email ?? '',
      website:               p.website ?? '',
      yearsInBusiness:       p.yearsInBusiness ?? undefined,
      teamSize:              p.teamSize ?? undefined,
      emergencyServices:     p.emergencyServices,
      tradeSpecialties:      p.tradeSpecialties,
      serviceCategories:     p.serviceCategories,
      commercialFocus:       p.commercialFocus,
      residentialFocus:      p.residentialFocus,
      preferredProjectSizes: p.preferredProjectSizes,
      serviceRadius:         p.serviceRadius ?? undefined,
      serviceStates:         p.serviceStates,
      serviceCities:         p.serviceCities,
      licenseNumber:         p.licenseNumber ?? '',
      allLicenses:           p.allLicenses,
      insuranceCarrier:      p.insuranceCarrier ?? '',
      insuranceExpiration:   p.insuranceExpiration ?? '',
      acceptingLeads:        p.acceptingLeads,
    }
  }

  // ─── Unsaved changes guard ───────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // ─── Save ────────────────────────────────────────────────────────────────

  const onSubmit = async (values: FormValues) => {
    setSaving(true)
    try {
      const result = await updateMyProfile({
        businessName:          values.businessName,
        description:           values.description || undefined,
        phone:                 values.phone        || undefined,
        email:                 values.email        || undefined,
        website:               values.website      || undefined,
        yearsInBusiness:       values.yearsInBusiness,
        teamSize:              values.teamSize,
        emergencyServices:     values.emergencyServices,
        tradeSpecialties:      values.tradeSpecialties,
        serviceCategories:     values.serviceCategories ?? [],
        commercialFocus:       values.commercialFocus,
        residentialFocus:      values.residentialFocus,
        preferredProjectSizes: values.preferredProjectSizes ?? [],
        serviceRadius:         values.serviceRadius,
        serviceStates:         values.serviceStates ?? [],
        serviceCities:         values.serviceCities ?? [],
        licenseNumber:         values.licenseNumber || undefined,
        allLicenses:           values.allLicenses ?? [],
        insuranceCarrier:      values.insuranceCarrier || undefined,
        insuranceExpiration:   values.insuranceExpiration || undefined,
        acceptingLeads:        values.acceptingLeads,
      })

      setProfile(result.profile)
      reset(profileToFormValues(result.profile))

      if (result.requiresReverification) {
        toast.warning(result.message, { duration: 6000 })
      } else {
        toast.success(result.message)
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ─── Section toggle ──────────────────────────────────────────────────────

  const toggleSection = (key: string) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))

  // ─── Render states ───────────────────────────────────────────────────────

  if (!authChecked || !profileLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {loadError ? (
          <div className="text-center">
            <p className="text-red-600 mb-3">{loadError}</p>
            <button
              onClick={loadProfile}
              className="text-sm text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <Loader2 size={28} className="animate-spin text-blue-500" />
        )}
      </div>
    )
  }

  const vs = profile?.verificationStatus
  const statusColor =
    vs === 'APPROVED'  ? 'text-green-700 bg-green-50 border-green-200' :
    vs === 'SUSPENDED' ? 'text-red-700 bg-red-50 border-red-200'       :
    vs === 'REJECTED'  ? 'text-red-600 bg-red-50 border-red-200'       :
    'text-amber-700 bg-amber-50 border-amber-200'

  return (
    <div className="min-h-screen bg-gray-50 pb-32">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">My Profile</h1>
            <p className="text-xs text-gray-500">Keep your business information accurate to receive quality leads</p>
          </div>
          {profile && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColor}`}>
              {vs === 'APPROVED' ? 'Verified' : vs === 'SUSPENDED' ? 'Suspended' : vs === 'REJECTED' ? 'Rejected' : 'Pending Verification'}
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

          {/* ─── Reverification warning banner ─────────────────────────────── */}
          {credentialsDirty && (
            <div className="flex gap-3 p-4 bg-amber-50 border border-amber-300 rounded-xl">
              <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-amber-800">Credential changes require re-verification</p>
                <p className="text-amber-700 mt-0.5 text-xs leading-relaxed">
                  You have edited license or insurance fields. Saving will remove you from lead rotation
                  until our team re-verifies your credentials (typically 1–2 business days).
                </p>
              </div>
            </div>
          )}

          {/* ─── Section 1: Business Info ────────────────────────────────── */}
          <Section
            icon={<Building2 size={15} />}
            title="Business Information"
            sectionKey="business"
            collapsed={collapsed}
            onToggle={toggleSection}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label required>Company Name</Label>
                <input
                  {...register('businessName')}
                  className={inputCls(!!errors.businessName)}
                  placeholder="Smith Construction LLC"
                />
                <FieldError msg={errors.businessName?.message} />
              </div>

              <div className="sm:col-span-2">
                <Label>Description</Label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className={inputCls(!!errors.description) + ' resize-none'}
                  placeholder="Tell owners about your experience, values, and what makes you stand out..."
                />
                <FieldError msg={errors.description?.message} />
              </div>

              <div>
                <Label><Phone size={12} className="inline mr-1" />Phone</Label>
                <input
                  {...register('phone')}
                  className={inputCls(!!errors.phone)}
                  placeholder="(555) 000-1234"
                  type="tel"
                />
                <FieldError msg={errors.phone?.message} />
              </div>

              <div>
                <Label><Mail size={12} className="inline mr-1" />Business Email</Label>
                <input
                  {...register('email')}
                  className={inputCls(!!errors.email)}
                  placeholder="office@smithco.com"
                  type="email"
                />
                <FieldError msg={errors.email?.message} />
              </div>

              <div className="sm:col-span-2">
                <Label><Globe size={12} className="inline mr-1" />Website</Label>
                <input
                  {...register('website')}
                  className={inputCls(!!errors.website)}
                  placeholder="https://smithconstruction.com"
                  type="url"
                />
                <FieldError msg={errors.website?.message} />
              </div>

              <div>
                <Label><Clock size={12} className="inline mr-1" />Years in Business</Label>
                <input
                  {...register('yearsInBusiness', { valueAsNumber: true })}
                  className={inputCls(!!errors.yearsInBusiness)}
                  placeholder="12"
                  type="number"
                  min={0}
                  max={100}
                />
                <FieldError msg={errors.yearsInBusiness?.message} />
              </div>

              <div>
                <Label><Users size={12} className="inline mr-1" />Team Size</Label>
                <input
                  {...register('teamSize', { valueAsNumber: true })}
                  className={inputCls(!!errors.teamSize)}
                  placeholder="8"
                  type="number"
                  min={1}
                />
                <FieldError msg={errors.teamSize?.message} />
              </div>

              <div className="sm:col-span-2">
                <Controller
                  control={control}
                  name="emergencyServices"
                  render={({ field }) => (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <ToggleSwitch checked={!!field.value} onChange={field.onChange} />
                      <div>
                        <span className="text-sm font-medium text-gray-800 flex items-center gap-1">
                          <Zap size={13} className="text-amber-500" />
                          Emergency / 24-Hour Services
                        </span>
                        <p className="text-xs text-gray-500">Enable to appear in emergency contractor searches</p>
                      </div>
                    </label>
                  )}
                />
              </div>
            </div>
          </Section>

          {/* ─── Section 2: Services ─────────────────────────────────────── */}
          <Section
            icon={<Wrench size={15} />}
            title="Services"
            sectionKey="services"
            collapsed={collapsed}
            onToggle={toggleSection}
          >
            <div className="space-y-5">
              {/* Trade Specialties */}
              <div>
                <Label required>Trade Specialties</Label>
                <p className="text-xs text-gray-500 mb-2">Select all that apply</p>
                <Controller
                  control={control}
                  name="tradeSpecialties"
                  render={({ field }) => (
                    <CheckboxGrid
                      options={TRADE_SPECIALTIES}
                      value={field.value ?? []}
                      onChange={field.onChange}
                    />
                  )}
                />
                <FieldError msg={errors.tradeSpecialties?.message} />
              </div>

              {/* Service Categories */}
              <div>
                <Label>Service Categories</Label>
                <p className="text-xs text-gray-500 mb-2">Types of projects you take on</p>
                <Controller
                  control={control}
                  name="serviceCategories"
                  render={({ field }) => (
                    <CheckboxGrid
                      options={SERVICE_CATEGORIES}
                      value={field.value ?? []}
                      onChange={field.onChange}
                      cols={2}
                    />
                  )}
                />
              </div>

              {/* Commercial / Residential */}
              <div className="flex gap-5">
                <Controller
                  control={control}
                  name="commercialFocus"
                  render={({ field }) => (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Commercial</span>
                    </label>
                  )}
                />
                <Controller
                  control={control}
                  name="residentialFocus"
                  render={({ field }) => (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Residential</span>
                    </label>
                  )}
                />
              </div>

              {/* Preferred Project Sizes */}
              <div>
                <Label>Preferred Project Sizes</Label>
                <Controller
                  control={control}
                  name="preferredProjectSizes"
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {PROJECT_SIZES.map(({ value, label }) => {
                        const selected = (field.value ?? []).includes(value)
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              const next = selected
                                ? (field.value ?? []).filter((v) => v !== value)
                                : [...(field.value ?? []), value]
                              field.onChange(next)
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              selected
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'
                            }`}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                />
              </div>
            </div>
          </Section>

          {/* ─── Section 3: Coverage ─────────────────────────────────────── */}
          <Section
            icon={<MapPin size={15} />}
            title="Service Coverage"
            sectionKey="coverage"
            collapsed={collapsed}
            onToggle={toggleSection}
          >
            <div className="space-y-5">
              {/* Service Radius */}
              <div>
                <Label>Service Radius (miles)</Label>
                <input
                  {...register('serviceRadius', { valueAsNumber: true })}
                  className={inputCls(!!errors.serviceRadius) + ' w-32'}
                  placeholder="50"
                  type="number"
                  min={0}
                  max={500}
                />
                <p className="text-xs text-gray-500 mt-1">From your primary business address</p>
                <FieldError msg={errors.serviceRadius?.message} />
              </div>

              {/* States Served */}
              <div>
                <Label>States Served</Label>
                <Controller
                  control={control}
                  name="serviceStates"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {US_STATES.map(({ abbr, name }) => {
                          const selected = (field.value ?? []).includes(abbr)
                          return (
                            <button
                              key={abbr}
                              type="button"
                              onClick={() => {
                                const next = selected
                                  ? (field.value ?? []).filter((v) => v !== abbr)
                                  : [...(field.value ?? []), abbr]
                                field.onChange(next)
                              }}
                              title={name}
                              className={`px-2 py-1 rounded text-xs font-medium border transition-all ${
                                selected
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                              }`}
                            >
                              {abbr}
                            </button>
                          )
                        })}
                      </div>
                      {(field.value ?? []).length > 0 && (
                        <p className="text-xs text-gray-500">
                          {(field.value ?? []).length} state{(field.value ?? []).length !== 1 ? 's' : ''} selected
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>

              {/* Cities / Counties Served */}
              <div>
                <Label>Cities / Counties Served</Label>
                <p className="text-xs text-gray-500 mb-1.5">Press Enter or comma to add</p>
                <Controller
                  control={control}
                  name="serviceCities"
                  render={({ field }) => (
                    <TagInput
                      value={field.value ?? []}
                      onChange={field.onChange}
                      placeholder="Phoenix, Scottsdale, Tempe..."
                    />
                  )}
                />
              </div>
            </div>
          </Section>

          {/* ─── Section 4: Credentials ⚠️ ──────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('credentials')}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-amber-50/50 transition"
            >
              <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-800">
                <Shield size={15} className="text-amber-600" />
                Credentials
                <span className="text-[11px] font-normal text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                  ⚠ Changes trigger re-verification
                </span>
              </div>
              {collapsed.credentials ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>

            {!collapsed.credentials && (
              <div className="px-5 pb-5 space-y-4 border-t border-amber-100">
                <div className="pt-4 p-3 bg-amber-50 rounded-lg text-xs text-amber-800 border border-amber-200">
                  <strong>Note:</strong> Editing any field in this section will submit your credentials for
                  re-verification. You will be temporarily removed from lead rotation until our team completes the review.
                </div>

                {/* License */}
                <div>
                  <Label>Primary License Number</Label>
                  <input
                    {...register('licenseNumber')}
                    className={inputCls(!!errors.licenseNumber)}
                    placeholder="ROC-123456"
                  />
                  <FieldError msg={errors.licenseNumber?.message} />
                </div>

                <div>
                  <Label>All License Numbers</Label>
                  <p className="text-xs text-gray-500 mb-1.5">Press Enter or comma to add multiple</p>
                  <Controller
                    control={control}
                    name="allLicenses"
                    render={({ field }) => (
                      <TagInput
                        value={field.value ?? []}
                        onChange={field.onChange}
                        placeholder="ROC-123456, LIC-789..."
                      />
                    )}
                  />
                </div>

                {/* Insurance */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-1 border-t border-amber-100">
                  <div>
                    <Label>Insurance Carrier</Label>
                    <input
                      {...register('insuranceCarrier')}
                      className={inputCls(!!errors.insuranceCarrier)}
                      placeholder="State Farm"
                    />
                    <FieldError msg={errors.insuranceCarrier?.message} />
                  </div>
                  <div>
                    <Label>Insurance Expiration</Label>
                    <input
                      {...register('insuranceExpiration')}
                      className={inputCls(!!errors.insuranceExpiration)}
                      type="date"
                    />
                    <FieldError msg={errors.insuranceExpiration?.message} />
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ─── Sticky save bar ───────────────────────────────────────────── */}
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="text-sm">
              {isDirty ? (
                <span className="text-amber-600 font-medium">Unsaved changes</span>
              ) : (
                <span className="text-gray-500">All changes saved</span>
              )}
              {credentialsDirty && (
                <span className="ml-2 text-xs text-amber-600">
                  · Saving will trigger re-verification
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {isDirty && (
                <button
                  type="button"
                  onClick={() => reset(profile ? profileToFormValues(profile) : undefined)}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition"
                >
                  Discard
                </button>
              )}
              <button
                type="submit"
                disabled={saving || !isDirty}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  sectionKey,
  collapsed,
  onToggle,
  children,
}: {
  icon:       React.ReactNode
  title:      string
  sectionKey: string
  collapsed:  Record<string, boolean>
  onToggle:   (key: string) => void
  children:   React.ReactNode
}) {
  const isCollapsed = !!collapsed[sectionKey]
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(sectionKey)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition"
      >
        <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-800">
          <span className="text-gray-500">{icon}</span>
          {title}
        </div>
        {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>
      {!isCollapsed && (
        <div className="px-5 pb-5 border-t border-gray-50 pt-4">
          {children}
        </div>
      )}
    </div>
  )
}

function Label({
  children,
  required,
}: {
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <label className="block text-xs font-semibold text-gray-700 mb-1">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-xs text-red-500 mt-1">{msg}</p>
}

function inputCls(hasError: boolean) {
  return `w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
    hasError
      ? 'border-red-400 bg-red-50'
      : 'border-gray-200 bg-white'
  }`
}

function CheckboxGrid({
  options,
  value,
  onChange,
  cols = 3,
}: {
  options:  string[]
  value:    string[]
  onChange: (v: string[]) => void
  cols?:    2 | 3
}) {
  return (
    <div className={`grid gap-y-2 gap-x-3 ${cols === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
      {options.map((opt) => {
        const checked = value.includes(opt)
        return (
          <label key={opt} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => {
                onChange(
                  e.target.checked
                    ? [...value, opt]
                    : value.filter((v) => v !== opt),
                )
              }}
              className="w-4 h-4 rounded text-blue-600 border-gray-300"
            />
            <span className="text-xs text-gray-700 leading-snug">{opt}</span>
          </label>
        )
      })}
    </div>
  )
}

function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value:       string[]
  onChange:    (v: string[]) => void
  placeholder: string
}) {
  const [input, setInput] = useState('')

  function addTag(raw: string) {
    const tags = raw.split(',').map((t) => t.trim()).filter(Boolean)
    const next = [...new Set([...value, ...tags])]
    onChange(next)
    setInput('')
  }

  function removeTag(tag: string) {
    onChange(value.filter((v) => v !== tag))
  }

  return (
    <div className="border border-gray-200 rounded-xl p-2 bg-white focus-within:ring-2 focus-within:ring-blue-500 transition">
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-blue-400 hover:text-blue-600"
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            if (input.trim()) addTag(input)
          } else if (e.key === 'Backspace' && !input && value.length > 0) {
            removeTag(value[value.length - 1])
          }
        }}
        onBlur={() => { if (input.trim()) addTag(input) }}
        placeholder={value.length === 0 ? placeholder : 'Add more...'}
        className="w-full text-sm outline-none bg-transparent placeholder-gray-400"
      />
    </div>
  )
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked:  boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
