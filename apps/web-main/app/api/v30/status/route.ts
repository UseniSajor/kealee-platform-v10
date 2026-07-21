import { NextRequest, NextResponse } from 'next/server'
import { isV30Enabled } from '@kealee/kealee-agent-stack'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const API_BASE = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? ''

/**
 * GET /api/v30/status?intakeId= — poll os-ai-orch generation progress for a public intake.
 */
export async function GET(req: NextRequest) {
  if (!isV30Enabled()) {
    return NextResponse.json({ error: 'v30 disabled' }, { status: 503 })
  }

  const intakeId = req.nextUrl.searchParams.get('intakeId')
  if (!intakeId) {
    return NextResponse.json({ error: 'intakeId required' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data: intake, error } = await supabase
    .from('public_intake_leads')
    .select('form_data')
    .eq('id', intakeId)
    .single()

  if (error || !intake) {
    return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
  }

  const formData = (intake.form_data as Record<string, unknown>) ?? {}
  const projectId = formData.v30ProjectId as string | undefined
  if (!projectId) {
    return NextResponse.json({ stage: 'idle', progress: {}, message: 'Generation not started yet' })
  }

  const apiRes = await fetch(
    `${API_BASE.replace(/\/$/, '')}/v30/project/${encodeURIComponent(projectId)}/status`,
    { cache: 'no-store' },
  )
  const payload = await apiRes.json().catch(() => ({}))
  if (!apiRes.ok) {
    return NextResponse.json(
      { error: (payload as { error?: string }).error ?? 'Status unavailable' },
      { status: apiRes.status },
    )
  }

  return NextResponse.json({ ...payload, intakeId, projectId })
}
