'use client'

import { useState, useRef } from 'react'
import { Camera, X, CheckCircle, Loader2, Image, RotateCcw } from 'lucide-react'

interface MobileCaptureCameraProps {
  captureSessionId: string
  captureToken: string
  zone: string
  zoneName: string
  prompt: string
  hvacPrompt?: string
  existingAssetCount: number
  onUploaded: (assetId: string) => void
}

export function MobileCaptureCamera({
  captureSessionId,
  captureToken,
  zone,
  zoneName,
  prompt,
  hvacPrompt,
  existingAssetCount,
  onUploaded,
}: MobileCaptureCameraProps) {
  const [uploading, setUploading] = useState(false)
  const [lastUploaded, setLastUploaded] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setUploading(true)
    setError(null)
    try {
      // Step 1: Upload file to Supabase storage
      const uploadForm = new FormData()
      uploadForm.append('file', file)
      uploadForm.append('captureToken', captureToken)
      uploadForm.append('zone', zone)

      const uploadResp = await fetch('/api/capture/upload-file', {
        method: 'POST',
        body: uploadForm,
      })
      if (!uploadResp.ok) {
        const { error: err } = await uploadResp.json()
        throw new Error(err ?? 'Upload failed')
      }
      const { storageUrl, storagePath } = await uploadResp.json() as {
        storageUrl: string
        storagePath: string
      }

      // Step 2: Register asset in DB + broadcast progress
      const assetResp = await fetch('/api/capture/asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          captureToken,
          captureSessionId,
          zone,
          storageUrl,
          storagePath,
          mimeType: file.type,
          fileSizeBytes: file.size,
        }),
      })
      if (!assetResp.ok) {
        const { error: err } = await assetResp.json()
        throw new Error(err ?? 'Asset registration failed')
      }
      const { assetId } = await assetResp.json() as { assetId: string }
      setLastUploaded(storageUrl)
      onUploaded(assetId)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset input so same file can be picked again
    e.target.value = ''
  }

  const displayPrompt = hvacPrompt ?? prompt

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Zone header */}
      <div
        className="rounded-xl px-4 py-3"
        style={{ backgroundColor: '#1A2B4A' }}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-blue-200">Current Zone</p>
        <p className="mt-0.5 text-lg font-bold text-white">{zoneName}</p>
      </div>

      {/* Prompt */}
      <div className="rounded-xl bg-amber-50 px-4 py-3 border border-amber-100">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 mb-1">
          What to capture
        </p>
        <p className="text-sm text-amber-800 leading-relaxed">{displayPrompt}</p>
      </div>

      {/* Existing asset count */}
      {existingAssetCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 text-green-500" />
          {existingAssetCount} photo{existingAssetCount !== 1 ? 's' : ''} uploaded for this zone
        </div>
      )}

      {/* Last uploaded preview */}
      {lastUploaded && (
        <div className="relative overflow-hidden rounded-xl border border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lastUploaded}
            alt="Last upload"
            className="h-48 w-full object-cover"
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-green-700 shadow">
            <CheckCircle className="h-3 w-3" />
            Uploaded
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          <X className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Camera button */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
      />

      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="flex flex-col items-center justify-center gap-3 rounded-2xl py-8 text-white transition-opacity active:opacity-80 disabled:opacity-50"
        style={{ backgroundColor: '#E8793A' }}
      >
        {uploading ? (
          <>
            <Loader2 className="h-10 w-10 animate-spin" />
            <span className="text-base font-semibold">Uploading…</span>
          </>
        ) : (
          <>
            <Camera className="h-10 w-10" />
            <span className="text-base font-semibold">Take Photo</span>
          </>
        )}
      </button>

      {/* Gallery pick alternative */}
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100">
        <Image className="h-4 w-4" />
        Choose from Gallery
        <input
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />
      </label>

      {existingAssetCount > 0 && (
        <button
          onClick={() => setLastUploaded(null)}
          className="flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-gray-600"
        >
          <RotateCcw className="h-3 w-3" />
          Clear preview
        </button>
      )}
    </div>
  )
}
