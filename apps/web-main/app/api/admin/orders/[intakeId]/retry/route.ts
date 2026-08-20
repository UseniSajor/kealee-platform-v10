import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { requireCommandCenterApi } from '@/lib/command-center-api-auth'
import { triggerV30GenerationForIntake } from '@/lib/v30-trigger'
import { resolveProductAutomationRoute } from '@/lib/product-automation'
import { SERVICE_DELIVERABLES } from '@/lib/service-deliverables'
import { orderStatusPatch } from '@/lib/order-status'
import { routeToManualFulfillment } from '@/lib/manual-fulfillment'
import { getWebMainUrl } from '@/lib/get-app-url'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * POST /api/admin/orders/[intakeId]/retry
 *
 * Re-runs fulfillment for a failed or manually-queued order. Clears the
 * generation guard first so the automation path does not short-circuit on its
 * own idempotency check, then reports honestly whether the retry was accepted.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { intakeId: string } },
) {
  const denied = await requireCommandCenterApi(req)
  if (denied) return denied

  const supabase = getSupabaseAdmin()
  const { data: order, error } = await supabase
    .from('public_intake_leads')
    .select('id, project_path, status, form_data')
    .eq('id', params.intakeId)
    .maybeSingle()

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const formData = (order.form_data as Record<string, unknown>) ?? {}
  const projectPath = order.project_path as string
  const automationRoute = resolveProductAutomationRoute({
    source: 'public_intake',
    projectPath,
  })

  // Clear the "already started" guard so the trigger actually re-dispatches.
  await supabase
    .from('public_intake_leads')
    .update({
      form_data: {
        ...formData,
        fulfillmentStatus: 'retryable',
        fulfillmentRetryAt: new Date().toISOString(),
        ...orderStatusPatch('processing', { actor: 'admin', reason: 'Fulfillment retried by admin' }),
      },
    })
    .eq('id', params.intakeId)

  const deliverable = SERVICE_DELIVERABLES[projectPath]

  // Concept products are produced in-app; everything else goes through the
  // orchestration service.
  if (deliverable?.generatesConcept) {
    const res = await fetch(`${getWebMainUrl()}/api/concept/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intakeId: params.intakeId }),
    }).catch(() => null)

    if (!res?.ok) {
      // Put the order back in the human queue — leaving it on "Processing"
      // with nothing running is exactly the silent stall we are removing.
      await routeToManualFulfillment({
        intakeId: params.intakeId,
        projectPath,
        reason: 'automation_failed',
        detail: 'Concept generation rejected an admin retry. Order returned to the human fulfillment queue.',
      })
      return NextResponse.json(
        { ok: false, error: 'Concept generation did not accept the retry. The order stays in the manual queue.' },
        { status: 502 },
      )
    }
    return NextResponse.json({ ok: true, dispatched: 'concept' })
  }

  const generation = await triggerV30GenerationForIntake(params.intakeId, {
    ...automationRoute,
    forceEnabled: true,
  }).catch(() => null)

  if (!generation) {
    await routeToManualFulfillment({
      intakeId: params.intakeId,
      projectPath,
      reason: 'automation_unavailable',
      detail: 'Admin retry could not reach the orchestration service. Order returned to the human fulfillment queue.',
    })
    return NextResponse.json(
      {
        ok: false,
        error:
          'Automation is not reachable. The order remains in the manual fulfillment queue — deliver it by hand or retry once the service is back.',
      },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true, dispatched: 'automation', ...generation })
}
