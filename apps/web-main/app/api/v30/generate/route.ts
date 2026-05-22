import { NextRequest, NextResponse } from 'next/server'
import { isV30Enabled } from '@kealee/kealee-agent-stack'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { triggerV30GenerationForIntake } from '@/lib/v30-trigger'

export const dynamic = 'force-dynamic'

/**
 * POST /api/v30/generate — after payment, bridge public_intake_leads → API v30 generation.
 */
export async function POST(req: NextRequest) {
  if (!isV30Enabled()) {
    return NextResponse.json({ error: 'v30 disabled' }, { status: 503 })
  }

  const body = await req.json().catch(() => ({})) as { intakeId?: string }
  const intakeId = body.intakeId
  if (!intakeId) {
    return NextResponse.json({ error: 'intakeId required' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data: intake, error } = await supabase
    .from('public_intake_leads')
    .select('id, status, form_data')
    .eq('id', intakeId)
    .single()

  if (error || !intake) {
    return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
  }

  const paid = ['paid', 'concept_ready', 'processing'].includes(intake.status as string)
  if (!paid) {
    return NextResponse.json({ error: 'Payment required before generation' }, { status: 402 })
  }

  const formData = (intake.form_data as Record<string, unknown>) ?? {}
  const features = (formData.v30Quote as { features?: string[] })?.features ?? (formData.v30Features as string[])
  if (!features?.length) {
    return NextResponse.json({ error: 'Missing v30 package features on intake' }, { status: 400 })
  }

  const payload = await triggerV30GenerationForIntake(intakeId)
  if (!payload) {
    return NextResponse.json({ error: 'Generation failed — check API env and KEALEE_V30_PUBLIC_USER_ID' }, { status: 500 })
  }

  return NextResponse.json({ ...payload, intakeId })
}
