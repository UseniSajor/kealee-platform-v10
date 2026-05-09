import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// GET /api/capture/progress?captureSessionId=xxx
// Polling endpoint for desktop progress panel
export async function GET(req: NextRequest) {
  const captureSessionId = req.nextUrl.searchParams.get('captureSessionId')
  if (!captureSessionId) {
    return NextResponse.json({ error: 'captureSessionId required' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('capture_sessions')
    .select(
      'id, current_zone, completed_zones, required_zones, progress_percent, uploaded_assets_count, voice_notes_count, walkthrough_video_uploaded, status, capture_mode, scan_enabled, scan_completed',
    )
    .eq('id', captureSessionId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const completedZones = (data.completed_zones as string[]) ?? []
  const requiredZones = (data.required_zones as string[]) ?? []

  return NextResponse.json({
    captureSessionId: data.id,
    currentZone: data.current_zone,
    completedZones,
    requiredZones,
    completedZonesCount: completedZones.length,
    totalZonesCount: requiredZones.length,
    progressPercent: data.progress_percent,
    uploadedAssetsCount: data.uploaded_assets_count,
    voiceNotesCount: data.voice_notes_count,
    walkthroughVideoUploaded: data.walkthrough_video_uploaded,
    status: data.status,
    captureMode: data.capture_mode,
    scanEnabled: data.scan_enabled,
    scanCompleted: data.scan_completed,
  })
}
