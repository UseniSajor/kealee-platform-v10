'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, ArrowLeft, Paperclip, X, ImageIcon, FileText, Video, Info, Loader2, Smartphone, Monitor } from 'lucide-react'
import { SERVICE_MAP } from '@/lib/services-config'
import { getConceptSqftHint, CONCEPT_PHOTO_RENDERING_DISCLAIMER } from '@/lib/concept-scope-placeholders'
import {
  buildConceptScope,
  getConceptConditionOptions,
  getConceptGoalOptions,
  isConceptScopeComplete,
} from '@/lib/concept-scope-builder'
import { ConceptIntakeShell } from '@/components/concept/ConceptIntakeShell'
import { ScopeChipGrid } from '@/components/concept/ScopeChipGrid'
import {
  uploadIntakeFilesSequentially,
  type IntakeUploadedFile,
} from '@/lib/intake-file-upload'
import { CaptureHandoffPanel } from '@kealee/ui/components/intake/capture-handoff-panel'
import { supabase } from '@/lib/supabase-browser'

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#E8724B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E8724B]/20 transition'

const STYLE_OPTIONS = [
  'Modern / Contemporary',
  'Transitional',
  'Traditional / Classic',
  'Farmhouse / Rustic',
  'Coastal / Beach',
  'Industrial / Loft',
  'Scandinavian / Minimalist',
  'Other / Not sure yet',
]

const GARDEN_STYLE_OPTIONS = [
  'Native / Naturalistic',
  'Formal / Geometric',
  'Cottage / English Garden',
  'Japanese / Zen',
  'Mediterranean / Drought-Tolerant',
  'Prairie / Wildflower Meadow',
  'Modern / Minimalist Outdoor',
  'Other / Not sure yet',
]

const GARDEN_SPACE_OPTIONS = [
  'Backyard only',
  'Front yard only',
  'Side yard',
  'Full lot / entire property',
  'Rooftop or terrace',
  'Multiple areas',
]

const GARDEN_FEATURES = [
  'Raised vegetable beds',
  'Fruit trees / orchard',
  'Herb garden',
  'Chicken coop / backyard poultry',
  'Compost system',
  'Pollinator / bee garden',
  'Perennial flower beds',
  'Lawn area',
  'Gravel / decomposed granite paths',
  'Patio / deck integration',
  'Pergola / shade structure',
  'Water feature (pond, fountain)',
  'Fire pit or outdoor fireplace',
  'Outdoor kitchen / BBQ',
  'Children\'s play area',
  'Pet-friendly zones',
  'Storage shed',
  'Privacy screening / hedges',
]

const GARDEN_IRRIGATION_OPTIONS = [
  'No irrigation needed',
  'Manual watering / hose bibs',
  'Drip irrigation',
  'In-ground sprinkler system',
  'Smart / automated irrigation',
  'Not sure — include recommendation',
]

const GARDEN_MAINTENANCE_OPTIONS = [
  'Minimal — low-maintenance design',
  'Weekend gardener — moderate upkeep',
  'Enthusiast — hands-on growing',
  'Intensive — vegetable / food production focus',
]

const PRIORITY_OPTIONS = [
  'Maximize space & functionality',
  'High-end finishes & materials',
  'Stay within budget',
  'Fast turnaround',
  'Increase home value / resale',
  'Eco-friendly / sustainable',
]

const GARDEN_PRIORITY_OPTIONS = [
  'Food production / edible garden',
  'Outdoor entertaining space',
  'Privacy & screening',
  'Low maintenance',
  'Eco-friendly / native planting',
  'Increase home value / curb appeal',
]

const TIMELINE_OPTIONS = [
  'As soon as possible',
  '1–3 months',
  '3–6 months',
  '6–12 months',
  'Exploring / no set timeline',
]

function DetailsInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const serviceSlug = searchParams.get('service') ?? ''
  const service = SERVICE_MAP[serviceSlug]

  const isGarden = serviceSlug === 'garden'

  const [scopeGoals, setScopeGoals] = useState<string[]>(() => {
    const raw = searchParams.get('scopeGoals')
    return raw ? raw.split('||').filter(Boolean) : []
  })
  const [scopeConditions, setScopeConditions] = useState<string[]>(() => {
    const raw = searchParams.get('scopeConditions')
    return raw ? raw.split('||').filter(Boolean) : []
  })
  const [extraNote, setExtraNote] = useState(() => searchParams.get('extraNote') ?? '')
  const [budget, setBudget] = useState(() => searchParams.get('budget') ?? '')
  const [zip, setZip] = useState(() => searchParams.get('zip') ?? '')
  const [style, setStyle] = useState(() => searchParams.get('style') ?? '')
  const [priority, setPriority] = useState(() => searchParams.get('priority') ?? '')
  const [timeline, setTimeline] = useState(() => searchParams.get('timeline') ?? '')
  const [sqft, setSqft] = useState(() => searchParams.get('sqft') ?? '')
  // Garden-specific fields
  const [gardenSpace, setGardenSpace] = useState(() => searchParams.get('gardenSpace') ?? '')
  const [gardenFeatures, setGardenFeatures] = useState<string[]>(() => {
    const raw = searchParams.get('gardenFeatures')
    return raw ? raw.split(',').filter(Boolean) : []
  })
  const [gardenIrrigation, setGardenIrrigation] = useState(() => searchParams.get('gardenIrrigation') ?? '')
  const [gardenMaintenance, setGardenMaintenance] = useState(() => searchParams.get('gardenMaintenance') ?? '')
  const [uploadedFiles, setUploadedFiles] = useState<IntakeUploadedFile[]>(() => {
    const raw = searchParams.get('attachments')
    if (!raw) return []
    return raw.split(',').filter(Boolean).map((url) => ({
      url,
      name: url.split('/').pop()?.split('?')[0] ?? 'file',
      type: /\.(jpg|jpeg|png|webp|heic)/i.test(url) ? 'image'
          : /\.(mp4|mov)/i.test(url) ? 'video'
          : 'document',
    } as IntakeUploadedFile))
  })
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [photoAckNoUpload, setPhotoAckNoUpload] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const resumedCaptureId = searchParams.get('captureSessionId')
  const resumedCaptureToken = searchParams.get('captureToken')
  const captureReturnParams = new URLSearchParams(searchParams.toString())
  captureReturnParams.delete('captureSessionId')
  captureReturnParams.delete('captureToken')
  const [uploadMode, setUploadMode] = useState<'device' | 'phone'>(
    resumedCaptureId && resumedCaptureToken ? 'phone' : 'device',
  )
  const [captureSession, setCaptureSession] = useState<{ id: string; token: string } | null>(
    resumedCaptureId && resumedCaptureToken
      ? { id: resumedCaptureId, token: resumedCaptureToken }
      : null,
  )
  const [captureStarting, setCaptureStarting] = useState(false)
  const [captureStatus, setCaptureStatus] = useState<string>('pending')
  const seenAssetIds = useRef<Set<string>>(new Set())

  function handleDrag(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = Array.from(e.dataTransfer.files)
      const remaining = 5 - uploadedFiles.length
      const toUpload = selected.slice(0, remaining)
      setUploading(true)
      const newFiles = await uploadIntakeFilesSequentially(toUpload)
      setUploadedFiles((prev) => [...prev, ...newFiles])
      setUploading(false)
    }
  }

  useEffect(() => {
    if (uploadedFiles.some((f) => f.type === 'image')) {
      setPhotoAckNoUpload(false)
    }
  }, [uploadedFiles])

  async function startCaptureSession() {
    if (captureSession || captureStarting) return
    setCaptureStarting(true)
    try {
      // No real intake exists yet at this step — capture_sessions.intake_id is a
      // loosely-correlated TEXT column (no FK), so a client-generated id just
      // satisfies CreateCaptureSessionSchema's required field.
      const resp = await fetch('/api/capture/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intake_id: `pre-intake-${crypto.randomUUID()}`,
          project_path: serviceSlug,
          address: zip.trim() ? `ZIP ${zip.trim()}` : 'Not yet provided',
          capture_mode: 'self_capture',
        }),
      })
      const json = await resp.json()
      if (resp.ok) {
        setCaptureSession({ id: json.captureSessionId, token: json.captureToken })
      }
    } catch {
      // handoff panel stays hidden; user can retry via the tab
    } finally {
      setCaptureStarting(false)
    }
  }

  // Poll the mobile capture session for new assets while it's active — the
  // /api/capture/progress endpoint was already built for this ("polling
  // endpoint for desktop progress panel") but had no consumer until now.
  useEffect(() => {
    if (!captureSession) return
    let cancelled = false

    async function poll() {
      if (!captureSession) return
      try {
        const resp = await fetch(`/api/capture/progress?captureSessionId=${captureSession.id}`)
        if (!resp.ok) return
        const progress = await resp.json()
        if (cancelled) return
        setCaptureStatus(progress.status ?? 'pending')

        if ((progress.uploadedAssetsCount ?? 0) > 0) {
          const { data: assets } = await supabase
            .from('capture_assets')
            .select('id, storage_url, mime_type, zone')
            .eq('capture_session_id', captureSession.id)
          if (cancelled || !assets) return
          const newAssets = assets.filter((a: { id: string }) => !seenAssetIds.current.has(a.id))
          if (newAssets.length > 0) {
            newAssets.forEach((a: { id: string }) => seenAssetIds.current.add(a.id))
            setUploadedFiles((prev) => [
              ...prev,
              ...newAssets.map(
                (a: { id: string; storage_url: string; mime_type: string; zone: string }) =>
                  ({
                    url: a.storage_url,
                    name: `${a.zone.replace(/_/g, ' ')} photo`,
                    type: a.mime_type?.startsWith('video') ? 'video' : 'image',
                  }) as IntakeUploadedFile,
              ),
            ])
          }
        }
      } catch {
        // transient network error — next poll tick will retry
      }
    }

    poll()
    const interval = setInterval(poll, 4000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [captureSession])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    if (!selected.length) return
    const remaining = 5 - uploadedFiles.length
    const toUpload = selected.slice(0, remaining)
    setUploading(true)
    const newFiles = await uploadIntakeFilesSequentially(toUpload)
    setUploadedFiles((prev) => [...prev, ...newFiles])
    setUploading(false)
    // reset input so same file can be re-selected if needed
    e.target.value = ''
  }

  function removeFile(url: string) {
    setUploadedFiles((prev) => prev.filter((f) => f.url !== url))
  }

  function fileIcon(kind: IntakeUploadedFile['type']) {
    if (kind === 'image') return <ImageIcon className="w-5 h-5 text-slate-400" />
    if (kind === 'video') return <Video className="w-5 h-5 text-slate-400" />
    return <FileText className="w-5 h-5 text-slate-400" />
  }

  function toggleScopeCondition(item: string) {
    setScopeConditions((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    )
  }

  function toggleScopeGoal(item: string) {
    setScopeGoals((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    )
  }

  function toggleGardenFeature(feature: string) {
    setGardenFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    )
  }

  function composedScope() {
    return buildConceptScope({
      serviceSlug,
      serviceLabel: service?.label,
      goals: scopeGoals,
      conditions: scopeConditions,
      extraNote,
      style,
      priority,
      timeline,
      sqft,
      gardenSpace,
      gardenFeatures,
      gardenIrrigation,
      gardenMaintenance,
    })
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!isConceptScopeComplete(scopeGoals, extraNote, isGarden, gardenFeatures)) {
      e.scope = isGarden
        ? 'Select at least one garden feature, or add a short note below.'
        : 'Tap at least one update you want, or add a short note below.'
    }
    if (!budget.trim()) e.budget = 'Please enter an estimated budget.'
    if (!/^\d{5}$/.test(zip)) e.zip = 'Please enter a valid 5-digit ZIP code.'
    if (!sqft.trim()) e.sqft = 'Please enter an approximate square footage.'
    if (!style) e.style = 'Please select a design style.'
    if (!priority) e.priority = 'Please select a top priority.'
    if (!timeline) e.timeline = 'Please select a project timeline.'
    if (isGarden) {
      if (!gardenSpace) e.gardenSpace = 'Please select which outdoor space.'
      if (!gardenIrrigation) e.gardenIrrigation = 'Please select an irrigation preference.'
      if (!gardenMaintenance) e.gardenMaintenance = 'Please select a maintenance commitment.'
    }
    const hasPhoto = uploadedFiles.some((f) => f.type === 'image')
    if (!hasPhoto && !photoAckNoUpload) {
      e.photos =
        'Upload at least one photo of existing conditions, or check the acknowledgment below to continue without photos.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleNext() {
    if (!validate()) return
    const params = new URLSearchParams({
      service: serviceSlug,
      scope: composedScope(),
      budget,
      zip,
      style,
      priority,
      timeline,
      sqft,
      ...(isGarden && {
        gardenSpace,
        gardenFeatures: gardenFeatures.join(','),
        gardenIrrigation,
        gardenMaintenance,
      }),
      ...(uploadedFiles.length > 0 && {
        attachments: uploadedFiles.map((f) => f.url).join(','),
      }),
    })
    router.push(`/concept/contact?${params.toString()}`)
  }

  if (!serviceSlug) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">No service selected.</p>
        <Link href="/concept" className="text-[#E8724B] font-semibold">← Start over</Link>
      </div>
    )
  }

  const goalOptions = getConceptGoalOptions(serviceSlug)
  const conditionOptions = getConceptConditionOptions(serviceSlug)
  const scopePreview = composedScope()

  return (
    <ConceptIntakeShell serviceSlug={serviceSlug}>
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#E8724B] mb-2">Step 2 of 4</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Tell Us About Your Project</h1>
        <p className="text-slate-500">
          Selected: <span className="font-semibold text-slate-700">{service?.label ?? serviceSlug}</span>
          {' · '}
          <span className="text-slate-400">Tap options below — no long essay required</span>
        </p>
      </div>

      <div className="space-y-6 max-w-xl lg:max-w-none">

        <ScopeChipGrid
          label={isGarden ? "What's the yard like today? (optional)" : "What's it like today? (optional)"}
          hint="Helps us ground the concept in your existing space."
          options={conditionOptions}
          selected={scopeConditions}
          onToggle={toggleScopeCondition}
        />

        {!isGarden && (
          <ScopeChipGrid
            label="What updates do you want? *"
            hint="Select all that apply."
            options={goalOptions}
            selected={scopeGoals}
            onToggle={toggleScopeGoal}
            error={errors.scope}
          />
        )}

        {/* Garden: Outdoor Space Type */}
        {isGarden && (
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Which outdoor space? <span className="text-[#E8724B]">*</span>
            </label>
            <select
              className={inputClass}
              value={gardenSpace}
              onChange={(e) => setGardenSpace(e.target.value)}
            >
              <option value="">Select area...</option>
              {GARDEN_SPACE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors.gardenSpace && <p className="text-xs text-red-500 mt-1">{errors.gardenSpace}</p>}
          </div>
        )}

        {/* Garden: Feature Checklist */}
        {isGarden && (
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              What do you want to include? <span className="text-[#E8724B]">*</span>
              <span className="text-slate-400 font-normal"> (select all that apply)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {GARDEN_FEATURES.map((feat) => (
                <label
                  key={feat}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer text-sm transition ${
                    gardenFeatures.includes(feat)
                      ? 'border-[#E8724B] bg-orange-50 text-[#E8724B] font-medium'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={gardenFeatures.includes(feat)}
                    onChange={() => toggleGardenFeature(feat)}
                  />
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    gardenFeatures.includes(feat) ? 'bg-[#E8724B] border-[#E8724B]' : 'border-slate-300 bg-white'
                  }`}>
                    {gardenFeatures.includes(feat) && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                        <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  {feat}
                </label>
              ))}
            </div>
            {errors.scope && <p className="text-xs text-red-500 mt-2">{errors.scope}</p>}
          </div>
        )}

        {/* Garden: Irrigation */}
        {isGarden && (
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Irrigation preference <span className="text-[#E8724B]">*</span>
            </label>
            <select
              className={inputClass}
              value={gardenIrrigation}
              onChange={(e) => setGardenIrrigation(e.target.value)}
            >
              <option value="">Select irrigation type...</option>
              {GARDEN_IRRIGATION_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            {errors.gardenIrrigation && <p className="text-xs text-red-500 mt-1">{errors.gardenIrrigation}</p>}
          </div>
        )}

        {/* Garden: Maintenance Level */}
        {isGarden && (
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Maintenance commitment <span className="text-[#E8724B]">*</span>
            </label>
            <select
              className={inputClass}
              value={gardenMaintenance}
              onChange={(e) => setGardenMaintenance(e.target.value)}
            >
              <option value="">How much upkeep are you planning?</option>
              {GARDEN_MAINTENANCE_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            {errors.gardenMaintenance && <p className="text-xs text-red-500 mt-1">{errors.gardenMaintenance}</p>}
          </div>
        )}

        {/* Square Footage */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1.5">
            Approximate Square Footage <span className="text-[#E8724B]">*</span>
          </label>
          <input
            type="number"
            className={inputClass}
            placeholder="e.g. 450"
            min="0"
            value={sqft}
            onChange={(e) => setSqft(e.target.value)}
          />
          {errors.sqft && <p className="text-xs text-red-500 mt-1">{errors.sqft}</p>}
          <p className="text-xs text-slate-400 mt-1">{getConceptSqftHint(serviceSlug)}</p>
        </div>

        {/* Style — garden-specific options when garden service */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1.5">
            {isGarden ? 'Garden Style' : 'Design Style'} <span className="text-[#E8724B]">*</span>
          </label>
          <select
            className={inputClass}
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          >
            <option value="">Select a style...</option>
            {(isGarden ? GARDEN_STYLE_OPTIONS : STYLE_OPTIONS).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.style && <p className="text-xs text-red-500 mt-1">{errors.style}</p>}
        </div>

        {/* Priority — garden-specific options when garden service */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1.5">
            Top Priority <span className="text-[#E8724B]">*</span>
          </label>
          <select
            className={inputClass}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="">What matters most to you?</option>
            {(isGarden ? GARDEN_PRIORITY_OPTIONS : PRIORITY_OPTIONS).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {errors.priority && <p className="text-xs text-red-500 mt-1">{errors.priority}</p>}
        </div>

        {/* Budget */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1.5">
            Estimated Project Budget <span className="text-[#E8724B]">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">$</span>
            <input
              type="number"
              className={`${inputClass} pl-7`}
              placeholder="50000"
              min="0"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>
          {errors.budget && <p className="text-xs text-red-500 mt-1">{errors.budget}</p>}
          <p className="text-xs text-slate-400 mt-1">Your total budget for construction — not the AI concept fee</p>
        </div>

        {/* Timeline */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1.5">
            Project Timeline <span className="text-[#E8724B]">*</span>
          </label>
          <select
            className={inputClass}
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
          >
            <option value="">When do you want to start?</option>
            {TIMELINE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {errors.timeline && <p className="text-xs text-red-500 mt-1">{errors.timeline}</p>}
        </div>

        {/* ZIP */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1.5">
            Project ZIP Code <span className="text-[#E8724B]">*</span>
          </label>
          <input
            type="text"
            className={inputClass}
            placeholder="20001"
            maxLength={5}
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, ''))}
          />
          {errors.zip && <p className="text-xs text-red-500 mt-1">{errors.zip}</p>}
          {zip.length === 5 && !errors.zip && (
            <p className="text-xs text-green-600 mt-1">✓ Location confirmed — used for zoning and permit analysis</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1.5">
            Anything else? <span className="text-slate-400 font-normal">(optional one line)</span>
          </label>
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. Keep the brick chimney visible, prefer warm wood tones"
            value={extraNote}
            onChange={(e) => setExtraNote(e.target.value)}
            maxLength={200}
          />
        </div>

        {scopePreview.length > 20 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Your project summary</p>
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{scopePreview}</p>
          </div>
        )}

        {/* File / Photo Upload */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1.5">
            Photos of existing conditions <span className="text-[#E8724B]">*</span>
          </label>
          <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2.5 mb-4 text-xs text-amber-950 leading-relaxed">
            <Info className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" aria-hidden />
            <p>{CONCEPT_PHOTO_RENDERING_DISCLAIMER}</p>
          </div>

          {/* Upload mode tabs */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setUploadMode('device')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                uploadMode === 'device'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Monitor className="w-4 h-4" /> Upload from this device
            </button>
            <button
              type="button"
              onClick={() => {
                setUploadMode('phone')
                startCaptureSession()
              }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                uploadMode === 'phone'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" /> Capture on my phone
            </button>
          </div>

          {uploadMode === 'phone' ? (
            <div>
              {captureStarting || !captureSession ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Setting up your capture link…
                </div>
              ) : (
                <>
                  <CaptureHandoffPanel
                    captureSessionId={captureSession.id}
                    captureToken={captureSession.token}
                    projectPath={serviceSlug}
                    returnPath={`/concept/details${captureReturnParams.size ? `?${captureReturnParams.toString()}` : ''}`}
                  />
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {captureStatus === 'in_progress' || uploadedFiles.length > 0 ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#E8724B]" />
                        <span>
                          {uploadedFiles.length > 0
                            ? `${uploadedFiles.length} photo${uploadedFiles.length === 1 ? '' : 's'} received from your phone — keep going or continue below.`
                            : 'Waiting for photos from your phone…'}
                        </span>
                      </>
                    ) : (
                      <span>Open the link on your phone to start capturing — photos will appear here automatically.</span>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Drag & Drop zone */
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`relative rounded-2xl border-2 border-dashed p-6 transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                dragActive
                  ? 'border-[#E8724B] bg-orange-50/30'
                  : 'border-slate-300 bg-slate-50 hover:border-[#E8724B] hover:bg-orange-50/10'
              }`}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,application/pdf"
                multiple
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
              />
              <div className="w-12 h-12 rounded-full bg-slate-200/60 flex items-center justify-center mb-3 text-slate-500 group-hover:text-[#E8724B] transition-colors">
                <Paperclip className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-slate-800 mb-1">
                Drag &amp; drop photos here, or <span className="text-[#E8724B] hover:underline">browse files</span>
              </p>
              <p className="text-xs text-slate-400">
                Up to 5 files, 50 MB each (JPG, PNG, WEBP, MP4, PDF)
              </p>
              {uploading && (
                <div className="absolute inset-0 bg-white/95 rounded-2xl flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 text-[#E8724B] animate-spin" />
                  <span className="text-xs font-semibold text-slate-700">Uploading files, please wait...</span>
                </div>
              )}
            </div>
          )}

          {/* Uploaded file previews grid */}
          {uploadedFiles.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Attached Files ({uploadedFiles.length}/5)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                {uploadedFiles.map((f) => (
                  <div
                    key={f.url}
                    className="relative aspect-square rounded-xl border border-slate-200 bg-slate-100 overflow-hidden group shadow-sm"
                  >
                    {f.type === 'image' ? (
                      <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 p-2 text-center bg-slate-50">
                        {fileIcon(f.type)}
                        <span className="text-[10px] text-slate-500 truncate w-full">{f.name}</span>
                      </div>
                    )}
                    {/* Delete hover overlay */}
                    <div className="absolute inset-0 bg-slate-950/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(f.url)
                        }}
                        className="p-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow transition-transform hover:scale-105"
                        aria-label="Delete file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!uploadedFiles.some((f) => f.type === 'image') && (
            <label className="mt-4 flex items-start gap-2.5 cursor-pointer text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-1 rounded border-slate-300 text-[#E8724B] focus:ring-[#E8724B]/30"
                checked={photoAckNoUpload}
                onChange={(e) => setPhotoAckNoUpload(e.target.checked)}
              />
              <span>
                I don&apos;t have photos yet — I understand renderings will be forward-looking concepts only (no before/after without existing-condition photos).
              </span>
            </label>
          )}
          {errors.photos && <p className="text-xs text-red-500 mt-2">{errors.photos}</p>}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-10">
        <Link
          href={`/concept?service=${serviceSlug}`}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <button
          onClick={handleNext}
          disabled={uploading}
          className="flex items-center gap-2 bg-[#E8724B] hover:bg-[#D45C33] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-8 py-4 rounded-xl transition-all duration-200"
        >
          {uploading ? 'Uploading files…' : 'Continue to Contact'} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </ConceptIntakeShell>
  )
}

export default function ConceptDetailsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-4 border-[#E8724B] border-t-transparent animate-spin" /></div>}>
      <DetailsInner />
    </Suspense>
  )
}
