/**
 * POST /api/marketing/google-conversion
 *
 * Fires a Google Ads Measurement Protocol conversion event.
 * Auth: x-marketing-bot-key header.
 *
 * Google Ads Measurement Protocol:
 * https://developers.google.com/google-ads/api/docs/conversions/upload-clicks
 */

import { NextRequest, NextResponse } from 'next/server'
import { z }                         from 'zod'

const Schema = z.object({
  source:          z.string(),
  campaignId:      z.string(),
  adGroupId:       z.string(),
  keyword:         z.string().optional(),
  conversionValue: z.number().positive(),
  contactId:       z.string(),
  conceptId:       z.string().optional(),
  gclid:           z.string().optional(),  // Google Click ID
})

type Body = z.infer<typeof Schema>

const GOOGLE_ADS_DEVELOPER_TOKEN   = process.env.GOOGLE_ADS_DEVELOPER_TOKEN   ?? ''
const GOOGLE_ADS_CUSTOMER_ID       = process.env.GOOGLE_ADS_CUSTOMER_ID        ?? ''
const GOOGLE_ADS_CONVERSION_ACTION = process.env.GOOGLE_ADS_CONVERSION_ACTION  ?? ''
const GOOGLE_ADS_ACCESS_TOKEN      = process.env.GOOGLE_ADS_ACCESS_TOKEN        ?? ''

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Auth
  const requiredKey = process.env.MARKETING_BOT_API_KEY
  if (requiredKey) {
    const provided = req.headers.get('x-marketing-bot-key')
    if (provided !== requiredKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let body: Body
  try {
    const raw    = await req.json()
    const parsed = Schema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
    }
    body = parsed.data
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Fire Measurement Protocol (fire-and-forget)
  void (async () => {
    try {
      if (!GOOGLE_ADS_DEVELOPER_TOKEN || !GOOGLE_ADS_CUSTOMER_ID || !GOOGLE_ADS_CONVERSION_ACTION) {
        console.warn('[google-conversion] Google Ads env vars not configured — skipping')
        return
      }

      const customerId = GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, '')

      const conversionPayload = {
        conversions: [
          {
            gclid:            body.gclid ?? undefined,
            conversionAction: `customers/${customerId}/conversionActions/${GOOGLE_ADS_CONVERSION_ACTION}`,
            conversionDateTime: new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '+00:00'),
            conversionValue:  body.conversionValue,
            currencyCode:     'USD',
          },
        ],
        partialFailure: true,
        validateOnly:   false,
      }

      const res = await fetch(
        `https://googleads.googleapis.com/v14/customers/${customerId}:uploadClickConversions`,
        {
          method:  'POST',
          headers: {
            Authorization:          `Bearer ${GOOGLE_ADS_ACCESS_TOKEN}`,
            'developer-token':      GOOGLE_ADS_DEVELOPER_TOKEN,
            'Content-Type':         'application/json',
          },
          body: JSON.stringify(conversionPayload),
        },
      )

      if (!res.ok) {
        const text = await res.text()
        console.error('[google-conversion] Google Ads API error:', res.status, text)
      } else {
        console.log('[google-conversion] Conversion uploaded successfully for contactId:', body.contactId)
      }
    } catch (e: any) {
      console.error('[google-conversion] Error:', e?.message)
    }
  })()

  return NextResponse.json({ success: true })
}
