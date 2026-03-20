'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { IntakeReviewPanel } from '@kealee/ui/components/intake/intake-review-panel'
import { Camera, Mic, Scan, CheckCircle2, AlertCircle } from 'lucide-react'

interface CaptureSummary {
  captureSessionId: string | null
  captureMode: 'standard' | 'enhanced_scan' | null
  uploadedAssetsCount: number
  voiceNotesCount: number
  completedZonesCount: number
  totalZonesCount: number
  scanCompleted: boolean
}

function CaptureSummarySection({ summary }: { summary: CaptureSummary }) {
  if (!summary.captureSessionId) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-400">
        No site capture completed yet.
      </div>
    )
  }

  const isEnhanced = summary.captureMode === 'enhanced_scan'

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>
          Capture Summary
        </h3>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: isEnhanced ? '#EEF2FF' : '#F0FDF4',
            color: isEnhanced ? '#4338CA' : '#15803D',
          }}
        >
          {isEnhanced ? 'Enhanced Scan' : 'Standard Capture'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white p-3 text-center shadow-sm">
          <Camera className="mx-auto mb-1 h-5 w-5 text-gray-400" />
          <p className="text-lg font-bold" style={{ color: '#1A2B4A' }}>
            {summary.uploadedAssetsCount}
          </p>
          <p className="text-xs text-gray-500">Photos</p>
        </div>
        <div className="rounded-xl bg-white p-3 text-center shadow-sm">
          <Mic className="mx-auto mb-1 h-5 w-5 text-gray-400" />
          <p className="text-lg font-bold" style={{ color: '#1A2B4A' }}>
            {summary.voiceNotesCount}
          </p>
          <p className="text-xs text-gray-500">Voice Notes</p>
        </div>
        <div className="rounded-xl bg-white p-3 text-center shadow-sm">
          <div className="mx-auto mb-1 flex items-center justify-center">
            <span className="text-sm font-bold" style={{ color: '#E8793A' }}>
              {summary.completedZonesCount}/{summary.totalZonesCount}
            </span>
          </div>
          <p className="text-xs text-gray-500">Rooms</p>
        </div>
      </div>

      {isEnhanced && (
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{
            backgroundColor: summary.scanCompleted ? '#F0FDF4' : '#FFF7ED',
          }}
        >
          {summary.scanCompleted ? (
            <>
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: '#16A34A' }} />
              <span className="text-sm font-medium text-green-700">
                Scan Completed — Floor plan with room layout will be included
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-500" />
              <span className="text-sm text-amber-700">
                Scan not yet completed — AI-inferred layout will be used
              </span>
            </>
          )}
        </div>
      )}

      {!isEnhanced && (
        <p className="text-xs text-gray-400">
          + AI-inferred layout from photos and voice notes
        </p>
      )}
    </div>
  )
}

export default function IntakeReviewPage() {
  const params = useParams()
  const router = useRouter()
  const projectPath = params.projectPath as string
  const [formData, setFormData] = useState<Record<string, unknown> | null>(null)
  const [captureSummary, setCaptureSummary] = useState<CaptureSummary>({
    captureSessionId: null,
    captureMode: null,
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

    const captureSession = sessionStorage.getItem(`kealee_capture_session_${projectPath}`)
    if (captureSession) {
      try {
        const parsed = JSON.parse(captureSession)
        if (parsed.captureSessionId) {
          // Load live session progress
          fetch(`/api/capture/progress?captureSessionId=${parsed.captureSessionId}`)
            .then((r) => r.json())
            .then((data) => {
              setCaptureSummary({
                captureSessionId: parsed.captureSessionId,
                captureMode: parsed.captureMode ?? 'standard',
                uploadedAssetsCount: data.uploadedAssetsCount ?? 0,
                voiceNotesCount: data.voiceNotesCount ?? 0,
                completedZonesCount: data.completedZonesCount ?? 0,
                totalZonesCount: data.totalZonesCount ?? 0,
                scanCompleted: data.scanCompleted ?? false,
              })
            })
            .catch(() => {})
        }
      } catch {}
    }
  }, [projectPath])

  if (!formData) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">No intake data found.</p>
        <button
          onClick={() => router.push(`/intake/${projectPath}`)}
          className="mt-4 text-sm text-[#E8793A] hover:underline"
        >
          Start intake
        </button>
      </div>
    )
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/intake/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intake: formData,
          captureSessionId: captureSummary.captureSessionId ?? undefined,
          captureMode: captureSummary.captureMode ?? undefined,
          scanCompleted: captureSummary.scanCompleted,
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const result = await res.json() as {
        ok: boolean
        intakeId?: string
        requiresPayment?: boolean
        paymentAmount?: number
        errors?: string[]
      }

      if (!result.ok) {
        alert('Submission failed: ' + (result.errors?.join(', ') ?? 'Unknown error'))
        return
      }

      if (result.requiresPayment && result.intakeId) {
        router.push(`/intake/${projectPath}/payment?intakeId=${result.intakeId}&amount=${result.paymentAmount ?? 0}`)
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
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      {/* Capture summary */}
      <CaptureSummarySection summary={captureSummary} />

      {/* Intake review */}
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
