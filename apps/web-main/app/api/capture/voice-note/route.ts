import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { generateVoiceNoteId, isTokenExpired, buildChannelName, CAPTURE_EVENTS } from '@kealee/intake'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { captureToken, captureSessionId, zone, storageUrl, storagePath, durationSeconds } = body

    if (!captureToken || !captureSessionId || !zone || !storageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data: session, error: sessionErr } = await supabase
      .from('capture_sessions')
      .select('*')
      .eq('id', captureSessionId)
      .eq('capture_token', captureToken)
      .single()

    if (sessionErr || !session) {
      return NextResponse.json({ error: 'Invalid capture session' }, { status: 401 })
    }
    if (isTokenExpired(session.token_expires_at)) {
      return NextResponse.json({ error: 'Capture link expired' }, { status: 401 })
    }

    const voiceNoteId = generateVoiceNoteId()
    const { error: insertErr } = await supabase.from('capture_voice_notes').insert({
      id: voiceNoteId,
      capture_session_id: captureSessionId,
      zone,
      storage_url: storageUrl,
      storage_path: storagePath ?? null,
      duration_seconds: durationSeconds ?? null,
      transcription_status: 'pending',
    })

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    // Increment voice_notes_count
    const newCount = (session.voice_notes_count ?? 0) + 1
    await supabase
      .from('capture_sessions')
      .update({ voice_notes_count: newCount })
      .eq('id', captureSessionId)

    // Broadcast progress
    const channelName = buildChannelName(captureSessionId)
    await supabase.channel(channelName).send({
      type: 'broadcast',
      event: CAPTURE_EVENTS.VOICE_NOTE_UPLOADED,
      payload: {
        captureSessionId,
        zone,
        voiceNoteId,
        voiceNotesCount: newCount,
      },
    })

    await supabase.channel(channelName).send({
      type: 'broadcast',
      event: CAPTURE_EVENTS.SESSION_PROGRESS,
      payload: {
        captureSessionId,
        currentZone: zone,
        completedZones: session.completed_zones,
        requiredZones: session.required_zones,
        progressPercent: session.progress_percent,
        uploadedAssetsCount: session.uploaded_assets_count,
        voiceNotesCount: newCount,
        walkthroughVideoUploaded: session.walkthrough_video_uploaded,
        status: session.status,
      },
    })

    return NextResponse.json({ voiceNoteId })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
