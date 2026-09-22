import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { generatePortalAccessToken } from '@/lib/portal-access-token'
import { getWebMainUrl } from '@/lib/get-app-url'
import { checkRateLimit, clientKey } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * POST /api/orders/lookup  { email }
 *
 * Emails access links for every paid order on an address. This is the way back
 * in for a customer who no longer has their confirmation email — previously
 * `/orders` had no page at all, so anyone sent there (or who lost the link)
 * reached a 404 holding a paid order.
 *
 * Answers identically whether or not the address has orders, so it cannot be
 * used to discover who bought what.
 */
const GENERIC_OK = {
  ok: true,
  message:
    'If that email placed an order with Kealee, its link is on its way. Check your inbox and spam folder.',
}

const PAID_STATUSES = ['paid', 'concept_ready', 'processing', 'delivered']

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(clientKey(req, 'order-lookup'), 5, 15 * 60_000)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Check your inbox, then try again shortly.' },
      { status: 429, headers: { 'retry-after': String(limit.retryAfterSeconds) } },
    )
  }

  let email = ''
  try {
    const body = (await req.json()) as { email?: unknown }
    email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!email.includes('@') || email.length > 200) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const { data: orders } = await supabase
      .from('public_intake_leads')
      .select('id, project_path, created_at')
      .ilike('contact_email', email)
      .in('status', PAID_STATUSES)
      .order('created_at', { ascending: false })
      .limit(10)

    if (!orders?.length) return NextResponse.json(GENERIC_OK)

    const links: string[] = []
    for (const order of orders) {
      const { token, error } = await generatePortalAccessToken({
        intakeId: order.id as string,
        email,
        nextPath: `/orders/${order.id}`,
      })
      if (error || !token) {
        console.error('[orders/lookup] token generation failed:', error)
        continue
      }
      const label = String(order.project_path ?? 'order').replace(/_/g, ' ')
      links.push(`${label}: ${getWebMainUrl()}/orders/${order.id}?t=${token}`)
    }

    if (!links.length) return NextResponse.json(GENERIC_OK)

    const resendApiKey = process.env.RESEND_API_KEY
    if (resendApiKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Kealee <notifications@kealee.com>',
          to: [email],
          subject: links.length > 1 ? 'Your Kealee orders' : 'Your Kealee order link',
          text: [
            links.length > 1
              ? 'Here are the links to your Kealee orders:'
              : 'Here is the link to your Kealee order:',
            '',
            ...links,
            '',
            'Each link shows your current status, anything we still need from you, and your deliverables as they are released.',
            'Links are valid for 30 days. If you did not request this, you can ignore this email.',
          ].join('\n'),
        }),
      })
    } else {
      console.warn('[orders/lookup] RESEND_API_KEY not set — access links not delivered')
    }

    return NextResponse.json(GENERIC_OK)
  } catch (error) {
    console.error('[orders/lookup]', error instanceof Error ? error.message : error)
    return NextResponse.json(GENERIC_OK)
  }
}
