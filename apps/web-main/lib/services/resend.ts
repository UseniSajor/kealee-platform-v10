/**
 * Resend Email Service
 * Sends intake links, confirmations, and notifications via email
 */

import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@kealee.com'
const contactEmail = process.env.RESEND_CONTACT_EMAIL || 'contact@kealee.com'

if (!apiKey) {
  console.warn('[Resend] Email service not configured - set RESEND_API_KEY')
}

const resend = apiKey ? new Resend(apiKey) : null

/**
 * Send intake link via email
 */
export async function sendIntakeLink(
  recipientEmail: string,
  intakeUrl: string,
  projectPath: string,
  userName?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!resend) {
    console.warn('[Resend] Email service not configured')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const projectLabel = projectPath.replace(/_/g, ' ')
    const greeting = userName ? `Hi ${userName.split(' ')[0]},` : 'Hi there,'

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a2b4a;">Continue Your ${projectLabel}</h2>
        <p style="color: #666; line-height: 1.6;">${greeting}</p>
        <p style="color: #666; line-height: 1.6;">
          We're ready to help with your ${projectLabel}. Continue your intake where you left off:
        </p>

        <div style="margin: 30px 0;">
          <a href="${intakeUrl}" style="display: inline-block; background-color: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Continue Intake
          </a>
        </div>

        <p style="color: #999; font-size: 12px;">
          Or copy this link: <code style="background: #f5f5f5; padding: 2px 6px;">${intakeUrl}</code>
        </p>

        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 40px 0;">

        <p style="color: #999; font-size: 12px;">
          Questions? <a href="mailto:${contactEmail}" style="color: #ff6b35; text-decoration: none;">${contactEmail}</a>
        </p>
        <p style="color: #999; font-size: 12px;">
          © 2026 Kealee. All rights reserved.
        </p>
      </div>
    `

    const result = await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: `Continue Your ${projectLabel} – Kealee`,
      html,
    })

    if (result.error) {
      console.error('[Resend] Failed to send email:', result.error)
      return { success: false, error: String(result.error) }
    }

    console.log('[Resend] Email sent:', {
      to: recipientEmail,
      messageId: result.data?.id,
    })

    return {
      success: true,
      messageId: result.data?.id,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Resend] Error:', errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * Send measurement confirmation email
 */
export async function sendMeasurementConfirmation(
  recipientEmail: string,
  distance: number,
  unit: string,
  confidence: number,
  method: string,
  projectId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a2b4a;">Measurement Recorded</h2>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 10px 0; color: #333;">
            <strong>Distance:</strong> ${distance}${unit}
          </p>
          <p style="margin: 10px 0; color: #333;">
            <strong>Method:</strong> ${method}
          </p>
          <p style="margin: 10px 0; color: #333;">
            <strong>Confidence:</strong> ${confidence}%
          </p>
          <p style="margin: 10px 0; color: #666; font-size: 12px;">
            Recorded: ${new Date().toLocaleString()}
          </p>
        </div>

        <p style="color: #666; line-height: 1.6;">
          Your measurement has been safely recorded and is ready for use in your project.
        </p>

        ${projectId ? `
          <div style="margin: 30px 0;">
            <a href="https://kealee.com/projects/${projectId}" style="display: inline-block; background-color: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              View Project
            </a>
          </div>
        ` : ''}

        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 40px 0;">

        <p style="color: #999; font-size: 12px;">
          © 2026 Kealee. All rights reserved.
        </p>
      </div>
    `

    const result = await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: 'Measurement Recorded – Kealee',
      html,
    })

    if (result.error) {
      console.error('[Resend] Failed to send email:', result.error)
      return { success: false, error: String(result.error) }
    }

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

/**
 * Send welcome email for new users
 */
export async function sendWelcomeEmail(
  recipientEmail: string,
  userName: string,
  intakeUrl?: string
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const firstName = userName.split(' ')[0]
    const cta = intakeUrl ? `
      <div style="margin: 30px 0;">
        <a href="${intakeUrl}" style="display: inline-block; background-color: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Get Started
        </a>
      </div>
    ` : ''

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a2b4a; margin-bottom: 10px;">Welcome to Kealee, ${firstName}!</h1>

        <p style="color: #666; line-height: 1.6;">
          We're excited to help bring your construction project to life. With Kealee, you can:
        </p>

        <ul style="color: #666; line-height: 1.8;">
          <li>Get AI-generated design concepts in days, not weeks</li>
          <li>Measure distances accurately with your phone's camera</li>
          <li>Access detailed cost estimates and permit guidance</li>
          <li>Connect with vetted contractors in your area</li>
        </ul>

        ${cta}

        <p style="color: #666; line-height: 1.6; margin-top: 30px;">
          <strong>Questions?</strong> We're here to help. Reply to this email or contact us at ${contactEmail}
        </p>

        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 40px 0;">

        <p style="color: #999; font-size: 12px;">
          © 2026 Kealee. All rights reserved.
        </p>
      </div>
    `

    const result = await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: `Welcome to Kealee, ${firstName}!`,
      html,
    })

    if (result.error) {
      console.error('[Resend] Failed to send email:', result.error)
      return { success: false, error: String(result.error) }
    }

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

/**
 * Check Resend service status
 */
export async function getResendStatus(): Promise<{
  configured: boolean
  fromEmail?: string
}> {
  return {
    configured: !!resend,
    fromEmail,
  }
}
