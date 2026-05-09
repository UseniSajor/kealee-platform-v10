import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { isTokenExpired } from '@kealee/intake'

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
      return NextResponse.json({ error: uploadErr.message }, { status: 500 })
    }

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(storagePath)
    const storageUrl = publicData.publicUrl

    return NextResponse.json({ storageUrl, storagePath })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
