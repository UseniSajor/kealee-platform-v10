/**
 * POST /api/marketing/sms-reply
 *
 * Receives inbound SMS replies forwarded by GHL.
 * - 'YES' → tags contact as hot lead, advances pipeline stage
 * - '1' / '2' / '3' → updates custom field (package tier preference)
 * - 'STOP' / 'UNSUBSCRIBE' → marks contact opted-out
 *
 * Returns 200 immediately (GHL webhook requirement).
 */

import { NextRequest, NextResponse } from 'next/server'
import { tagContact, updateContactField } from '@/lib/marketing/ghl-client'

export const dynamic = 'force-dynamic'

interface GhlSmsPayload {
  contactId?:      string
  phone?:          string
  message?:        string
  body?:           string
  conversationId?: string
  locationId?:     string
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Parse body — return 200 immediately regardless
  void (async () => {
    try {
      const payload: GhlSmsPayload = await req.json()
      const contactId  = payload.contactId
      const rawMessage = (payload.message ?? payload.body ?? '').trim().toUpperCase()

      if (!contactId || !rawMessage) return

      const ghlEnabled = !!process.env.GHL_API_KEY

      if (rawMessage === 'YES' || rawMessage === 'Y') {
        // Hot lead — tag and update field
        if (ghlEnabled) {
          await tagContact(contactId, ['replied-yes', 'hot-lead'])
          await updateContactField(contactId, 'sms_reply_intent', 'YES')
        }
        console.log(`[sms-reply] Hot lead reply: contactId=${contactId}`)
      } else if (rawMessage === '1' || rawMessage === '2' || rawMessage === '3') {
        // Package tier preference
        if (ghlEnabled) {
          await updateContactField(contactId, 'preferred_tier', rawMessage)
          await tagContact(contactId, [`tier-${rawMessage}-interest`])
        }
        console.log(`[sms-reply] Tier preference: contactId=${contactId} tier=${rawMessage}`)
      } else if (['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'].includes(rawMessage)) {
        // Opt-out
        if (ghlEnabled) {
          await updateContactField(contactId, 'email_opt_out', 'true')
          await updateContactField(contactId, 'sms_opt_out', 'true')
          await tagContact(contactId, ['opted-out-sms'])
        }
        console.log(`[sms-reply] Opt-out: contactId=${contactId}`)
      } else {
        // Unknown reply — log for manual review
        console.log(`[sms-reply] Unrecognized reply: contactId=${contactId} message="${rawMessage}"`)
        if (ghlEnabled) {
          await updateContactField(contactId, 'last_sms_reply', rawMessage.slice(0, 100))
        }
      }
    } catch (e: any) {
      console.error('[sms-reply] Error:', e?.message)
    }
  })()

  return NextResponse.json({ status: 'ok' }, { status: 200 })
}
