import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, sendInternalSystemEmail } from '@kealee/communications'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { email, 'cf-turnstile-response': turnstileResponse } = await req.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email address is required.' }, { status: 400 })
    }

    // Rate Limiting: 5 requests per IP per hour
    const ip = req.headers.get('x-forwarded-for') || req.ip || 'unknown'
    const ipLimit = await checkRateLimit(`rl_newsletter_ip_${ip}`, 5, 3600)

    if (!ipLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Turnstile Validation
    if (process.env.TURNSTILE_SECRET_KEY && turnstileResponse) {
      const tsRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${turnstileResponse}`,
      })
      const tsData = await tsRes.json()
      if (!tsData.success) {
        return NextResponse.json({ error: 'Failed security verification. Please try again.' }, { status: 403 })
      }
    }

    const resendApiKey = process.env.RESEND_API_KEY
    const audienceId = process.env.RESEND_AUDIENCE_ID

    if (resendApiKey && audienceId) {
      // Add contact to Resend audience
      const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, unsubscribed: false }),
      })

      if (!res.ok && res.status !== 409) {
        // 409 = already subscribed, treat as success
        console.error('[newsletter] Resend contacts error', res.status, await res.text())
      }
    } else if (resendApiKey) {
      // No audience configured — send internal notification email
      await sendInternalSystemEmail({
        to: 'hello@kealee.com',
        subject: 'New Newsletter Subscriber',
        html: `<p>New subscriber: ${email}</p><p>Time: ${new Date().toISOString()}</p>`,
        route: '/api/newsletter'
      }, true)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[newsletter] Error:', err)
    return NextResponse.json({ error: 'Failed to subscribe. Please try again.' }, { status: 500 })
  }
}

