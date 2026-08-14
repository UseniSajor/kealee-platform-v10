import { getSupabaseAdmin } from '@/lib/supabase-server'

export interface PaidOrderIncidentInput {
  intakeId: string
  projectPath?: string
  stripeSessionId: string
  stripeEventId?: string
  stage: string
  error: string
  customerEmail?: string | null
}

/**
 * Durable record of a fulfillment failure on an order that was already
 * paid, so ops can see and resolve it even though the customer was
 * charged successfully. Never throws — incident logging must not itself
 * break the payment/fulfillment flow it's reporting on.
 */
export async function recordPaidOrderIncident(input: PaidOrderIncidentInput): Promise<void> {
  console.error('[paid-order-incident]', {
    stage: input.stage,
    intakeId: input.intakeId,
    stripeSessionId: input.stripeSessionId,
    error: input.error,
  })

  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('paid_order_incidents').insert({
      intake_id: input.intakeId,
      project_path: input.projectPath ?? null,
      stripe_session_id: input.stripeSessionId,
      stripe_event_id: input.stripeEventId ?? null,
      stage: input.stage,
      error: input.error,
      customer_email: input.customerEmail ?? null,
      status: 'open',
    })

    if (error) {
      console.error('[paid-order-incident] insert failed:', error.message)
    }
  } catch (err) {
    console.error('[paid-order-incident] DB unavailable:', err)
  }
}
