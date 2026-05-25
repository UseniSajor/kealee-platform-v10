import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, subject, message } = await req.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Name, email, subject, and message are required.' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    const resendApiKey = process.env.RESEND_API_KEY

    if (resendApiKey) {
      // Notify the team
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Kealee Contact Form <notifications@kealee.com>',
          to: ['hello@kealee.com'],
          reply_to: email,
          subject: `[Contact] ${subject} — ${name}`,
          text: [
            `Name: ${name}`,
            `Email: ${email}`,
            `Phone: ${phone || 'Not provided'}`,
            `Subject: ${subject}`,
            '',
            'Message:',
            message,
            '',
            `Submitted: ${new Date().toISOString()}`,
          ].join('\n'),
        }),
      })

      // Send confirmation to the user
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Kealee <hello@kealee.com>',
          to: [email],
          subject: "We received your message — Kealee",
          text: [
            `Hi ${name},`,
            '',
            "Thanks for reaching out to Kealee! We've received your message and our team will get back to you within 24 hours.",
            '',
            "Here's a copy of what you sent:",
            `Subject: ${subject}`,
            `Message: ${message}`,
            '',
            'In the meantime, explore our services:',
            '• AI Concept Design: https://kealee.com/concept',
            '• Building Permits: https://kealee.com/permits',
            '• Pricing: https://kealee.com/pricing',
            '',
            '— The Kealee Team',
            'hello@kealee.com | (240) 555-0100',
          ].join('\n'),
        }),
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[contact] Error:', err)
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
  }
}
