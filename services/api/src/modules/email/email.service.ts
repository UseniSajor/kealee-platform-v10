import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string | string[]
  subject: string
  template?: 'welcome' | 'password-reset' | 'invoice-paid' | 'subscription-canceled' | 'milestone-approved' | 'payment-released'
  data?: Record<string, any>
  html?: string
  text?: string
}

export class EmailService {
  /**
   * Send email using Resend
   */
  async sendEmail(options: EmailOptions) {
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️  RESEND_API_KEY not set, email not sent:', options.subject)
      return { success: false, error: 'Email provider not configured' }
    }

    try {
      // Use template if provided, otherwise use custom HTML/text
      const { html, text } = options.template
        ? await this.getTemplate(options.template, options.data || {})
        : { html: options.html, text: options.text }

      const result = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Kealee Platform <noreply@kealee.com>',
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: html || text,
        text: text || html?.replace(/<[^>]*>/g, ''),
      })

      return { success: true, id: result.id }
    } catch (error: any) {
      console.error('❌ Email send failed:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get email template
   */
  private async getTemplate(template: string, data: Record<string, any>): Promise<{ html: string; text: string }> {
    // Template implementations
    switch (template) {
      case 'welcome':
        return {
          html: `
            <h1>Welcome to Kealee Platform!</h1>
            <p>Hi ${data.name || 'there'},</p>
            <p>Welcome to Kealee Platform. We're excited to have you on board!</p>
            <p>Get started by exploring your dashboard.</p>
          `,
          text: `Welcome to Kealee Platform! Hi ${data.name || 'there'}, welcome to Kealee Platform.`,
        }

      case 'password-reset':
        return {
          html: `
            <h1>Reset Your Password</h1>
            <p>Click the link below to reset your password:</p>
            <a href="${data.resetUrl}">Reset Password</a>
            <p>This link expires in 1 hour.</p>
          `,
          text: `Reset your password: ${data.resetUrl}`,
        }

      case 'invoice-paid':
        return {
          html: `
            <h1>Invoice Paid</h1>
            <p>Your invoice #${data.invoiceNumber} has been paid.</p>
            <p>Amount: $${data.amount}</p>
            <p><a href="${data.invoiceUrl}">View Invoice</a></p>
          `,
          text: `Invoice #${data.invoiceNumber} paid. Amount: $${data.amount}`,
        }

      case 'subscription-canceled':
        return {
          html: `
            <h1>Subscription Canceled</h1>
            <p>Your subscription has been canceled.</p>
            <p>You'll continue to have access until ${data.accessUntil}.</p>
          `,
          text: `Subscription canceled. Access until ${data.accessUntil}`,
        }

      case 'milestone-approved':
        return {
          html: `
            <h1>Milestone Approved</h1>
            <p>Milestone "${data.milestoneName}" has been approved.</p>
            <p>Payment will be released shortly.</p>
          `,
          text: `Milestone "${data.milestoneName}" approved. Payment will be released.`,
        }

      case 'payment-released':
        return {
          html: `
            <h1>Payment Released</h1>
            <p>Payment of $${data.amount} has been released for milestone "${data.milestoneName}".</p>
            <p>Platform fee (3%): $${data.platformFee}</p>
            <p>Your payout: $${data.payout}</p>
          `,
          text: `Payment of $${data.amount} released. Your payout: $${data.payout}`,
        }

      default:
        throw new Error(`Unknown template: ${template}`)
    }
  }
}

export const emailService = new EmailService()
