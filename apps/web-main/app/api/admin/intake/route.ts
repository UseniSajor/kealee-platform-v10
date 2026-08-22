/**
 * Staff intake: phone/assisted customer orders and in-house jobs.
 *
 * POST creates the order. GET returns the field schema, so the console can be
 * driven from one source of truth rather than a form that drifts from the
 * engine's expectations.
 *
 * Behind the same command-centre auth as the rest of /api/admin.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { requireCommandCenterApi } from '@/lib/command-center-api-auth'
import {
  validateStaffIntake, buildStaffIntakeRecord, STAFF_INTAKE_PATHS,
  type StaffIntakeInput,
} from '@/lib/staff-intake'
import {
  isSitePlanOrder, evaluateSitePlanOrder, sitePlanRuleFormData,
} from '@/lib/site-plan-rules'
import { resolveProductAutomationRoute } from '@/lib/product-automation'
import { triggerV30GenerationForIntake } from '@/lib/v30-trigger'

export const dynamic = 'force-dynamic'

/**
 * Fields worth asking on a call, in the order that makes sense to ask them.
 * Everything except address is optional — see staff-intake.ts for why.
 */
const CALL_SCRIPT = [
  { field: 'projectAddress', label: 'Project address', required: true,
    why: 'Without it no jurisdiction can be resolved and no rules apply.' },
  { field: 'zone', label: 'Zoning classification', required: false,
    why: 'If unknown we resolve it from GIS, which stays preliminary until surveyed.' },
  { field: 'cornerLot', label: 'Is it a corner lot?', required: false,
    why: 'Changes the front yard requirement in most zones. Unknown routes the setback to a human.' },
  { field: 'lot_size', label: 'Lot size (sq ft)', required: false,
    why: 'Drives lot coverage and density checks.' },
  { field: 'lotWidthFt', label: 'Lot width (ft)', required: false, why: 'Drives minimum lot width checks.' },
  { field: 'use', label: 'Intended use', required: false, why: 'Dimensional standards vary by use within a zone.' },
  { field: 'proposedHeightFt', label: 'Proposed height (ft)', required: false, why: 'Checked against the zone maximum.' },
  { field: 'environmentalOverlays', label: 'Any streams, wetlands or floodplain?', required: false,
    why: 'Triggers buffer requirements and can change the permit path.' },
  { field: 'subdivisionStatus', label: 'Is subdivision involved?', required: false,
    why: 'Decides whether Subtitle 24 procedures apply.' },
] as const

export async function GET(req: NextRequest) {
  const denied = await requireCommandCenterApi(req)
  if (denied) return denied
  return NextResponse.json({
    products: STAFF_INTAKE_PATHS,
    modes: [
      { mode: 'assisted', label: 'Customer order (phone or assisted)', takesPayment: true },
      { mode: 'in_house', label: 'In-house / self-perform job', takesPayment: false },
    ],
    callScript: CALL_SCRIPT,
    note:
      'Every field except the address is optional. Anything the caller cannot answer should be listed ' +
      'in notAsked rather than guessed — the rule engine treats an unknown as "route to a human", ' +
      'which is correct, whereas a guessed value silently produces the wrong requirement.',
  })
}

export async function POST(req: NextRequest) {
  const denied = await requireCommandCenterApi(req)
  if (denied) return denied

  let input: StaffIntakeInput
  try {
    input = (await req.json()) as StaffIntakeInput
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = validateStaffIntake(input)
  if (!validation.ok) {
    return NextResponse.json({ error: 'Validation failed', errors: validation.errors }, { status: 400 })
  }

  const record = buildStaffIntakeRecord(input)

  // An in-house job never passes through Stripe, so the rule evaluation that
  // the webhook performs for a paid order has to happen here instead.
  // Otherwise a self-perform job would be the only order type with no zoning
  // analysis attached.
  if (record.status === 'paid' && isSitePlanOrder(input.projectPath)) {
    const outcome = evaluateSitePlanOrder({
      intakeId: 'pending',
      projectPath: input.projectPath,
      formData: { ...record.form_data, address: record.project_address },
    })
    Object.assign(record.form_data, sitePlanRuleFormData(outcome))
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('public_intake_leads')
    .insert(record)
    .select('id')
    .single()

  if (error || !data) {
    console.error('[admin-intake] insert failed:', error?.message)
    return NextResponse.json(
      { error: 'Could not create the order', detail: error?.message ?? 'unknown' },
      { status: 500 },
    )
  }

  // An in-house job has no webhook behind it, so the generation trigger the
  // webhook would have fired has to be fired here. Failing to generate must not
  // undo a created job — the order stands and ops can retry it.
  let generation: { triggered: boolean; detail: string } = { triggered: false, detail: 'not applicable' }
  if (record.status === 'paid' && record.form_data.v30 === true) {
    try {
      const result = await triggerV30GenerationForIntake(data.id, {
        ...resolveProductAutomationRoute({ source: 'public_intake_v30', projectPath: input.projectPath }),
      })
      generation = result
        ? { triggered: true, detail: `project ${result.projectId ?? '—'}` }
        : { triggered: false, detail: 'V30 generation is disabled (KEALEE_V30_ENABLED off) — job queued only.' }
    } catch (e) {
      generation = {
        triggered: false,
        detail: `Generation failed: ${e instanceof Error ? e.message : String(e)}. The job was created; retry it.`,
      }
      console.error('[admin-intake] in-house generation failed:', e)
    }
  }

  return NextResponse.json({
    intakeId: data.id,
    mode: input.mode,
    status: record.status,
    automated: record.form_data.v30 === true,
    generation,
    // An assisted order still needs paying for; say so rather than letting a
    // staff member assume the order is complete.
    nextStep: record.status === 'paid'
      ? 'In-house job created, flagged v30 and queued for the bots. No payment is required.'
      : 'Order created but NOT paid. Take payment to start fulfilment.',
    warnings: validation.warnings,
    notAsked: (record.form_data.staffIntake as { notAsked: string[] }).notAsked,
  }, { status: 201 })
}
