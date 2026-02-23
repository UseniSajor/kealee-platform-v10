import { bidService } from './bid.service'
import { emailService } from '../email/email.service'

// ── Config ──────────────────────────────────────────────────────────────────

function getNotificationRecipient(): string {
  return process.env.BID_ALERT_EMAIL || 'timc@kealee.com'
}

// ── HTML Formatting ─────────────────────────────────────────────────────────

function formatDate(d: Date | string | null): string {
  if (!d) return 'N/A'
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function daysUntil(d: Date | string | null): string {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (days < 0) return '(overdue)'
  if (days === 0) return '(TODAY)'
  if (days === 1) return '(tomorrow)'
  return `(${days} days)`
}

function bidRow(bid: any): string {
  return `<tr>
    <td style="padding:8px;border-bottom:1px solid #eee;">${bid.projectName}</td>
    <td style="padding:8px;border-bottom:1px solid #eee;">${formatDate(bid.dueDate)} ${daysUntil(bid.dueDate)}</td>
    <td style="padding:8px;border-bottom:1px solid #eee;">${bid.status || ''}</td>
    <td style="padding:8px;border-bottom:1px solid #eee;">${bid.scope || ''}</td>
  </tr>`
}

function bidTable(bids: any[], title: string, color: string): string {
  if (!bids.length) return ''
  return `
    <h2 style="color:${color};margin-top:24px;">${title} (${bids.length})</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr style="background:#f9fafb;">
        <th style="padding:8px;text-align:left;">Project</th>
        <th style="padding:8px;text-align:left;">Due Date</th>
        <th style="padding:8px;text-align:left;">Status</th>
        <th style="padding:8px;text-align:left;">Scope</th>
      </tr>
      ${bids.map(bidRow).join('')}
    </table>`
}

export function formatAlertEmail(alerts: any): string {
  const now = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  return `
    <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;">
      <h1 style="color:#1e3a5f;">Kealee Bid Pipeline — Daily Alert</h1>
      <p style="color:#6b7280;">${now} | ${alerts.totalAlerts} items needing attention</p>
      ${bidTable(alerts.urgent?.bids || [], 'URGENT — Due within 3 days', '#dc2626')}
      ${bidTable(alerts.thisWeek?.bids || [], 'This Week — Due within 7 days', '#f59e0b')}
      ${bidTable(alerts.needsFollowUp?.bids || [], 'Needs Follow-Up — No update in 14+ days', '#6366f1')}
      ${bidTable(alerts.newLeads?.bids || [], 'New Leads — Unreviewed', '#059669')}
      ${alerts.totalAlerts === 0 ? '<p style="color:#6b7280;margin-top:24px;">No active alerts. Pipeline is clear.</p>' : ''}
      <hr style="margin-top:32px;border:none;border-top:1px solid #e5e7eb;" />
      <p style="color:#9ca3af;font-size:12px;">Kealee Construction LLC — Bid Pipeline Automation</p>
    </div>`
}

// ── Send Daily Alerts ───────────────────────────────────────────────────────

export async function sendDailyAlerts(recipientEmail?: string): Promise<{ success: boolean; alertCount: number; error?: string }> {
  try {
    const alerts = await bidService.getAlerts()
    const to = recipientEmail || getNotificationRecipient()
    const html = formatAlertEmail(alerts)

    const result = await emailService.sendEmail({
      to,
      subject: `Bid Pipeline Alert — ${alerts.totalAlerts} items (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
      html,
    })

    return {
      success: result.success,
      alertCount: alerts.totalAlerts,
      error: result.success ? undefined : (result as any).error,
    }
  } catch (error: any) {
    return { success: false, alertCount: 0, error: error.message }
  }
}

// ── Send Urgent Alert ───────────────────────────────────────────────────────

export async function sendUrgentAlert(bid: any, recipientEmail?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const to = recipientEmail || getNotificationRecipient()
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#dc2626;">URGENT: Bid Due Soon</h1>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0;">
          <h2 style="margin:0 0 8px;">${bid.projectName}</h2>
          <p style="margin:4px 0;"><strong>Due:</strong> ${formatDate(bid.dueDate)} ${daysUntil(bid.dueDate)}</p>
          <p style="margin:4px 0;"><strong>Source:</strong> ${bid.source || 'N/A'}</p>
          <p style="margin:4px 0;"><strong>Scope:</strong> ${bid.scope || 'N/A'}</p>
          <p style="margin:4px 0;"><strong>Status:</strong> ${bid.status || 'N/A'}</p>
          ${bid.gcName ? `<p style="margin:4px 0;"><strong>GC:</strong> ${bid.gcName}</p>` : ''}
          ${bid.ownerName ? `<p style="margin:4px 0;"><strong>Owner:</strong> ${bid.ownerName}</p>` : ''}
        </div>
        <p style="color:#6b7280;">This bid is due within 48 hours. Please take action.</p>
        <hr style="margin-top:24px;border:none;border-top:1px solid #e5e7eb;" />
        <p style="color:#9ca3af;font-size:12px;">Kealee Construction LLC — Bid Pipeline Automation</p>
      </div>`

    const result = await emailService.sendEmail({
      to,
      subject: `URGENT: ${bid.projectName} — Due ${formatDate(bid.dueDate)}`,
      html,
    })

    return { success: result.success, error: result.success ? undefined : (result as any).error }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
