'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, ArrowLeft, Paperclip, X, ImageIcon, FileText, Video } from 'lucide-react'
import { SERVICE_MAP } from '@/lib/services-config'
import { getConceptScopePlaceholder, getConceptSqftHint } from '@/lib/concept-scope-placeholders'
import {
  uploadIntakeFilesSequentially,
  type IntakeUploadedFile,
} from '@/lib/intake-file-upload'

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

  const [scope, setScope] = useState(() => searchParams.get('scope') ?? '')
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
  const [errors, setErrors] = useState<Record<string, string>>({})

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
    if (kind === 'image') return <ImageIcon className="w-4 h-4 shrink-0" />
    if (kind === 'video') return <Video className="w-4 h-4 shrink-0" />
    return <FileText className="w-4 h-4 shrink-0" />
  }

  function toggleGardenFeature(feature: string) {
    setGardenFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    )
  }

  function validate() {
    const e: Record<string, string> = {}
    if (scope.trim().length < 20) e.scope = 'Please describe your project in at least 20 characters.'
    if (!budget.trim()) e.budget = 'Please enter an estimated budget.'
    if (!/^\d{5}$/.test(zip)) e.zip = 'Please enter a valid 5-digit ZIP code.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleNext() {
    if (!validate()) return
    const params = new URLSearchParams({
      service: serviceSlug,
      scope,
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

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#E8724B] mb-2">Step 2 of 4</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Tell Us About Your Project</h1>
        <p className="text-slate-500">
          Selected: <span className="font-semibold text-slate-700">{service?.label ?? serviceSlug}</span>
        </p>
      </div>

      <div className="space-y-6 max-w-xl">

        {/* Project Description */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1.5">
            Project Description <span className="text-[#E8724B]">*</span>
          </label>
          <textarea
            className={`${inputClass} h-32 resize-none`}
            placeholder={getConceptScopePlaceholder(serviceSlug)}
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          />
          {errors.scope && <p className="text-xs text-red-500 mt-1">{errors.scope}</p>}
          <p className="text-xs text-slate-400 mt-1">{scope.length} characters — the more detail, the more accurate your concept</p>
        </div>

        {/* Garden: Outdoor Space Type */}
        {isGarden && (
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Which outdoor space? <span className="text-slate-400 font-normal">(optional)</span>
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
          </div>
        )}

        {/* Garden: Feature Checklist */}
        {isGarden && (
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              What do you want to include? <span className="text-slate-400 font-normal">(select all that apply)</span>
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
          </div>
        )}

        {/* Garden: Irrigation */}
        {isGarden && (
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Irrigation preference <span className="text-slate-400 font-normal">(optional)</span>
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
          </div>
        )}

        {/* Garden: Maintenance Level */}
        {isGarden && (
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Maintenance commitment <span className="text-slate-400 font-normal">(optional)</span>
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
          </div>
        )}

        {/* Square Footage */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1.5">
            Approximate Square Footage <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="number"
            className={inputClass}
            placeholder="e.g. 450"
            min="0"
            value={sqft}
            onChange={(e) => setSqft(e.target.value)}
          />
          <p className="text-xs text-slate-400 mt-1">{getConceptSqftHint(serviceSlug)}</p>
        </div>

        {/* Style — garden-specific options when garden service */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1.5">
            {isGarden ? 'Garden Style' : 'Design Style'} <span className="text-slate-400 font-normal">(optional)</span>
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
        </div>

        {/* Priority — garden-specific options when garden service */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1.5">
            Top Priority <span className="text-slate-400 font-normal">(optional)</span>
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
            Project Timeline <span className="text-slate-400 font-normal">(optional)</span>
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

        {/* File / Photo Upload */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1.5">
            Photos or Documents <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <p className="text-xs text-slate-400 mb-2">
            Attach existing plans, inspiration photos, or videos — up to 5 files, 50 MB each. Accepted: JPG, PNG, WEBP, MP4, PDF.
          </p>

          {/* Uploaded file chips */}
          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {uploadedFiles.map((f) => (
                <div
                  key={f.url}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700 max-w-[200px]"
                >
                  {fileIcon(f.type)}
                  <span className="truncate flex-1">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(f.url)}
                    className="text-slate-400 hover:text-red-500 transition ml-1 shrink-0"
                    aria-label="Remove file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload trigger */}
          {uploadedFiles.length < 5 && (
            <label className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed cursor-pointer text-sm font-medium transition ${
              uploading
                ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                : 'border-slate-300 text-slate-600 hover:border-[#E8724B] hover:text-[#E8724B]'
            }`}>
              <Paperclip className="w-4 h-4 shrink-0" />
              {uploading ? 'Uploading…' : `Attach files${uploadedFiles.length > 0 ? ` (${uploadedFiles.length}/5)` : ''}`}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,application/pdf"
                multiple
                disabled={uploading}
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
          )}
          {uploadedFiles.length >= 5 && (
            <p className="text-xs text-slate-400 mt-1">Maximum 5 files attached.</p>
          )}
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
    </div>
  )
}

export default function ConceptDetailsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-4 border-[#E8724B] border-t-transparent animate-spin" /></div>}>
      <DetailsInner />
    </Suspense>
  )
}
