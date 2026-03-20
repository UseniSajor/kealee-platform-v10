import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import {
  isTokenExpired,
  buildCompletenessReport,
  buildDigitalTwinRecord,
  deriveSpatialNodes,
  deriveSystemNodes,
  deriveObservations,
  generateCaptureId,
  buildChannelName,
  CAPTURE_EVENTS,
  normalizeCaptureSession,
  normalizeAsset,
} from '@kealee/intake'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { captureToken, captureSessionId } = body

    if (!captureToken || !captureSessionId) {
      return NextResponse.json({ error: 'captureToken and captureSessionId required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data: rawSession, error: sessionErr } = await supabase
      .from('capture_sessions')
      .select('*')
      .eq('id', captureSessionId)
      .eq('capture_token', captureToken)
      .single()

    if (sessionErr || !rawSession) {
      return NextResponse.json({ error: 'Invalid capture session' }, { status: 401 })
    }
    if (isTokenExpired(rawSession.token_expires_at)) {
      return NextResponse.json({ error: 'Capture link expired' }, { status: 401 })
    }
    if (rawSession.status === 'completed') {
      return NextResponse.json({ ok: true, alreadyCompleted: true })
    }

    const session = normalizeCaptureSession(rawSession)

    // Fetch all assets
    const { data: rawAssets } = await supabase
      .from('capture_assets')
      .select('*')
      .eq('capture_session_id', captureSessionId)

    const assets = (rawAssets ?? []).map(normalizeAsset)

    // Build completeness report
    const { data: rawVoiceNotes } = await supabase
      .from('capture_voice_notes')
      .select('id')
      .eq('capture_session_id', captureSessionId)
    const voiceNotesCount = (rawVoiceNotes ?? []).length
    const report = buildCompletenessReport(session, assets, voiceNotesCount)

    // Mark session complete
    await supabase
      .from('capture_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        progress_percent: report.progressPercent,
        completed_zones: report.completedZones,
        uploaded_assets_count: report.totalAssets,
        voice_notes_count: voiceNotesCount,
      })
      .eq('id', captureSessionId)

    // Create or update digital twin
    let twinId: string | null = null

    // Check if project already has a twin
    if (session.project_id) {
      const { data: existingTwin } = await supabase
        .from('property_twins')
        .select('id, source_capture_session_ids')
        .eq('project_id', session.project_id)
        .single()

      if (existingTwin) {
        twinId = existingTwin.id
        const existingIds: string[] = existingTwin.source_capture_session_ids ?? []
        if (!existingIds.includes(captureSessionId)) {
          await supabase
            .from('property_twins')
            .update({
              source_capture_session_ids: [...existingIds, captureSessionId],
              updated_at: new Date().toISOString(),
            })
            .eq('id', twinId)
        }
      }
    }

    if (!twinId) {
      // Create new twin
      const twinRecord = buildDigitalTwinRecord({
        project_id: session.project_id ?? undefined,
        address: session.address,
        creation_path: 'mobile_capture',
        source_capture_session_ids: [captureSessionId],
      })
      twinId = twinRecord.id

      const { error: twinErr } = await supabase.from('property_twins').insert(twinRecord)
      if (twinErr) {
        console.error('[capture/complete] twin insert error', twinErr)
      }
    }

    // Derive and insert spatial/system nodes + observations
    const spatialNodes = deriveSpatialNodes(twinId, assets)
    const systemNodes = deriveSystemNodes(twinId, assets)

    if (spatialNodes.length > 0) {
      await supabase.from('property_twin_spatial_nodes').upsert(spatialNodes, { onConflict: 'node_key' })
    }
    if (systemNodes.length > 0) {
      await supabase.from('property_twin_system_nodes').upsert(systemNodes, { onConflict: 'system_key' })
    }

    const observations = deriveObservations(twinId, assets, spatialNodes, systemNodes)
    if (observations.length > 0) {
      await supabase.from('property_twin_observations').insert(observations)
    }

    // Broadcast completion
    const channelName = buildChannelName(captureSessionId)
    await supabase.channel(channelName).send({
      type: 'broadcast',
      event: CAPTURE_EVENTS.SESSION_COMPLETED,
      payload: {
        captureSessionId,
        twinId,
        completedZones: report.completedZones,
        progressPercent: report.progressPercent,
        totalAssets: report.totalAssets,
      },
    })

    return NextResponse.json({
      ok: true,
      twinId,
      report: {
        progressPercent: report.progressPercent,
        completedZones: report.completedZones,
        missingRequired: report.missingRequired,
        totalAssets: report.totalAssets,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
