'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Check, MapPin, Boxes,
  Home, Building2, Warehouse, Building, Landmark, Layers,
  ChevronRight, AlertCircle, Camera, Video, Upload, X,
} from 'lucide-react'
import { RevenueHookModal } from '@kealee/core-hooks'

type Step = 'type' | 'details' | 'location' | 'twin' | 'info' | 'media' | 'review'

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

// ── Photo zones per project type ────────────────────────────────────────────
interface PhotoZone { id: string; label: string; required: boolean; hint: string }

const PHOTO_ZONES_BY_TYPE: Record<string, PhotoZone[]> = {
  ADDITION: [
    { id: 'rear_yard', label: 'Rear Yard Looking Toward House', required: true, hint: 'Stand at back fence, capture full yard width and existing structure' },
    { id: 'side_yard', label: 'Side Yard', required: true, hint: 'Show available side yard clearance and existing walls' },
    { id: 'exterior_walls', label: 'Exterior Walls Being Extended', required: true, hint: 'Capture the existing wall(s) where the addition will connect' },
    { id: 'neighborhood_context', label: 'Neighborhood Context', required: false, hint: 'Show adjacent homes and any relevant site constraints' },
  ],
  RENOVATION: [
    { id: 'room_overview', label: 'Room Overview', required: true, hint: 'Full room from the doorway — show walls, floor, and ceiling' },
    { id: 'focal_wall', label: 'Main Feature Wall', required: true, hint: 'The wall or feature you most want to change' },
    { id: 'flooring_closeup', label: 'Flooring Close-Up', required: true, hint: 'Capture existing floor material and condition' },
    { id: 'ceiling_detail', label: 'Ceiling / Lighting', required: false, hint: 'Show ceiling height, existing fixtures' },
  ],
  NEW_HOME: [
    { id: 'site_overview', label: 'Site Overview', required: true, hint: 'Full site from the street' },
    { id: 'lot_boundaries', label: 'Lot Boundaries', required: true, hint: 'Walk the perimeter and capture boundary markers' },
    { id: 'adjacent_structures', label: 'Adjacent Structures', required: false, hint: 'Neighboring homes or structures that affect design' },
  ],
  MULTIFAMILY: [
    { id: 'site_overview', label: 'Site Overview', required: true, hint: 'Full site from the street' },
    { id: 'existing_structure', label: 'Existing Structure (if any)', required: false, hint: 'Any buildings currently on site' },
    { id: 'adjacent_context', label: 'Adjacent Context', required: false, hint: 'Neighboring buildings that affect design' },
  ],
  COMMERCIAL: [
    { id: 'overall_space', label: 'Overall Space', required: true, hint: 'Wide shot from the corner showing full floor plate' },
    { id: 'existing_layout', label: 'Existing Layout', required: false, hint: 'Current desk arrangement and partitions' },
    { id: 'meeting_rooms', label: 'Meeting Rooms', required: false, hint: 'Capture a representative conference room' },
  ],
  MIXED_USE: [
    { id: 'site_overview', label: 'Site Overview', required: true, hint: 'Full site from the street' },
    { id: 'adjacent_retail', label: 'Adjacent Retail / Street Character', required: false, hint: 'Show neighboring retail and pedestrian context' },
  ],
}

// Types that require video walkthrough
const REQUIRES_VIDEO = new Set(['ADDITION', 'RENOVATION', 'COMMERCIAL'])

// ── Project info fields per type ─────────────────────────────────────────────
interface InfoField { key: string; label: string; type: 'select' | 'boolean' | 'text' | 'numeric'; options?: { value: string; label: string }[] }

const INFO_FIELDS_BY_TYPE: Record<string, { title: string; fields: InfoField[] }> = {
  ADDITION: {
    title: 'Site Assessment',
    fields: [
      { key: 'lotSizeSqFt', label: 'Lot Size (sq ft)', type: 'numeric' },
      { key: 'rearYardDepth', label: 'Rear Yard Depth (ft)', type: 'numeric' },
      { key: 'utilityMarkings', label: 'Have utilities been marked (811)?', type: 'boolean' },
      { key: 'hoaApprovalStatus', label: 'HOA Approval Status', type: 'select', options: [
        { value: 'no_hoa', label: 'No HOA' },
        { value: 'not_submitted', label: 'Not yet submitted' },
        { value: 'pending', label: 'Pending review' },
        { value: 'approved', label: 'Approved' },
      ]},
      { key: 'soilCondition', label: 'Soil / Site Condition', type: 'select', options: [
        { value: 'standard', label: 'Standard / unknown' },
        { value: 'expansive_clay', label: 'Expansive clay' },
        { value: 'sandy', label: 'Sandy / poor bearing' },
        { value: 'rocky', label: 'Rocky' },
        { value: 'fill', label: 'Previously filled / disturbed' },
      ]},
    ],
  },
  RENOVATION: {
    title: 'Condition Assessment',
    fields: [
      { key: 'yearBuilt', label: 'Year Built (approx.)', type: 'select', options: [
        { value: 'pre_1950', label: 'Before 1950' },
        { value: '1950_1970', label: '1950–1970' },
        { value: '1970_1990', label: '1970–1990' },
        { value: '1990_2005', label: '1990–2005' },
        { value: '2005_plus', label: '2005 or newer' },
      ]},
      { key: 'structuralConcerns', label: 'Any known structural concerns?', type: 'boolean' },
      { key: 'liveInDuringReno', label: 'Will you live in the home during renovation?', type: 'boolean' },
      { key: 'electricalPanelSize', label: 'Electrical Panel Size', type: 'select', options: [
        { value: '100a', label: '100 Amp' },
        { value: '150a', label: '150 Amp' },
        { value: '200a', label: '200 Amp' },
        { value: 'unknown', label: 'Unknown' },
      ]},
    ],
  },
  NEW_HOME: {
    title: 'Site Assessment',
    fields: [
      { key: 'lotSizeSqFt', label: 'Lot Size (sq ft)', type: 'numeric' },
      { key: 'hasTitle', label: 'Title report available?', type: 'boolean' },
      { key: 'utilityMarkings', label: 'Have utilities been marked (811)?', type: 'boolean' },
      { key: 'hoaApprovalStatus', label: 'HOA / Covenant Status', type: 'select', options: [
        { value: 'no_hoa', label: 'No HOA / Covenants' },
        { value: 'not_submitted', label: 'Not yet submitted' },
        { value: 'pending', label: 'Pending review' },
        { value: 'approved', label: 'Approved' },
      ]},
    ],
  },
  MULTIFAMILY: {
    title: 'Site Due Diligence',
    fields: [
      { key: 'lotSizeSqFt', label: 'Lot Size (sq ft)', type: 'numeric' },
      { key: 'apn', label: 'Assessor Parcel Number (APN)', type: 'text' },
      { key: 'hasTitle', label: 'Title report available?', type: 'boolean' },
      { key: 'zoningCode', label: 'Zoning Code (if known)', type: 'text' },
    ],
  },
  COMMERCIAL: {
    title: 'Space Assessment',
    fields: [
      { key: 'totalGfaSqFt', label: 'Total Office Area (sq ft)', type: 'numeric' },
      { key: 'headcount', label: 'Approximate Headcount', type: 'numeric' },
      { key: 'officeLayout', label: 'Preferred Layout', type: 'select', options: [
        { value: 'open_plan', label: 'Open Plan' },
        { value: 'private_office', label: 'Private Offices' },
        { value: 'hybrid', label: 'Hybrid (open + private)' },
      ]},
    ],
  },
  MIXED_USE: {
    title: 'Site Due Diligence',
    fields: [
      { key: 'lotSizeSqFt', label: 'Lot Size (sq ft)', type: 'numeric' },
      { key: 'apn', label: 'Assessor Parcel Number (APN)', type: 'text' },
      { key: 'zoningCode', label: 'Zoning Code (if known)', type: 'text' },
      { key: 'hasTitle', label: 'Title report available?', type: 'boolean' },
    ],
  },
}

const STEPS: { id: Step; label: string }[] = [
  { id: 'type', label: 'Type' },
  { id: 'details', label: 'Details' },
  { id: 'location', label: 'Location' },
  { id: 'twin', label: 'Twin' },
  { id: 'info', label: 'Info' },
  { id: 'media', label: 'Media' },
  { id: 'review', label: 'Review' },
]

interface ZonePhoto { zoneId: string; file: File; url: string }

export default function NewProjectPage() {
  const [step, setStep] = useState<Step>('type')
  const [projectType, setProjectType] = useState<string | null>(null)
  const [twinTier, setTwinTier] = useState<string>('L1')
  const [details, setDetails] = useState({ name: '', description: '', budget: '', sqft: '' })
  const [location, setLocation] = useState({ address: '', city: '', state: '', zip: '' })
  const [projectInfo, setProjectInfo] = useState<Record<string, any>>({})
  const [zonePhotos, setZonePhotos] = useState<ZonePhoto[]>([])
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoDuration, setVideoDuration] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showIntakeHook, setShowIntakeHook] = useState(false)
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const currentStepIndex = STEPS.findIndex(s => s.id === step)
  const selectedType = PROJECT_TYPES.find(t => t.id === projectType)
  const zones = projectType ? (PHOTO_ZONES_BY_TYPE[projectType] ?? []) : []
  const requiresVideo = projectType ? REQUIRES_VIDEO.has(projectType) : false
  const requiredZones = zones.filter(z => z.required)
  const capturedZoneIds = new Set(zonePhotos.map(p => p.zoneId))
  const requiredZonesCaptured = requiredZones.filter(z => capturedZoneIds.has(z.id)).length

  const canAdvance = () => {
    if (step === 'type') return !!projectType
    if (step === 'details') return !!details.name && !!details.budget
    if (step === 'location') return !!location.address && !!location.city && !!location.state
    if (step === 'twin') return true
    if (step === 'info') return true
    if (step === 'media') {
      const requiredMet = requiredZones.every(z => capturedZoneIds.has(z.id))
      if (!requiredMet) return false
      if (requiresVideo && !videoFile) return false
      return true
    }
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

  const handleTypeSelect = (typeId: string) => {
    setProjectType(typeId)
    const type = PROJECT_TYPES.find(t => t.id === typeId)
    if (type) setTwinTier(type.twinTier)
    // Reset media when type changes
    setZonePhotos([])
    setVideoFile(null)
    setVideoUrl(null)
    setVideoDuration(null)
  }

  const handleZoneCapture = async (zoneId: string, file: File) => {
    setUploading(true)
    try {
      const url = URL.createObjectURL(file)
      setZonePhotos(prev => {
        const without = prev.filter(p => p.zoneId !== zoneId)
        return [...without, { zoneId, file, url }]
      })
    } finally {
      setUploading(false)
    }
  }

  const handleVideoCapture = (file: File) => {
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    const url = URL.createObjectURL(file)
    setVideoFile(file)
    setVideoUrl(url)
    // Read duration after metadata loads
    const vid = document.createElement('video')
    vid.src = url
    vid.onloadedmetadata = () => {
      const secs = Math.round(vid.duration)
      const mins = Math.floor(secs / 60)
      const remainder = secs % 60
      setVideoDuration(`${mins}:${remainder.toString().padStart(2, '0')}`)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: projectType,
          name: details.name,
          description: details.description,
          budget: parseFloat(details.budget.replace(/,/g, '')) || 0,
          sqft: parseInt(details.sqft.replace(/,/g, '')) || undefined,
          address: location.address,
          city: location.city,
          state: location.state,
          zip: location.zip,
          twinTier,
          projectInfo,
          mediaZones: zonePhotos.map(p => ({ zoneId: p.zoneId, filename: p.file.name })),
          hasVideoWalkthrough: !!videoFile,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setCreatedProjectId(data.project?.id ?? null)
        const pid = data.project?.id

        // Upload zone photos
        if (pid && zonePhotos.length > 0) {
          for (const photo of zonePhotos) {
            try {
              const urlRes = await fetch(`/api/v1/projects/${pid}/photos/presign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: photo.file.name, contentType: photo.file.type, zoneId: photo.zoneId }),
              })
              const { uploadUrl, photoId } = await urlRes.json()
              await fetch(uploadUrl, { method: 'PUT', body: photo.file, headers: { 'Content-Type': photo.file.type } })
              await fetch(`/api/v1/projects/${pid}/photos/${photoId}/confirm`, { method: 'POST' })
            } catch (err) {
              console.warn('Zone photo upload failed', photo.zoneId, err)
            }
          }
        }

        // Upload video
        if (pid && videoFile) {
          try {
            const urlRes = await fetch(`/api/v1/projects/${pid}/videos/presign`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filename: videoFile.name, contentType: videoFile.type }),
            })
            const { uploadUrl, videoId } = await urlRes.json()
            await fetch(uploadUrl, { method: 'PUT', body: videoFile, headers: { 'Content-Type': videoFile.type } })
            await fetch(`/api/v1/projects/${pid}/videos/${videoId}/confirm`, { method: 'POST' })
          } catch (err) {
            console.warn('Video upload failed', err)
          }
        }

        setShowIntakeHook(true)
      } else {
        window.location.href = '/projects'
      }
    } catch {
      window.location.href = '/projects'
    } finally {
      setSubmitting(false)
    }
  }

  // ── Info step renderer ────────────────────────────────────────────────────
  const renderInfoStep = () => {
    if (!projectType) return null
    const config = INFO_FIELDS_BY_TYPE[projectType]
    if (!config) return (
      <div className="text-sm text-gray-500">No additional info required for this project type.</div>
    )
    return (
      <div className="space-y-4">
        {config.fields.map(field => {
          if (field.type === 'boolean') return (
            <div key={field.key}>
              <label className="mb-1 block text-sm font-medium text-gray-700">{field.label}</label>
              <div className="flex gap-3">
                {(['Yes', 'No'] as const).map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setProjectInfo(prev => ({ ...prev, [field.key]: opt === 'Yes' }))}
                    className="flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-all"
                    style={{
                      borderColor: projectInfo[field.key] === (opt === 'Yes') ? '#2ABFBF' : '#E5E7EB',
                      backgroundColor: projectInfo[field.key] === (opt === 'Yes') ? 'rgba(42,191,191,0.06)' : 'white',
                      color: '#1A2B4A',
                    }}
                  >{opt}</button>
                ))}
              </div>
            </div>
          )
          if (field.type === 'select' && field.options) return (
            <div key={field.key}>
              <label className="mb-1 block text-sm font-medium text-gray-700">{field.label}</label>
              <select
                value={projectInfo[field.key] ?? ''}
                onChange={e => setProjectInfo(prev => ({ ...prev, [field.key]: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': 'rgba(42,191,191,0.3)' } as React.CSSProperties}
              >
                <option value="">Select…</option>
                {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )
          return (
            <div key={field.key}>
              <label className="mb-1 block text-sm font-medium text-gray-700">{field.label}</label>
              <input
                type={field.type === 'numeric' ? 'number' : 'text'}
                value={projectInfo[field.key] ?? ''}
                onChange={e => setProjectInfo(prev => ({ ...prev, [field.key]: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': 'rgba(42,191,191,0.3)' } as React.CSSProperties}
              />
            </div>
          )
        })}
      </div>
    )
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
      <div className="mb-8 overflow-x-auto">
        <div className="flex min-w-max items-center justify-between">
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
                <div className="mx-2 mt-[-18px] h-0.5 w-8 sm:w-14" style={{
                  backgroundColor: i < currentStepIndex ? '#38A169' : '#E5E7EB',
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

        {/* ── Step 1: Type ─────────────────────────────────────────────────── */}
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

        {/* ── Step 2: Details ───────────────────────────────────────────────── */}
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

        {/* ── Step 3: Location ──────────────────────────────────────────────── */}
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

        {/* ── Step 4: Twin ──────────────────────────────────────────────────── */}
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
              </p>
            </div>
          </div>
        )}

        {/* ── Step 5: Info ──────────────────────────────────────────────────── */}
        {step === 'info' && (
          <div>
            <h2 className="font-display mb-1 text-lg font-semibold" style={{ color: '#1A2B4A' }}>
              {projectType && INFO_FIELDS_BY_TYPE[projectType] ? INFO_FIELDS_BY_TYPE[projectType].title : 'Project Info'}
            </h2>
            <p className="mb-6 text-sm text-gray-500">Technical details that help our AI produce better deliverables</p>
            {renderInfoStep()}
          </div>
        )}

        {/* ── Step 6: Media ─────────────────────────────────────────────────── */}
        {step === 'media' && (
          <div>
            <h2 className="font-display mb-1 text-lg font-semibold" style={{ color: '#1A2B4A' }}>Photos & Video</h2>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">Capture each zone for the best AI results</p>
              {zones.length > 0 && (
                <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{
                  backgroundColor: requiredZonesCaptured === requiredZones.length ? 'rgba(56,161,105,0.1)' : 'rgba(239,68,68,0.1)',
                  color: requiredZonesCaptured === requiredZones.length ? '#38A169' : '#DC2626',
                }}>
                  {requiredZonesCaptured} of {requiredZones.length} required zones captured
                </span>
              )}
            </div>

            {/* Zone cards */}
            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              {zones.map(zone => {
                const captured = zonePhotos.find(p => p.zoneId === zone.id)
                return (
                  <div
                    key={zone.id}
                    className="relative overflow-hidden rounded-xl border-2 transition-all"
                    style={{
                      borderColor: captured ? '#38A169' : zone.required ? '#FCA5A5' : '#E5E7EB',
                    }}
                  >
                    {captured ? (
                      <div className="relative aspect-video">
                        <img src={captured.url} alt={zone.label} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 flex flex-col justify-between p-2">
                          <div className="flex justify-between">
                            <span className="rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">Captured</span>
                            <button
                              onClick={() => setZonePhotos(prev => prev.filter(p => p.zoneId !== zone.id))}
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="rounded bg-black/50 px-2 py-0.5 text-xs text-white">{zone.label}</p>
                        </div>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer flex-col items-center gap-2 p-4 text-center">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/png,image/heic,image/*"
                          capture="environment"
                          onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) handleZoneCapture(zone.id, file)
                            e.target.value = ''
                          }}
                        />
                        <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{
                          backgroundColor: zone.required ? 'rgba(239,68,68,0.1)' : 'rgba(42,191,191,0.1)',
                        }}>
                          <Camera className="h-5 w-5" style={{ color: zone.required ? '#DC2626' : '#2ABFBF' }} />
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: '#1A2B4A' }}>
                            {zone.label}
                            {zone.required && <span className="ml-1 text-red-500">*</span>}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">{zone.hint}</p>
                        </div>
                        <span className="rounded-full px-3 py-1 text-xs font-medium" style={{
                          backgroundColor: 'rgba(42,191,191,0.1)',
                          color: '#2ABFBF',
                        }}>
                          Tap to capture
                        </span>
                      </label>
                    )}
                  </div>
                )
              })}

              {/* Generic upload if no zones defined */}
              {zones.length === 0 && (
                <label className="col-span-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 hover:bg-gray-50" style={{ borderColor: '#E5E7EB' }}>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={e => {
                      const files = Array.from(e.target.files ?? [])
                      files.forEach(f => {
                        const id = `generic_${Math.random().toString(36).slice(2)}`
                        handleZoneCapture(id, f)
                      })
                      e.target.value = ''
                    }}
                  />
                  <Camera className="mb-2 h-8 w-8 text-gray-400" />
                  <p className="text-sm font-medium text-gray-700">Add project photos</p>
                  <p className="mt-1 text-xs text-gray-400">JPEG, PNG, HEIC · 20MB max each</p>
                </label>
              )}
            </div>

            {/* Video section */}
            {requiresVideo && (
              <div className="rounded-xl border border-gray-200 p-5" style={{ backgroundColor: '#F7FAFC' }}>
                <div className="mb-3 flex items-center gap-2">
                  <Video className="h-5 w-5" style={{ color: '#2ABFBF' }} />
                  <p className="font-medium" style={{ color: '#1A2B4A' }}>
                    Video Walkthrough <span className="text-red-500">*</span>
                  </p>
                </div>
                <p className="mb-4 text-xs text-gray-500">2–3 min walkthrough dramatically improves AI deliverable quality</p>

                {videoUrl ? (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      className="w-full rounded-lg"
                      controls
                      style={{ maxHeight: 240 }}
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Video captured {videoDuration ? `· ${videoDuration}` : ''}
                      </span>
                      <button
                        onClick={() => { setVideoFile(null); setVideoUrl(null); setVideoDuration(null) }}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed py-4 text-sm font-medium transition-colors hover:bg-white" style={{ borderColor: '#2ABFBF', color: '#2ABFBF' }}>
                      <input
                        type="file"
                        className="hidden"
                        accept="video/*"
                        capture="environment"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoCapture(f); e.target.value = '' }}
                      />
                      <Camera className="h-4 w-4" />
                      Record with Camera
                    </label>
                    <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed py-4 text-sm font-medium transition-colors hover:bg-white" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
                      <input
                        type="file"
                        className="hidden"
                        accept="video/mp4,video/mov,video/quicktime,video/x-msvideo"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoCapture(f); e.target.value = '' }}
                      />
                      <Upload className="h-4 w-4" />
                      Upload Existing
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Step 7: Review ────────────────────────────────────────────────── */}
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
                  </div>
                </div>
                <button onClick={() => setStep('twin')} className="text-xs" style={{ color: '#2ABFBF' }}>Edit</button>
              </div>

              {/* Project Info summary */}
              {projectType && Object.keys(projectInfo).length > 0 && (
                <div className="rounded-lg border border-gray-100 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs text-gray-500">Project Info</p>
                    <button onClick={() => setStep('info')} className="text-xs" style={{ color: '#2ABFBF' }}>Edit</button>
                  </div>
                  <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
                    {Object.entries(projectInfo).filter(([, v]) => v !== '' && v !== null && v !== undefined).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="capitalize text-gray-500">{k.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                        <span className="font-medium" style={{ color: '#1A2B4A' }}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Media summary */}
              <div className="rounded-lg border border-gray-100 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs text-gray-500">Media</p>
                  <button onClick={() => setStep('media')} className="text-xs" style={{ color: '#2ABFBF' }}>Edit</button>
                </div>

                {/* Zone photo thumbnails */}
                {zonePhotos.length > 0 && (
                  <div className="mb-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {zonePhotos.map(p => {
                      const zone = zones.find(z => z.id === p.zoneId)
                      return (
                        <div key={p.zoneId} className="relative">
                          <div className="aspect-square overflow-hidden rounded-lg">
                            <img src={p.url} alt={zone?.label ?? p.zoneId} className="h-full w-full object-cover" />
                          </div>
                          <p className="mt-0.5 truncate text-[10px] text-gray-500">{zone?.label ?? p.zoneId}</p>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Video badge */}
                {videoFile && (
                  <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: 'rgba(42,191,191,0.08)' }}>
                    <Video className="h-4 w-4" style={{ color: '#2ABFBF' }} />
                    <span className="text-xs font-medium" style={{ color: '#1A2B4A' }}>
                      Video walkthrough captured {videoDuration ? `· ${videoDuration}` : ''}
                    </span>
                  </div>
                )}

                {zonePhotos.length === 0 && !videoFile && (
                  <p className="text-xs text-gray-400">No media added</p>
                )}
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

      {/* Revenue Hook */}
      {showIntakeHook && (
        <RevenueHookModal
          stage="project_intake"
          projectId={createdProjectId ?? undefined}
          onSelect={() => { window.location.href = `/projects${createdProjectId ? `/${createdProjectId}` : ''}` }}
          onDismiss={() => { window.location.href = `/projects${createdProjectId ? `/${createdProjectId}` : ''}` }}
        />
      )}
    </div>
  )
}
