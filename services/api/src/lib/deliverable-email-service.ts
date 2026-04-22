/**
 * Deliverable Email Service (Enhancement 5)
 * Sends generated deliverables to customers via Resend email
 * Pattern: ProjectOutput ready → Build email with Supabase URLs → Send via Resend
 */

import { Resend } from 'resend'

// ============================================================================
// Types
// ============================================================================

export interface DeliverableEmailData {
  serviceType: 'concept' | 'estimation' | 'permit'
  customerEmail: string
  customerName?: string
  projectTitle: string
  pdfUrl?: string
  conceptImageUrls?: string[]
  estimationPdfUrl?: string
  permitFileUrls?: string[]
  metadata?: {
    intakeId?: string
    projectId?: string
    budget?: { low?: number; mid?: number; high?: number }
    confidence?: number
  }
}

// ============================================================================
// Email Templates
// ============================================================================

function buildConceptEmailHTML(data: DeliverableEmailData): string {
  const { customerName, projectTitle, pdfUrl, conceptImageUrls, metadata } = data

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Your Concept Package</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #1A2B4A 0%, #1e3a5f 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 30px; }
      .section { margin: 20px 0; }
      .section-title { font-size: 18px; font-weight: bold; color: #1A2B4A; margin-bottom: 15px; }
      .image-gallery { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
      .image-card { border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
      .image-card img { width: 100%; height: 200px; object-fit: cover; }
      .image-label { padding: 10px; font-size: 12px; color: #666; }
      .confidence-badge { display: inline-block; padding: 8px 12px; background-color: #38A169; color: white; border-radius: 4px; font-weight: bold; margin: 10px 0; }
      .budget-section { background-color: #f9f9f9; padding: 15px; border-radius: 8px; }
      .budget-row { display: flex; justify-content: space-between; margin: 8px 0; }
      .budget-label { font-weight: bold; }
      .budget-amount { color: #E8793A; }
      .cta-button { display: inline-block; padding: 12px 24px; background-color: #E8793A; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 5px 10px 0; }
      .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Your Concept Package is Ready! 🎨</h1>
        <p>${projectTitle}</p>
      </div>

      <div class="section">
        <p>Hi${customerName ? ` ${customerName}` : ''},</p>
        <p>Your pre-design concept package has been generated and is ready for review. Below you'll find your renderings, design concepts, and next steps.</p>
      </div>

      ${metadata?.confidence ? `
        <div class="section">
          <div class="confidence-badge">
            Confidence: ${Math.round(metadata.confidence * 100)}%
          </div>
          <p>Our AI analyzed your project requirements and generated these concepts with high confidence.</p>
        </div>
      ` : ''}

      ${conceptImageUrls && conceptImageUrls.length > 0 ? `
        <div class="section">
          <div class="section-title">📸 Concept Renderings</div>
          <div class="image-gallery">
            ${conceptImageUrls.map((url, i) => `
              <div class="image-card">
                <img src="${url}" alt="Concept ${i + 1}">
                <div class="image-label">Concept ${i + 1}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${metadata?.budget ? `
        <div class="section">
          <div class="section-title">💰 Budget Range</div>
          <div class="budget-section">
            <div class="budget-row">
              <span class="budget-label">Low Estimate:</span>
              <span class="budget-amount">$${metadata.budget.low?.toLocaleString() || 'N/A'}</span>
            </div>
            <div class="budget-row">
              <span class="budget-label">Likely Cost:</span>
              <span class="budget-amount" style="color: #E8793A; font-size: 16px;">$${metadata.budget.mid?.toLocaleString() || 'N/A'}</span>
            </div>
            <div class="budget-row">
              <span class="budget-label">High Estimate:</span>
              <span class="budget-amount">$${metadata.budget.high?.toLocaleString() || 'N/A'}</span>
            </div>
          </div>
        </div>
      ` : ''}

      ${pdfUrl ? `
        <div class="section">
          <div class="section-title">📄 Download Your Package</div>
          <p>
            <a href="${pdfUrl}" class="cta-button">Download PDF (7-day access)</a>
          </p>
          <p style="font-size: 12px; color: #999;">Your PDF is hosted on Supabase Storage and will be available for 7 days.</p>
        </div>
      ` : ''}

      <div class="section">
        <div class="section-title">🎯 Next Steps</div>
        <p>
          <a href="https://kealee.com/permits?projectId=${metadata?.projectId || ''}" class="cta-button">Order Permits</a>
          <a href="https://kealee.com/contractors?projectId=${metadata?.projectId || ''}" class="cta-button">Find Contractor</a>
          <a href="https://kealee.com/architects?projectId=${metadata?.projectId || ''}" class="cta-button">Connect with Architect</a>
        </p>
      </div>

      <div class="footer">
        <p>© 2026 Kealee Platform. All rights reserved.</p>
        <p>Questions? Reply to this email or visit https://kealee.com/support</p>
      </div>
    </div>
  </body>
</html>
  `
}

function buildEstimationEmailHTML(data: DeliverableEmailData): string {
  const { customerName, projectTitle, estimationPdfUrl, metadata } = data

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Your Cost Estimate</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #1A2B4A 0%, #1e3a5f 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 30px; }
      .section { margin: 20px 0; }
      .section-title { font-size: 18px; font-weight: bold; color: #1A2B4A; margin-bottom: 15px; }
      .cta-button { display: inline-block; padding: 12px 24px; background-color: #E8793A; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
      .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Your Cost Estimate is Ready! 💵</h1>
        <p>${projectTitle}</p>
      </div>

      <div class="section">
        <p>Hi${customerName ? ` ${customerName}` : ''},</p>
        <p>Your detailed cost estimate has been prepared. This includes labor, materials, and contingency calculations based on current market rates and your project scope.</p>
      </div>

      ${estimationPdfUrl ? `
        <div class="section">
          <div class="section-title">📄 Download Your Estimate</div>
          <p>
            <a href="${estimationPdfUrl}" class="cta-button">Download Estimate PDF (7-day access)</a>
          </p>
          <p style="font-size: 12px; color: #999;">Includes itemized breakdown, timeline, and assumptions.</p>
        </div>
      ` : ''}

      <div class="section">
        <div class="section-title">📞 Ready to Move Forward?</div>
        <p>
          <a href="https://kealee.com/contractors?projectId=${metadata?.projectId || ''}" class="cta-button">Get Contractor Quote</a>
        </p>
      </div>

      <div class="footer">
        <p>© 2026 Kealee Platform. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
  `
}

function buildPermitEmailHTML(data: DeliverableEmailData): string {
  const { customerName, projectTitle, permitFileUrls, metadata } = data

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Your Permit Package</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #1A2B4A 0%, #1e3a5f 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 30px; }
      .section { margin: 20px 0; }
      .section-title { font-size: 18px; font-weight: bold; color: #1A2B4A; margin-bottom: 15px; }
      .file-list { list-style: none; padding: 0; }
      .file-item { padding: 10px; background-color: #f9f9f9; border-left: 4px solid #E8793A; margin: 8px 0; }
      .cta-button { display: inline-block; padding: 12px 24px; background-color: #E8793A; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
      .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Your Permit Package is Ready! 📋</h1>
        <p>${projectTitle}</p>
      </div>

      <div class="section">
        <p>Hi${customerName ? ` ${customerName}` : ''},</p>
        <p>Your permit application package has been prepared and is ready for submission to your local jurisdiction.</p>
      </div>

      ${permitFileUrls && permitFileUrls.length > 0 ? `
        <div class="section">
          <div class="section-title">📁 Your Documents</div>
          <ul class="file-list">
            ${permitFileUrls.map((url, i) => `
              <li class="file-item">
                <a href="${url}" style="color: #E8793A; text-decoration: none; font-weight: bold;">Document ${i + 1} (7-day access)</a>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}

      <div class="section">
        <div class="section-title">✅ What's Included</div>
        <ul>
          <li>Building permit application form</li>
          <li>Site plan and architectural drawings</li>
          <li>Scope of work documentation</li>
          <li>Systems impact analysis</li>
          <li>Compliance checklist</li>
        </ul>
      </div>

      <div class="footer">
        <p>© 2026 Kealee Platform. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
  `
}

// ============================================================================
// Email Sending Service
// ============================================================================

export async function sendDeliverableEmail(
  data: DeliverableEmailData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('[Email] RESEND_API_KEY not set, skipping email delivery')
      return { success: false, error: 'RESEND_API_KEY not configured' }
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    // Determine email subject and HTML content
    let subject = ''
    let html = ''

    switch (data.serviceType) {
      case 'concept':
        subject = `Your ${data.projectTitle} Concept Package is Ready`
        html = buildConceptEmailHTML(data)
        break
      case 'estimation':
        subject = `Your ${data.projectTitle} Cost Estimate`
        html = buildEstimationEmailHTML(data)
        break
      case 'permit':
        subject = `Your ${data.projectTitle} Permit Application Package`
        html = buildPermitEmailHTML(data)
        break
    }

    // Send email via Resend
    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'deliverables@kealee.com',
      to: data.customerEmail,
      subject,
      html,
      headers: {
        'X-Entity-Ref-ID': data.metadata?.intakeId || 'unknown',
      },
    })

    if (response.error) {
      console.error('[Email] Resend API error:', response.error)
      return { success: false, error: response.error.message }
    }

    console.log(`[Email] Sent ${data.serviceType} deliverable to ${data.customerEmail}`, {
      messageId: response.data?.id,
    })

    return { success: true, messageId: response.data?.id }
  } catch (err: any) {
    console.error('[Email] Failed to send deliverable email:', err?.message)
    return { success: false, error: err?.message }
  }
}

// ============================================================================
// Batch Email Service
// ============================================================================

export async function sendDeliverableEmails(
  deliverables: DeliverableEmailData[]
): Promise<Array<{ intakeId?: string; success: boolean; error?: string }>> {
  return Promise.all(
    deliverables.map(async (deliverable) => {
      const result = await sendDeliverableEmail(deliverable)
      return {
        intakeId: deliverable.metadata?.intakeId,
        ...result,
      }
    })
  )
}
