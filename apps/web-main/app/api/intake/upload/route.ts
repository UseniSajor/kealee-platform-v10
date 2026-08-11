import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
  'video/mp4', 'video/quicktime', 'video/mov',
  'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg',
  'application/pdf',
  'application/json', 'application/geo+json', 'application/zip',
  'application/vnd.google-earth.kml+xml', 'application/dxf',
])

const ALLOWED_DOCUMENT_EXTENSIONS = new Set([
  'dwg', 'dxf', 'docx', 'geojson', 'json', 'kml', 'kmz', 'landxml', 'shp', 'zip',
])

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    if (files.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 files allowed' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const uploadedUrls: string[] = []
    const rejectedFiles: Array<{ name: string; reason: string }> = []

    for (const file of files) {
      const lowerName = file.name.toLowerCase()
      const extension = lowerName.split('.').pop() ?? ''
      const allowedByExtension = ALLOWED_DOCUMENT_EXTENSIONS.has(extension)
      if (!ALLOWED_TYPES.has(file.type) && !allowedByExtension) {
        rejectedFiles.push({ name: file.name, reason: `Unsupported file type: ${file.type || extension || 'unknown'}` })
        console.warn('[intake/upload] Rejected unsupported file', { name: file.name, type: file.type, extension })
        continue
      }

      if (file.size > MAX_FILE_SIZE) {
        rejectedFiles.push({ name: file.name, reason: 'File exceeds the 50 MB upload limit' })
        console.warn('[intake/upload] Rejected oversized file', { name: file.name, size: file.size })
        continue
      }

      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
      const path = `intake-uploads/${randomUUID()}.${ext}`
      const buffer = Buffer.from(await file.arrayBuffer())

      const { error } = await supabase.storage
        .from('concept-uploads')
        .upload(path, buffer, {
          contentType: file.type,
          upsert: false,
        })

      if (error) {
        console.error('[intake/upload] Storage upload failed:', error.message)
        rejectedFiles.push({ name: file.name, reason: error.message })
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from('concept-uploads')
        .getPublicUrl(path)

      uploadedUrls.push(publicUrl)
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json({ error: rejectedFiles[0]?.reason ?? 'No files were uploaded', rejectedFiles }, { status: 400 })
    }
    return NextResponse.json({ urls: uploadedUrls, rejectedFiles })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Upload failed'
    console.error('[intake/upload] Error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
