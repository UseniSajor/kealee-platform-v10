import { Resend } from 'resend'

// Lazy-initialize Resend client to avoid crash if API key missing
let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️  RESEND_API_KEY not set - email service disabled');
    return null;
  }
  
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  
  return resend;
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  template?: 'welcome' | 'password-reset' | 'invoice-paid' | 'subscription-canceled' | 'milestone-approved' | 'payment-released' | 'payment-failed' | 'concept-validation-delivered' | 'developer-service-delivered' | 'concept_package_confirmation' | 'task-assigned' | 'permit_order_confirmation' | 'architect_vip_confirmation'
  data?: Record<string, any>
  html?: string
  text?: string
}

export class EmailService {
  /**
   * Send email using Resend
   */
  async sendEmail(options: EmailOptions) {
    const resendClient = getResendClient();
    
    if (!resendClient) {
      console.warn('⚠️  Email service not configured, email not sent:', options.subject)
      return { success: false, error: 'Email provider not configured' }
    }

    try {
      // Use template if provided, otherwise use custom HTML/text
      const { html, text } = options.template
        ? await this.getTemplate(options.template, options.data || {})
        : { html: options.html, text: options.text }

      const result = await resendClient.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Kealee Platform <noreply@kealee.com>',
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: html || undefined,
        text: text || (html ? html.replace(/<[^>]*>/g, '') : undefined),
      } as any)

      // Handle different response structures from Resend API
      const emailId = result.data?.id || (result as any).id || 'unknown'
      return { success: true, id: emailId }
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

      case 'task-assigned':
        return {
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #2563eb;">New Task Assigned</h1>
              <p>You've been assigned a new task:</p>
              <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <h2 style="margin: 0 0 8px 0;">${data.taskTitle || 'Task'}</h2>
                <p style="margin: 0; color: #6b7280;">${data.taskDescription || ''}</p>
                <p style="margin: 8px 0 0 0;"><strong>Due:</strong> ${data.dueDate || 'N/A'}</p>
              </div>
              <a href="${process.env.PM_BASE_URL || 'https://pm.kealee.com'}/tasks/${data.taskId || ''}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">
                View Task
              </a>
            </div>
          `,
          text: `New task assigned: ${data.taskTitle || 'Task'}. Due: ${data.dueDate || 'N/A'}`,
        }

      case 'payment-failed':
        return {
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #ef4444;">Payment Failed</h1>
              <p>We were unable to process your payment of $${data.amount || 0}.</p>
              <p>Please update your payment method to avoid service interruption.</p>
              <a href="${data.invoiceUrl || `${process.env.APP_BASE_URL || 'https://app.kealee.com'}/billing`}" style="display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">
                Update Payment Method
              </a>
            </div>
          `,
          text: `Payment failed: $${data.amount || 0}. Update payment method: ${data.invoiceUrl || `${process.env.APP_BASE_URL || 'https://app.kealee.com'}/billing`}`,
        }

      case 'permit_order_confirmation':
        return {
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
              <div style="background: linear-gradient(135deg, #1A2B4A 0%, #0F1D34 100%); padding: 40px 32px; border-radius: 8px 8px 0 0;">
                <h1 style="color: #fff; margin: 0; font-size: 24px;">Your Permit Order is Confirmed</h1>
                <p style="color: #94A3B8; margin: 8px 0 0 0;">Kealee Permit Services</p>
              </div>
              <div style="padding: 32px;">
                <p>Hi ${data.customerName || 'there'},</p>
                <p>We've received your order for <strong>${data.tierName || 'Permit Service'}</strong>.</p>
                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <p style="margin: 0 0 8px 0;"><strong>Order Details</strong></p>
                  <p style="margin: 4px 0; color: #475569;">Service: ${data.tierName}</p>
                  <p style="margin: 4px 0; color: #475569;">Amount: $${data.amount ? (data.amount / 100).toFixed(2) : '0.00'}</p>
                  <p style="margin: 4px 0; color: #475569;">Order ID: ${data.orderId || 'N/A'}</p>
                </div>
                <p>Our team will begin work on your permit package within 1 business day. You'll receive updates via email as we progress.</p>
                <p><strong>What happens next:</strong></p>
                <ol style="color: #475569; padding-left: 20px;">
                  <li>Our permit specialists review your intake information</li>
                  <li>We research jurisdiction-specific requirements</li>
                  <li>Your package is prepared and reviewed for first-cycle approval</li>
                  <li>Delivered to your portal within the agreed timeline</li>
                </ol>
                <a href="${process.env.PORTAL_BASE_URL || 'https://app.kealee.com'}/permits" style="display: inline-block; padding: 12px 24px; background: #2ABFBF; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px; font-weight: 600;">
                  View Your Order
                </a>
                <p style="color: #94A3B8; font-size: 13px; margin-top: 24px;">Questions? Reply to this email or contact <a href="mailto:permits@kealee.com" style="color: #2ABFBF;">permits@kealee.com</a></p>
              </div>
            </div>
          `,
          text: `Your permit order is confirmed. Service: ${data.tierName}. Order ID: ${data.orderId}. Our team will begin within 1 business day.`,
        }

      case 'architect_vip_confirmation':
        return {
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
              <div style="background: linear-gradient(135deg, #1A2B4A 0%, #0F1D34 100%); padding: 40px 32px; border-radius: 8px 8px 0 0;">
                <h1 style="color: #fff; margin: 0; font-size: 24px;">Architect VIP Order Confirmed</h1>
                <p style="color: #94A3B8; margin: 8px 0 0 0;">Kealee Architect Services</p>
              </div>
              <div style="padding: 32px;">
                <p>Hi ${data.customerName || 'there'},</p>
                <p>Your <strong>${data.tierName || 'Architect VIP'}</strong> service is confirmed. A licensed architect will be assigned to your project within 1 business day.</p>
                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <p style="margin: 0 0 8px 0;"><strong>Order Details</strong></p>
                  <p style="margin: 4px 0; color: #475569;">Service: ${data.tierName}</p>
                  <p style="margin: 4px 0; color: #475569;">Turnaround: ${data.turnaround || '7–10 business days'}</p>
                  <p style="margin: 4px 0; color: #475569;">Amount: $${data.amount ? (data.amount / 100).toFixed(2) : '0.00'}</p>
                  <p style="margin: 4px 0; color: #475569;">Order ID: ${data.orderId || 'N/A'}</p>
                </div>
                <p><strong>What happens next:</strong></p>
                <ol style="color: #475569; padding-left: 20px;">
                  <li>A licensed architect is assigned to your project</li>
                  <li>We gather your property details and existing documents</li>
                  <li>Permit-ready drawing set is prepared</li>
                  <li>Review + approval before final delivery</li>
                  <li>Drawings delivered to your Kealee portal</li>
                </ol>
                <a href="${process.env.PORTAL_BASE_URL || 'https://app.kealee.com'}/architect-vip" style="display: inline-block; padding: 12px 24px; background: #E8793A; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px; font-weight: 600;">
                  View Your Project
                </a>
                <p style="color: #94A3B8; font-size: 13px; margin-top: 24px;">Questions? Reply to this email or contact <a href="mailto:hello@kealee.com" style="color: #E8793A;">hello@kealee.com</a></p>
              </div>
            </div>
          `,
          text: `Architect VIP order confirmed. Service: ${data.tierName}. Turnaround: ${data.turnaround}. Order ID: ${data.orderId}. An architect will be assigned within 1 business day.`,
        }

      default:
        throw new Error(`Unknown template: ${template}`)
    }
  }
}

export const emailService = new EmailService()
