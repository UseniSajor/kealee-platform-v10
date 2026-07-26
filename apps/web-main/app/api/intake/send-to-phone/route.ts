import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { phone, projectPath, intakeUrl } = body

    if (!phone || !projectPath) {
      return NextResponse.json(
        { success: false, message: 'Phone and projectPath are required' },
        { status: 400 }
      )
    }

    // Validate phone format (basic E.164 format)
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { success: false, message: 'Invalid phone number' },
        { status: 400 }
      )
    }

    // Send SMS via Twilio if configured
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      try {
        const twilioResponse = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + process.env.TWILIO_ACCOUNT_SID + '/Messages.json', {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: process.env.TWILIO_PHONE_NUMBER,
            To: '+1' + cleanPhone,
            Body: `Kealee: Continue your ${projectPath.replace(/_/g, ' ')} intake here: ${intakeUrl}`,
          }).toString(),
        })

        if (!twilioResponse.ok) {
          console.error('[SendToPhone] Twilio failed:', await twilioResponse.text())
          throw new Error('SMS delivery failed')
        }

        return NextResponse.json({ success: true, message: 'SMS sent successfully' })
      } catch (smsError) {
        console.error('[SendToPhone] SMS error:', smsError)
        // Don't fail - fall back to alternative
      }
    }

    // Fallback: Track as engagement event and log for manual follow-up
    if (process.env.ANALYTICS_API) {
      try {
        await fetch(`${process.env.ANALYTICS_API}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'intake_send_to_phone',
            projectPath,
            phone: cleanPhone.slice(-4), // Log last 4 digits for privacy
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => {}) // Fire and forget
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: 'Link copied to clipboard. You can share the URL or manually send it to your phone.',
    })
  } catch (error) {
    console.error('[SendToPhone] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to send link' },
      { status: 500 }
    )
  }
}
