/**
 * services/worker/src/processors/lead-followup.processor.ts
 *
 * Processes lead follow-up jobs: sends SMS and email reminders
 * at timed intervals (1h, 24h, 72h) after intake submission.
 */

import { Worker, Job } from 'bullmq'
import { redis } from '../config/redis.config'
import type { LeadFollowupJobData } from '../queues/lead-followup.queue'

// Email templates (simple HTML)
const EMAIL_TEMPLATES = {
  email_24h: {
    subject: 'Your project is ready to go — complete your order',
    getHtml: (name: string, projectType: string, leadId: string) => `
      <h2>Hi ${name},</h2>
      <p>Thanks for starting your ${projectType} project with Kealee!</p>
      <p>Your project details have been saved. Complete your order to unlock AI analysis and expert insights.</p>
      <p>
        <a href="https://kealee.com/projects/${leadId}"
           style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Complete Your Order
        </a>
      </p>
      <p>Questions? <a href="mailto:hello@kealee.com">Contact us</a></p>
    `,
  },
  reminder_72h: {
    subject: 'Still thinking it over? We saved your project details',
    getHtml: (name: string, projectType: string, leadId: string) => `
      <h2>Hi ${name},</h2>
      <p>We noticed you started a ${projectType} project but haven't completed your order yet.</p>
      <p>Your project information is saved and ready to go. Just complete payment to unlock:</p>
      <ul>
        <li>AI-powered project analysis</li>
        <li>Expert recommendations</li>
        <li>Timeline and cost insights</li>
      </ul>
      <p>
        <a href="https://kealee.com/projects/${leadId}"
           style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Resume Your Project
        </a>
      </p>
      <p style="font-size: 12px; color: #666;">
        Still have questions? <a href="mailto:hello@kealee.com">Reply to this email</a> and our team will get back to you within 24 hours.
      </p>
    `,
  },
}

export function createLeadFollowupWorker(): Worker<LeadFollowupJobData> {
  return new Worker<LeadFollowupJobData>(
    'lead-followup',
    async (job: Job<LeadFollowupJobData>) => {
      const { leadId, email, firstName, projectType, jobType } = job.data

      console.log(`[lead-followup] Starting ${jobType} job for lead ${leadId}`)

      try {
        // Only send SMS for 1h job (would integrate Twilio here)
        if (jobType === 'sms_1h') {
          console.log(`[lead-followup] SMS 1h follow-up for ${email} (leadId: ${leadId})`)
          // TODO: await twilio.messages.create({ to: phone, body: smsBody })
          return { type: 'sms', status: 'queued', leadId }
        }

        // Send email for 24h and 72h jobs
        if (jobType === 'email_24h' || jobType === 'reminder_72h') {
          const template = EMAIL_TEMPLATES[jobType]
          if (!template) {
            throw new Error(`Unknown email template: ${jobType}`)
          }

          const name = firstName || 'there'
          const projectLabel = projectType || 'your'

          // TODO: Integrate with Resend or email service
          // For now, just log that we'd send it
          console.log(`[lead-followup] Email ${jobType} to ${email} for lead ${leadId}`)
          console.log(`[lead-followup] Subject: ${template.subject}`)

          // This is where you'd call your email service:
          // await resend.emails.send({
          //   from: 'Kealee <hello@kealee.com>',
          //   to: email,
          //   subject: template.subject,
          //   html: template.getHtml(name, projectLabel, leadId),
          // })

          return {
            type: 'email',
            status: 'sent',
            jobType,
            leadId,
            email,
          }
        }

        return { type: 'unknown', status: 'skipped', jobType }
      } catch (err: any) {
        console.error(`[lead-followup] Job ${job.id} failed:`, err.message)
        throw err
      }
    },
    { connection: redis, concurrency: 5 }
  )
}
