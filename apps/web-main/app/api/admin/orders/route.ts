import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { requireCommandCenterApi } from '@/lib/command-center-api-auth'
import { SERVICE_DELIVERABLES } from '@/lib/service-deliverables'
import { resolveOrderStatus, ORDER_STATUS_META } from '@/lib/order-status'
import { buildOrderChecklist } from '@/lib/order-view'
import type { OrderRecord } from '@/lib/order-access'

export const dynamic = 'force-dynamic'

const MAX_LIMIT = 200

/**
 * GET /api/admin/orders
 *
 * Operator view of every lead and paid order, with the filters the fulfillment
 * team actually works by: product, state, lifecycle status, and age. Returns
 * the missing-information count and fulfillment health per row so failures are
 * visible without opening the database.
 *
 * Query: product, state, status, olderThanDays, needsAttention, q, limit, format=csv
 */
export async function GET(req: NextRequest) {
  const denied = await requireCommandCenterApi(req)
  if (denied) return denied

  const sp = req.nextUrl.searchParams
  const product = sp.get('product')
  const state = sp.get('state')?.toUpperCase()
  const statusFilter = sp.get('status')
  const olderThanDays = Number(sp.get('olderThanDays') ?? '')
  const needsAttention = sp.get('needsAttention') === 'true'
  const search = sp.get('q')?.trim().toLowerCase()
  const limit = Math.min(Number(sp.get('limit') ?? '100') || 100, MAX_LIMIT)

  const supabase = getSupabaseAdmin()
  let query = supabase
    .from('public_intake_leads')
    .select(
      'id, project_path, client_name, contact_email, contact_phone, project_address, status, created_at, paid_at, payment_amount, form_data, metadata',
    )
    .order('created_at', { ascending: false })
    .limit(MAX_LIMIT)

  if (product) query = query.eq('project_path', product) as typeof query

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message, orders: [] }, { status: 500 })
  }

  const now = Date.now()
  const rows = ((data ?? []) as unknown as OrderRecord[])
    .map(order => {
      const formData = order.form_data ?? {}
      const lifecycle = resolveOrderStatus(formData, order.status)
      const checklist = buildOrderChecklist(order.project_path, formData, order)
      const missing = checklist.filter(item => item.state === 'missing')
      const siteIntelligence =
        formData.siteIntelligence && typeof formData.siteIntelligence === 'object'
          ? (formData.siteIntelligence as Record<string, unknown>)
          : {}
      const jurisdiction =
        siteIntelligence.jurisdiction && typeof siteIntelligence.jurisdiction === 'object'
          ? (siteIntelligence.jurisdiction as Record<string, unknown>)
          : {}
      const ageDays = order.created_at
        ? Math.floor((now - Date.parse(order.created_at)) / 86_400_000)
        : null

      return {
        id: order.id,
        productKey: order.project_path,
        productLabel: SERVICE_DELIVERABLES[order.project_path]?.label ?? order.project_path,
        clientName: order.client_name,
        contactEmail: order.contact_email,
        contactPhone: order.contact_phone,
        projectAddress: order.project_address,
        state: (jurisdiction.state as string | null) ?? null,
        county: (jurisdiction.county as string | null) ?? null,
        coverage: (siteIntelligence.coverage as string | null) ?? null,
        columnStatus: order.status,
        status: lifecycle,
        statusLabel: ORDER_STATUS_META[lifecycle].label,
        waitingOn: ORDER_STATUS_META[lifecycle].actor,
        createdAt: order.created_at,
        paidAt: order.paid_at,
        ageDays,
        missingCount: missing.length,
        missingItems: missing.map(item => item.label),
        fulfillmentStatus: (formData.fulfillmentStatus as string | null) ?? null,
        requiresHumanFulfillment: formData.requiresHumanFulfillment === true,
        fulfillmentFallbackReason: (formData.fulfillmentFallbackReason as string | null) ?? null,
        assignedReviewer: (formData.assignedReviewer as string | null) ?? null,
        internalNotes: Array.isArray(formData.internalNotes) ? formData.internalNotes : [],
        deliveredAt: (formData.deliveredAt as string | null) ?? null,
      }
    })
    .filter(row => {
      if (state && row.state !== state) return false
      if (statusFilter && row.status !== statusFilter) return false
      if (Number.isFinite(olderThanDays) && olderThanDays > 0) {
        if (row.ageDays == null || row.ageDays < olderThanDays) return false
      }
      if (needsAttention) {
        const stuck =
          row.requiresHumanFulfillment ||
          row.status === 'failed' ||
          row.status === 'awaiting_customer_information' ||
          (row.waitingOn === 'kealee' && (row.ageDays ?? 0) > 5 && row.status !== 'delivered')
        if (!stuck) return false
      }
      if (search) {
        const haystack = [row.clientName, row.contactEmail, row.projectAddress, row.id]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(search)) return false
      }
      return true
    })
    .slice(0, limit)

  if (sp.get('format') === 'csv') {
    const columns = [
      'id', 'productKey', 'status', 'clientName', 'contactEmail', 'contactPhone',
      'projectAddress', 'state', 'county', 'coverage', 'createdAt', 'paidAt',
      'ageDays', 'missingCount', 'fulfillmentStatus', 'assignedReviewer',
    ] as const
    const escape = (value: unknown) =>
      `"${String(value ?? '').replace(/"/g, '""')}"`
    const csv = [
      columns.join(','),
      ...rows.map(row => columns.map(column => escape(row[column])).join(',')),
    ].join('\n')
    return new NextResponse(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="kealee-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  }

  return NextResponse.json({ orders: rows, count: rows.length })
}
