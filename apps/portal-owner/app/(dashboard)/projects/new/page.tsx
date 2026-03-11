'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Check, MapPin, Boxes,
  Home, Building2, Warehouse, Building, Landmark, Layers,
  ChevronRight, AlertCircle,
} from 'lucide-react'

type Step = 'type' | 'details' | 'location' | 'twin' | 'review'

const PROJECT_TYPES = [
  { id: 'ADDITION', label: 'Addition', desc: 'Expand your existing home', icon: Home, twinTier: 'L1' },
  { id: 'RENOVATION', label: 'Renovation', desc: 'Remodel interior or exterior', icon: Home, twinTier: 'L1' },
  { id: 'NEW_HOME', label: 'New Home', desc: 'Build a new single-family home', icon: Building2, twinTier: 'L2' },
  { id: 'MULTIFAMILY', label: 'Multifamily', desc: 'Duplex, townhomes, apartments', icon: Building, twinTier: 'L2' },
  { id: 'COMMERCIAL', label: 'Commercial TI', desc: 'Tenant improvement or buildout', icon: Warehouse, twinTier: 'L2' },
  { id: 'MIXED_USE', label: 'Mixed Use', desc: 'Residential + commercial', icon: Landmark, twinTier: 'L3' },
]

const TWIN_TIERS = [
  {
    tier: 'L1',
    name: 'Light',
    price: 'Included',
    desc: 'Basic tracking with milestone updates',
    kpis: ['Budget variance', 'Schedule performance', 'Completion %'],
    modules: ['os-pm', 'os-pay'],
    color: '#2ABFBF',
  },
  {
    tier: 'L2',
    name: 'Standard',
    price: '$99/mo',
    desc: 'Full scheduling, cost tracking, document management',
    kpis: ['Budget variance', 'Schedule performance', 'Completion %', 'Risk score', 'Quality score', 'Open issues'],
    modules: ['os-pm', 'os-pay', 'os-feas'],
    color: '#E8793A',
    recommended: true,
  },
  {
    tier: 'L3',
    name: 'Premium',
    price: '$299/mo',
    desc: 'AI predictions, IoT sensors, advanced analytics',
    kpis: ['All L2 KPIs', 'Safety score', 'CPI', 'RFI response time', 'Change order rate'],
    modules: ['os-pm', 'os-pay', 'os-feas', 'os-dev', 'os-ops'],
    color: '#7C3AED',
  },
]

const STEPS: { id: Step; label: string }[] = [
  { id: 'type', label: 'Project Type' },
  { id: 'details', label: 'Details' },
  { id: 'location', label: 'Location' },
  { id: 'twin', label: 'Digital Twin' },
  { id: 'review', label: 'Review' },
]

export default function NewProjectPage() {
  const [step, setStep] = useState<Step>('type')
  const [projectType, setProjectType] = useState<string | null>(null)
  const [twinTier, setTwinTier] = useState<string>('L1')
  const [details, setDetails] = useState({ name: '', description: '', budget: '', sqft: '' })
  const [location, setLocation] = useState({ address: '', city: '', state: '', zip: '' })
  const [submitting, setSubmitting] = useState(false)

  const currentStepIndex = STEPS.findIndex(s => s.id === step)
  const selectedType = PROJECT_TYPES.find(t => t.id === projectType)

  const canAdvance = () => {
    if (step === 'type') return !!projectType
    if (step === 'details') return !!details.name && !!details.budget
    if (step === 'location') return !!location.address && !!location.city && !!location.state
    if (step === 'twin') return true
    return true
  }

  const nextStep = () => {
    const idx = STEPS.findIndex(s => s.id === step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id)
  }

  const prevStep = () => {
    const idx = STEPS.findIndex(s => s.id === step)
    if (idx > 0) setStep(STEPS[idx - 1].id)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    // In production: POST /api/v1/projects with twin creation
    await new Promise(r => setTimeout(r, 2000))
    window.location.href = '/projects'
  }

  // Auto-select recommended twin tier when project type changes
  const handleTypeSelect = (typeId: string) => {
    setProjectType(typeId)
    const type = PROJECT_TYPES.find(t => t.id === typeId)
    if (type) setTwinTier(type.twinTier)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/projects" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>

      <h1 className="font-display mb-2 text-2xl font-bold" style={{ color: '#1A2B4A' }}>Create New Project</h1>
      <p className="mb-8 text-sm text-gray-500">Set up your project and activate its Digital Twin</p>

      {/* Step Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all"
                  style={{
                    backgroundColor: i < currentStepIndex ? '#38A169' : i === currentStepIndex ? '#2ABFBF' : '#E5E7EB',
                    color: i <= currentStepIndex ? 'white' : '#9CA3AF',
                  }}
                >
                  {i < currentStepIndex ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className="mt-1.5 text-xs font-medium" style={{
                  color: i <= currentStepIndex ? '#1A2B4A' : '#9CA3AF',
                }}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="mx-2 mt-[-18px] h-0.5 w-12 sm:w-20" style={{
                  backgroundColor: i < currentStepIndex ? '#38A169' : '#E5E7EB',
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        {step === 'type' && (
          <div>
            <h2 className="font-display mb-1 text-lg font-semibold" style={{ color: '#1A2B4A' }}>What type of project?</h2>
            <p className="mb-6 text-sm text-gray-500">This determines your default Digital Twin tier and enabled modules</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {PROJECT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className="flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all"
                  style={{
                    borderColor: projectType === type.id ? '#2ABFBF' : '#E5E7EB',
                    backgroundColor: projectType === type.id ? 'rgba(42,191,191,0.04)' : 'white',
                  }}
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg" style={{
                    backgroundColor: projectType === type.id ? 'rgba(42,191,191,0.15)' : '#F7FAFC',
                  }}>
                    <type.icon className="h-5 w-5" style={{
                      color: projectType === type.id ? '#2ABFBF' : '#6B7280',
                    }} />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: '#1A2B4A' }}>{type.label}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{type.desc}</p>
                    <span className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold" style={{
                      backgroundColor: 'rgba(42,191,191,0.1)',
                      color: '#2ABFBF',
                    }}>
                      Default: {type.twinTier}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'details' && (
          <div>
            <h2 className="font-display mb-1 text-lg font-semibold" style={{ color: '#1A2B4A' }}>Project Details</h2>
            <p className="mb-6 text-sm text-gray-500">Basic information about your project</p>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Project Name *</label>
                <input
                  type="text"
                  value={details.name}
                  onChange={(e) => setDetails({ ...details, name: e.target.value })}
                  placeholder="e.g. Kitchen Remodel - Oak Lane"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'rgba(42,191,191,0.3)' } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={details.description}
                  onChange={(e) => setDetails({ ...details, description: e.target.value })}
                  placeholder="Brief description of the project scope..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'rgba(42,191,191,0.3)' } as React.CSSProperties}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Estimated Budget *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                    <input
                      type="text"
                      value={details.budget}
                      onChange={(e) => setDetails({ ...details, budget: e.target.value })}
                      placeholder="250,000"
                      className="w-full rounded-lg border border-gray-200 py-2.5 pl-7 pr-4 text-sm focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': 'rgba(42,191,191,0.3)' } as React.CSSProperties}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Square Footage</label>
                  <input
                    type="text"
                    value={details.sqft}
                    onChange={(e) => setDetails({ ...details, sqft: e.target.value })}
                    placeholder="2,400"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': 'rgba(42,191,191,0.3)' } as React.CSSProperties}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'location' && (
          <div>
            <h2 className="font-display mb-1 text-lg font-semibold" style={{ color: '#1A2B4A' }}>Project Location</h2>
            <p className="mb-6 text-sm text-gray-500">Where is the project located?</p>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Street Address *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={location.address}
                    onChange={(e) => setLocation({ ...location, address: e.target.value })}
                    placeholder="142 5th Ave"
                    className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': 'rgba(42,191,191,0.3)' } as React.CSSProperties}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">City *</label>
                  <input
                    type="text"
                    value={location.city}
                    onChange={(e) => setLocation({ ...location, city: e.target.value })}
                    placeholder="Bethesda"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': 'rgba(42,191,191,0.3)' } as React.CSSProperties}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">State *</label>
                  <input
                    type="text"
                    value={location.state}
                    onChange={(e) => setLocation({ ...location, state: e.target.value })}
                    placeholder="MD"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': 'rgba(42,191,191,0.3)' } as React.CSSProperties}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">ZIP</label>
                  <input
                    type="text"
                    value={location.zip}
                    onChange={(e) => setLocation({ ...location, zip: e.target.value })}
                    placeholder="20814"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': 'rgba(42,191,191,0.3)' } as React.CSSProperties}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'twin' && (
          <div>
            <h2 className="font-display mb-1 text-lg font-semibold" style={{ color: '#1A2B4A' }}>Choose Digital Twin Tier</h2>
            <p className="mb-6 text-sm text-gray-500">Your project&apos;s Digital Twin tracks everything in real-time</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {TWIN_TIERS.map((tier) => (
                <button
                  key={tier.tier}
                  onClick={() => setTwinTier(tier.tier)}
                  className="relative flex flex-col rounded-xl border-2 p-5 text-left transition-all"
                  style={{
                    borderColor: twinTier === tier.tier ? tier.color : '#E5E7EB',
                    backgroundColor: twinTier === tier.tier ? `${tier.color}08` : 'white',
                  }}
                >
                  {tier.recommended && (
                    <span className="absolute -top-2.5 right-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: tier.color }}>
                      Recommended
                    </span>
                  )}
                  <div className="mb-3 flex items-center gap-2">
                    <Boxes className="h-5 w-5" style={{ color: tier.color }} />
                    <span className="font-display text-lg font-bold" style={{ color: '#1A2B4A' }}>{tier.tier}</span>
                  </div>
                  <p className="font-display text-xl font-bold" style={{ color: tier.color }}>{tier.price}</p>
                  <p className="mb-3 mt-1 text-xs text-gray-500">{tier.desc}</p>

                  <p className="mb-2 text-xs font-medium text-gray-600">{tier.kpis.length} KPIs tracked:</p>
                  <ul className="mb-3 space-y-1">
                    {tier.kpis.map((kpi) => (
                      <li key={kpi} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Check className="h-3 w-3" style={{ color: tier.color }} />
                        {kpi}
                      </li>
                    ))}
                  </ul>

                  <p className="mb-1 text-xs font-medium text-gray-600">Modules:</p>
                  <div className="flex flex-wrap gap-1">
                    {tier.modules.map((mod) => (
                      <span key={mod} className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{
                        backgroundColor: `${tier.color}15`,
                        color: tier.color,
                      }}>
                        {mod}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg p-3" style={{ backgroundColor: 'rgba(42,191,191,0.06)' }}>
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: '#2ABFBF' }} />
              <p className="text-xs text-gray-600">
                Your Digital Twin is created automatically when you start a project. You can upgrade tiers at any time.
                Higher tiers track more KPIs and enable additional OS modules.
              </p>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div>
            <h2 className="font-display mb-1 text-lg font-semibold" style={{ color: '#1A2B4A' }}>Review & Create</h2>
            <p className="mb-6 text-sm text-gray-500">Confirm your project details before creating</p>

            <div className="space-y-4">
              {/* Project Type */}
              <div className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
                <div>
                  <p className="text-xs text-gray-500">Project Type</p>
                  <p className="font-medium" style={{ color: '#1A2B4A' }}>{selectedType?.label || '—'}</p>
                </div>
                <button onClick={() => setStep('type')} className="text-xs" style={{ color: '#2ABFBF' }}>Edit</button>
              </div>

              {/* Details */}
              <div className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
                <div>
                  <p className="text-xs text-gray-500">Project Details</p>
                  <p className="font-medium" style={{ color: '#1A2B4A' }}>{details.name || '—'}</p>
                  <p className="text-xs text-gray-400">Budget: ${details.budget || '0'} | {details.sqft || '—'} sqft</p>
                </div>
                <button onClick={() => setStep('details')} className="text-xs" style={{ color: '#2ABFBF' }}>Edit</button>
              </div>

              {/* Location */}
              <div className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="font-medium" style={{ color: '#1A2B4A' }}>{location.address || '—'}</p>
                  <p className="text-xs text-gray-400">{location.city}, {location.state} {location.zip}</p>
                </div>
                <button onClick={() => setStep('location')} className="text-xs" style={{ color: '#2ABFBF' }}>Edit</button>
              </div>

              {/* Twin */}
              <div className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{
                    backgroundColor: twinTier === 'L1' ? 'rgba(42,191,191,0.1)' : twinTier === 'L2' ? 'rgba(232,121,58,0.1)' : 'rgba(124,58,237,0.1)',
                  }}>
                    <Boxes className="h-5 w-5" style={{
                      color: twinTier === 'L1' ? '#2ABFBF' : twinTier === 'L2' ? '#E8793A' : '#7C3AED',
                    }} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Digital Twin</p>
                    <p className="font-medium" style={{ color: '#1A2B4A' }}>
                      {twinTier} — {TWIN_TIERS.find(t => t.tier === twinTier)?.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {TWIN_TIERS.find(t => t.tier === twinTier)?.kpis.length} KPIs | {TWIN_TIERS.find(t => t.tier === twinTier)?.modules.length} modules
                    </p>
                  </div>
                </div>
                <button onClick={() => setStep('twin')} className="text-xs" style={{ color: '#2ABFBF' }}>Edit</button>
              </div>
            </div>

            {/* What happens next */}
            <div className="mt-6 rounded-xl p-5" style={{ backgroundColor: '#F7FAFC' }}>
              <p className="mb-3 text-sm font-medium" style={{ color: '#1A2B4A' }}>What happens when you create:</p>
              <div className="space-y-2">
                {[
                  'Project record created in your portfolio',
                  `Digital Twin (${twinTier}) activated with ${TWIN_TIERS.find(t => t.tier === twinTier)?.kpis.length} KPIs`,
                  'KeaBot Owner assigned to your project',
                  'OS modules activated: ' + (TWIN_TIERS.find(t => t.tier === twinTier)?.modules.join(', ')),
                  'You can start uploading plans and scheduling right away',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3" style={{ color: '#2ABFBF' }} />
                    <span className="text-xs text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          {currentStepIndex > 0 ? (
            <button
              onClick={prevStep}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          ) : <div />}

          {step === 'review' ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#E8793A' }}
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <Layers className="h-4 w-4" />
                  Create Project & Activate Twin
                </>
              )}
            </button>
          ) : (
            <button
              onClick={nextStep}
              disabled={!canAdvance()}
              className="flex items-center gap-1.5 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: canAdvance() ? '#2ABFBF' : '#9CA3AF' }}
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
