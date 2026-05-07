/**
 * GA4 Server-Side Analytics (Measurement Protocol)
 *
 * Uses GA4 Measurement Protocol to track events server-side.
 * Requires NEXT_PUBLIC_GA4_ID (G-XXXXXXXX) and GA4_API_SECRET.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/ga4
 */

const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_ID        ?? ''
const GA4_API_SECRET      = process.env.GA4_API_SECRET            ?? ''
const GA4_ENDPOINT        = 'https://www.google-analytics.com/mp/collect'

// ── Typed event names ─────────────────────────────────────────────────────────

export const GA4_EVENTS = {
  // Concept funnel
  concept_start:      'concept_start',
  concept_submit:     'concept_submit',
  concept_purchased:  'concept_purchased',

  // Permit funnel
  permit_inquiry:     'permit_inquiry',
  permit_purchased:   'permit_purchased',

  // Lead events
  lead_captured:      'lead_captured',
  lead_qualified:     'lead_qualified',

  // Payment events
  payment_complete:   'payment_complete',
  payment_failed:     'payment_failed',

  // Engagement
  page_view:          'page_view',
  form_start:         'form_start',
  form_submit:        'form_submit',
  cta_click:          'cta_click',
  blog_view:          'blog_view',

  // Marketing
  meta_lead_received:    'meta_lead_received',
  google_lead_received:  'google_lead_received',
  sms_reply_received:    'sms_reply_received',
  sequence_step_sent:    'sequence_step_sent',
} as const

export type GA4EventName = (typeof GA4_EVENTS)[keyof typeof GA4_EVENTS]

// ── Event parameter types ─────────────────────────────────────────────────────

export interface GA4EventParams {
  // Standard GA4 params
  currency?:        'USD'
  value?:           number
  transaction_id?:  string
  item_category?:   string

  // Kealee custom dims
  project_type?:    string
  lead_source?:     string
  utm_source?:      string
  utm_medium?:      string
  utm_campaign?:    string
  contact_id?:      string
  concept_id?:      string
  sequence_id?:     string
  step_type?:       string

  // Arbitrary extra
  [key: string]: string | number | boolean | undefined
}

// ── Core tracking function ────────────────────────────────────────────────────

/**
 * Fire a GA4 Measurement Protocol event.
 *
 * @param clientId  - GA4 client_id (from cookie _ga, or generated UUID)
 * @param eventName - one of GA4_EVENTS values
 * @param params    - typed event parameters
 */
export async function trackServerEvent(
  clientId:  string,
  eventName: GA4EventName,
  params:    GA4EventParams = {},
): Promise<boolean> {
  if (!GA4_MEASUREMENT_ID || !GA4_API_SECRET) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ga4] DEV event: ${eventName}`, params)
    }
    return false
  }

  try {
    const url = `${GA4_ENDPOINT}?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        events:    [{ name: eventName, params }],
      }),
    })

    return res.ok
  } catch (e: any) {
    console.error('[ga4] trackServerEvent error:', e?.message)
    return false
  }
}

// ── Convenience wrappers ──────────────────────────────────────────────────────

export async function trackConceptStart(
  clientId:    string,
  projectType: string,
  source?:     string,
): Promise<void> {
  await trackServerEvent(clientId, 'concept_start', { project_type: projectType, lead_source: source })
}

export async function trackConceptPurchase(
  clientId:    string,
  value:       number,
  projectType: string,
  conceptId:   string,
): Promise<void> {
  await trackServerEvent(clientId, 'concept_purchased', {
    currency:       'USD',
    value,
    project_type:   projectType,
    concept_id:     conceptId,
    transaction_id: conceptId,
  })
}

export async function trackLeadCaptured(
  clientId:  string,
  source:    string,
  projectType?: string,
): Promise<void> {
  await trackServerEvent(clientId, 'lead_captured', {
    lead_source:  source,
    project_type: projectType,
  })
}

export async function trackPaymentComplete(
  clientId:       string,
  value:          number,
  transactionId:  string,
  itemCategory:   string,
): Promise<void> {
  await trackServerEvent(clientId, 'payment_complete', {
    currency:       'USD',
    value,
    transaction_id: transactionId,
    item_category:  itemCategory,
  })
}

export async function trackPermitInquiry(
  clientId:     string,
  jurisdiction: string,
  projectType:  string,
): Promise<void> {
  await trackServerEvent(clientId, 'permit_inquiry', {
    lead_source:  jurisdiction,
    project_type: projectType,
  })
}
