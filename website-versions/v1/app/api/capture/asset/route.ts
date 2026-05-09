import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import {
  generateAssetId,
  isTokenExpired,
  computeProgressPercent,
  buildChannelName,
  CAPTURE_EVENTS,
} from '@kealee/intake'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { captureToken, captureSessionId, zone, storageUrl, storagePath, mimeType, fileSizeBytes } = body

    if (!captureToken || !captureSessionId || !zone || !storageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Validate session
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

    // Insert asset record
    const assetId = generateAssetId()
    const { error: assetErr } = await supabase.from('capture_assets').insert({
      id: assetId,
      capture_session_id: captureSessionId,
      zone,
      storage_url: storageUrl,
      storage_path: storagePath ?? null,
      mime_type: mimeType ?? 'image/jpeg',
      file_size_bytes: fileSizeBytes ?? null,
      upload_status: 'complete',
    })

    if (assetErr) {
      return NextResponse.json({ error: assetErr.message }, { status: 500 })
    }

    // Recount assets and update completed_zones
    const { data: allAssets } = await supabase
      .from('capture_assets')
      .select('zone')
      .eq('capture_session_id', captureSessionId)

    const completedZonesSet = new Set<string>(
      (allAssets ?? []).map((a: { zone: string }) => a.zone),
    )
    const completedZones = Array.from(completedZonesSet)
    const progressPercent = computeProgressPercent(session.required_zones, completedZones)
    const newAssetCount = (allAssets ?? []).length

    await supabase
      .from('capture_sessions')
      .update({
        completed_zones: completedZones,
        progress_percent: progressPercent,
        uploaded_assets_count: newAssetCount,
        current_zone: zone,
        status: session.status === 'pending' ? 'in_progress' : session.status,
      })
      .eq('id', captureSessionId)

    // Broadcast progress via Supabase Realtime
    const channelName = buildChannelName(captureSessionId)
    await supabase.channel(channelName).send({
      type: 'broadcast',
      event: CAPTURE_EVENTS.ASSET_UPLOADED,
      payload: {
        captureSessionId,
        zone,
        assetId,
        completedZones,
        progressPercent,
        uploadedAssetsCount: newAssetCount,
        voiceNotesCount: session.voice_notes_count,
        walkthroughVideoUploaded: session.walkthrough_video_uploaded,
        status: session.status,
      },
    })

    // Also broadcast SESSION_PROGRESS
    await supabase.channel(channelName).send({
      type: 'broadcast',
      event: CAPTURE_EVENTS.SESSION_PROGRESS,
      payload: {
        captureSessionId,
        currentZone: zone,
        completedZones,
        requiredZones: session.required_zones,
        progressPercent,
        uploadedAssetsCount: newAssetCount,
        voiceNotesCount: session.voice_notes_count,
        walkthroughVideoUploaded: session.walkthrough_video_uploaded,
        status: session.status,
      },
    })

    return NextResponse.json({ assetId, progressPercent, completedZones })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// PATCH /api/capture/asset — special actions (e.g., mark_scan_completed)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { captureToken, captureSessionId, action } = body

    if (!captureToken || !captureSessionId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data: session, error: sessionErr } = await supabase
      .from('capture_sessions')
      .select('id, capture_token')
      .eq('id', captureSessionId)
      .eq('capture_token', captureToken)
      .single()

    if (sessionErr || !session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 403 })
    }

    if (action === 'mark_scan_completed') {
      const { error } = await supabase
        .from('capture_sessions')
        .update({ scan_completed: true, updated_at: new Date().toISOString() })
        .eq('id', captureSessionId)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
