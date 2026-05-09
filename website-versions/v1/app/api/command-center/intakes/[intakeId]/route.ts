import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// GET /api/command-center/intakes/[intakeId]
export async function GET(req: NextRequest, { params }: { params: { intakeId: string } }) {
  const { intakeId } = params
  const supabase = getSupabaseAdmin()

  const { data: intake, error } = await supabase
    .from('public_intake_leads')
    .select('*')
    .eq('id', intakeId)
    .single()

  if (error || !intake) {
    return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
  }

  // Fetch associated capture sessions
  const { data: captureSessions } = await supabase
    .from('capture_sessions')
    .select('*')
    .eq('intake_id', intakeId)
    .order('created_at', { ascending: false })

  // Fetch associated digital twin
  const { data: twin } = await supabase
    .from('property_twins')
    .select('id, status, creation_path, created_at, source_capture_session_ids')
    .eq('intake_id', intakeId)
    .maybeSingle()

  return NextResponse.json({ intake, captureSessions: captureSessions ?? [], twin })
}

// PATCH /api/command-center/intakes/[intakeId] — update status or assign
export async function PATCH(req: NextRequest, { params }: { params: { intakeId: string } }) {
  const { intakeId } = params
  try {
    const body = await req.json()
    const { status, assignedTo, notes } = body

    const updatePayload: Record<string, unknown> = {}
    if (status) updatePayload.status = status
    if (assignedTo !== undefined) updatePayload.assigned_to = assignedTo
    if (notes !== undefined) updatePayload.notes = notes
    updatePayload.updated_at = new Date().toISOString()

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('public_intake_leads')
      .update(updatePayload)
      .eq('id', intakeId)
      .select('id, status')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Update failed' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, intake: data })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
