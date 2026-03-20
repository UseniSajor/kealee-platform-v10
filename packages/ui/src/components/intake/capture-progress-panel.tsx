'use client'

import { useEffect, useState, useRef } from 'react'
import { CheckCircle2, Clock, Image, Mic, Camera } from 'lucide-react'

interface CaptureProgressPayload {
  captureSessionId: string
  currentZone?: string
  completedZones: string[]
  requiredZones: string[]
  progressPercent: number
  uploadedAssetsCount: number
  voiceNotesCount: number
  walkthroughVideoUploaded: boolean
  status: string
}

interface CaptureProgressPanelProps {
  captureSessionId: string
  requiredZones: string[]
  onComplete?: (payload: CaptureProgressPayload) => void
}

export function CaptureProgressPanel({
  captureSessionId,
  requiredZones,
  onComplete,
}: CaptureProgressPanelProps) {
  const [progress, setProgress] = useState<CaptureProgressPayload>({
    captureSessionId,
    completedZones: [],
    requiredZones,
    progressPercent: 0,
    uploadedAssetsCount: 0,
    voiceNotesCount: 0,
    walkthroughVideoUploaded: false,
    status: 'pending',
  })
  const [completed, setCompleted] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    async function poll() {
      try {
        const resp = await fetch(`/api/capture/progress?captureSessionId=${captureSessionId}`)
        if (!resp.ok) return
        const data = (await resp.json()) as CaptureProgressPayload
        setProgress(data)
        if (data.status === 'completed' && !completed) {
          setCompleted(true)
          onComplete?.(data)
          if (intervalRef.current) clearInterval(intervalRef.current)
        }
      } catch {
        // silent — keep polling
      }
    }

    poll()
    intervalRef.current = setInterval(poll, 5000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [captureSessionId, completed, onComplete])

  const pendingZones = requiredZones.filter((z) => !progress.completedZones.includes(z))
  const labelFor = (zone: string) =>
    zone.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: '#1A2B4A' }}>
          Capture Progress
        </h2>
        {completed ? (
          <span className="rounded-full px-3 py-1 text-xs font-medium bg-green-100 text-green-700">
            Complete
          </span>
        ) : (
          <span className="rounded-full px-3 py-1 text-xs font-medium bg-orange-50 text-orange-600 flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
            Live
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-gray-500">Overall progress</span>
          <span className="font-semibold" style={{ color: '#1A2B4A' }}>
            {progress.progressPercent}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress.progressPercent}%`, backgroundColor: '#E8793A' }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center rounded-xl bg-gray-50 p-3">
          <Image className="mb-1 h-4 w-4 text-gray-400" />
          <span className="text-xl font-bold" style={{ color: '#1A2B4A' }}>
            {progress.uploadedAssetsCount}
          </span>
          <span className="text-xs text-gray-500">Photos</span>
        </div>
        <div className="flex flex-col items-center rounded-xl bg-gray-50 p-3">
          <Mic className="mb-1 h-4 w-4 text-gray-400" />
          <span className="text-xl font-bold" style={{ color: '#1A2B4A' }}>
            {progress.voiceNotesCount}
          </span>
          <span className="text-xs text-gray-500">Voice Notes</span>
        </div>
        <div className="flex flex-col items-center rounded-xl bg-gray-50 p-3">
          <Camera className="mb-1 h-4 w-4 text-gray-400" />
          <span className="text-xl font-bold" style={{ color: '#1A2B4A' }}>
            {progress.walkthroughVideoUploaded ? '✓' : '–'}
          </span>
          <span className="text-xs text-gray-500">Walkthrough</span>
        </div>
      </div>

      {/* Current zone */}
      {progress.currentZone && !completed && (
        <div
          className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium"
          style={{ backgroundColor: '#FFF4ED', color: '#E8793A' }}
        >
          <Clock className="h-4 w-4" />
          Currently capturing: {labelFor(progress.currentZone)}
        </div>
      )}

      {/* Zone list */}
      <div className="space-y-1.5">
        {requiredZones.map((zone) => {
          const done = progress.completedZones.includes(zone)
          return (
            <div
              key={zone}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm"
              style={{
                backgroundColor: done ? '#F0FDF4' : '#FAFAFA',
                color: done ? '#166534' : '#6B7280',
              }}
            >
              <CheckCircle2
                className="h-4 w-4 flex-shrink-0"
                style={{ color: done ? '#16A34A' : '#D1D5DB' }}
              />
              {labelFor(zone)}
            </div>
          )
        })}
        {pendingZones.length === 0 && !completed && (
          <p className="pt-1 text-center text-xs text-gray-400">
            All zones captured — waiting for session completion…
          </p>
        )}
      </div>

      {completed && (
        <div
          className="mt-5 rounded-xl p-4 text-center"
          style={{ backgroundColor: '#F0FDF4' }}
        >
          <CheckCircle2 className="mx-auto mb-2 h-8 w-8" style={{ color: '#16A34A' }} />
          <p className="font-semibold" style={{ color: '#166534' }}>
            Capture complete!
          </p>
          <p className="mt-1 text-sm text-green-600">
            {progress.uploadedAssetsCount} photos · {progress.voiceNotesCount} voice notes
          </p>
        </div>
      )}
    </div>
  )
}
