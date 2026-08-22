import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { requireCommandCenterApi } from '@/lib/command-center-api-auth'
import { buildOrderView } from '@/lib/order-view'
import {
  ADMIN_SETTABLE_STATUSES,
  isOrderStatus,
  orderStatusPatch,
  resolveOrderStatus,
} from '@/lib/order-status'
import type { OrderRecord } from '@/lib/order-access'
import { sendDeliverableReadyEmail } from '@/lib/deliverable-ready-email'

export const dynamic = 'force-dynamic'

const ORDER_COLUMNS =
  'id, project_path, client_name, contact_email, contact_phone, project_address, status, created_at, paid_at, form_data, metadata'

export async function GET(
  req: NextRequest,
  { params }: { params: { intakeId: string } },
) {
  const denied = await requireCommandCenterApi(req)
  if (denied) return denied

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('public_intake_leads')
    .select(ORDER_COLUMNS)
    .eq('id', params.intakeId)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const order = data as unknown as OrderRecord
  const formData = order.form_data ?? {}

  return NextResponse.json({
    ...buildOrderView(order),
    status: resolveOrderStatus(formData, order.status),
    columnStatus: order.status,
    contactEmail: order.contact_email,
    contactPhone: order.contact_phone,
    assignedReviewer: formData.assignedReviewer ?? null,
    internalNotes: Array.isArray(formData.internalNotes) ? formData.internalNotes : [],
    fulfillment: {
      status: formData.fulfillmentStatus ?? null,
      mode: formData.fulfillmentMode ?? null,
      fallbackReason: formData.fulfillmentFallbackReason ?? null,
      fallbackDetail: formData.fulfillmentFallbackDetail ?? null,
      botTypes: formData.fulfillmentBotTypes ?? null,
      v30ProjectId: formData.v30ProjectId ?? null,
      startedAt: formData.v30GenerationStartedAt ?? null,
    },
    uploads: Array.isArray(formData.uploadedFileMeta) ? formData.uploadedFileMeta : [],
    settableStatuses: ADMIN_SETTABLE_STATUSES,
  })
}

interface PatchBody {
  status?: string
  assignedReviewer?: string | null
  note?: string
  /** Marks the order as blocked on the customer and records what is needed. */
  requestInformation?: string[]
  professionalReviewComplete?: boolean
  /** Manual payment reconciliation: 'refunded' | 'manual_paid' | 'unpaid'. */
  paymentDisposition?: string
  /** Email the customer their order link (used when a deliverable is released). */
  notifyCustomer?: boolean
  actor?: string
}

/**
 * PATCH /api/admin/orders/[intakeId]
 *
 * Every operator action an order needs — set status, assign a reviewer, add an
 * internal note, request information from the customer, record professional
 * review, or reconcile payment — without touching the database directly.
 *
 * Writes into `form_data` so no schema migration is required; the `status`
 * column is only touched for the two values it already models.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { intakeId: string } },
) {
  const denied = await requireCommandCenterApi(req)
  if (denied) return denied

  let body: PatchBody
  try {
    body = (await req.json()) as PatchBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (body.status && !isOrderStatus(body.status)) {
    return NextResponse.json({ error: `Unknown status: ${body.status}` }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data: existing, error: fetchError } = await supabase
    .from('public_intake_leads')
    .select('form_data, status')
    .eq('id', params.intakeId)
    .maybeSingle()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const formData = (existing.form_data as Record<string, unknown>) ?? {}
  const actor = body.actor ?? 'admin'
  const patch: Record<string, unknown> = { ...formData }

  if (body.status) {
    const status = body.status
    if (!isOrderStatus(status)) {
      return NextResponse.json({ error: `Unknown status: ${status}` }, { status: 400 })
    }
    Object.assign(patch, orderStatusPatch(status, { actor }))
    if (status === 'delivered') patch.deliveredAt = new Date().toISOString()
  }

  if (body.assignedReviewer !== undefined) {
    patch.assignedReviewer = body.assignedReviewer
    patch.assignedReviewerAt = new Date().toISOString()
  }

  if (body.note) {
    const notes = Array.isArray(formData.internalNotes)
      ? [...(formData.internalNotes as unknown[])]
      : []
    notes.push({ note: body.note, actor, at: new Date().toISOString() })
    patch.internalNotes = notes
  }

  if (body.requestInformation?.length) {
    patch.requestedInformation = body.requestInformation
    patch.requestedInformationAt = new Date().toISOString()
    Object.assign(
      patch,
      orderStatusPatch('awaiting_customer_information', {
        actor,
        reason: `Requested from customer: ${body.requestInformation.join('; ')}`,
      }),
    )
  }

  if (body.professionalReviewComplete) {
    patch.professionalReviewCompletedAt = new Date().toISOString()
    patch.professionalReviewCompletedBy = actor
  }

  if (body.paymentDisposition) {
    patch.paymentDisposition = body.paymentDisposition
    patch.paymentDispositionAt = new Date().toISOString()
    patch.paymentDispositionBy = actor
  }

  const update: Record<string, unknown> = { form_data: patch }
  // The `status` column is a constrained enum consumed by the webhook and the
  // portals — only mirror the two lifecycle values it already understands.
  if (body.status === 'delivered') update.status = 'delivered'
  if (body.status === 'cancelled') update.status = 'cancelled'

  const { error: updateError } = await supabase
    .from('public_intake_leads')
    .update(update)
    .eq('id', params.intakeId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Notifying the customer is a separate, explicit action — an admin can move
  // an order through internal states without mailing them every time, and can
  // resend the link when a delivery email failed.
  let notified: boolean | undefined
  if (body.notifyCustomer) {
    const { data: contact } = await supabase
      .from('public_intake_leads')
      .select('contact_email, client_name, project_path')
      .eq('id', params.intakeId)
      .maybeSingle()

    if (!contact?.contact_email) {
      notified = false
    } else {
      const result = await sendDeliverableReadyEmail({
        to: contact.contact_email,
        firstName: (contact.client_name ?? '').split(' ')[0] || 'there',
        service: contact.project_path,
        intakeId: params.intakeId,
      }).catch(() => ({ sent: false }))
      notified = result.sent
      if (notified) {
        await supabase
          .from('public_intake_leads')
          .update({ form_data: { ...patch, customerNotifiedAt: new Date().toISOString() } })
          .eq('id', params.intakeId)
      }
    }
  }

  return NextResponse.json({
    ok: true,
    status: body.status ?? resolveOrderStatus(patch, existing.status),
    ...(notified === undefined ? {} : { notified }),
  })
}
