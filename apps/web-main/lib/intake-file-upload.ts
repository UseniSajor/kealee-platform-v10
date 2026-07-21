export type IntakeUploadedKind = 'image' | 'video' | 'document'

export type IntakeUploadedFile = { name: string; url: string; type: IntakeUploadedKind }

export function classifyIntakeFileType(file: File): IntakeUploadedKind {
  if (file.type.startsWith('video/')) return 'video'
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) return 'document'
  if (file.type.startsWith('image/')) return 'image'
  return 'document'
}

/** Upload one file per request so each response URL maps to the correct file. */
export async function uploadIntakeFilesSequentially(files: File[]): Promise<IntakeUploadedFile[]> {
  const results: IntakeUploadedFile[] = []
  for (const f of files) {
    const body = new FormData()
    body.append('files', f)
    const res = await fetch('/api/intake/upload', { method: 'POST', body })
    if (!res.ok) continue
    const data = (await res.json()) as { urls?: string[] }
    const url = data.urls?.[0]
    if (url) results.push({ name: f.name, url, type: classifyIntakeFileType(f) })
  }
  return results
}
