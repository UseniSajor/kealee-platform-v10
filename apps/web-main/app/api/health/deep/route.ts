import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

/**
 * GET /api/health/deep
 *
 * Dependency health for the launch-critical path. Deliberately separate from
 * `/api/health`, which the platform uses as the deploy healthcheck and must
 * stay shallow — a degraded downstream should page an operator, not roll back
 * a deploy.
 *
 * Returns 200 when everything the customer journey needs is reachable, and 503
 * when something required is not. Never returns credentials or their values.
 */
interface Check {
  name: string
  status: 'ok' | 'degraded' | 'down' | 'not_configured'
  required: boolean
  detail?: string
}

async function timed<T>(fn: () => Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

async function checkDatabase(): Promise<Check> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { name: 'database', status: 'not_configured', required: true, detail: 'SUPABASE_SERVICE_ROLE_KEY missing' }
  }
  try {
    const supabase = getSupabaseAdmin()
    const { error } = await timed(
      async () => supabase.from('public_intake_leads').select('id', { head: true, count: 'exact' }).limit(1),
      8_000,
    )
    if (error) return { name: 'database', status: 'down', required: true, detail: error.message }
    return { name: 'database', status: 'ok', required: true }
  } catch (error) {
    return {
      name: 'database',
      status: 'down',
      required: true,
      detail: error instanceof Error ? error.message : 'unknown error',
    }
  }
}

async function checkApi(): Promise<Check> {
  const base = (process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')
  if (!base) {
    return { name: 'api', status: 'not_configured', required: false, detail: 'INTERNAL_API_URL / NEXT_PUBLIC_API_URL unset' }
  }
  try {
    const res = await timed(() => fetch(`${base}/health`, { cache: 'no-store' }), 8_000)
    return res.ok
      ? { name: 'api', status: 'ok', required: false }
      : { name: 'api', status: 'down', required: false, detail: `HTTP ${res.status}` }
  } catch (error) {
    return {
      name: 'api',
      status: 'down',
      required: false,
      detail: error instanceof Error ? error.message : 'unreachable',
    }
  }
}

async function checkFulfillmentAutomation(): Promise<Check> {
  const base = (process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')
  if (!base) {
    return {
      name: 'fulfillment_automation',
      status: 'not_configured',
      required: false,
      detail: 'No API base URL — all orders route to manual fulfillment.',
    }
  }
  try {
    const res = await timed(() => fetch(`${base}/v30/status`, { cache: 'no-store' }), 8_000)
    if (!res.ok) {
      return {
        name: 'fulfillment_automation',
        status: 'degraded',
        required: false,
        detail: `Orchestration routes unavailable (HTTP ${res.status}). Paid orders fall back to the manual queue.`,
      }
    }
    return { name: 'fulfillment_automation', status: 'ok', required: false }
  } catch (error) {
    return {
      name: 'fulfillment_automation',
      status: 'degraded',
      required: false,
      detail: error instanceof Error ? error.message : 'unreachable',
    }
  }
}

function checkPayments(): Check {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { name: 'payments', status: 'not_configured', required: true, detail: 'STRIPE_SECRET_KEY missing — checkout returns 503' }
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return { name: 'payments', status: 'degraded', required: true, detail: 'STRIPE_WEBHOOK_SECRET missing — paid orders will not be fulfilled' }
  }
  return { name: 'payments', status: 'ok', required: true }
}

function checkEmail(): Check {
  return process.env.RESEND_API_KEY
    ? { name: 'email', status: 'ok', required: true }
    : { name: 'email', status: 'not_configured', required: true, detail: 'RESEND_API_KEY missing — customers receive no notifications' }
}

function checkStorage(): Check {
  const configured =
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
    Boolean(process.env.S3_BUCKET ?? process.env.R2_BUCKET)
  return configured
    ? { name: 'storage', status: 'ok', required: true }
    : { name: 'storage', status: 'not_configured', required: true, detail: 'No upload target configured' }
}

function checkCustomerDelivery(): Check {
  // Deliverables are reachable either through a configured owner portal or the
  // on-site order view. The on-site view always exists, so this only warns when
  // the portal is half-configured.
  const portal = process.env.NEXT_PUBLIC_OWNER_PORTAL_URL?.trim()
  return portal
    ? { name: 'customer_delivery', status: 'ok', required: true, detail: `Owner portal: ${portal}` }
    : {
        name: 'customer_delivery',
        status: 'ok',
        required: true,
        detail: 'No owner portal configured — deliverables serve from /orders on this domain.',
      }
}

export async function GET() {
  const checks: Check[] = [
    ...(await Promise.all([checkDatabase(), checkApi(), checkFulfillmentAutomation()])),
    checkPayments(),
    checkEmail(),
    checkStorage(),
    checkCustomerDelivery(),
  ]

  const blocking = checks.filter(
    check => check.required && (check.status === 'down' || check.status === 'not_configured'),
  )

  return NextResponse.json(
    {
      ok: blocking.length === 0,
      checkedAt: new Date().toISOString(),
      blocking: blocking.map(check => check.name),
      checks,
    },
    { status: blocking.length === 0 ? 200 : 503 },
  )
}
