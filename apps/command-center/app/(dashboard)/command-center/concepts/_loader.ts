"use server";

/**
 * Concept intake queue loader — queries Supabase public_intake_leads directly.
 * Maps the real schema to the shape expected by IntakeQueue / IntakeDetail.
 */

import { createClient } from '@supabase/supabase-js'

// ── Types matching the queue/detail component contracts ───────────────────────

export interface ConceptQueueItem {
  id: string
  packageName: string
  packageTier: string       // project_path label
  deliveryStatus: string    // mapped from status
  status: string
  createdAt: string
  user?: { name?: string; email?: string }
  metadata?: Record<string, unknown>
}

export interface ConceptQueueResult {
  orders: ConceptQueueItem[]
  total: number
}

// ── Status mapping ────────────────────────────────────────────────────────────

function deliveryStatus(status: string): string {
  if (status === 'concept_ready' || status === 'paid') return 'ready'
  if (status === 'processing')                          return 'generating'
  return 'pending'
}

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars not set')
  return createClient(url, key, { auth: { persistSession: false } })
}

// ── Queue loader ──────────────────────────────────────────────────────────────

export async function loadConceptQueue(params?: {
  deliveryStatus?: string
  limit?: number
}): Promise<ConceptQueueResult> {
  try {
    const supabase = getClient()
    let query = supabase
      .from('public_intake_leads')
      .select('id, project_path, status, contact_email, client_name, created_at, form_data, project_address, budget_range')
      .order('created_at', { ascending: false })
      .limit(params?.limit ?? 50)

    // Filter by mapped status if requested
    if (params?.deliveryStatus === 'ready') {
      query = query.in('status', ['concept_ready', 'paid'])
    } else if (params?.deliveryStatus === 'generating') {
      query = query.eq('status', 'processing')
    } else if (params?.deliveryStatus === 'pending') {
      query = query.eq('status', 'new')
    }

    const { data, error } = await query
    if (error || !data) return { orders: [], total: 0 }

    const orders: ConceptQueueItem[] = data.map(row => {
      const fd  = (row.form_data as Record<string, unknown> | null) ?? {}
      const tier = typeof fd.tier === 'number' ? fd.tier : 1
      return {
        id:            row.id,
        packageName:   (row.project_path ?? 'unknown').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        packageTier:   row.project_path ?? 'unknown',
        deliveryStatus: deliveryStatus(row.status),
        status:        row.status,
        createdAt:     row.created_at,
        user: {
          name:  (row as { client_name?: string }).client_name ?? undefined,
          email: row.contact_email ?? undefined,
        },
        metadata: {
          intakeData: {
            projectAddress: (row as { project_address?: string }).project_address ?? '',
            budgetRange:    (row as { budget_range?: string }).budget_range ?? '',
            tier,
          },
          leadScore: {
            tier: tier >= 3 ? 'hot' : tier >= 2 ? 'warm' : 'cold',
          },
          outputs: {
            designBrief:        (fd.conceptOutput as Record<string, unknown>)?.designBrief ?? null,
            permitPathSummary:  (fd.conceptOutput as Record<string, unknown>)?.permitPathSummary ?? null,
          },
        },
      }
    })

    return { orders, total: orders.length }
  } catch {
    return { orders: [], total: 0 }
  }
}

// ── Detail loader ─────────────────────────────────────────────────────────────

export async function loadConceptOrderDetail(id: string): Promise<ConceptQueueItem | null> {
  try {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('public_intake_leads')
      .select('id, project_path, status, contact_email, client_name, created_at, form_data, project_address, budget_range')
      .eq('id', id)
      .single()

    if (error || !data) return null

    const fd  = (data.form_data as Record<string, unknown> | null) ?? {}
    const co  = (fd.conceptOutput as Record<string, unknown> | null) ?? {}
    const tier = typeof fd.tier === 'number' ? fd.tier : 1

    return {
      id:            data.id,
      packageName:   (data.project_path ?? 'unknown').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      packageTier:   data.project_path ?? 'unknown',
      deliveryStatus: deliveryStatus(data.status),
      status:        data.status,
      createdAt:     data.created_at,
      user: {
        name:  (data as { client_name?: string }).client_name ?? undefined,
        email: data.contact_email ?? undefined,
      },
      metadata: {
        intakeData: {
          projectAddress: (data as { project_address?: string }).project_address ?? '',
          budgetRange:    (data as { budget_range?: string }).budget_range ?? '',
          jurisdiction:   (fd.jurisdiction as string) ?? '',
          photos:         Array.isArray(co.renderUrls) ? co.renderUrls : [],
          tier,
        },
        leadScore: {
          tier: tier >= 3 ? 'hot' : tier >= 2 ? 'warm' : 'cold',
        },
        outputs: {
          designBrief: co.designBrief
            ? { summary: typeof co.designBrief === 'string' ? co.designBrief : JSON.stringify(co.designBrief) }
            : null,
          permitPathSummary: co.permitPathSummary
            ? { notes: Array.isArray((co.permitPathSummary as any).keyRequirements)
                ? (co.permitPathSummary as any).keyRequirements
                : [typeof co.permitPathSummary === 'string' ? co.permitPathSummary : JSON.stringify(co.permitPathSummary)]
              }
            : null,
          exteriorConceptImages:  Array.isArray(co.renderUrls) ? (co.renderUrls as string[]).slice(0, 3) : [],
          landscapeConceptImages: Array.isArray(co.renderUrls) ? (co.renderUrls as string[]).slice(3, 6) : [],
        },
      },
    }
  } catch {
    return null
  }
}

// ── Delivery status update ────────────────────────────────────────────────────

export async function updateDeliveryStatus(
  id: string,
  newDeliveryStatus: string,
  _deliveryUrl?: string,
): Promise<void> {
  const statusMap: Record<string, string> = {
    pending:    'new',
    generating: 'processing',
    ready:      'concept_ready',
    delivered:  'concept_ready',
  }
  const supabaseStatus = statusMap[newDeliveryStatus] ?? newDeliveryStatus
  const supabase = getClient()
  await supabase
    .from('public_intake_leads')
    .update({ status: supabaseStatus })
    .eq('id', id)
}
