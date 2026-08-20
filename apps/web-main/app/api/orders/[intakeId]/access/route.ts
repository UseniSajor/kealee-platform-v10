import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { generatePortalAccessToken } from '@/lib/portal-access-token'
import { getWebMainUrl } from '@/lib/get-app-url'
import { checkRateLimit, clientKey } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * POST /api/orders/[intakeId]/access  { email }
 *
 * Emails a fresh order-access link to the address on file. Always answers the
 * same way whether or not the email matches, so this cannot be used to test
 * whether an order exists or who owns it.
 */
const GENERIC_OK = {
  ok: true,
  message:
    'If that email is on this order, an access link is on its way. Check your inbox and spam folder.',
}

export async function POST(
  req: NextRequest,
  { params }: { params: { intakeId: string } },
) {
  // Sends mail to an address we hold — cap it so it cannot be used to spam a
  // customer whose order id someone guessed.
  const limit = checkRateLimit(clientKey(req, `order-access:${params.intakeId}`), 5, 15 * 60_000)
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
    const { data: order } = await supabase
      .from('public_intake_leads')
      .select('id, contact_email, project_path')
      .eq('id', params.intakeId)
      .maybeSingle()

    if (!order || order.contact_email?.toLowerCase() !== email) {
      return NextResponse.json(GENERIC_OK)
    }

    const { token, error } = await generatePortalAccessToken({
      intakeId: order.id,
      email,
      nextPath: `/orders/${order.id}`,
    })
    if (error || !token) {
      console.error('[orders/access] token generation failed:', error)
      return NextResponse.json(GENERIC_OK)
    }

    const link = `${getWebMainUrl()}/orders/${order.id}?t=${token}`
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
          subject: 'Your Kealee order link',
          text: [
            'Here is the link to your Kealee order:',
            '',
            link,
            '',
            'It shows your current status, anything we still need from you, and your deliverables as they are released.',
            'The link is valid for 30 days. If you did not request it, you can ignore this email.',
          ].join('\n'),
        }),
      })
    } else {
      console.warn('[orders/access] RESEND_API_KEY not set — access link not delivered')
    }

    return NextResponse.json(GENERIC_OK)
  } catch (error) {
    console.error(
      '[orders/access]',
      error instanceof Error ? error.message : error,
    )
    return NextResponse.json(GENERIC_OK)
  }
}
