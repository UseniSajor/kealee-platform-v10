/**
 * GA4 Measurement Protocol — server-side events (Phase 3).
 * Uses NEXT_PUBLIC_GA_MEASUREMENT_ID (layout) or NEXT_PUBLIC_GA4_ID + GA4_API_SECRET.
 */

import type { UTMParams } from '@/lib/marketing/utm'
import { utmToMetadataFields } from '@/lib/marketing/utm-metadata'

const GA4_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ??
  process.env.NEXT_PUBLIC_GA4_ID ??
  ''
const GA4_API_SECRET = process.env.GA4_API_SECRET ?? ''
const GA4_ENDPOINT = 'https://www.google-analytics.com/mp/collect'

export type MarketingGA4Event =
  | 'lead_submitted'
  | 'checkout_started'
  | 'purchase'
  | 'lead_captured'
  | 'payment_complete'

export interface GA4EventParams {
  currency?: 'USD'
  value?: number
  transaction_id?: string
  project_type?: string
  lead_source?: string
  intake_id?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  [key: string]: string | number | boolean | undefined
}

function clientIdFromIntake(intakeId: string): string {
  return intakeId.replace(/-/g, '').slice(0, 32) || intakeId
}

export async function trackServerGA4(
  clientId: string,
  eventName: MarketingGA4Event,
  params: GA4EventParams = {},
): Promise<boolean> {
  if (!GA4_MEASUREMENT_ID || !GA4_API_SECRET) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ga4] ${eventName}`, params)
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
        events: [{ name: eventName, params }],
      }),
    })
    return res.ok
  } catch (e: unknown) {
    console.error('[ga4]', eventName, e instanceof Error ? e.message : e)
    return false
  }
}

export async function trackLeadSubmitted(opts: {
  intakeId: string
  projectPath: string
  source: string
  utm?: UTMParams
}): Promise<void> {
  const utmFields = opts.utm ? utmToMetadataFields(opts.utm) : {}
  const base = {
    project_type: opts.projectPath,
    lead_source: opts.source,
    intake_id: opts.intakeId,
    utm_source: utmFields.utm_source,
    utm_medium: utmFields.utm_medium,
    utm_campaign: utmFields.utm_campaign,
  }
  await trackServerGA4(clientIdFromIntake(opts.intakeId), 'lead_submitted', base)
  await trackServerGA4(clientIdFromIntake(opts.intakeId), 'lead_captured', base)
}

export async function trackCheckoutStarted(opts: {
  intakeId: string
  projectPath: string
  valueCents: number
  utm?: UTMParams
}): Promise<void> {
  const u = utmToMetadataFields(opts.utm ?? {})
  await trackServerGA4(clientIdFromIntake(opts.intakeId), 'checkout_started', {
    currency: 'USD',
    value: opts.valueCents / 100,
    project_type: opts.projectPath,
    intake_id: opts.intakeId,
    utm_source: u.utm_source,
    utm_medium: u.utm_medium,
    utm_campaign: u.utm_campaign,
  })
}

export async function trackPurchase(opts: {
  intakeId: string
  projectPath: string
  valueCents: number
  utm?: UTMParams
}): Promise<void> {
  const u = utmToMetadataFields(opts.utm ?? {})
  const base = {
    currency: 'USD' as const,
    value: opts.valueCents / 100,
    transaction_id: opts.intakeId,
    project_type: opts.projectPath,
    intake_id: opts.intakeId,
    utm_source: u.utm_source,
    utm_medium: u.utm_medium,
    utm_campaign: u.utm_campaign,
  }
  await trackServerGA4(clientIdFromIntake(opts.intakeId), 'purchase', base)
  await trackServerGA4(clientIdFromIntake(opts.intakeId), 'payment_complete', base)
}
