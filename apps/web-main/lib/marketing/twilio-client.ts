/**
 * Twilio SMS Client
 *
 * Sends SMS alerts for hot leads
 */

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID ?? ''
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN ?? ''
const TWILIO_PHONE = process.env.TWILIO_PHONE ?? ''
const YOUR_SMS_NUMBER = process.env.YOUR_SMS_NUMBER ?? ''

export interface SendSMSInput {
  to: string
  message: string
}

export interface SendSMSResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send SMS via Twilio
 */
export async function sendSMS(input: SendSMSInput): Promise<SendSMSResult> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE) {
    return {
      success: false,
      error: 'Twilio not configured (missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE)',
    }
  }

  try {
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')
    const body = new URLSearchParams({
      To: input.to,
      From: TWILIO_PHONE,
      Body: input.message,
    })

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    )

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      return {
        success: false,
        error: `Twilio error: ${res.status} ${text}`,
      }
    }

    const data = (await res.json()) as { sid?: string }
    return {
      success: true,
      messageId: data.sid,
    }
  } catch (err) {
    return {
      success: false,
      error: `SMS send failed: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

/**
 * Send SMS alert to owner about a hot lead
 */
export async function alertHotLead(input: {
  name: string
  service: string
  budget: string
  timeline: string
  intakePath: string
  email?: string
}): Promise<SendSMSResult> {
  if (!YOUR_SMS_NUMBER) {
    return {
      success: false,
      error: 'YOUR_SMS_NUMBER not configured',
    }
  }

  const message = `🔥 Hot Lead! ${input.name} | ${input.service} | ${input.budget} | ${input.timeline} | ${input.intakePath}`

  return sendSMS({
    to: YOUR_SMS_NUMBER,
    message,
  })
}
