import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import {
  generateCaptureId,
  generateCaptureToken,
  getTokenExpiresAt,
  getRequiredZones,
  CreateCaptureSessionSchema,
} from '@kealee/intake'

// POST /api/capture/session — create a new capture session
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = CreateCaptureSessionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const { project_path, intake_id, project_id, address, client_name, created_by_user_id } =
      parsed.data

    const captureSessionId = generateCaptureId()
    const captureToken = generateCaptureToken()
    const tokenExpiresAt = getTokenExpiresAt(48)
    const requiredZones = getRequiredZones(project_path)
    const captureMode = (parsed.data as { capture_mode?: string }).capture_mode ?? 'standard'

    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('capture_sessions').insert({
      id: captureSessionId,
      project_path,
      intake_id: intake_id ?? null,
      project_id: project_id ?? null,
      address,
      client_name: client_name ?? null,
      created_by_user_id: created_by_user_id ?? null,
      capture_token: captureToken,
      token_expires_at: tokenExpiresAt,
      required_zones: requiredZones,
      completed_zones: [],
      status: 'pending',
      uploaded_assets_count: 0,
      voice_notes_count: 0,
      walkthrough_video_uploaded: false,
      progress_percent: 0,
      capture_mode: captureMode,
      scan_enabled: captureMode === 'enhanced_scan',
      scan_completed: false,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ captureSessionId, captureToken, requiredZones, captureMode })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// GET /api/capture/session?captureSessionId=xxx
export async function GET(req: NextRequest) {
  const captureSessionId = req.nextUrl.searchParams.get('captureSessionId')
  if (!captureSessionId) {
    return NextResponse.json({ error: 'captureSessionId required' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('capture_sessions')
    .select('*')
    .eq('id', captureSessionId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
