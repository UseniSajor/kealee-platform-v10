/**
 * Twilio SMS Service
 * Sends intake links and notifications via SMS
 */

import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromNumber = process.env.TWILIO_PHONE_NUMBER

if (!accountSid || !authToken || !fromNumber) {
  console.warn('[Twilio] SMS service not configured - set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER')
}

const client = accountSid && authToken ? twilio(accountSid, authToken) : null

/**
 * Send intake link to phone via SMS
 */
export async function sendIntakeToPhone(
  phoneNumber: string,
  projectPath: string,
  intakeUrl: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!client) {
    console.warn('[Twilio] SMS service not configured')
    return {
      success: false,
      error: 'SMS service not configured - fallback to manual copy',
    }
  }

  try {
    // Validate phone number format
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      return { success: false, error: 'Invalid phone number' }
    }

    const toNumber = `+1${cleanPhone.slice(-10)}`
    const projectLabel = projectPath.replace(/_/g, ' ')

    const message = await client.messages.create({
      body: `Kealee: Continue your ${projectLabel} intake here: ${intakeUrl}`,
      from: fromNumber!,
      to: toNumber,
    })

    console.log('[Twilio] SMS sent:', {
      to: toNumber,
      messageId: message.sid,
      status: message.status,
    })

    return {
      success: true,
      messageId: message.sid,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Twilio] Failed to send SMS:', errorMessage)

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Send measurement confirmation via SMS
 */
export async function sendMeasurementConfirmation(
  phoneNumber: string,
  distance: number,
  unit: string,
  confidence: number
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!client) {
    return { success: false, error: 'SMS service not configured' }
  }

  try {
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      return { success: false, error: 'Invalid phone number' }
    }

    const toNumber = `+1${cleanPhone.slice(-10)}`

    const message = await client.messages.create({
      body: `Kealee: Measurement recorded: ${distance}${unit} (${confidence}% confidence)`,
      from: fromNumber!,
      to: toNumber,
    })

    return {
      success: true,
      messageId: message.sid,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Twilio] Failed to send SMS:', errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * Send OTP for verification
 */
export async function sendOTP(
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  if (!client) {
    return { success: false, error: 'SMS service not configured' }
  }

  try {
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      return { success: false, error: 'Invalid phone number' }
    }

    const toNumber = `+1${cleanPhone.slice(-10)}`

    await client.messages.create({
      body: `Your Kealee verification code is: ${code}`,
      from: fromNumber!,
      to: toNumber,
    })

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

/**
 * Check SMS service status
 */
export async function getTwilioStatus(): Promise<{
  configured: boolean
  accountSid?: string
  fromNumber?: string
}> {
  return {
    configured: !!client,
    accountSid: accountSid ? `${accountSid.slice(0, 4)}...` : undefined,
    fromNumber,
  }
}
