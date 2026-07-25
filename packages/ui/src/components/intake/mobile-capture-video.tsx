'use client'

import { useRef, useState } from 'react'
import { CheckCircle, Film, Loader2, X } from 'lucide-react'

interface MobileCaptureVideoProps {
  captureSessionId: string
  captureToken: string
  zone: string
  zoneName: string
  prompt: string
  onUploaded: (assetId: string) => void
}

/** Guided, browser-native walkthrough video capture for an intake zone. */
export function MobileCaptureVideo({ captureSessionId, captureToken, zone, zoneName, prompt, onUploaded }: MobileCaptureVideoProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('captureToken', captureToken)
      form.append('zone', zone)
      form.append('type', 'walkthrough_video')
      const upload = await fetch('/api/capture/upload-file', { method: 'POST', body: form })
      if (!upload.ok) throw new Error('Video upload failed')
      const { storageUrl, storagePath } = await upload.json() as { storageUrl: string; storagePath: string }
      const register = await fetch('/api/capture/asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captureToken, captureSessionId, zone, storageUrl, storagePath, mimeType: file.type, fileSizeBytes: file.size }),
      })
      if (!register.ok) throw new Error('Video registration failed')
      const { assetId } = await register.json() as { assetId: string }
      setUploaded(true)
      onUploaded(assetId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="rounded-xl bg-[#1A2B4A] px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-blue-200">Walkthrough video</p>
        <p className="mt-0.5 text-lg font-bold text-white">{zoneName}</p>
      </div>
      <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">How to move</p>
        <p className="text-sm leading-relaxed text-indigo-900">{prompt} Walk slowly, keep the phone level, and narrate anything important. A 30–90 second walkthrough is enough.</p>
      </div>
      {uploaded && <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700"><CheckCircle className="h-4 w-4" /> Walkthrough uploaded</div>}
      {error && <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"><X className="mt-0.5 h-4 w-4" />{error}</div>}
      <input ref={inputRef} type="file" accept="video/*" capture="environment" onChange={e => { const file = e.target.files?.[0]; if (file) void handleFile(file) }} className="hidden" />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-indigo-600 py-8 text-white disabled:opacity-50">
        {uploading ? <><Loader2 className="h-10 w-10 animate-spin" /><span className="text-base font-semibold">Uploading…</span></> : <><Film className="h-10 w-10" /><span className="text-base font-semibold">Record walkthrough video</span></>}
      </button>
    </div>
  )
}
