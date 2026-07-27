import { NextResponse } from 'next/server'
import { sendIntakeToPhone } from '@/lib/services/twilio'
import { sendIntakeLink } from '@/lib/services/resend'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { phone, email, projectPath, intakeUrl } = body

    if (!projectPath || !intakeUrl) {
      return NextResponse.json(
        { success: false, message: 'projectPath and intakeUrl are required' },
        { status: 400 }
      )
    }

    const results: {
      sms?: { success: boolean; error?: string }
      email?: { success: boolean; error?: string }
    } = {}

    // Send SMS if phone provided
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '')
      if (cleanPhone.length >= 10) {
        const smsResult = await sendIntakeToPhone(cleanPhone, projectPath, intakeUrl)
        results.sms = smsResult
      }
    }

    // Send email if email provided
    if (email) {
      const emailResult = await sendIntakeLink(email, intakeUrl, projectPath)
      results.email = emailResult
    }

    // At least one delivery method should succeed
    const smsSent = results.sms?.success ?? false
    const emailSent = results.email?.success ?? false

    if (!smsSent && !emailSent) {
      return NextResponse.json(
        {
          success: false,
          message: 'Could not send via SMS or email. Try copying the link manually.',
          results,
        },
        { status: 500 }
      )
    }

    // Log successful delivery
    console.log('[SendToPhone] Delivery:', {
      sms: results.sms?.success,
      email: results.email?.success,
      projectPath,
    })

    return NextResponse.json({
      success: true,
      message: `Link sent via ${[smsSent && 'SMS', emailSent && 'email'].filter(Boolean).join(' and ')}`,
      results,
    })
  } catch (error) {
    console.error('[SendToPhone] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to send link' },
      { status: 500 }
    )
  }
}
