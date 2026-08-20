/**
 * Manual-fulfillment fallback.
 *
 * A paid order must never end up with nothing happening to it. Automation is
 * best-effort: the orchestration service can be unreachable, a feature flag can
 * be off, or a product can have no automated route yet. In any of those cases
 * this routes the order into the human queue with an explicit status instead of
 * dropping it or throwing the webhook into an unbounded Stripe retry loop.
 */

import { getSupabaseAdmin } from '@/lib/supabase-server'
import { recordPaidOrderIncident } from '@/lib/paid-order-incident'
import { orderStatusPatch } from '@/lib/order-status'
import * as Sentry from '@sentry/nextjs'

export type ManualFulfillmentReason =
  | 'automation_unavailable'
  | 'automation_disabled'
  | 'no_automated_route'
  | 'automation_failed'

const REASON_DETAIL: Record<ManualFulfillmentReason, string> = {
  automation_unavailable:
    'The orchestration service did not accept the job. Order routed to the human fulfillment queue.',
  automation_disabled:
    'Automated fulfillment is disabled for this environment. Order routed to the human fulfillment queue.',
  no_automated_route:
    'This product has no automated fulfillment route. Order routed to the human fulfillment queue.',
  automation_failed:
    'Automated fulfillment errored. Order routed to the human fulfillment queue.',
}

export interface ManualFulfillmentInput {
  intakeId: string
  projectPath: string
  reason: ManualFulfillmentReason
  stripeSessionId?: string
  stripeEventId?: string
  customerEmail?: string | null
  /** Extra context for the reviewer picking this up. */
  detail?: string
}

/**
 * Move a paid order into human review. Never throws — this is the safety net,
 * so a failure inside it must not mask the original problem.
 */
export async function routeToManualFulfillment(
  input: ManualFulfillmentInput,
): Promise<void> {
  const detail = input.detail ?? REASON_DETAIL[input.reason]

  Sentry.captureMessage('Paid order routed to manual fulfillment', {
    level: 'warning',
    tags: {
      area: 'payment-fulfillment',
      stage: 'manual-fallback',
      projectPath: input.projectPath,
      reason: input.reason,
    },
    extra: { intakeId: input.intakeId, detail },
  })

  try {
    const supabase = getSupabaseAdmin()
    const { data: row } = await supabase
      .from('public_intake_leads')
      .select('form_data')
      .eq('id', input.intakeId)
      .single()

    const existing = (row?.form_data as Record<string, unknown>) ?? {}

    await supabase
      .from('public_intake_leads')
      .update({
        form_data: {
          ...existing,
          ...orderStatusPatch('in_review', { reason: detail, actor: 'system' }),
          fulfillmentStatus: 'manual',
          fulfillmentMode: 'human',
          fulfillmentFallbackReason: input.reason,
          fulfillmentFallbackDetail: detail,
          fulfillmentFallbackAt: new Date().toISOString(),
          requiresHumanFulfillment: true,
        },
      })
      .eq('id', input.intakeId)
  } catch (error) {
    console.error(
      '[manual-fulfillment] could not mark order:',
      error instanceof Error ? error.message : error,
    )
  }

  if (input.stripeSessionId) {
    await recordPaidOrderIncident({
      intakeId: input.intakeId,
      projectPath: input.projectPath,
      stripeSessionId: input.stripeSessionId,
      stripeEventId: input.stripeEventId,
      stage: `manual-fulfillment:${input.reason}`,
      error: detail,
      customerEmail: input.customerEmail,
    })
  }

  await notifyOpsOfManualOrder(input, detail)
}

async function notifyOpsOfManualOrder(
  input: ManualFulfillmentInput,
  detail: string,
): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) return

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Kealee Notifications <notifications@kealee.com>',
        to: ['hello@kealee.com'],
        subject: `ACTION REQUIRED — manual fulfillment: ${input.projectPath.replace(/_/g, ' ')}`,
        text: [
          'A paid order needs to be fulfilled by a human.',
          '',
          `  Intake ID: ${input.intakeId}`,
          `  Product:   ${input.projectPath.replace(/_/g, ' ')}`,
          `  Customer:  ${input.customerEmail ?? 'unknown'}`,
          `  Reason:    ${input.reason}`,
          `  Detail:    ${detail}`,
          '',
          'The order is marked "In Review" and is visible in the admin orders list.',
        ].join('\n'),
      }),
    })
  } catch (error) {
    console.error(
      '[manual-fulfillment] ops notification failed:',
      error instanceof Error ? error.message : error,
    )
  }
}
