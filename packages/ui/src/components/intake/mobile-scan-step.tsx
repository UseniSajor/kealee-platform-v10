'use client'

import { useState, useRef } from 'react'
import { Scan, Video, CheckCircle2, Loader2, AlertCircle, RefreshCw } from 'lucide-react'

interface MobileScanStepProps {
  captureSessionId: string
  captureToken: string
  onScanCompleted: () => void
}

type ScanState = 'idle' | 'recording' | 'uploading' | 'done' | 'error'

export function MobileScanStep({
  captureSessionId,
  captureToken,
  onScanCompleted,
}: MobileScanStepProps) {
  const [state, setState] = useState<ScanState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  async function startScan() {
    setErrorMsg(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      chunksRef.current = []

      const mimeType = MediaRecorder.isTypeSupported('video/mp4')
        ? 'video/mp4'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        if (timerRef.current) clearInterval(timerRef.current)
        const blob = new Blob(chunksRef.current, { type: mimeType })
        await uploadScan(blob, mimeType)
      }

      recorder.start(500)
      setState('recording')

      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
    } catch {
      setErrorMsg('Could not access camera. Please allow camera permission and try again.')
      setState('error')
    }
  }

  function stopScan() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setState('uploading')
    }
  }

  async function uploadScan(blob: Blob, mimeType: string) {
    try {
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
      const filename = `scan_${Date.now()}.${ext}`

      const form = new FormData()
      form.append('file', blob, filename)
      form.append('captureToken', captureToken)
      form.append('zone', 'scan_room')
      form.append('areaType', 'interior')

      const uploadRes = await fetch('/api/capture/upload-file', { method: 'POST', body: form })
      if (!uploadRes.ok) throw new Error('Upload failed')
      const { storageUrl, storagePath } = await uploadRes.json()

      const assetRes = await fetch('/api/capture/asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          captureToken,
          captureSessionId: captureSessionId,
          capture_zone: 'scan_room',
          capture_area_type: 'interior',
          asset_type: 'video',
          file_url: storageUrl,
          file_path: storagePath,
          file_name: filename,
          mime_type: mimeType,
          is_scan_generated: true,
        }),
      })
      if (!assetRes.ok) throw new Error('Asset registration failed')

      setState('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed')
      setState('error')
    }
  }

  function handleDone() {
    onScanCompleted()
  }

  function reset() {
    setState('idle')
    setErrorMsg(null)
    setElapsed(0)
    chunksRef.current = []
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  if (state === 'done') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
        <CheckCircle2 className="h-16 w-16" style={{ color: '#16A34A' }} />
        <div>
          <h3 className="text-lg font-bold" style={{ color: '#1A2B4A' }}>
            Scan Captured!
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Your 3D scan data has been uploaded. AI will process room boundaries.
          </p>
        </div>
        <button
          onClick={handleDone}
          className="rounded-2xl px-6 py-3 text-sm font-semibold text-white"
          style={{ backgroundColor: '#E8793A' }}
        >
          Continue
        </button>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-sm text-red-600">{errorMsg}</p>
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white"
          style={{ backgroundColor: '#1A2B4A' }}
        >
          <RefreshCw className="h-4 w-4" /> Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div
          className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ backgroundColor: '#EEF2FF' }}
        >
          <Scan className="h-7 w-7" style={{ color: '#4F46E5' }} />
        </div>
        <h3 className="text-lg font-bold" style={{ color: '#1A2B4A' }}>
          3D Room Scan
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Record a slow walkthrough of the room. LiDAR or video-based capture will build a spatial model.
        </p>
      </div>

      {/* Instructions */}
      <div className="rounded-xl bg-indigo-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 mb-2">
          Instructions
        </p>
        <ol className="space-y-1.5 text-sm text-indigo-800">
          <li>1. Tap <strong>Start Room Scan</strong> below</li>
          <li>2. Move slowly around the room with your phone</li>
          <li>3. Cover all walls, ceiling, and floor</li>
          <li>4. Tap <strong>Stop Scan</strong> when complete</li>
        </ol>
      </div>

      {/* Device note */}
      {typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && (
        <div className="rounded-xl bg-blue-50 px-4 py-2.5 text-xs text-blue-700">
          ✨ Your device supports LiDAR — scan will auto-capture depth data
        </div>
      )}
      {typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent) && (
        <div className="rounded-xl bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
          ⚠️ Video-based capture — move slowly for best accuracy
        </div>
      )}

      {/* State: recording */}
      {state === 'recording' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 rounded-xl bg-red-50 px-4 py-3">
            <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
            <span className="text-sm font-semibold text-red-700">
              Recording — {formatTime(elapsed)}
            </span>
          </div>
          <button
            onClick={stopScan}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-white"
            style={{ backgroundColor: '#DC2626' }}
          >
            Stop Scan
          </button>
        </div>
      ) : state === 'uploading' ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#E8793A' }} />
          <p className="text-sm text-gray-500">Uploading scan data…</p>
        </div>
      ) : (
        <button
          onClick={startScan}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-white"
          style={{ backgroundColor: '#4F46E5' }}
        >
          <Video className="h-5 w-5" />
          Start Room Scan
        </button>
      )}
    </div>
  )
}
