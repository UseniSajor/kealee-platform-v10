'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { isValidProjectPath, getRequiredZones } from '@kealee/intake'
import { CaptureHandoffPanel } from '@kealee/ui/components/intake/capture-handoff-panel'
import { CaptureProgressPanel } from '@kealee/ui/components/intake/capture-progress-panel'
import { CaptureModeSelector, type CaptureMode } from '@kealee/ui/components/intake/capture-mode-selector'
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'
import { notFound } from 'next/navigation'

interface SessionData {
  captureSessionId: string
  captureToken: string
  requiredZones: string[]
  captureMode: CaptureMode
}

export default function CaptureGatePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectPath = params.projectPath as string

  if (!isValidProjectPath(projectPath)) {
    notFound()
  }

  const intakeId = searchParams.get('intakeId')
  const projectId = searchParams.get('projectId')

  const [step, setStep] = useState<'select_mode' | 'handoff'>('select_mode')
  const [captureMode, setCaptureMode] = useState<CaptureMode>('standard')
  const [session, setSession] = useState<SessionData | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [captureComplete, setCaptureComplete] = useState(false)
  const [linkSent, setLinkSent] = useState(false)

  // Restore existing session if any
  useEffect(() => {
    const stored = typeof window !== 'undefined'
      ? sessionStorage.getItem(`kealee_capture_session_${projectPath}`)
      : null
    if (stored) {
      try {
        setSession(JSON.parse(stored))
        setStep('handoff')
      } catch {}
    }
  }, [projectPath])

  async function handleModeConfirmed() {
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
        sessionStorage.setItem(
          `kealee_capture_session_${projectPath}`,
          JSON.stringify(sessionData),
        )
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
    if (projectId) {
      router.push(`/app/projects/${projectId}/twin`)
    } else {
      router.push(`/intake/${projectPath}/success?intakeId=${intakeId ?? 'captured'}`)
    }
  }

  const requiredZones = session?.requiredZones ?? getRequiredZones(projectPath)

  // ─── Mode complete state ────────────────────────────────────────────────────
  if (captureComplete) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-16 w-16" style={{ color: '#16A34A' }} />
        <h2 className="mb-2 text-2xl font-bold" style={{ color: '#1A2B4A' }}>
          Capture complete!
        </h2>
        <p className="mb-8 text-gray-500">
          Your digital twin is being built from the captured data. You can review it now.
        </p>
        <button
          onClick={handleProceed}
          className="flex items-center gap-2 mx-auto rounded-xl px-6 py-3 font-medium text-white"
          style={{ backgroundColor: '#E8793A' }}
        >
          View Digital Twin <ArrowRight className="h-4 w-4" />
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
            Mobile Site Capture
          </h1>
          <p className="mt-1 text-gray-500">
            Choose how your property will be captured. You can always upgrade later.
          </p>
        </div>

        <CaptureModeSelector
          defaultMode={captureMode}
          onChange={setCaptureMode}
        />

        {error && (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        )}

        <button
          onClick={handleModeConfirmed}
          disabled={creating}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: '#E8793A' }}
        >
          {creating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Continue to Capture <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
    )
  }

  // ─── Step 2: Handoff + live progress ────────────────────────────────────────
  if (!session) return null

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
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            backgroundColor: session.captureMode === 'enhanced_scan' ? '#EEF2FF' : '#F0FDF4',
            color: session.captureMode === 'enhanced_scan' ? '#4338CA' : '#15803D',
          }}
        >
          {session.captureMode === 'enhanced_scan' ? 'Enhanced Scan' : 'Standard Capture'}
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
                  After completing all zones, you&apos;ll see a 3D scan step at the end.
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
