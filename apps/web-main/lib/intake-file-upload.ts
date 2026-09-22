import { resolveIntakeFileType } from './intake-file-types'

export type IntakeUploadedKind = 'image' | 'video' | 'document' | 'voice'

/**
 * `label` and `viewpoint` are what make a photograph usable as an "existing
 * condition" in the concept package: the package pairs each before-view with a
 * concept view from the same viewpoint, and it cannot do that from a filename.
 */
export type IntakeUploadedFile = { name: string; url: string; type: IntakeUploadedKind; label?: string; area?: string; viewpoint?: string }

/**
 * The largest file the platform accepts, everywhere.
 *
 * Set by the storage backend, not by preference: Supabase rejects anything
 * larger with EntityTooLarge (verified against the live project 2026-09-22).
 * Raising it means raising the project's storage limit first — a client-side
 * number above this only moves the failure later, after the customer has
 * waited through the upload.
 */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024
export const MAX_UPLOAD_LABEL = '50 MB'

export function classifyIntakeFileType(file: File): IntakeUploadedKind {
  const type = resolveIntakeFileType(file)
  if (type.startsWith('video/')) return 'video'
  if (type.startsWith('audio/')) return 'voice'
  if (type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) return 'document'
  if (type.startsWith('image/')) return 'image'
  return 'document'
}

/** Upload one file per request so each response URL maps to the correct file. */
export async function uploadIntakeFilesSequentially(
  files: File[],
  onError?: (message: string) => void,
): Promise<IntakeUploadedFile[]> {
  const results: IntakeUploadedFile[] = []
  for (const f of files) {
    try {
      if (f.size > MAX_UPLOAD_BYTES) throw new Error(`File exceeds the ${MAX_UPLOAD_LABEL} upload limit.`)
      const body = new FormData()
      const type = resolveIntakeFileType(f)
      body.append('files', type !== f.type ? new File([f], f.name, { type }) : f)
      const res = await fetch('/api/intake/upload', {
        method: 'POST', body, signal: AbortSignal.timeout(120_000),
      })
      const data = await res.json().catch(() => ({})) as { urls?: string[]; error?: string }
      if (!res.ok) throw new Error(data.error || `Upload failed (${res.status}). Please try again.`)
      const url = data.urls?.[0]
      if (!url) throw new Error('The upload did not return a file. Please try again.')
      results.push({ name: f.name, url, type: classifyIntakeFileType(f) })
    } catch (error) {
      const reason = error instanceof Error && error.name === 'TimeoutError'
        ? 'Upload timed out. Please try again.'
        : error instanceof Error ? error.message : 'Upload failed. Please try again.'
      const message = `${f.name}: ${reason}`
      console.error('[intake-file-upload]', message)
      onError?.(message)
    }
  }
  return results
}
