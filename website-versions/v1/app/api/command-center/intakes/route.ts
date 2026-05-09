import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// GET /api/command-center/intakes
// Returns intake queue with optional filters
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status')
  const projectPath = req.nextUrl.searchParams.get('projectPath')
  const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '50', 10)

  const supabase = getSupabaseAdmin()

  let query = supabase
    .from('public_intake_leads')
    .select(`
      id,
      project_path,
      client_name,
      contact_email,
      contact_phone,
      project_address,
      budget_range,
      status,
      requires_payment,
      payment_amount,
      created_at,
      form_data
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) {
    query = query.eq('status', status) as typeof query
  }
  if (projectPath) {
    query = query.eq('project_path', projectPath) as typeof query
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch capture session counts per intake
  const intakeIds = (data ?? []).map((i: { id: string }) => i.id)
  const { data: captureSessions } = intakeIds.length > 0
    ? await supabase
        .from('capture_sessions')
        .select('intake_id, status, capture_mode, scan_completed, site_visit_requested, site_visit_status, preferred_visit_window, site_visit_fee')
        .in('intake_id', intakeIds)
    : { data: [] }

  const captureCountMap = new Map<string, number>()
  const captureModeMap = new Map<string, string>()
  const scanCompletedMap = new Map<string, boolean>()
  const siteVisitMap = new Map<string, {
    requested: boolean
    status: string
    preferredWindow: string | null
    fee: number
  }>()

  for (const cs of captureSessions ?? []) {
    const count = captureCountMap.get(cs.intake_id) ?? 0
    captureCountMap.set(cs.intake_id, count + 1)
    if (!captureModeMap.has(cs.intake_id)) {
      captureModeMap.set(cs.intake_id, cs.capture_mode ?? 'self_capture')
      scanCompletedMap.set(cs.intake_id, cs.scan_completed ?? false)
      if (cs.site_visit_requested) {
        siteVisitMap.set(cs.intake_id, {
          requested: true,
          status: cs.site_visit_status ?? 'requested',
          preferredWindow: cs.preferred_visit_window ?? null,
          fee: cs.site_visit_fee ?? 12500,
        })
      }
    }
  }

  const enriched = (data ?? []).map((intake: Record<string, unknown>) => ({
    ...intake,
    captureSessionCount: captureCountMap.get(intake.id as string) ?? 0,
    captureMode: captureModeMap.get(intake.id as string) ?? null,
    scanCompleted: scanCompletedMap.get(intake.id as string) ?? false,
    siteVisit: siteVisitMap.get(intake.id as string) ?? null,
  }))

  return NextResponse.json({ intakes: enriched, total: enriched.length })
}
