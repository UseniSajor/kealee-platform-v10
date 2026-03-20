'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { MobileCaptureChecklist } from '@kealee/ui/components/intake/mobile-capture-checklist'
import { MobileCaptureCamera } from '@kealee/ui/components/intake/mobile-capture-camera'
import { MobileCaptureVoiceNote } from '@kealee/ui/components/intake/mobile-capture-voice-note'
import { CheckCircle2, Loader2, Mic, Camera, List, AlertTriangle } from 'lucide-react'

interface ZoneMeta {
  zone: string
  displayName: string
  prompt: string
  hvacPrompt: string | null
  isRequired: boolean
  isCompleted: boolean
  assetCount: number
}

interface CaptureSession {
  id: string
  address: string
  project_path: string
  status: string
  completed_zones: string[]
  required_zones: string[]
  progress_percent: number
  uploaded_assets_count: number
  voice_notes_count: number
}

type MobileView = 'checklist' | 'camera' | 'voice'

export default function MobileCapturePage() {
  const params = useParams()
  const captureSessionToken = params.captureSessionToken as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<CaptureSession | null>(null)
  const [zones, setZones] = useState<ZoneMeta[]>([])
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [view, setView] = useState<MobileView>('checklist')
  const [completing, setCompleting] = useState(false)
  const [completed, setCompleted] = useState(false)

  const loadSession = useCallback(async () => {
    try {
      const resp = await fetch(`/api/capture/session/start?token=${captureSessionToken}`)
      if (!resp.ok) {
        const { error: err } = await resp.json()
        setError(err ?? 'Invalid or expired capture link')
        return
      }
      const { session: s, zonesMeta } = await resp.json()
      setSession(s)
      setZones(zonesMeta)
      if (s.status === 'completed') setCompleted(true)
    } catch {
      setError('Failed to load capture session')
    } finally {
      setLoading(false)
    }
  }, [captureSessionToken])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  function handleSelectZone(zone: string) {
    setSelectedZone(zone)
    setView('camera')
  }

  function handleAssetUploaded() {
    // Refresh session data
    loadSession()
  }

  function handleVoiceNoteRecorded() {
    loadSession()
  }

  async function handleCompleteSession() {
    if (!session) return
    setCompleting(true)
    try {
      const resp = await fetch('/api/capture/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          captureToken: captureSessionToken,
          captureSessionId: session.id,
        }),
      })
      if (!resp.ok) {
        const { error: err } = await resp.json()
        setError(err ?? 'Failed to complete session')
        return
      }
      setCompleted(true)
    } catch {
      setError('Network error — please try again')
    } finally {
      setCompleting(false)
    }
  }

  const selectedZoneMeta = zones.find((z) => z.zone === selectedZone)
  const requiredComplete = zones.filter((z) => z.isRequired && z.isCompleted).length
  const requiredTotal = zones.filter((z) => z.isRequired).length

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#E8793A' }} />
      </div>
    )
  }

  // ─── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-red-400" />
        <h1 className="mb-2 text-xl font-bold text-gray-800">Unable to load capture</h1>
        <p className="text-gray-500">{error}</p>
      </div>
    )
  }

  // ─── Completed ─────────────────────────────────────────────────────────────
  if (completed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 text-center">
        <CheckCircle2 className="mb-4 h-16 w-16" style={{ color: '#16A34A' }} />
        <h1 className="mb-2 text-2xl font-bold" style={{ color: '#1A2B4A' }}>
          Capture Complete!
        </h1>
        <p className="mb-2 text-gray-500">
          All done. Your photos and voice notes have been uploaded.
        </p>
        <p className="text-sm text-gray-400">
          You can close this tab. Your team is reviewing the capture.
        </p>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: '#1A2B4A' }}
      >
        <div>
          <p className="text-xs text-blue-200">Kealee Capture</p>
          <p className="text-sm font-semibold text-white truncate max-w-[180px]">
            {session.address}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-blue-200">{requiredComplete}/{requiredTotal}</span>
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-blue-900">
            <div
              className="h-full rounded-full"
              style={{
                width: `${requiredTotal > 0 ? (requiredComplete / requiredTotal) * 100 : 0}%`,
                backgroundColor: '#E8793A',
              }}
            />
          </div>
        </div>
      </div>

      {/* Tab bar (when zone selected) */}
      {selectedZone && (
        <div className="flex border-b border-gray-200 bg-white">
          <TabBtn active={view === 'checklist'} onClick={() => setView('checklist')} label="Zones" icon={<List className="h-4 w-4" />} />
          <TabBtn active={view === 'camera'} onClick={() => setView('camera')} label="Camera" icon={<Camera className="h-4 w-4" />} />
          <TabBtn active={view === 'voice'} onClick={() => setView('voice')} label="Voice" icon={<Mic className="h-4 w-4" />} />
        </div>
      )}

      {/* Content */}
      <div className="px-4 pt-4">
        {view === 'checklist' && (
          <>
            <MobileCaptureChecklist
              zones={zones}
              currentZone={selectedZone ?? undefined}
              onSelectZone={handleSelectZone}
            />

            {/* Complete session CTA */}
            {requiredComplete === requiredTotal && requiredTotal > 0 && (
              <div className="pb-8">
                <button
                  onClick={handleCompleteSession}
                  disabled={completing}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: '#16A34A' }}
                >
                  {completing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5" />
                  )}
                  {completing ? 'Completing…' : 'Complete Capture Session'}
                </button>
              </div>
            )}
          </>
        )}

        {view === 'camera' && selectedZoneMeta && (
          <MobileCaptureCamera
            captureSessionId={session.id}
            captureToken={captureSessionToken}
            zone={selectedZoneMeta.zone}
            zoneName={selectedZoneMeta.displayName}
            prompt={selectedZoneMeta.prompt}
            hvacPrompt={selectedZoneMeta.hvacPrompt ?? undefined}
            existingAssetCount={selectedZoneMeta.assetCount}
            onUploaded={handleAssetUploaded}
          />
        )}

        {view === 'voice' && selectedZoneMeta && (
          <MobileCaptureVoiceNote
            captureSessionId={session.id}
            captureToken={captureSessionToken}
            zone={selectedZoneMeta.zone}
            onRecorded={handleVoiceNoteRecorded}
          />
        )}
      </div>
    </div>
  )
}

function TabBtn({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors"
      style={active ? { color: '#E8793A', borderBottom: '2px solid #E8793A' } : { color: '#6B7280' }}
    >
      {icon}
      {label}
    </button>
  )
}
