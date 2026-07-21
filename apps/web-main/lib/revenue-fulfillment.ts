import type Stripe from 'stripe'
import { prisma } from '@kealee/database'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { getRevenueProduct } from './revenue-product-catalog'
import { triggerV30GenerationForIntake } from './v30-trigger'
import { sendPostPaymentCustomerEmail } from './marketing/lifecycle'
import { mergeFulfillmentFormData } from './product-automation'
import { ensureAutonomousFulfillmentRun } from './autonomous-fulfillment'

export async function fulfillRevenueProduct(session: Stripe.Checkout.Session, stripeEventId?: string) {
  const meta = session.metadata ?? {}
  if (meta.source !== 'revenue_product') return { handled: false }
  const product = getRevenueProduct(meta.productKey ?? '')
  if (!product || !meta.intakeId) throw new Error('Invalid revenue product checkout metadata')
  const supabase = getSupabaseAdmin()
  const paidAt = new Date().toISOString()
  const existingTransaction = await prisma.revenueTransaction.findUnique({
    where: { stripeCheckoutSessionId: session.id },
  })
  if (existingTransaction && ['processing', 'cleared'].includes(existingTransaction.status)) {
    return { handled: true, duplicate: true, intakeId: meta.intakeId, productKey: product.productKey }
  }

  const { data: intake, error: intakeError } = await supabase.from('public_intake_leads')
    .select('form_data').eq('id', meta.intakeId).single()
  if (intakeError) throw new Error(`Revenue intake fetch failed: ${intakeError.message}`)
  const existingFormData = (intake?.form_data as Record<string, unknown>) ?? {}
  const fulfillment = {
    revenueProductKey: product.productKey,
    workflowTemplateId: product.workflowTemplateId,
    responsibleAgent: product.responsibleAgent,
    propertyIntelligenceDepth: product.propertyIntelDepth,
    fulfillmentBotTypes: product.botTypes,
    fulfillmentSlaHours: product.fulfillmentSlaHours,
    fulfillmentStatus: 'queued',
    fulfillmentQueuedAt: paidAt,
    stripeEventId,
    exclusions: product.exclusions,
  }
  const { error } = await supabase.from('public_intake_leads').update({
    status: 'paid', paid_at: paidAt, stripe_session_id: session.id,
    form_data: mergeFulfillmentFormData(existingFormData, fulfillment),
  }).eq('id', meta.intakeId)
  if (error) throw new Error(`Revenue intake update failed: ${error.message}`)

  const dbProduct = await prisma.revenueProduct.findUnique({ where: { productKey: product.productKey } })
  await prisma.revenueTransaction.upsert({
    where: { stripeCheckoutSessionId: session.id },
    update: { status: 'processing', recognizedAt: new Date() },
    create: {
      intakeId: meta.intakeId, productId: dbProduct?.id,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
      grossCents: session.amount_total ?? product.priceCents,
      netCents: session.amount_total ?? product.priceCents,
      status: 'processing', recognizedAt: new Date(),
    },
  })
  try {
    const run = await ensureAutonomousFulfillmentRun({
      intakeId: meta.intakeId, stripeSessionId: session.id, productKey: product.productKey,
      botTypes: product.botTypes, workflowTemplateId: product.workflowTemplateId,
      propertyIntelligenceDepth: product.propertyIntelDepth,
    })
    const { data: beforeGeneration } = await supabase.from('public_intake_leads').select('form_data').eq('id', meta.intakeId).single()
    await supabase.from('public_intake_leads').update({ form_data: {
      ...((beforeGeneration?.form_data as Record<string, unknown>) ?? existingFormData),
      autonomousRunId: run.runId,
    } }).eq('id', meta.intakeId)
    const generation = await triggerV30GenerationForIntake(meta.intakeId, fulfillment)
    if (!generation) throw new Error('Product generation could not be queued')
    const email = session.customer_details?.email
    if (email) {
      await sendPostPaymentCustomerEmail({
        intakeId: meta.intakeId,
        email,
        clientName: session.customer_details?.name ?? '',
        projectPath: product.productKey,
      }).catch(error => console.error('[revenue-fulfillment] confirmation email failed:', error))
    }
    return { handled: true, intakeId: meta.intakeId, productKey: product.productKey }
  } catch (error) {
    await prisma.revenueTransaction.update({
      where: { stripeCheckoutSessionId: session.id },
      data: { status: 'retryable' },
    })
    const { data: latest } = await supabase.from('public_intake_leads').select('form_data').eq('id', meta.intakeId).single()
    const latestFormData = (latest?.form_data as Record<string, unknown>) ?? existingFormData
    await supabase.from('public_intake_leads').update({
      form_data: { ...latestFormData, ...fulfillment, fulfillmentStatus: 'retryable', fulfillmentError: error instanceof Error ? error.message : 'Generation failed' },
    }).eq('id', meta.intakeId)
    throw error
  }
}
