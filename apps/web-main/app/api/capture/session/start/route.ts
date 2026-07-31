import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import {
  getCaptureVideoPlan,
  getRequiredZones,
  getZoneMeta,
  isTokenExpired,
  normalizeCaptureProjectPath,
  normalizeCaptureSession,
} from '@kealee/intake'

export const dynamic = 'force-dynamic'


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
  const normalizedProjectPath = normalizeCaptureProjectPath(session.project_path)
  const configuredZones = getRequiredZones(normalizedProjectPath)
  if (configuredZones.length === 0) {
    return NextResponse.json(
      { error: `Capture is not configured for project path "${session.project_path}"` },
      { status: 400 },
    )
  }
  const videoPlan = getCaptureVideoPlan(normalizedProjectPath)

  // Repair legacy/aliased sessions at read time so a kitchen capture created
  // with a generic fallback cannot continue requesting exterior photos.
  const storedZones = session.required_zones
  const zonesChanged =
    session.project_path !== normalizedProjectPath ||
    storedZones.length !== configuredZones.length ||
    storedZones.some((zone, index) => zone !== configuredZones[index])
  if (zonesChanged) {
    await supabase
      .from('capture_sessions')
      .update({
        project_path: normalizedProjectPath,
        required_zones: configuredZones,
      })
      .eq('id', session.id)
    session.project_path = normalizedProjectPath
    session.required_zones = configuredZones
  }

  // Get existing assets for this session
  const { data: assetsRaw } = await supabase
    .from('capture_assets')
    .select('*')
    .eq('capture_session_id', session.id)

  const assets = assetsRaw ?? []

  // Build zone metadata for required zones
  const zonesMeta = session.required_zones.map((zone: any) => {
    const meta = getZoneMeta(zone)
    const zoneAssets = assets.filter((a: { zone: string }) => a.zone === zone)
    return {
      zone,
      displayName: meta?.displayName ?? zone,
      prompt: meta?.prompt ?? '',
      hvacPrompt: meta?.hvacPrompt ?? null,
      allowsVideo: videoPlan?.zones.includes(zone) ?? false,
      videoPrompt: videoPlan?.prompt ?? null,
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
