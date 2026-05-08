/**
 * GET /api/marketing/unsubscribe?token=<jwt>
 *
 * Email unsubscribe endpoint. Verifies a signed token, marks the contact
 * as opted-out in GHL and Supabase, returns an HTML confirmation page.
 *
 * Token payload: { contactId: string, email: string, iat: number }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHmac }                from 'crypto'
import { getSupabaseAdmin }          from '@/lib/supabase-server'
import { updateContactField }        from '@/lib/marketing/ghl-client'

export const dynamic = 'force-dynamic'


const SITE_URL           = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kealee.com'
const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_JWT_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'kealee-unsubscribe-secret'

// ── Minimal JWT verification (HS256, no external dep required) ────────────────

function base64urlDecode(str: string): string {
  const pad = str.length % 4
  const padded = pad ? str + '='.repeat(4 - pad) : str
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
}

function verifyToken(token: string): { contactId?: string; email?: string } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [headerB64, payloadB64, sig] = parts
    const expected = createHmac('sha256', UNSUBSCRIBE_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url')

    if (sig !== expected) return null

    return JSON.parse(base64urlDecode(payloadB64))
  } catch {
    return null
  }
}

// ── HTML response helper ──────────────────────────────────────────────────────

function htmlPage(title: string, body: string): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} — Kealee</title>
  <style>
    body{font-family:sans-serif;max-width:560px;margin:80px auto;padding:24px;color:#4A5568;text-align:center}
    h1{color:#1A2B4A;font-size:24px;margin-bottom:16px}
    p{line-height:1.6;margin-bottom:16px}
    a{color:#2ABFBF}
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${body}
</body>
</html>`,
    {
      status:  200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    },
  )
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const token            = searchParams.get('token')
  const emailParam       = searchParams.get('email')  // fallback for plain-email unsubscribe

  // Token-based unsubscribe
  if (token) {
    const payload = verifyToken(token)
    if (!payload) {
      return htmlPage(
        'Invalid unsubscribe link',
        '<p>This unsubscribe link is invalid or has expired. Please contact <a href="mailto:hello@kealee.com">hello@kealee.com</a> to opt out.</p>',
      )
    }

    const { contactId, email } = payload

    // Mark opt-out in GHL
    if (contactId && process.env.GHL_API_KEY) {
      try {
        await updateContactField(contactId, 'email_opt_out', 'true')
      } catch (e: any) {
        console.error('[unsubscribe] GHL opt-out error:', e?.message)
      }
    }

    // Mark opt-out in Supabase
    if (email) {
      try {
        const supabase = getSupabaseAdmin()
        await supabase
          .from('public_intake_leads')
          .update({ status: 'unsubscribed', metadata: { unsubscribedAt: new Date().toISOString() } })
          .eq('contact_email', email)
      } catch (e: any) {
        console.error('[unsubscribe] Supabase opt-out error:', e?.message)
      }

      // Cancel pending drip steps
      if (contactId) {
        try {
          const supabase = getSupabaseAdmin()
          await supabase
            .from('ghl_sequence_queue')
            .update({ status: 'cancelled' })
            .eq('status', 'pending')
            .eq('ghl_contact_id', contactId)
        } catch (e: any) {
          console.error('[unsubscribe] Drip cancel error:', e?.message)
        }
      }
    }

    return htmlPage(
      'You\'ve been unsubscribed',
      `<p>You've been successfully removed from Kealee marketing emails.</p>
       <p>You may still receive transactional emails related to active projects.</p>
       <p><a href="${SITE_URL}">Return to Kealee →</a></p>`,
    )
  }

  // Plain email fallback (no token)
  if (emailParam) {
    try {
      const supabase = getSupabaseAdmin()
      await supabase
        .from('public_intake_leads')
        .update({ status: 'unsubscribed' })
        .eq('contact_email', emailParam)
    } catch (e: any) {
      console.error('[unsubscribe] Fallback opt-out error:', e?.message)
    }

    return htmlPage(
      'Unsubscribed',
      `<p>${emailParam} has been removed from Kealee marketing emails.</p>
       <p><a href="${SITE_URL}">Return to Kealee →</a></p>`,
    )
  }

  return htmlPage(
    'Invalid unsubscribe link',
    '<p>No unsubscribe token found. Please contact <a href="mailto:hello@kealee.com">hello@kealee.com</a>.</p>',
  )
}
