'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { MobileCaptureChecklist } from '@kealee/ui/components/intake/mobile-capture-checklist'
import { MobileCaptureCamera } from '@kealee/ui/components/intake/mobile-capture-camera'
import { MobileCaptureVoiceNote } from '@kealee/ui/components/intake/mobile-capture-voice-note'
import { MobileCaptureVideo } from '@kealee/ui/components/intake/mobile-capture-video'
import { MobileScanStep } from '@kealee/ui/components/intake/mobile-scan-step'
import { ArrowLeft, CheckCircle2, Loader2, Mic, Camera, List, Scan, AlertTriangle } from 'lucide-react'

interface ZoneMeta {
  zone: string
  displayName: string
  prompt: string
  hvacPrompt: string | null
  allowsVideo: boolean
  videoPrompt: string | null
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
  capture_mode: 'standard' | 'enhanced_scan'
  scan_enabled: boolean
  scan_completed: boolean
}

type MobileView = 'checklist' | 'camera' | 'voice' | 'video' | 'scan'

export default function MobileCapturePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const captureSessionToken = params.captureSessionToken as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<CaptureSession | null>(null)
  const [zones, setZones] = useState<ZoneMeta[]>([])
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [view, setView] = useState<MobileView>('checklist')
  const [completing, setCompleting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [showScanStep, setShowScanStep] = useState(false)
  const [scanDone, setScanDone] = useState(false)
  const [uploadSaved, setUploadSaved] = useState(false)

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
      if (s.scan_completed) setScanDone(true)
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
    setUploadSaved(true)
    loadSession()
  }

  function handleVoiceNoteRecorded() {
    loadSession()
  }

  async function markScanCompleted() {
    if (!session) return
    try {
      await fetch('/api/capture/asset', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          captureToken: captureSessionToken,
          captureSessionId: session.id,
          action: 'mark_scan_completed',
        }),
      })
      setScanDone(true)
    } catch {}
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

  function handleScanCompleted() {
    markScanCompleted()
    setView('checklist')
    setShowScanStep(false)
  }

  const selectedZoneMeta = zones.find((z) => z.zone === selectedZone)
  const requiredComplete = zones.filter((z) => z.isRequired && z.isCompleted).length
  const requiredTotal = zones.filter((z) => z.isRequired).length
  const allRequiredDone = requiredComplete === requiredTotal && requiredTotal > 0
  const needsScan = session?.scan_enabled && !scanDone
  const canComplete = allRequiredDone && !needsScan
  const requestedReturnPath = searchParams.get('returnTo')
  const safeReturnPath = requestedReturnPath?.startsWith('/') && !requestedReturnPath.startsWith('//')
    ? requestedReturnPath
    : `/intake/${session?.project_path ?? 'kitchen_remodel'}`
  const returnToIntake = () => {
    if (!session) return
    const separator = safeReturnPath.includes('?') ? '&' : '?'
    window.location.assign(
      `${safeReturnPath}${separator}captureSessionId=${encodeURIComponent(session.id)}&captureToken=${encodeURIComponent(captureSessionToken)}`,
    )
  }

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
        <p className="mb-1 text-gray-500">
          All done. Your photos and voice notes have been uploaded.
        </p>
        {session?.capture_mode === 'enhanced_scan' && scanDone && (
          <p className="text-sm text-indigo-600 font-medium">
            ✨ 3D scan included — floor plan will be generated automatically.
          </p>
        )}
        <p className="mt-2 text-sm text-gray-400">
          You can close this tab. Your team is reviewing the capture.
        </p>
        <button
          type="button"
          onClick={returnToIntake}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1A2B4A] px-5 py-3 text-sm font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Return to intake
        </button>
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
        <button
          type="button"
          onClick={returnToIntake}
          className="flex items-center gap-2 text-left"
          aria-label="Return to intake"
        >
          <ArrowLeft className="h-4 w-4 text-blue-200" />
          <div>
          <p className="text-xs text-blue-200">Kealee Capture</p>
          <p className="text-sm font-semibold text-white truncate max-w-[180px]">
            {session.address}
          </p>
          </div>
        </button>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-blue-200">{requiredComplete}/{requiredTotal}</span>
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-blue-900">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${requiredTotal > 0 ? (requiredComplete / requiredTotal) * 100 : 0}%`,
                backgroundColor: '#E8793A',
              }}
            />
          </div>
        </div>
      </div>

      {/* Tab bar (when zone selected or scan view) */}
      {(selectedZone || showScanStep) && (
        <div className="flex border-b border-gray-200 bg-white">
          <TabBtn active={view === 'checklist'} onClick={() => { setView('checklist'); setShowScanStep(false) }} label="Zones" icon={<List className="h-4 w-4" />} />
          {selectedZone && (
            <>
              <TabBtn active={view === 'camera'} onClick={() => setView('camera')} label="Camera" icon={<Camera className="h-4 w-4" />} />
              <TabBtn active={view === 'voice'} onClick={() => setView('voice')} label="Voice" icon={<Mic className="h-4 w-4" />} />
              {selectedZoneMeta?.allowsVideo && (
                <TabBtn active={view === 'video'} onClick={() => setView('video')} label="Video" icon={<Camera className="h-4 w-4" />} />
              )}
            </>
          )}
          {session.scan_enabled && (
            <TabBtn
              active={view === 'scan'}
              onClick={() => { setView('scan'); setShowScanStep(true) }}
              label="3D Scan"
              icon={<Scan className="h-4 w-4" />}
              highlight={!scanDone && allRequiredDone}
            />
          )}
        </div>
      )}

      {/* Content */}
      <div className="px-4 pt-4">
        {uploadSaved && (
          <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-900">Saved to your project</p>
                <p className="mt-1 text-xs text-green-700">Your photo or video was uploaded. Capture another item or return to the intake on this device.</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => { setUploadSaved(false); setView('checklist') }} className="rounded-xl border border-green-300 bg-white px-3 py-2 text-xs font-semibold text-green-800">
                Capture more
              </button>
              <button type="button" onClick={returnToIntake} className="rounded-xl bg-[#1A2B4A] px-3 py-2 text-xs font-semibold text-white">
                Return to intake
              </button>
            </div>
          </div>
        )}
        {view === 'checklist' && (
          <>
            <MobileCaptureChecklist
              zones={zones}
              currentZone={selectedZone ?? undefined}
              onSelectZone={handleSelectZone}
            />

            {/* Enhanced scan CTA — appears after all required zones done */}
            {session.scan_enabled && allRequiredDone && !scanDone && (
              <div
                className="mt-4 rounded-2xl px-4 py-4"
                style={{ backgroundColor: '#EEF2FF' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Scan className="h-5 w-5" style={{ color: '#4F46E5' }} />
                  <span className="text-sm font-semibold" style={{ color: '#3730A3' }}>
                    3D Scan Step
                  </span>
                </div>
                <p className="text-xs text-indigo-700 mb-3">
                  All zones captured! Complete your 3D room scan to finish enhanced capture.
                </p>
                <button
                  onClick={() => { setView('scan'); setShowScanStep(true) }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white"
                  style={{ backgroundColor: '#4F46E5' }}
                >
                  <Scan className="h-4 w-4" /> Start 3D Scan
                </button>
              </div>
            )}

            {/* Complete CTA */}
            {canComplete && (
              <div className="mt-4 pb-8">
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

        {view === 'video' && selectedZoneMeta?.allowsVideo && (
          <MobileCaptureVideo
            captureSessionId={session.id}
            captureToken={captureSessionToken}
            zone={selectedZoneMeta.zone}
            zoneName={selectedZoneMeta.displayName}
            prompt={selectedZoneMeta.videoPrompt ?? selectedZoneMeta.prompt}
            onUploaded={handleAssetUploaded}
          />
        )}

        {view === 'scan' && (
          <MobileScanStep
            captureSessionId={session.id}
            captureToken={captureSessionToken}
            onScanCompleted={handleScanCompleted}
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
  highlight = false,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon: React.ReactNode
  highlight?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors"
      style={active ? { color: '#E8793A', borderBottom: '2px solid #E8793A' } : { color: '#6B7280' }}
    >
      {icon}
      {label}
      {highlight && !active && (
        <span className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-indigo-500" />
      )}
    </button>
  )
}
