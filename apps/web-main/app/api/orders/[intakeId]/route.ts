import { NextRequest, NextResponse } from 'next/server'
import { authorizeOrderAccess } from '@/lib/order-access'
import { SERVICE_DELIVERABLES } from '@/lib/service-deliverables'
import { ORDER_STATUS_META, resolveOrderStatus } from '@/lib/order-status'
import { buildOrderView } from '@/lib/order-view'

export const dynamic = 'force-dynamic'

/**
 * GET /api/orders/[intakeId]?t=<portal token>
 *
 * Customer-facing order status + deliverables. Requires the emailed order
 * token or a signed-in session matching the order's contact email.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { intakeId: string } },
) {
  const token = req.nextUrl.searchParams.get('t')
  const access = await authorizeOrderAccess(params.intakeId, token)

  if (!access.ok) {
    // Same response for missing and unauthorised so an order id cannot be probed.
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const { order } = access
  const formData = order.form_data ?? {}
  const status = resolveOrderStatus(formData, order.status)

  return NextResponse.json({
    ...buildOrderView(order),
    status,
    statusLabel: ORDER_STATUS_META[status].label,
    statusDescription: ORDER_STATUS_META[status].customerDescription,
    waitingOn: ORDER_STATUS_META[status].actor,
    deliverableIncludes: SERVICE_DELIVERABLES[order.project_path]?.includes ?? [],
  })
}
