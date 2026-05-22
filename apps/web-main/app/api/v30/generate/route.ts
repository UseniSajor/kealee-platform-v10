import { NextRequest, NextResponse } from 'next/server'
import { isV30Enabled } from '@kealee/kealee-agent-stack'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const API_BASE = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? ''

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
    .select('id, project_path, client_name, contact_email, project_address, form_data, status')
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
  const v30Quote = formData.v30Quote as { features?: string[] } | undefined
  const features = v30Quote?.features ?? (formData.v30Features as string[] | undefined)
  const answers = (formData.v30Answers ?? formData) as Record<string, unknown>

  if (!features?.length) {
    return NextResponse.json({ error: 'Missing v30 package features on intake' }, { status: 400 })
  }

  const required = ['propertyType', 'primaryScope', 'budgetRange', 'timeline', 'location', 'squareFeet', 'yearBuilt']
  for (const key of required) {
    if (answers[key] == null || answers[key] === '') {
      return NextResponse.json({ error: `Missing v30 answer: ${key}` }, { status: 400 })
    }
  }

  const apiRes = await fetch(`${API_BASE.replace(/\/$/, '')}/v30/public-intake/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intakeLeadId: intake.id,
      projectPath: intake.project_path,
      clientName: intake.client_name,
      contactEmail: intake.contact_email,
      projectAddress: intake.project_address,
      answers: {
        propertyType: String(answers.propertyType),
        primaryScope: String(answers.primaryScope),
        budgetRange: String(answers.budgetRange),
        timeline: String(answers.timeline),
        location: String(answers.location ?? intake.project_address),
        squareFeet: Number(answers.squareFeet ?? answers.squareFootage ?? 0),
        yearBuilt: String(answers.yearBuilt),
        utilities: (answers.utilities as Record<string, boolean>) ?? {},
        codeConsiderations: (answers.codeConsiderations as string[]) ?? [],
      },
      features,
    }),
  })

  const payload = await apiRes.json().catch(() => ({}))
  if (!apiRes.ok) {
    return NextResponse.json(
      { error: (payload as { error?: string }).error ?? 'API generation failed' },
      { status: apiRes.status },
    )
  }

  await supabase
    .from('public_intake_leads')
    .update({
      form_data: {
        ...formData,
        v30ProjectId: (payload as { projectId?: string }).projectId,
        v30PackageId: (payload as { packageId?: string }).packageId,
        v30GenerationStartedAt: new Date().toISOString(),
      },
    })
    .eq('id', intakeId)

  return NextResponse.json(payload)
}
