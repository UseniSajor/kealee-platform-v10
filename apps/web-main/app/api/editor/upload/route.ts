/**
 * POST /api/editor/upload
 *
 * Accepts multipart form data with a file (photo, floor plan PDF, sketch).
 * Uploads to Supabase Storage, creates a PascalSceneUpload record,
 * then optionally queues AI vision analysis.
 *
 * SECURITY (audit 2026-05-09): the caller must be the owner of the parent
 * `pascal_scenes` row (or the row must be anonymous and the caller anonymous).
 *
 * FormData fields:
 *   file        — the binary file
 *   sceneId     — Pascal scene this upload belongs to
 *   uploadType  — PHOTO | FLOOR_PLAN | SKETCH | PDF | INSPIRATION
 *   analyzeNow  — 'true' to immediately trigger vision analysis
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, buildStorageUrl } from '@/lib/supabase-server'
import { authorizeEditorRequest, enforceOwnership } from '@/lib/editor-auth'
import { v4 as uuid } from 'uuid'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/heic',
  'application/pdf',
]

const MAX_SIZE_MB = 25

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeEditorRequest()
    if (!auth.ok) return auth.response

    const formData   = await req.formData()
    const file       = formData.get('file') as File | null
    const sceneId    = formData.get('sceneId') as string | null
    const uploadType = (formData.get('uploadType') as string | null) ?? 'PHOTO'
    const analyzeNow = formData.get('analyzeNow') === 'true'

    if (!file)    return NextResponse.json({ error: 'file is required' }, { status: 400 })
    if (!sceneId) return NextResponse.json({ error: 'sceneId is required' }, { status: 400 })

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `File type ${file.type} not allowed` }, { status: 400 })
    }

    const sizeMb = file.size / (1024 * 1024)
    if (sizeMb > MAX_SIZE_MB) {
      return NextResponse.json({ error: `File too large (max ${MAX_SIZE_MB} MB)` }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data: scene, error: sceneErr } = await supabase
      .from('pascal_scenes')
      .select('user_id')
      .eq('id', sceneId)
      .single()

    if (sceneErr || !scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 })
    }

    const ownershipBlock = enforceOwnership(auth, scene.user_id)
    if (ownershipBlock) return ownershipBlock

    const ext = file.name.split('.').pop() ?? 'jpg'
    const storagePath = `pascal-uploads/${sceneId}/${uuid()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('kealee-assets')
      .upload(storagePath, await file.arrayBuffer(), {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) throw uploadError

    const fileUrl = buildStorageUrl('kealee-assets', storagePath)

    const { data: uploadRecord, error: dbError } = await supabase
      .from('pascal_scene_uploads')
      .insert({
        scene_id:    sceneId,
        upload_type: uploadType.toUpperCase(),
        file_name:   file.name,
        file_url:    fileUrl,
        file_size_mb: Math.round(sizeMb * 100) / 100,
        mime_type:   file.type,
        vision_status: analyzeNow ? 'pending' : null,
      })
      .select()
      .single()

    if (dbError) throw dbError

    if (analyzeNow) {
      // Forward the auth cookie so the vision route's own auth check passes.
      const cookie = req.headers.get('cookie') ?? ''
      fetch(`${req.nextUrl.origin}/api/editor/vision`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', cookie },
        body:    JSON.stringify({ uploadId: uploadRecord.id, sceneId, fileUrl }),
      }).catch(err => console.error('[upload] vision trigger failed:', err))
    }

    return NextResponse.json({ upload: uploadRecord, fileUrl }, { status: 201 })
  } catch (err) {
    console.error('[editor/upload POST]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
