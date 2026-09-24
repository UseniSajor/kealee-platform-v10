import { prisma } from '../../lib/prisma'
import { getStripe } from '../billing/stripe.client'

const db = prisma as any

function numberMap(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([, amount]) => typeof amount === 'number' && Number.isFinite(amount))) as Record<string, number>
}

function stringMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => typeof item === 'string' && item.length > 0)) as Record<string, string>
}

export async function rollupTenantUsage(orgId: string, periodStart: Date, periodEnd: Date) {
  if (periodEnd <= periodStart) throw Object.assign(new Error('Usage period end must be after its start'), { statusCode: 400 })
  const plan = await db.tenantPlan.findUnique({ where: { orgId } })
  const included = numberMap(plan?.includedUsage)
  const grouped = await db.tenantUsageEvent.groupBy({
    by: ['metric'],
    where: {
      orgId,
      status: { not: 'VOID' },
      occurredAt: { gte: periodStart, lt: periodEnd },
    },
    _sum: { quantity: true, unitCostCents: true },
  })

  const rollups: unknown[] = []
  for (const row of grouped) {
    const quantity = Number(row._sum.quantity ?? 0)
    const includedAmount = included[row.metric] ?? 0
    rollups.push(await db.tenantUsageRollup.upsert({
      where: { orgId_metric_periodStart_periodEnd: { orgId, metric: row.metric, periodStart, periodEnd } },
      update: {
        quantity,
        costCents: Number(row._sum.unitCostCents ?? 0),
        includedAmount,
        overageAmount: Math.max(0, quantity - includedAmount),
      },
      create: {
        orgId,
        metric: row.metric,
        periodStart,
        periodEnd,
        quantity,
        costCents: Number(row._sum.unitCostCents ?? 0),
        includedAmount,
        overageAmount: Math.max(0, quantity - includedAmount),
      },
    }))
  }
  return rollups
}

/** Reports pending idempotent facts to Stripe meters. The plan's
 * stripeMeterPriceIds map is intentionally interpreted as metric -> Stripe
 * meter event name; the legacy name is retained for migration compatibility. */
export async function reportPendingTenantUsageToStripe(orgId: string, limit = 100) {
  const plan = await db.tenantPlan.findUnique({ where: { orgId } })
  if (!plan?.stripeCustomerId) throw Object.assign(new Error('Tenant Stripe customer is not configured'), { statusCode: 409 })
  const meterNames = stringMap(plan.stripeMeterPriceIds)
  const pending = await db.tenantUsageEvent.findMany({
    where: { orgId, status: 'RECORDED', metric: { in: Object.keys(meterNames) } },
    orderBy: { occurredAt: 'asc' },
    take: Math.min(Math.max(limit, 1), 500),
  })
  if (!pending.length) return { reported: 0, skipped: 0 }

  const stripe: any = getStripe()
  let reported = 0
  let skipped = 0
  for (const event of pending) {
    const eventName = meterNames[event.metric]
    if (!eventName) { skipped += 1; continue }
    const result = await stripe.billing.meterEvents.create({
      event_name: eventName,
      identifier: `kealee_${event.id}`,
      timestamp: Math.floor(new Date(event.occurredAt).getTime() / 1000),
      payload: {
        stripe_customer_id: plan.stripeCustomerId,
        value: String(event.quantity),
      },
    })
    await db.tenantUsageEvent.update({
      where: { id: event.id },
      data: { status: 'REPORTED', stripeEventId: result.identifier ?? `kealee_${event.id}` },
    })
    reported += 1
  }
  return { reported, skipped }
}

export async function reconcileTenantUsage(orgId: string, periodStart: Date, periodEnd: Date) {
  const rollups = await rollupTenantUsage(orgId, periodStart, periodEnd)
  const stripe = await reportPendingTenantUsageToStripe(orgId).catch((error: Error & { statusCode?: number }) => {
    if (error.statusCode === 409) return { reported: 0, skipped: 0, deferred: error.message }
    throw error
  })
  return { rollups, stripe }
}
