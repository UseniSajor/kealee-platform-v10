'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { isValidProjectPath, getRequiredZones } from '@kealee/intake'
import { CaptureHandoffPanel } from '@kealee/ui/components/intake/capture-handoff-panel'
import { CaptureProgressPanel } from '@kealee/ui/components/intake/capture-progress-panel'
import { CaptureModeSelector, type CaptureMode, SITE_VISIT_FEE_CENTS } from '@kealee/ui/components/intake/capture-mode-selector'
import { CheckCircle2, ArrowRight, Loader2, MapPin } from 'lucide-react'
import { notFound } from 'next/navigation'

interface SessionData {
  captureSessionId: string
  captureToken: string
  requiredZones: string[]
  captureMode: CaptureMode
}

const SITE_VISIT_MODE_BADGE_STYLE = {
  backgroundColor: '#E0E7FF',
  color: '#3730A3',
}

const STANDARD_MODE_BADGE_STYLE = {
  enhanced_scan: { backgroundColor: '#EEF2FF', color: '#4338CA' },
  self_capture:  { backgroundColor: '#F0FDF4', color: '#15803D' },
}

export default function CaptureGatePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectPath = params.projectPath as string

  if (!isValidProjectPath(projectPath)) notFound()

  const intakeId = searchParams.get('intakeId')
  const projectId = searchParams.get('projectId')

  const [step, setStep] = useState<'select_mode' | 'handoff'>('select_mode')
  const [captureMode, setCaptureMode] = useState<CaptureMode>('self_capture')
  const [preferredWindow, setPreferredWindow] = useState<string | undefined>()
  const [session, setSession] = useState<SessionData | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [captureComplete, setCaptureComplete] = useState(false)
  const [linkSent, setLinkSent] = useState(false)

  // Restore existing session
  useEffect(() => {
    const stored = typeof window !== 'undefined'
      ? sessionStorage.getItem(`kealee_capture_session_${projectPath}`)
      : null
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setSession(parsed)
        // If stored mode is site_visit, redirect to review
        if (parsed.captureMode === 'kealee_site_visit') {
          router.push(`/intake/${projectPath}/review?intakeId=${intakeId ?? ''}`)
          return
        }
        setStep('handoff')
      } catch {}
    }
  }, [projectPath, intakeId, router])

  async function handleModeConfirmed() {
    // Site visit: create minimal capture session, then go directly to review
    if (captureMode === 'kealee_site_visit') {
      setCreating(true)
      setError(null)
      try {
        const intakeData = typeof window !== 'undefined'
          ? sessionStorage.getItem(`kealee_intake_${projectPath}`)
          : null
        const parsed = intakeData ? JSON.parse(intakeData) : {}

        const resp = await fetch('/api/capture/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_path: projectPath,
            intake_id: intakeId ?? undefined,
            project_id: projectId ?? undefined,
            address: parsed.projectAddress ?? parsed.address ?? 'Unknown address',
            client_name: parsed.clientName ?? undefined,
            capture_mode: 'kealee_site_visit',
            preferred_visit_window: preferredWindow ?? undefined,
          }),
        })
        const data = await resp.json()
        if (!resp.ok) {
          setError(data.error ?? 'Failed to create session')
          return
        }

        // Persist session so review page can read capture mode
        const sessionData: SessionData = {
          captureSessionId: data.captureSessionId,
          captureToken: data.captureToken,
          requiredZones: [],
          captureMode: 'kealee_site_visit',
        }
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`kealee_capture_session_${projectPath}`, JSON.stringify(sessionData))
          // Also persist capture mode for review/payment pages
          sessionStorage.setItem(`kealee_capture_mode_${projectPath}`, JSON.stringify({
            captureMode: 'kealee_site_visit',
            siteVisitFee: SITE_VISIT_FEE_CENTS,
            preferredVisitWindow: preferredWindow ?? null,
          }))
        }

        router.push(`/intake/${projectPath}/review?intakeId=${intakeId ?? ''}`)
      } catch {
        setError('Network error — please try again')
      } finally {
        setCreating(false)
      }
      return
    }

    // Self capture / Enhanced scan: create session and show handoff panel
    setCreating(true)
    setError(null)
    try {
      const intakeData = typeof window !== 'undefined'
        ? sessionStorage.getItem(`kealee_intake_${projectPath}`)
        : null
      const parsed = intakeData ? JSON.parse(intakeData) : {}

      const resp = await fetch('/api/capture/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_path: projectPath,
          intake_id: intakeId ?? undefined,
          project_id: projectId ?? undefined,
          address: parsed.projectAddress ?? parsed.address ?? 'Unknown address',
          client_name: parsed.clientName ?? undefined,
          capture_mode: captureMode,
        }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        setError(data.error ?? 'Failed to create capture session')
        return
      }

      const sessionData: SessionData = {
        captureSessionId: data.captureSessionId,
        captureToken: data.captureToken,
        requiredZones: data.requiredZones,
        captureMode: data.captureMode ?? captureMode,
      }
      setSession(sessionData)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`kealee_capture_session_${projectPath}`, JSON.stringify(sessionData))
        sessionStorage.setItem(`kealee_capture_mode_${projectPath}`, JSON.stringify({
          captureMode,
          siteVisitFee: 0,
          preferredVisitWindow: null,
        }))
      }
      setStep('handoff')
    } catch {
      setError('Network error — please try again')
    } finally {
      setCreating(false)
    }
  }

  function handleCaptureComplete() {
    setCaptureComplete(true)
  }

  function handleProceed() {
    // After capture complete: go to review
    router.push(`/intake/${projectPath}/review?intakeId=${intakeId ?? ''}`)
  }

  const requiredZones = session?.requiredZones ?? getRequiredZones(projectPath)

  if (captureComplete) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-16 w-16" style={{ color: '#16A34A' }} />
        <h2 className="mb-2 text-2xl font-bold" style={{ color: '#1A2B4A' }}>
          Capture complete!
        </h2>
        <p className="mb-8 text-gray-500">
          Your property data has been captured. Review your intake below.
        </p>
        <button
          onClick={handleProceed}
          className="flex items-center gap-2 mx-auto rounded-xl px-6 py-3 font-medium text-white"
          style={{ backgroundColor: '#E8793A' }}
        >
          Review & Continue <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    )
  }

  // ─── Step 1: Select capture mode ────────────────────────────────────────────
  if (step === 'select_mode') {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>
            Site Capture
          </h1>
          <p className="mt-1 text-gray-500">
            Choose how your property will be captured for the AI concept package.
          </p>
        </div>

        <CaptureModeSelector
          defaultMode={captureMode}
          onChange={(mode, window) => {
            setCaptureMode(mode)
            setPreferredWindow(window)
          }}
        />

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <button
          onClick={handleModeConfirmed}
          disabled={creating}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-white disabled:opacity-60"
          style={{
            backgroundColor: captureMode === 'kealee_site_visit' ? '#4F46E5' : '#E8793A',
          }}
        >
          {creating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : captureMode === 'kealee_site_visit' ? (
            <>
              <MapPin className="h-5 w-5" /> Request Site Visit — Continue to Review
            </>
          ) : (
            <>
              Continue to Capture <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
    )
  }

  // ─── Step 2: Handoff + live progress ─────────────────────────────────────────
  if (!session) return null

  const modeBadgeStyle =
    session.captureMode === 'enhanced_scan' || session.captureMode === 'self_capture'
      ? STANDARD_MODE_BADGE_STYLE[session.captureMode as 'enhanced_scan' | 'self_capture']
      : SITE_VISIT_MODE_BADGE_STYLE

  const modeLabel =
    session.captureMode === 'enhanced_scan' ? 'Enhanced Scan'
    : session.captureMode === 'kealee_site_visit' ? 'Site Visit'
    : 'Self Capture'

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>
            Mobile Site Capture
          </h1>
          <p className="mt-1 text-gray-500">
            Send the guided capture link to your phone. Progress updates here in real time.
          </p>
        </div>
        <span className="rounded-full px-3 py-1 text-xs font-semibold" style={modeBadgeStyle}>
          {modeLabel}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <CaptureHandoffPanel
            captureSessionId={session.captureSessionId}
            captureToken={session.captureToken}
            projectPath={projectPath}
            onLinkSent={() => setLinkSent(true)}
          />
          {linkSent && (
            <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Link sent! Open it on your phone and start capturing.
              {session.captureMode === 'enhanced_scan' && (
                <span className="block mt-1 font-medium">
                  After all zones, you&apos;ll see a 3D scan step.
                </span>
              )}
            </div>
          )}
        </div>

        <CaptureProgressPanel
          captureSessionId={session.captureSessionId}
          requiredZones={requiredZones}
          onComplete={handleCaptureComplete}
        />
      </div>
    </div>
  )
}
