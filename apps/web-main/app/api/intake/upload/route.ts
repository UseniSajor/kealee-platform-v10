import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { randomUUID } from 'crypto'

const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
  'video/mp4', 'video/quicktime', 'video/mov',
  'application/pdf',
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

    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) {
        continue // skip unsupported types silently
      }

      if (file.size > MAX_FILE_SIZE) {
        continue // skip oversized files silently
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
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from('concept-uploads')
        .getPublicUrl(path)

      uploadedUrls.push(publicUrl)
    }

    return NextResponse.json({ urls: uploadedUrls })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Upload failed'
    console.error('[intake/upload] Error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
