'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { isValidProjectPath, getRequiredZones } from '@kealee/intake'
import { CaptureHandoffPanel } from '@kealee/ui/components/intake/capture-handoff-panel'
import { CaptureProgressPanel } from '@kealee/ui/components/intake/capture-progress-panel'
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'
import { notFound } from 'next/navigation'

interface SessionData {
  captureSessionId: string
  captureToken: string
  requiredZones: string[]
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

  const [session, setSession] = useState<SessionData | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [captureComplete, setCaptureComplete] = useState(false)
  const [twinId, setTwinId] = useState<string | null>(null)
  const [linkSent, setLinkSent] = useState(false)

  useEffect(() => {
    // Check if session already exists in sessionStorage
    const stored = typeof window !== 'undefined'
      ? sessionStorage.getItem(`kealee_capture_session_${projectPath}`)
      : null

    if (stored) {
      try {
        setSession(JSON.parse(stored))
        return
      } catch {}
    }

    // Create capture session
    createCaptureSession()
  }, [projectPath])

  async function createCaptureSession() {
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
      }
      setSession(sessionData)

      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          `kealee_capture_session_${projectPath}`,
          JSON.stringify(sessionData),
        )
      }
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
    if (twinId) {
      router.push(`/app/projects/${projectId ?? 'new'}/twin?twinId=${twinId}`)
    } else {
      router.push(`/intake/${projectPath}/success?intakeId=${intakeId ?? 'captured'}`)
    }
  }

  const requiredZones = session?.requiredZones ?? getRequiredZones(projectPath)

  if (creating) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin" style={{ color: '#E8793A' }} />
          <p className="text-sm text-gray-500">Setting up your capture session…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="mb-4 text-red-600">{error}</p>
        <button
          onClick={createCaptureSession}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: '#E8793A' }}
        >
          Retry
        </button>
      </div>
    )
  }

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

  if (!session) return null

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>
          Mobile Site Capture
        </h1>
        <p className="mt-1 text-gray-500">
          Send the guided capture link to your phone. As you capture each zone, progress updates here in real time.
        </p>
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
              Link sent! Open it on your phone and start capturing. This page will update automatically.
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
