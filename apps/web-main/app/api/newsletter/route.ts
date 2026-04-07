import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email address is required.' }, { status: 400 })
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
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Kealee <notifications@kealee.com>',
          to: ['hello@kealee.com'],
          subject: 'New Newsletter Subscriber',
          text: `New subscriber: ${email}\nTime: ${new Date().toISOString()}`,
        }),
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[newsletter] Error:', err)
    return NextResponse.json({ error: 'Failed to subscribe. Please try again.' }, { status: 500 })
  }
}
