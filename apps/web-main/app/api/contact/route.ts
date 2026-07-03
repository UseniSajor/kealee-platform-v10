import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, sendEmailWithTemplate, sendInternalSystemEmail } from '@kealee/communications'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, subject, message, 'cf-turnstile-response': turnstileResponse } = await req.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Name, email, subject, and message are required.' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
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

    // Rate Limiting: 3 requests per IP per hour
    const ip = req.headers.get('x-forwarded-for') || req.ip || 'unknown'
    const ipLimit = await checkRateLimit(`rl_contact_ip_${ip}`, 3, 3600)

    if (!ipLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // 1. Send Internal Notification
    // Safe because the "to" address is hardcoded to our internal team.
    const internalHtml = `
      <h3>New Contact Submission</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <hr />
      <p>${message.replace(/\n/g, '<br/>')}</p>
    `
    await sendInternalSystemEmail({
      to: 'hello@kealee.com',
      subject: `[Contact] ${subject} — ${name}`,
      html: internalHtml,
      route: '/api/contact'
    }, true)

    // 2. Send Auto-Responder to User
    // Uses predefined template so attacker cannot control the email body sent to external addresses.
    await sendEmailWithTemplate({
      to: email,
      templateName: 'CONTACT_FORM_AUTO_REPLY',
      variables: { name, subject, message },
      ipAddress: ip,
      route: '/api/contact'
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[contact] Error:', err)
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
  }
}
