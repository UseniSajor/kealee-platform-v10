import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { to, firstName, service, amount, intakeId, failureMessage, source } = await req.json() as {
      to: string
      firstName: string
      service: string
      amount: number        // in cents
      intakeId: string
      failureMessage: string
      source: string
    }

    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.warn('[payment-failed email] RESEND_API_KEY not set — skipping emails')
      return NextResponse.json({ sent: false, reason: 'RESEND_API_KEY not configured' })
    }

    const retryUrl = source === 'public_intake'
      ? 'https://kealee.com/concept/confirm'
      : 'https://kealee.com/permits'

    const amountFormatted = (amount / 100).toFixed(2)
    const timestamp = new Date().toISOString()

    // User email
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Kealee <hello@kealee.com>',
        to: [to],
        subject: 'Your Kealee payment was not completed',
        text: [
          `Hi ${firstName},`,
          '',
          'We were unable to process your payment for:',
          `  ${service} — $${amountFormatted}`,
          '',
          'This is usually caused by:',
          '  • Insufficient funds',
          '  • A temporary hold placed by your bank',
          '  • An expired or incorrect card number',
          '',
          'Your project details are saved and you have not been charged.',
          '',
          `To try again, visit: ${retryUrl}`,
          '',
          'If you need help or would like to use a different card, reply to',
          'this email and we will assist you within the hour.',
          '',
          '— The Kealee Team',
          'hello@kealee.com',
        ].join('\n'),
      }),
    })

    // Admin alert
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Kealee Notifications <notifications@kealee.com>',
        to: ['hello@kealee.com'],
        subject: `⚠️ Payment failed — ${service} #${intakeId}`,
        text: [
          'A payment failed and may need follow-up:',
          '',
          `  Intake ID:    ${intakeId}`,
          `  Service:      ${service}`,
          `  Amount:       $${amountFormatted}`,
          `  Failure:      ${failureMessage}`,
          `  Time:         ${timestamp}`,
          '',
          'Review and consider reaching out to the client directly.',
        ].join('\n'),
      }),
    })

    return NextResponse.json({ sent: true })
  } catch (err: any) {
    console.error('[payment-failed email]', err?.message)
    return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 })
  }
}
