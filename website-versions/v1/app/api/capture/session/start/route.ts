import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { isTokenExpired, normalizeCaptureSession, getZoneMeta } from '@kealee/intake'

// GET /api/capture/session/start?token=xxx
// Resolves a capture token → returns session + zone metadata
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'token required' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const { data: raw, error } = await supabase
    .from('capture_sessions')
    .select('*')
    .eq('capture_token', token)
    .single()

  if (error || !raw) {
    return NextResponse.json({ error: 'Invalid or expired capture link' }, { status: 404 })
  }

  if (isTokenExpired(raw.token_expires_at)) {
    return NextResponse.json({ error: 'This capture link has expired. Please request a new one.' }, { status: 410 })
  }

  const session = normalizeCaptureSession(raw)

  // Get existing assets for this session
  const { data: assetsRaw } = await supabase
    .from('capture_assets')
    .select('*')
    .eq('capture_session_id', session.id)

  const assets = assetsRaw ?? []

  // Build zone metadata for required zones
  const zonesMeta = session.required_zones.map((zone) => {
    const meta = getZoneMeta(zone)
    const zoneAssets = assets.filter((a: { zone: string }) => a.zone === zone)
    return {
      zone,
      displayName: meta?.displayName ?? zone,
      prompt: meta?.prompt ?? '',
      hvacPrompt: meta?.hvacPrompt ?? null,
      isRequired: true,
      isCompleted: session.completed_zones.includes(zone),
      assetCount: zoneAssets.length,
    }
  })

  // Mark session as in_progress if still pending
  if (raw.status === 'pending') {
    await supabase
      .from('capture_sessions')
      .update({ status: 'in_progress' })
      .eq('id', session.id)
    session.status = 'in_progress'
  }

  return NextResponse.json({ session, zonesMeta, assetCount: assets.length })
}
