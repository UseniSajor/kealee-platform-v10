/**
 * Access control for a single customer order.
 *
 * Two accepted proofs, both scoped to one intake:
 *   1. The per-order portal token issued into the customer's email link.
 *   2. A Supabase session whose email matches the order's contact email.
 *
 * Anything else is denied. Nothing here ever reveals whether an order exists
 * to an unauthorised caller — callers surface a single generic 404.
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export interface OrderRecord {
  id: string
  project_path: string
  client_name: string | null
  contact_email: string | null
  contact_phone: string | null
  project_address: string | null
  status: string | null
  created_at: string | null
  paid_at: string | null
  form_data: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
}

export type OrderAccessResult =
  | { ok: true; order: OrderRecord; via: 'token' | 'session' }
  | { ok: false; reason: 'not_found' | 'denied' }

const ORDER_COLUMNS =
  'id, project_path, client_name, contact_email, contact_phone, project_address, status, created_at, paid_at, form_data, metadata'

function tokenIsValid(order: OrderRecord, token: string): boolean {
  const bag = {
    ...((order.metadata as Record<string, unknown>) ?? {}),
    ...((order.form_data as Record<string, unknown>) ?? {}),
  }
  const stored = bag.portalToken
  if (typeof stored !== 'string' || stored.length === 0) return false
  if (stored !== token) return false

  const expiry = bag.portalTokenExpiresAt
  if (typeof expiry === 'string') {
    const expiresAt = Date.parse(expiry)
    if (Number.isFinite(expiresAt) && expiresAt < Date.now()) return false
  }
  return true
}

export async function authorizeOrderAccess(
  intakeId: string,
  token?: string | null,
): Promise<OrderAccessResult> {
  if (!intakeId) return { ok: false, reason: 'not_found' }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('public_intake_leads')
    .select(ORDER_COLUMNS)
    .eq('id', intakeId)
    .maybeSingle()

  if (error || !data) return { ok: false, reason: 'not_found' }
  const order = data as unknown as OrderRecord

  if (token && tokenIsValid(order, token)) {
    return { ok: true, order, via: 'token' }
  }

  try {
    const supabaseAuth = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()
    const sessionEmail = user?.email?.toLowerCase()
    const orderEmail = order.contact_email?.toLowerCase()
    if (sessionEmail && orderEmail && sessionEmail === orderEmail) {
      return { ok: true, order, via: 'session' }
    }
  } catch {
    // No session context available (e.g. static render) — fall through to deny.
  }

  return { ok: false, reason: 'denied' }
}
