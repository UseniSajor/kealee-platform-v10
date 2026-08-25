/**
 * Canonical customer-order lifecycle.
 *
 * Stored on `public_intake_leads.form_data.orderStatus` (JSONB) rather than in
 * a new column: the `status` column is a constrained DB enum consumed by the
 * webhook, the concept generator, and the portals, and widening it would be a
 * schema change on a live table. The JSONB field carries the richer lifecycle
 * that admins and customers see, and always coexists with the column value.
 */

export const ORDER_STATUSES = [
  'draft',
  'intake_submitted',
  'awaiting_customer_information',
  'in_review',
  'processing',
  'needs_professional_review',
  'needs_customer_approval',
  'ready_for_delivery',
  'delivered',
  'revision_requested',
  'cancelled',
  'failed',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

interface OrderStatusMeta {
  label: string
  /** What the customer should understand is happening. */
  customerDescription: string
  /** Who has to act next. */
  actor: 'kealee' | 'customer' | 'none'
  /** Terminal states are not retried automatically. */
  terminal: boolean
}

export const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  draft: {
    label: 'Draft',
    customerDescription: 'Your intake has been started but not submitted.',
    actor: 'customer',
    terminal: false,
  },
  intake_submitted: {
    label: 'Intake Submitted',
    customerDescription: 'We have your project details and are opening your order.',
    actor: 'kealee',
    terminal: false,
  },
  awaiting_customer_information: {
    label: 'Awaiting Customer Information',
    customerDescription:
      'We need a few more items from you before work can continue. Your checklist below shows what is outstanding.',
    actor: 'customer',
    terminal: false,
  },
  in_review: {
    label: 'In Review',
    customerDescription: 'A Kealee reviewer is working through your project by hand.',
    actor: 'kealee',
    terminal: false,
  },
  processing: {
    label: 'Product being prepared',
    customerDescription: 'Your product is being prepared. We’ll let you know when it’s ready.',
    actor: 'kealee',
    terminal: false,
  },
  needs_professional_review: {
    label: 'Needs Professional Review',
    customerDescription:
      'Your deliverable is drafted and is queued for review by a qualified professional before release.',
    actor: 'kealee',
    terminal: false,
  },
  needs_customer_approval: {
    label: 'Needs Customer Approval',
    customerDescription: 'Review the draft and approve it, or tell us what to change.',
    actor: 'customer',
    terminal: false,
  },
  ready_for_delivery: {
    label: 'Ready for Delivery',
    customerDescription: 'Your deliverable has cleared review and is being released.',
    actor: 'kealee',
    terminal: false,
  },
  delivered: {
    label: 'Delivered',
    customerDescription: 'Your deliverable is available to download.',
    actor: 'none',
    terminal: true,
  },
  revision_requested: {
    label: 'Revision Requested',
    customerDescription: 'We are working through the revisions you asked for.',
    actor: 'kealee',
    terminal: false,
  },
  cancelled: {
    label: 'Cancelled',
    customerDescription: 'This order was cancelled.',
    actor: 'none',
    terminal: true,
  },
  failed: {
    label: 'Failed',
    customerDescription:
      'Something went wrong producing this order. A Kealee reviewer has been alerted and will pick it up by hand.',
    actor: 'kealee',
    terminal: false,
  },
}

/**
 * Customer-safe projection of an internal lifecycle state. Provider or worker
 * failures are retained in the order record for staff recovery, but customers
 * should see that Kealee is preparing their product rather than an error state.
 */
export function customerOrderStatus(status: OrderStatus): OrderStatus {
  return status === 'failed' ? 'processing' : status
}

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && (ORDER_STATUSES as readonly string[]).includes(value)
}

/**
 * Best-effort read of the lifecycle status for one order, falling back to the
 * legacy `status` column for orders created before the lifecycle existed.
 */
export function resolveOrderStatus(
  formData: Record<string, unknown> | null | undefined,
  columnStatus?: string | null,
): OrderStatus {
  const explicit = formData?.orderStatus
  if (isOrderStatus(explicit)) return explicit

  switch (columnStatus) {
    case 'delivered':
    case 'concept_ready':
      return 'delivered'
    case 'paid':
      return 'processing'
    case 'cancelled':
      return 'cancelled'
    case 'new':
      return 'intake_submitted'
    default:
      return 'intake_submitted'
  }
}

export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_META[status].label
}

/** Statuses an admin may set by hand from the command center. */
export const ADMIN_SETTABLE_STATUSES: OrderStatus[] = [
  'awaiting_customer_information',
  'in_review',
  'processing',
  'needs_professional_review',
  'needs_customer_approval',
  'ready_for_delivery',
  'delivered',
  'revision_requested',
  'cancelled',
  'failed',
]

/** Patch to merge into `form_data` when moving an order to a new status. */
export function orderStatusPatch(
  status: OrderStatus,
  detail?: { reason?: string; actor?: string },
): Record<string, unknown> {
  return {
    orderStatus: status,
    orderStatusLabel: ORDER_STATUS_META[status].label,
    orderStatusAt: new Date().toISOString(),
    ...(detail?.reason ? { orderStatusReason: detail.reason } : {}),
    ...(detail?.actor ? { orderStatusSetBy: detail.actor } : {}),
  }
}
