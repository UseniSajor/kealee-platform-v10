import { NextRequest, NextResponse } from 'next/server'
import { isV30Enabled } from '@kealee/kealee-agent-stack'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const API_BASE = () =>
  (process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')

/**
 * GET /api/v30/workspace?intakeId= — package + bot results for customer workspace.
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
    .select('id, project_path, client_name, form_data, status')
    .eq('id', intakeId)
    .single()

  if (error || !intake) {
    return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
  }

  const formData = (intake.form_data as Record<string, unknown>) ?? {}
  const projectId = formData.v30ProjectId as string | undefined
  const v30Quote = formData.v30Quote as Record<string, unknown> | undefined

  if (!projectId) {
    return NextResponse.json({
      intakeId,
      projectId: null,
      stage: 'pending',
      executions: [],
      quote: v30Quote,
    })
  }

  const apiRes = await fetch(
    `${API_BASE()}/v30/project/${encodeURIComponent(projectId)}/workspace`,
    { cache: 'no-store' },
  )
  const workspace = await apiRes.json().catch(() => ({}))
  if (!apiRes.ok) {
    return NextResponse.json(
      { error: (workspace as { error?: string }).error ?? 'Workspace unavailable' },
      { status: apiRes.status },
    )
  }

  return NextResponse.json({
    intakeId,
    projectPath: intake.project_path,
    clientName: intake.client_name,
    status: intake.status,
    quote: v30Quote,
    ...(workspace as object),
  })
}
