/**
 * Alert system for critical failures
 * Sends alerts to Slack, email, and console
 */

export type AlertType =
  | 'api_error'
  | 'worker_failure'
  | 'queue_backlog'
  | 'payment_error'
  | 'database_error'
  | 'auth_failure'
  | 'integration_error'

/**
 * Send an alert via Slack, email, or console fallback
 */
export async function sendAlert(
  type: AlertType,
  message: string,
  details?: Record<string, unknown>
): Promise<void> {
  const timestamp = new Date().toISOString()
  const alertMessage = `[${type.toUpperCase()}] ${message}`

  // 1. Try Slack webhook
  if (process.env.SLACK_ALERT_WEBHOOK_URL) {
    try {
      const payload = {
        text: `🚨 ${alertMessage}`,
        attachments: details ? [
          {
            color: 'danger',
            fields: Object.entries(details).map(([key, value]) => ({
              title: key,
              value: typeof value === 'string' ? value : JSON.stringify(value),
              short: true,
            })),
            footer: 'Kealee Platform',
            ts: Math.floor(Date.now() / 1000),
          },
        ] : [],
      }

      await fetch(process.env.SLACK_ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {
        // Slack request failed, fall through to email
      })
    } catch {
      // Slack failed, continue to email
    }
  }

  // 2. Try Resend email
  if (process.env.RESEND_API_KEY && process.env.ALERT_EMAIL_TO) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      const detailsHtml = details
        ? `<pre>${JSON.stringify(details, null, 2)}</pre>`
        : ''

      await resend.emails.send({
        from: 'alerts@kealee.com',
        to: process.env.ALERT_EMAIL_TO,
        subject: `🚨 ${alertMessage}`,
        html: `
          <h2>${alertMessage}</h2>
          <p><strong>Timestamp:</strong> ${timestamp}</p>
          <p><strong>Service:</strong> ${process.env.SERVICE_NAME || 'unknown'}</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'unknown'}</p>
          ${detailsHtml}
        `,
      }).catch(() => {
        // Email failed, continue to console
      })
    } catch {
      // Resend not available or error
    }
  }

  // 3. Console fallback (always)
  console.error(`[ALERT:${type.toUpperCase()}] ${message}`)
  if (details) {
    console.error('Details:', details)
  }
}

/**
 * Send an alert immediately (fire-and-forget)
 */
export function sendAlertAsync(
  type: AlertType,
  message: string,
  details?: Record<string, unknown>
): void {
  sendAlert(type, message, details).catch((err) => {
    console.error('[ALERT_FAILED]', err.message)
  })
}
