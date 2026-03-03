/**
 * Email job data types
 */

export interface EmailJobData {
  to: string | string[]
  from?: string
  subject?: string
  text?: string
  html?: string
  template?: string
  templateData?: Record<string, any>
  cc?: string | string[]
  bcc?: string | string[]
  replyTo?: string
  attachments?: EmailAttachment[]
  metadata?: {
    userId?: string
    orgId?: string
    eventType?: string
    [key: string]: any
  }
}

export interface EmailAttachment {
  content: string // Base64 encoded
  filename: string
  type?: string
  disposition?: string
}

export interface EmailTemplate {
  subject: string
  text?: string
  html: string
}

/**
 * Common email templates
 */
export const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  welcome: {
    subject: 'Welcome to Kealee Platform',
    html: `
      <h1>Welcome to Kealee Platform!</h1>
      <p>Hi {{name}},</p>
      <p>We're excited to have you on board.</p>
      <p>Get started by exploring your dashboard.</p>
    `,
  },
  // ---------------------------------------------------------------------------
  // GC-specific onboarding + communications (Ops Services)
  // ---------------------------------------------------------------------------
  gc_welcome_day0: {
    subject: 'Welcome to Kealee Ops Services!',
    html: `
      <h1>Welcome to Kealee Ops Services!</h1>
      <p>Hi {{gcName}},</p>
      <p>We’re excited to support your team. Your portal is ready and you can start submitting service requests today.</p>
      <p><a href="{{portalUrl}}">Open your GC portal</a></p>
      <p><strong>Next steps</strong></p>
      <ul>
        <li>Invite your team members</li>
        <li>Connect your active projects</li>
        <li>Submit your first service request</li>
      </ul>
      <p>Questions? Reply to this email and we’ll help.</p>
    `,
    text: `Welcome to Kealee Ops Services!\n\nHi {{gcName}},\n\nOpen your GC portal: {{portalUrl}}\n\nNext steps:\n- Invite your team members\n- Connect your active projects\n- Submit your first service request\n`,
  },
  gc_welcome_day1_meet_pm: {
    subject: 'Meet your dedicated PM',
    html: `
      <h1>Meet your dedicated PM</h1>
      <p>Hi {{gcName}},</p>
      <p>Your dedicated PM is <strong>{{pmName}}</strong>.</p>
      <p>You can reach them at: <a href="mailto:{{pmEmail}}">{{pmEmail}}</a></p>
      <p><strong>What your PM will help with</strong></p>
      <ul>
        <li>Project setup + coordination</li>
        <li>Permits and inspections tracking</li>
        <li>Vendor coordination</li>
        <li>Weekly reporting</li>
      </ul>
      <p><a href="{{portalUrl}}">Open your GC portal</a></p>
    `,
    text: `Meet your dedicated PM\n\nHi {{gcName}},\n\nYour dedicated PM is {{pmName}} ({{pmEmail}}).\nOpen your GC portal: {{portalUrl}}\n`,
  },
  gc_welcome_day3_first_service_request: {
    subject: 'How to submit your first service request',
    html: `
      <h1>How to submit your first service request</h1>
      <p>Hi {{gcName}},</p>
      <p>Submitting a service request is the fastest way to get support from your Kealee PM team.</p>
      <ol>
        <li>Open the portal</li>
        <li>Go to <strong>Service requests</strong></li>
        <li>Click <strong>New request</strong></li>
        <li>Share your context, deadline, and any files/links</li>
      </ol>
      <p><a href="{{newRequestUrl}}">Create a new service request</a></p>
      <p>Tip: The more detail you provide, the faster we can deliver.</p>
    `,
    text: `How to submit your first service request\n\nHi {{gcName}},\n\nCreate a new service request here: {{newRequestUrl}}\n`,
  },
  gc_welcome_day7_weekly_report_preview: {
    subject: 'First weekly report preview',
    html: `
      <h1>First weekly report preview</h1>
      <p>Hi {{gcName}},</p>
      <p>This is what your weekly reports will look like: executive summary, project status, permits/inspections, risks, and upcoming week.</p>
      <p><a href="{{weeklyReportsUrl}}">View weekly reports in the portal</a></p>
      <p><strong>What you can do</strong></p>
      <ul>
        <li>Approve reports</li>
        <li>Request changes</li>
        <li>Comment and track action items</li>
        <li>Share with clients/lenders</li>
      </ul>
    `,
    text: `First weekly report preview\n\nHi {{gcName}},\n\nView weekly reports: {{weeklyReportsUrl}}\n`,
  },

  passwordReset: {
    subject: 'Reset Your Password',
    html: `
      <h1>Password Reset Request</h1>
      <p>Hi {{name}},</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="{{resetLink}}">Reset Password</a></p>
      <p>This link expires in 1 hour.</p>
    `,
  },
  projectCreated: {
    subject: 'New Project Created',
    html: `
      <h1>Project Created</h1>
      <p>Hi {{name}},</p>
      <p>Your project "{{projectName}}" has been created successfully.</p>
      <p><a href="{{projectLink}}">View Project</a></p>
    `,
  },

  // ---------------------------------------------------------------------------
  // Service request communications (GC)
  // ---------------------------------------------------------------------------
  gc_service_request_received: {
    subject: 'Your service request has been received',
    html: `
      <h1>Service request received</h1>
      <p>Hi {{gcName}},</p>
      <p>We’ve received your service request:</p>
      <p><strong>{{requestTitle}}</strong></p>
      <p>We’ll review and assign it shortly.</p>
      <p><a href="{{requestUrl}}">View request</a></p>
      <p>Request ID: {{requestId}}</p>
    `,
    text: `Service request received\n\nHi {{gcName}},\n\n{{requestTitle}}\nView: {{requestUrl}}\nRequest ID: {{requestId}}\n`,
  },
  gc_service_request_assigned: {
    subject: 'Your request has been assigned to {{pmName}}',
    html: `
      <h1>Service request assigned</h1>
      <p>Hi {{gcName}},</p>
      <p>Your service request <strong>{{requestTitle}}</strong> has been assigned to <strong>{{pmName}}</strong>.</p>
      <p>Next update: {{nextUpdateEta}}</p>
      <p><a href="{{requestUrl}}">View request</a></p>
    `,
    text: `Service request assigned\n\nHi {{gcName}},\n\n{{requestTitle}} assigned to {{pmName}}.\nNext update: {{nextUpdateEta}}\nView: {{requestUrl}}\n`,
  },
  gc_service_request_update: {
    subject: 'Update on your service request',
    html: `
      <h1>Service request update</h1>
      <p>Hi {{gcName}},</p>
      <p><strong>{{requestTitle}}</strong></p>
      <p>{{updateSummary}}</p>
      <p><a href="{{requestUrl}}">View request</a></p>
    `,
    text: `Service request update\n\nHi {{gcName}},\n\n{{requestTitle}}\n{{updateSummary}}\nView: {{requestUrl}}\n`,
  },
  gc_service_request_completed: {
    subject: 'Your service request has been completed',
    html: `
      <h1>Service request completed</h1>
      <p>Hi {{gcName}},</p>
      <p>Your service request <strong>{{requestTitle}}</strong> has been completed.</p>
      <p><strong>Outcome</strong></p>
      <p>{{completionSummary}}</p>
      <p><a href="{{requestUrl}}">View request</a></p>
    `,
    text: `Service request completed\n\nHi {{gcName}},\n\n{{requestTitle}}\nOutcome: {{completionSummary}}\nView: {{requestUrl}}\n`,
  },

  // ---------------------------------------------------------------------------
  // Weekly report email (GC)
  // ---------------------------------------------------------------------------
  gc_weekly_report_ready: {
    subject: 'Your weekly report is ready',
    html: `
      <h1>Your weekly report is ready</h1>
      <p>Hi {{gcName}},</p>
      <p><strong>Week of {{weekOf}}</strong></p>
      <p>{{executiveSummary}}</p>
      <p><strong>Action items</strong></p>
      <ul>
        <li>{{actionItem1}}</li>
        <li>{{actionItem2}}</li>
        <li>{{actionItem3}}</li>
      </ul>
      <p>
        <a href="{{weeklyReportUrl}}">Open full report in portal</a>
      </p>
      <p>If you need changes, you can request edits directly from the report page.</p>
    `,
    text: `Your weekly report is ready\n\nHi {{gcName}},\n\nWeek of {{weekOf}}\n\n{{executiveSummary}}\n\nAction items:\n- {{actionItem1}}\n- {{actionItem2}}\n- {{actionItem3}}\n\nOpen full report: {{weeklyReportUrl}}\n`,
  },

  // ---------------------------------------------------------------------------
  // Billing communications (GC)
  // ---------------------------------------------------------------------------
  gc_invoice_due: {
    subject: 'Invoice #{{invoiceNumber}} is due',
    html: `
      <h1>Invoice due</h1>
      <p>Hi {{gcName}},</p>
      <p>Invoice <strong>#{{invoiceNumber}}</strong> for <strong>{{invoiceAmount}}</strong> is due on <strong>{{dueDate}}</strong>.</p>
      <p><a href="{{invoiceUrl}}">View invoice</a></p>
      <p><a href="{{billingPortalUrl}}">Manage payment method</a></p>
    `,
    text: `Invoice due\n\nHi {{gcName}},\n\nInvoice #{{invoiceNumber}} for {{invoiceAmount}} is due on {{dueDate}}.\nView invoice: {{invoiceUrl}}\nManage payment method: {{billingPortalUrl}}\n`,
  },
  gc_payment_received: {
    subject: 'Payment received - thank you!',
    html: `
      <h1>Payment received</h1>
      <p>Hi {{gcName}},</p>
      <p>Thank you — we’ve received your payment for invoice <strong>#{{invoiceNumber}}</strong>.</p>
      <p><a href="{{invoiceUrl}}">View invoice</a></p>
      <p>If you need a tax receipt, you can download it from the billing portal.</p>
    `,
    text: `Payment received\n\nHi {{gcName}},\n\nThank you — payment received for invoice #{{invoiceNumber}}.\nView invoice: {{invoiceUrl}}\n`,
  },
  gc_payment_failed: {
    subject: 'Payment failed - update your card',
    html: `
      <h1>Payment failed</h1>
      <p>Hi {{gcName}},</p>
      <p>We were unable to process your payment for invoice <strong>#{{invoiceNumber}}</strong>.</p>
      <p>Please update your card to avoid service interruption.</p>
      <p><a href="{{billingPortalUrl}}">Update payment method</a></p>
      <p><a href="{{invoiceUrl}}">View invoice</a></p>
    `,
    text: `Payment failed\n\nHi {{gcName}},\n\nWe couldn't process payment for invoice #{{invoiceNumber}}.\nUpdate payment method: {{billingPortalUrl}}\nView invoice: {{invoiceUrl}}\n`,
  },
  gc_subscription_upgraded: {
    subject: 'Your subscription has been upgraded',
    html: `
      <h1>Subscription updated</h1>
      <p>Hi {{gcName}},</p>
      <p>Your Kealee Ops Services subscription has been upgraded to <strong>{{newPackageName}}</strong>.</p>
      <p>Effective date: {{effectiveDate}}</p>
      <p><a href="{{billingPortalUrl}}">View billing details</a></p>
    `,
    text: `Subscription upgraded\n\nHi {{gcName}},\n\nYour subscription is now {{newPackageName}}.\nEffective date: {{effectiveDate}}\nBilling portal: {{billingPortalUrl}}\n`,
  },

  // ---------------------------------------------------------------------------
  // Concept package purchase flow
  // ---------------------------------------------------------------------------
  concept_package_confirmation: {
    subject: 'Your {{packageName}} is confirmed!',
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <div style="background:#0F2240;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:24px;">Order Confirmed</h1>
        </div>
        <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
          <p>Hi {{customerName}},</p>
          <p>Thank you for your purchase! Your <strong>{{packageName}}</strong> has been confirmed.</p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:24px 0;">
            <p style="margin:0 0 8px;font-weight:600;">Order Summary</p>
            <p style="margin:0;color:#6b7280;">Package: {{packageName}} ({{packageTier}})</p>
            <p style="margin:0;color:#6b7280;">Amount: ${{amount}}</p>
          </div>
          <h3>What happens next?</h3>
          <ol style="color:#374151;line-height:1.8;">
            <li>Our AI system generates your concept package (up to 24 hours)</li>
            <li>You'll receive an email when your concept is ready</li>
            <li>View and download from your dashboard</li>
          </ol>
          <p>We've also sent you an email to set up your Kealee dashboard account.</p>
          <p style="margin-top:24px;">
            <a href="https://kealee.com/dashboard" style="display:inline-block;background:#0284c7;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Go to Dashboard</a>
          </p>
        </div>
        <div style="text-align:center;padding:16px;color:#9ca3af;font-size:12px;">
          <p>Questions? Call <a href="tel:+13015758777" style="color:#0284c7;">(301) 575-8777</a> or email <a href="mailto:support@kealee.com" style="color:#0284c7;">support@kealee.com</a></p>
        </div>
      </div>
    `,
    text: `Order Confirmed\n\nHi {{customerName}},\n\nYour {{packageName}} ({{packageTier}}) has been confirmed.\nAmount: ${{amount}}\n\nWhat happens next:\n1. Our AI system generates your concept package (up to 24 hours)\n2. You'll receive an email when your concept is ready\n3. View and download from your dashboard\n\nDashboard: https://kealee.com/dashboard\nQuestions? Call (301) 575-8777\n`,
  },
  account_setup: {
    subject: 'Set up your Kealee dashboard account',
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <div style="background:#0F2240;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:24px;">Set Up Your Account</h1>
        </div>
        <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
          <p>Hi {{customerName}},</p>
          <p>Your Kealee account has been created. Set up your password to access your dashboard, track your order, and manage your projects.</p>
          <p style="text-align:center;margin:32px 0;">
            <a href="{{setupUrl}}" style="display:inline-block;background:#0284c7;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">Create Your Password</a>
          </p>
          <p style="color:#6b7280;font-size:13px;">This link expires in 48 hours. If it has expired, contact support for a new link.</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-top:24px;">
            <p style="margin:0 0 8px;font-weight:600;font-size:14px;">Your dashboard includes:</p>
            <ul style="margin:0;padding-left:20px;color:#6b7280;font-size:13px;line-height:1.8;">
              <li>Order tracking with real-time status updates</li>
              <li>Concept package download when ready</li>
              <li>Project management tools</li>
              <li>Direct messaging with our team</li>
            </ul>
          </div>
        </div>
        <div style="text-align:center;padding:16px;color:#9ca3af;font-size:12px;">
          <p>Questions? Call <a href="tel:+13015758777" style="color:#0284c7;">(301) 575-8777</a> or email <a href="mailto:support@kealee.com" style="color:#0284c7;">support@kealee.com</a></p>
        </div>
      </div>
    `,
    text: `Set Up Your Account\n\nHi {{customerName}},\n\nYour Kealee account has been created. Set up your password to access your dashboard.\n\nCreate your password: {{setupUrl}}\n\nThis link expires in 48 hours.\n\nQuestions? Call (301) 575-8777\n`,
  },
  order_status_update: {
    subject: 'Your {{packageName}} is ready!',
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <div style="background:#059669;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:24px;">Your Concept Is Ready!</h1>
        </div>
        <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
          <p>Hi {{customerName}},</p>
          <p>Great news — your <strong>{{packageName}}</strong> concept package has been generated and is ready for you to view.</p>
          <p style="text-align:center;margin:32px 0;">
            <a href="{{deliveryUrl}}" style="display:inline-block;background:#059669;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">View Your Concept</a>
          </p>
          <p>You can also access it anytime from your <a href="https://kealee.com/dashboard/orders" style="color:#0284c7;">dashboard</a>.</p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-top:24px;">
            <p style="margin:0 0 8px;font-weight:600;font-size:14px;">What's next?</p>
            <ul style="margin:0;padding-left:20px;color:#6b7280;font-size:13px;line-height:1.8;">
              <li>Review your AI-generated concept designs</li>
              <li>Get a detailed cost estimate</li>
              <li>Start your permit application</li>
              <li>Connect with verified contractors</li>
            </ul>
          </div>
        </div>
        <div style="text-align:center;padding:16px;color:#9ca3af;font-size:12px;">
          <p>Questions? Call <a href="tel:+13015758777" style="color:#0284c7;">(301) 575-8777</a> or email <a href="mailto:support@kealee.com" style="color:#0284c7;">support@kealee.com</a></p>
        </div>
      </div>
    `,
    text: `Your Concept Is Ready!\n\nHi {{customerName}},\n\nYour {{packageName}} concept package has been generated.\n\nView it here: {{deliveryUrl}}\n\nYou can also access it from your dashboard: https://kealee.com/dashboard/orders\n\nQuestions? Call (301) 575-8777\n`,
  },
}
