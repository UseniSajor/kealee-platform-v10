import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { isTokenExpired } from '@kealee/intake'

import { parseCapturePosition } from '@/lib/capture-position'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const captureToken = formData.get('captureToken') as string | null
    const zone = formData.get('zone') as string | null
    const type = (formData.get('type') as string | null) ?? 'photo'

    if (!file || !captureToken || !zone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Validate token
    const { data: session, error: sessionErr } = await supabase
      .from('capture_sessions')
      .select('id, token_expires_at, status')
      .eq('capture_token', captureToken)
      .single()

    if (sessionErr || !session) {
      return NextResponse.json({ error: 'Invalid capture token' }, { status: 401 })
    }
    if (isTokenExpired(session.token_expires_at)) {
      return NextResponse.json({ error: 'Capture link has expired' }, { status: 401 })
    }
    if (session.status === 'completed') {
      return NextResponse.json({ error: 'Capture session is already completed' }, { status: 400 })
    }

    // Build storage path
    const ext = file.name.split('.').pop() ?? (type === 'voice_note' ? 'webm' : 'jpg')
    const timestamp = Date.now()
    const storagePath = `captures/${session.id}/${zone}/${type}_${timestamp}.${ext}`
    const bucket = 'capture-assets'

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadErr } = await supabase.storage
      .from(bucket)
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadErr) {
      console.error('[capture/upload-file] Storage upload failed', { captureSessionId: session.id, zone, name: file.name, type: file.type, size: file.size, error: uploadErr.message })
      return NextResponse.json({ error: uploadErr.message }, { status: 500 })
    }

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(storagePath)
    const storageUrl = publicData.publicUrl

    // Position is optional — indoors, or permission denied, there is none, and
    // that is normal. What is rejected is a coordinate with no accuracy: it
    // looks usable and nothing downstream could tell that it is not.
    const { position, error: positionError } = parseCapturePosition(formData)
    if (positionError) {
      return NextResponse.json({ error: positionError }, { status: 400 })
    }

    console.info('[capture/upload-file] Upload saved', {
      captureSessionId: session.id, zone, type, size: file.size,
      positionGrade: position?.grade ?? 'none',
      accuracyMetres: position?.accuracyMetres ?? null,
    })
    return NextResponse.json({
      storageUrl,
      storagePath,
      position: position
        ? {
            latitude: position.latitude,
            longitude: position.longitude,
            accuracyMetres: position.accuracyMetres,
            grade: position.grade,
            permittedUses: position.permittedUses,
            prohibitedUses: position.prohibitedUses,
            rationale: position.rationale,
          }
        : null,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error'
    console.error('[capture/upload-file] Request failed', { error: msg })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
