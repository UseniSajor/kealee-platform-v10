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
        .select('intake_id, status')
        .in('intake_id', intakeIds)
    : { data: [] }

  const captureCountMap = new Map<string, number>()
  for (const cs of captureSessions ?? []) {
    const count = captureCountMap.get(cs.intake_id) ?? 0
    captureCountMap.set(cs.intake_id, count + 1)
  }

  const enriched = (data ?? []).map((intake: Record<string, unknown>) => ({
    ...intake,
    captureSessionCount: captureCountMap.get(intake.id as string) ?? 0,
  }))

  return NextResponse.json({ intakes: enriched, total: enriched.length })
}
