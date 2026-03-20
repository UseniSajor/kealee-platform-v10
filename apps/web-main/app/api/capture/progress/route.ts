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
      'id, current_zone, completed_zones, required_zones, progress_percent, uploaded_assets_count, voice_notes_count, walkthrough_video_uploaded, status',
    )
    .eq('id', captureSessionId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    captureSessionId: data.id,
    currentZone: data.current_zone,
    completedZones: data.completed_zones,
    requiredZones: data.required_zones,
    progressPercent: data.progress_percent,
    uploadedAssetsCount: data.uploaded_assets_count,
    voiceNotesCount: data.voice_notes_count,
    walkthroughVideoUploaded: data.walkthrough_video_uploaded,
    status: data.status,
  })
}
