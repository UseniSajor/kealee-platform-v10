/**
 * POST /api/marketing/meta-lead
 *
 * Meta (Facebook/Instagram) Lead Ads webhook endpoint.
 * - Validates X-Hub-Signature-256 HMAC
 * - Returns 200 immediately (Meta requires fast response)
 * - Delegates to concept-lead logic fire-and-forget
 *
 * Meta Lead Gen webhook format:
 * https://developers.facebook.com/docs/marketing-api/guides/lead-ads/create
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHmac }                from 'crypto'
import { getSupabaseAdmin }          from '@/lib/supabase-server'
import { createOrUpdateContact }     from '@/lib/marketing/ghl-client'
import { scheduleSequence }          from '@/lib/marketing/sequences'

export const dynamic = 'force-dynamic'

const META_WEBHOOK_SECRET = process.env.META_WEBHOOK_SECRET ?? ''

// ── HMAC signature verification ───────────────────────────────────────────────

function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!META_WEBHOOK_SECRET) return true  // skip in dev if not configured
  if (!signatureHeader) return false

  const [, digest] = signatureHeader.split('=')
  const expected   = createHmac('sha256', META_WEBHOOK_SECRET)
    .update(rawBody, 'utf8')
    .digest('hex')

  return digest === expected
}

// ── Meta field key normalizer ─────────────────────────────────────────────────

interface MetaFieldData {
  name:  string
  values: string[]
}

function extractMetaFields(fieldData: MetaFieldData[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const f of fieldData ?? []) {
    out[f.name.toLowerCase().replace(/\s+/g, '_')] = f.values?.[0] ?? ''
  }
  return out
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Read raw body for HMAC verification
  const rawBody = await req.text()
  const sig     = req.headers.get('X-Hub-Signature-256')

  if (!verifyMetaSignature(rawBody, sig)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  // Return 200 immediately — Meta requires < 5s response
  // Process asynchronously
  void (async () => {
    try {
      const payload = JSON.parse(rawBody)

      // Meta webhook structure: entry[].changes[].value.leads_info
      for (const entry of payload?.entry ?? []) {
        for (const change of entry?.changes ?? []) {
          const leads: Array<{
            leadgen_id: string
            field_data: MetaFieldData[]
            created_time?: number
          }> = change?.value?.leads_info ?? []

          for (const lead of leads) {
            const fields      = extractMetaFields(lead.field_data ?? [])
            const email       = fields.email ?? fields.email_address ?? ''
            const firstName   = fields.first_name ?? fields.full_name?.split(' ')[0] ?? ''
            const lastName    = fields.last_name ?? fields.full_name?.split(' ').slice(1).join(' ') ?? ''
            const phone       = fields.phone_number ?? fields.phone ?? ''
            const projectType = fields.project_type ?? fields.service ?? 'kitchen_remodel'
            const location    = fields.city ?? fields.location ?? fields.zip_code ?? ''

            if (!email) continue

            // Save to Supabase
            try {
              const supabase = getSupabaseAdmin()
              await supabase.from('public_intake_leads').insert({
                project_path:     projectType,
                client_name:      [firstName, lastName].filter(Boolean).join(' ') || email.split('@')[0],
                contact_email:    email,
                contact_phone:    phone || null,
                project_address:  location || 'Not provided',
                source:           'meta_lead_ad',
                status:           'new',
                requires_payment: true,
                payment_amount:   0,
                form_data: {
                  leadgen_id: lead.leadgen_id,
                  fields,
                },
                metadata: {
                  source:      'meta_lead_ad',
                  capturedAt:  new Date().toISOString(),
                },
              })
            } catch (e: any) {
              console.error('[meta-lead] Supabase error:', e?.message)
            }

            // GHL contact + sequence
            if (process.env.GHL_API_KEY) {
              try {
                const contact = await createOrUpdateContact({
                  email,
                  firstName,
                  lastName,
                  phone: phone || undefined,
                  source: 'meta_lead_ad',
                  tags: ['meta-lead-ad', 'concept-inquiry'],
                })

                await scheduleSequence(
                  lead.leadgen_id,
                  contact.id,
                  'CONCEPT_SEQUENCE',
                  {
                    firstName:       firstName || 'there',
                    projectType:     projectType.replace(/_/g, ' '),
                    projectSlug:     projectType,
                    location:        location || 'your area',
                    conceptPrice:    '395',
                    conceptPriceHigh: '585',
                  },
                )
              } catch (e: any) {
                console.error('[meta-lead] GHL error:', e?.message)
              }
            }
          }
        }
      }
    } catch (e: any) {
      console.error('[meta-lead] Processing error:', e?.message)
    }
  })()

  return NextResponse.json({ status: 'ok' }, { status: 200 })
}

// ── GET — Meta webhook verification challenge ─────────────────────────────────

export function GET(req: NextRequest): NextResponse {
  const { searchParams } = new URL(req.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.META_VERIFY_TOKEN ?? ''

  if (mode === 'subscribe' && token === verifyToken) {
    return new NextResponse(challenge ?? '', { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
