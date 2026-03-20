'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { IntakeReviewPanel } from '@kealee/ui/components/intake/intake-review-panel'
import { Camera, Mic, Scan, MapPin, CheckCircle2, AlertCircle } from 'lucide-react'

const SITE_VISIT_FEE_CENTS = 12500
const AI_CONCEPT_BASE_CENTS = 38500 // $385 base AI Concept Package

type CaptureMode = 'self_capture' | 'enhanced_scan' | 'kealee_site_visit'

interface CaptureInfo {
  captureSessionId: string | null
  captureMode: CaptureMode | null
  siteVisitFee: number
  preferredVisitWindow: string | null
  uploadedAssetsCount: number
  voiceNotesCount: number
  completedZonesCount: number
  totalZonesCount: number
  scanCompleted: boolean
}

// ── Capture Method Section ────────────────────────────────────────────────────
function CaptureSummarySection({ info }: { info: CaptureInfo }) {
  if (!info.captureMode) return null

  if (info.captureMode === 'kealee_site_visit') {
    return (
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-semibold text-indigo-900">Kealee Site Visit Scan</h3>
          </div>
          <span className="rounded-full bg-indigo-200 px-2 py-0.5 text-xs font-semibold text-indigo-800">
            + $125
          </span>
        </div>
        <p className="text-sm text-indigo-700">
          Kealee will perform an on-site professional scan of your property.
        </p>
        {info.preferredVisitWindow && (
          <div className="flex items-center gap-2 text-xs text-indigo-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Preferred availability: <strong>{info.preferredVisitWindow}</strong>
          </div>
        )}
        <div className="rounded-xl bg-white px-4 py-3 text-xs text-indigo-700 border border-indigo-100">
          📅 After payment, our team will contact you within 24 hours to confirm your visit.
        </div>

        {/* Pricing breakdown */}
        <div className="border-t border-indigo-100 pt-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-indigo-700">
            <span>AI Concept Package</span>
            <span>$385</span>
          </div>
          <div className="flex justify-between text-indigo-700">
            <span>Kealee Site Visit Scan</span>
            <span>$125</span>
          </div>
          <div className="flex justify-between font-bold text-indigo-900 border-t border-indigo-200 pt-1.5 mt-1.5">
            <span>Total</span>
            <span>$510</span>
          </div>
        </div>
      </div>
    )
  }

  // Self capture or enhanced scan
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>Capture Summary</h3>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: info.captureMode === 'enhanced_scan' ? '#EEF2FF' : '#F0FDF4',
            color: info.captureMode === 'enhanced_scan' ? '#4338CA' : '#15803D',
          }}
        >
          {info.captureMode === 'enhanced_scan' ? 'Enhanced Scan' : 'Self Capture'}
        </span>
      </div>

      <p className="text-sm text-gray-600">
        {info.captureMode === 'enhanced_scan'
          ? 'You will capture and scan your property for improved accuracy.'
          : 'You will capture your property using guided photo and video steps.'}
      </p>

      {info.captureSessionId && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white p-3 text-center shadow-sm">
            <Camera className="mx-auto mb-1 h-5 w-5 text-gray-400" />
            <p className="text-lg font-bold" style={{ color: '#1A2B4A' }}>{info.uploadedAssetsCount}</p>
            <p className="text-xs text-gray-500">Photos</p>
          </div>
          <div className="rounded-xl bg-white p-3 text-center shadow-sm">
            <Mic className="mx-auto mb-1 h-5 w-5 text-gray-400" />
            <p className="text-lg font-bold" style={{ color: '#1A2B4A' }}>{info.voiceNotesCount}</p>
            <p className="text-xs text-gray-500">Voice Notes</p>
          </div>
          <div className="rounded-xl bg-white p-3 text-center shadow-sm">
            <span className="block text-sm font-bold" style={{ color: '#E8793A' }}>
              {info.completedZonesCount}/{info.totalZonesCount}
            </span>
            <p className="text-xs text-gray-500">Rooms</p>
          </div>
        </div>
      )}

      {info.captureMode === 'enhanced_scan' && (
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{
            backgroundColor: info.scanCompleted ? '#F0FDF4' : '#FFF7ED',
          }}
        >
          {info.scanCompleted ? (
            <>
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: '#16A34A' }} />
              <span className="text-sm text-green-700">Scan Completed — Floor plan with room layout included</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-500" />
              <span className="text-sm text-amber-700">3D scan pending — AI-inferred layout will be used</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Deliverables Section ──────────────────────────────────────────────────────
function DeliverablesSection({ captureMode, scanCompleted }: { captureMode: CaptureMode | null; scanCompleted: boolean }) {
  const items = [
    '3D exterior concept renderings',
    'Material + finish direction board',
    'AI-generated design narrative',
    captureMode === 'enhanced_scan' && scanCompleted
      ? '+ Floor plan with room layout'
      : '+ AI-inferred layout',
    captureMode === 'kealee_site_visit'
      ? '+ Professional scan measurements'
      : null,
  ].filter(Boolean) as string[]

  return (
    <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5">
      <h3 className="text-sm font-semibold mb-3" style={{ color: '#1A2B4A' }}>
        What&apos;s Included
      </h3>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: '#16A34A' }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function IntakeReviewPage() {
  const params = useParams()
  const router = useRouter()
  const projectPath = params.projectPath as string

  const [formData, setFormData] = useState<Record<string, unknown> | null>(null)
  const [captureInfo, setCaptureInfo] = useState<CaptureInfo>({
    captureSessionId: null,
    captureMode: null,
    siteVisitFee: 0,
    preferredVisitWindow: null,
    uploadedAssetsCount: 0,
    voiceNotesCount: 0,
    completedZonesCount: 0,
    totalZonesCount: 0,
    scanCompleted: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = sessionStorage.getItem(`kealee_intake_${projectPath}`)
    if (stored) {
      try { setFormData(JSON.parse(stored)) } catch {}
    }

    // Capture mode info
    const captureModeRaw = sessionStorage.getItem(`kealee_capture_mode_${projectPath}`)
    const captureSession = sessionStorage.getItem(`kealee_capture_session_${projectPath}`)
    let parsedMode: { captureMode?: CaptureMode; siteVisitFee?: number; preferredVisitWindow?: string | null } = {}
    try { parsedMode = captureModeRaw ? JSON.parse(captureModeRaw) : {} } catch {}
    let parsedSession: { captureSessionId?: string } = {}
    try { parsedSession = captureSession ? JSON.parse(captureSession) : {} } catch {}

    const cid = parsedSession.captureSessionId ?? null
    const mode = parsedMode.captureMode ?? null
    const siteVisitFee = parsedMode.siteVisitFee ?? 0

    setCaptureInfo((prev) => ({
      ...prev,
      captureSessionId: cid,
      captureMode: mode,
      siteVisitFee,
      preferredVisitWindow: parsedMode.preferredVisitWindow ?? null,
    }))

    // Load live capture progress (non-site-visit modes)
    if (cid && mode !== 'kealee_site_visit') {
      fetch(`/api/capture/progress?captureSessionId=${cid}`)
        .then((r) => r.json())
        .then((data) => {
          setCaptureInfo((prev) => ({
            ...prev,
            uploadedAssetsCount: data.uploadedAssetsCount ?? 0,
            voiceNotesCount: data.voiceNotesCount ?? 0,
            completedZonesCount: data.completedZonesCount ?? 0,
            totalZonesCount: data.totalZonesCount ?? 0,
            scanCompleted: data.scanCompleted ?? false,
          }))
        })
        .catch(() => {})
    }
  }, [projectPath])

  if (!formData) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">No intake data found.</p>
        <button onClick={() => router.push(`/intake/${projectPath}`)} className="mt-4 text-sm text-[#E8793A] hover:underline">
          Start intake
        </button>
      </div>
    )
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      const isSiteVisit = captureInfo.captureMode === 'kealee_site_visit'
      const totalAmount = isSiteVisit
        ? AI_CONCEPT_BASE_CENTS + SITE_VISIT_FEE_CENTS
        : undefined // use default path amount

      const res = await fetch('/api/intake/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intake: formData,
          captureSessionId: captureInfo.captureSessionId ?? undefined,
          captureMode: captureInfo.captureMode ?? undefined,
          scanCompleted: captureInfo.scanCompleted,
          siteVisitRequested: isSiteVisit,
          siteVisitFee: isSiteVisit ? SITE_VISIT_FEE_CENTS : 0,
          preferredVisitWindow: captureInfo.preferredVisitWindow ?? undefined,
          overrideAmount: totalAmount,
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const result = await res.json() as {
        ok: boolean; intakeId?: string; requiresPayment?: boolean; paymentAmount?: number; errors?: string[];
      }

      if (!result.ok) {
        alert('Submission failed: ' + (result.errors?.join(', ') ?? 'Unknown error'))
        return
      }

      const amount = result.paymentAmount ?? (isSiteVisit ? AI_CONCEPT_BASE_CENTS + SITE_VISIT_FEE_CENTS : 38500)

      if (result.requiresPayment && result.intakeId) {
        const params = new URLSearchParams({
          intakeId: result.intakeId,
          amount: String(amount),
          ...(isSiteVisit ? { siteVisit: '1' } : {}),
        })
        router.push(`/intake/${projectPath}/payment?${params.toString()}`)
      } else {
        router.push(`/intake/${projectPath}/success?intakeId=${result.intakeId ?? 'unknown'}`)
      }
    } catch (err) {
      alert('Something went wrong. Please try again.')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-5">
      <CaptureSummarySection info={captureInfo} />
      <DeliverablesSection captureMode={captureInfo.captureMode} scanCompleted={captureInfo.scanCompleted} />
      <IntakeReviewPanel
        formData={formData}
        projectPath={projectPath}
        onBack={() => router.push(`/intake/${projectPath}`)}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
