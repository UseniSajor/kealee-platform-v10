/**
 * Email Service via Resend
 *
 * Handles all outbound email for the Kealee Platform.
 * Uses the Resend SDK for reliable transactional email delivery.
 */

import { Resend } from 'resend';
import { PrismaClient } from '@kealee/database';

const prisma = new PrismaClient();

let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (resendInstance) return resendInstance;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error('RESEND_API_KEY is not configured. Email sending is disabled.');
  }
  resendInstance = new Resend(key);
  return resendInstance;
}

const DEFAULT_FROM = 'Kealee <notifications@kealee.com>';
const DEFAULT_REPLY_TO = 'support@kealee.com';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export interface SendEmailResult {
  messageId: string;
  status: 'sent' | 'failed';
}

/**
 * Send a single email via Resend.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  const resend = getResend();

  const { data, error } = await resend.emails.send({
    from: opts.from || DEFAULT_FROM,
    to: Array.isArray(opts.to) ? opts.to : [opts.to],
    subject: opts.subject,
    html: opts.html,
    replyTo: opts.replyTo || DEFAULT_REPLY_TO,
    tags: opts.tags,
  });

  if (error) {
    console.error('[Email] Failed to send:', error);
    throw new Error(`Email send failed: ${error.message}`);
  }

  return {
    messageId: data?.id || '',
    status: 'sent',
  };
}

export interface BatchEmailMessage {
  to: string;
  subject: string;
  html: string;
  from?: string;
  tags?: { name: string; value: string }[];
}

export interface BatchEmailResult {
  messageId: string;
  to: string;
  status: 'sent' | 'failed';
  error?: string;
}

/**
 * Send batch emails via Resend (up to 100 per batch).
 */
export async function sendBatchEmails(
  messages: BatchEmailMessage[]
): Promise<BatchEmailResult[]> {
  const resend = getResend();

  // Resend batch supports up to 100 per call
  const results: BatchEmailResult[] = [];
  const batchSize = 100;

  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);

    const { data, error } = await resend.batch.send(
      batch.map((msg) => ({
        from: msg.from || DEFAULT_FROM,
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
        replyTo: DEFAULT_REPLY_TO,
        tags: msg.tags,
      }))
    );

    if (error) {
      console.error('[Email] Batch send failed:', error);
      // Mark all in this batch as failed
      for (const msg of batch) {
        results.push({ messageId: '', to: msg.to, status: 'failed', error: error.message });
      }
    } else if (data) {
      const ids = (data as any).data || [];
      for (let j = 0; j < batch.length; j++) {
        results.push({
          messageId: ids[j]?.id || '',
          to: batch[j].to,
          status: 'sent',
        });
      }
    }
  }

  return results;
}

export interface SendTemplateEmailOptions {
  to: string;
  templateId: string;
  variables: Record<string, string>;
  projectId?: string;
  userId?: string;
}

/**
 * Send an email using a MessageTemplate from the database.
 * Resolves variables, wraps in layout, logs to CommunicationLog.
 */
export async function sendEmailWithTemplate(
  opts: SendTemplateEmailOptions
): Promise<SendEmailResult> {
  // 1. Look up the template
  const template = await prisma.messageTemplate.findUnique({
    where: { id: opts.templateId },
  });

  if (!template) {
    throw new Error(`MessageTemplate not found: ${opts.templateId}`);
  }

  // 2. Interpolate variables in subject and body
  const subject = interpolateVariables(template.subject || template.name, opts.variables);
  const body = interpolateVariables(template.body, opts.variables);

  // 3. Wrap body in the email layout
  const html = wrapInEmailLayout(body, opts.variables.projectName);

  // 4. Send the email
  const result = await sendEmail({
    to: opts.to,
    subject,
    html,
    tags: [
      { name: 'template', value: template.name },
      ...(opts.projectId ? [{ name: 'projectId', value: opts.projectId }] : []),
    ],
  });

  // 5. Log to CommunicationLog
  await prisma.communicationLog.create({
    data: {
      channel: 'EMAIL',
      type: template.type,
      recipientEmail: opts.to,
      clientId: opts.userId,
      projectId: opts.projectId,
      subject,
      body: html,
      status: result.status === 'sent' ? 'SENT' : 'FAILED',
      sentAt: result.status === 'sent' ? new Date() : undefined,
      metadata: {
        messageId: result.messageId,
        templateId: opts.templateId,
        templateName: template.name,
      },
    },
  });

  return result;
}

/**
 * Replace {{variable}} placeholders in a template string.
 */
function interpolateVariables(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
}

/**
 * Wrap plain HTML body content in the Kealee email layout.
 * Used when sending template-based emails without React Email rendering.
 */
export function wrapInEmailLayout(bodyHtml: string, projectName?: string): string {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.kealee.com';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:#1e293b; padding:24px 32px; text-align:center;">
              <span style="font-size:24px; font-weight:700; color:#ffffff; letter-spacing:-0.5px;">Kealee</span>
              ${projectName ? `<br/><span style="font-size:13px; color:#94a3b8; margin-top:4px; display:inline-block;">${projectName}</span>` : ''}
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px; background-color:#f8fafc; border-top:1px solid #e2e8f0; text-align:center;">
              <p style="margin:0 0 8px; font-size:12px; color:#64748b;">
                Powered by Kealee &mdash; Construction Project Management
              </p>
              <p style="margin:0; font-size:11px; color:#94a3b8;">
                <a href="${APP_URL}/privacy" style="color:#94a3b8;">Privacy Policy</a>
                &nbsp;&middot;&nbsp;
                <a href="${APP_URL}/unsubscribe" style="color:#94a3b8;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
