import { Worker, Job } from 'bullmq'
import { redis } from '../config/redis.config'
import { IntakeProcessingJobData } from '../queues/intake-processing.queue'
import { emailQueue } from '../queues/email.queue'

const TEAM_EMAIL = process.env.TEAM_INTAKE_EMAIL || 'team@kealee.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.kealee.com'
const COMMAND_CENTER_URL = process.env.COMMAND_CENTER_URL || 'https://command-center.kealee.com'

async function getPrisma() {
  const { PrismaClient } = await import('@prisma/client')
  return new PrismaClient() as any
}

const PATH_LABELS: Record<string, string> = {
  exterior_concept: 'Exterior Concept Package',
  interior_renovation: 'Interior Renovation Package',
  whole_home_remodel: 'Whole Home Remodel',
  addition_expansion: 'Addition & Expansion',
  design_build: 'Design-Build Package',
  permit_path_only: 'Permit Path Package',
}

async function processIntakeJob(job: Job<IntakeProcessingJobData>) {
  const { intakeId, projectPath, amount, customerEmail, stripeSessionId } = job.data
  const prisma = await getPrisma()

  try {
    console.log(`[intake-processing] Processing paid intake ${intakeId}`)

    // 1. Fetch the intake lead record
    const lead = await prisma.publicIntakeLead.findUnique({
      where: { id: intakeId },
    })

    if (!lead) {
      throw new Error(`PublicIntakeLead ${intakeId} not found`)
    }

    await job.updateProgress(15)

    // 2. Mark lead as processing
    await prisma.publicIntakeLead.update({
      where: { id: intakeId },
      data: { status: 'processing' },
    })

    const packageLabel = PATH_LABELS[projectPath] ?? projectPath
    const amountDollars = (amount / 100).toFixed(2)

    await job.updateProgress(25)

    // 3. Create command center task
    try {
      await prisma.task.create({
        data: {
          title: `New intake: ${lead.clientName} — ${packageLabel}`,
          description: [
            `Client: ${lead.clientName}`,
            `Email: ${lead.contactEmail}`,
            `Phone: ${lead.contactPhone ?? 'N/A'}`,
            `Address: ${lead.projectAddress}`,
            `Package: ${packageLabel}`,
            `Budget: ${lead.budgetRange}`,
            `Timeline: ${lead.timelineGoal ?? 'Not specified'}`,
            `Lead Score: ${lead.leadScore} (${lead.leadTier})`,
            `Amount Paid: $${amountDollars}`,
            `Stripe Session: ${stripeSessionId}`,
            `Intake ID: ${intakeId}`,
          ].join('\n'),
          status: lead.leadTier === 'hot' ? 'URGENT' : 'PENDING',
          priority: lead.leadTier === 'hot' ? 'HIGH' : lead.leadTier === 'warm' ? 'MEDIUM' : 'LOW',
          source: 'intake',
          metadata: {
            intakeId,
            projectPath,
            leadTier: lead.leadTier,
            leadRoute: lead.leadRoute,
            amount,
            stripeSessionId,
          },
        },
      })
    } catch (taskErr: any) {
      console.warn(`[intake-processing] Task creation failed (non-fatal): ${taskErr.message}`)
    }

    await job.updateProgress(50)

    // 4. Send confirmation email to client
    try {
      await emailQueue.sendEmail({
        to: customerEmail,
        subject: `We received your ${packageLabel} request`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#1a1a1a">Your request is confirmed!</h2>
            <p>Hi ${lead.clientName},</p>
            <p>Thank you for submitting your <strong>${packageLabel}</strong> request. We've received your payment of <strong>$${amountDollars}</strong> and our team is now reviewing your project details.</p>
            <table style="width:100%;border-collapse:collapse;margin:20px 0">
              <tr style="background:#f5f5f5"><td style="padding:8px 12px;font-weight:600">Project Address</td><td style="padding:8px 12px">${lead.projectAddress}</td></tr>
              <tr><td style="padding:8px 12px;font-weight:600">Package</td><td style="padding:8px 12px">${packageLabel}</td></tr>
              <tr style="background:#f5f5f5"><td style="padding:8px 12px;font-weight:600">Budget Range</td><td style="padding:8px 12px">${lead.budgetRange}</td></tr>
              <tr><td style="padding:8px 12px;font-weight:600">Timeline</td><td style="padding:8px 12px">${lead.timelineGoal ?? 'To be discussed'}</td></tr>
            </table>
            <h3>What happens next?</h3>
            <ol>
              <li><strong>Review (1-2 business days)</strong> — Our team reviews your project details and photos.</li>
              <li><strong>Concept Delivery</strong> — We deliver your personalized concept package.</li>
              <li><strong>Consultation</strong> — We schedule a call to discuss next steps.</li>
            </ol>
            <p>Questions? Reply to this email or call us at <a href="tel:+12025550100">(202) 555-0100</a>.</p>
            <p>— The Kealee Team</p>
          </div>
        `,
        text: `Hi ${lead.clientName},\n\nYour ${packageLabel} request has been received and your payment of $${amountDollars} is confirmed.\n\nProject: ${lead.projectAddress}\nPackage: ${packageLabel}\n\nOur team will review your details and deliver your concept package within 1-2 business days.\n\n— The Kealee Team`,
        metadata: { eventType: 'intake_confirmation', intakeId },
      })
    } catch (emailErr: any) {
      console.warn(`[intake-processing] Client email failed (non-fatal): ${emailErr.message}`)
    }

    await job.updateProgress(70)

    // 5. Send internal team alert
    try {
      const tier = lead.leadTier.toUpperCase()
      const priority = lead.leadTier === 'hot' ? '🔴 HOT LEAD' : lead.leadTier === 'warm' ? '🟡 WARM LEAD' : '🔵 COLD LEAD'

      await emailQueue.sendEmail({
        to: TEAM_EMAIL,
        subject: `${priority} — New Intake: ${lead.clientName} (${packageLabel})`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2>${priority} — New Paid Intake</h2>
            <p><strong>Lead Score: ${lead.leadScore}/100 (${tier})</strong> — Route: ${lead.leadRoute}</p>
            <table style="width:100%;border-collapse:collapse;margin:20px 0">
              <tr style="background:#f5f5f5"><td style="padding:8px 12px;font-weight:600">Client</td><td style="padding:8px 12px">${lead.clientName}</td></tr>
              <tr><td style="padding:8px 12px;font-weight:600">Email</td><td style="padding:8px 12px"><a href="mailto:${lead.contactEmail}">${lead.contactEmail}</a></td></tr>
              <tr style="background:#f5f5f5"><td style="padding:8px 12px;font-weight:600">Phone</td><td style="padding:8px 12px">${lead.contactPhone ?? 'N/A'}</td></tr>
              <tr><td style="padding:8px 12px;font-weight:600">Address</td><td style="padding:8px 12px">${lead.projectAddress}</td></tr>
              <tr style="background:#f5f5f5"><td style="padding:8px 12px;font-weight:600">Package</td><td style="padding:8px 12px">${packageLabel}</td></tr>
              <tr><td style="padding:8px 12px;font-weight:600">Budget</td><td style="padding:8px 12px">${lead.budgetRange}</td></tr>
              <tr style="background:#f5f5f5"><td style="padding:8px 12px;font-weight:600">Timeline</td><td style="padding:8px 12px">${lead.timelineGoal ?? 'Not specified'}</td></tr>
              <tr><td style="padding:8px 12px;font-weight:600">Amount Paid</td><td style="padding:8px 12px">$${amountDollars}</td></tr>
            </table>
            ${lead.uploadedPhotos?.length ? `<p><strong>Photos uploaded:</strong> ${lead.uploadedPhotos.length}</p>` : ''}
            <p><a href="${COMMAND_CENTER_URL}/intake/${intakeId}" style="background:#2563eb;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;display:inline-block">View in Command Center</a></p>
          </div>
        `,
        text: `New Paid Intake — ${priority}\n\nClient: ${lead.clientName}\nEmail: ${lead.contactEmail}\nPhone: ${lead.contactPhone ?? 'N/A'}\nAddress: ${lead.projectAddress}\nPackage: ${packageLabel}\nBudget: ${lead.budgetRange}\nAmount: $${amountDollars}\nLead Score: ${lead.leadScore} (${tier})\nRoute: ${lead.leadRoute}\n\nView: ${COMMAND_CENTER_URL}/intake/${intakeId}`,
        metadata: { eventType: 'intake_team_alert', intakeId },
      })
    } catch (teamEmailErr: any) {
      console.warn(`[intake-processing] Team alert email failed (non-fatal): ${teamEmailErr.message}`)
    }

    await job.updateProgress(85)

    // 6. Trigger AI concept generation for applicable paths
    const conceptPaths = ['exterior_concept', 'interior_renovation', 'whole_home_remodel', 'addition_expansion', 'design_build']
    if (conceptPaths.includes(projectPath) && lead.uploadedPhotos?.length > 0) {
      try {
        const { Queue } = await import('bullmq')
        const aiQueue = new Queue('ml', {
          connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
        })
        await aiQueue.add('run-exterior-concept', {
          intakeId,
          projectPath,
          clientName: lead.clientName,
          contactEmail: lead.contactEmail,
          projectAddress: lead.projectAddress,
          budgetRange: lead.budgetRange,
          timelineGoal: lead.timelineGoal,
          uploadedPhotos: lead.uploadedPhotos,
          leadTier: lead.leadTier,
        }, { priority: 1, attempts: 2 })
        await aiQueue.close()
      } catch (aiErr: any) {
        console.warn(`[intake-processing] AI concept queue failed (non-fatal): ${aiErr.message}`)
      }
    }

    await job.updateProgress(100)

    console.log(`[intake-processing] Intake ${intakeId} fully processed`)

    return {
      success: true,
      intakeId,
      tasksCreated: true,
      emailsSent: true,
    }
  } catch (error: any) {
    console.error(`[intake-processing] Failed for intake ${intakeId}:`, error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

export function createIntakeProcessingWorker(): Worker<IntakeProcessingJobData> {
  const worker = new Worker<IntakeProcessingJobData>(
    'intake-processing',
    async (job) => processIntakeJob(job),
    {
      connection: redis,
      concurrency: 5,
    }
  )

  worker.on('completed', (job) => {
    console.log(`[intake-processing] Job ${job.id} completed for intake ${job.data.intakeId}`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[intake-processing] Job ${job?.id} failed:`, err.message)
  })

  worker.on('error', (err) => {
    console.error('[intake-processing] Worker error:', err)
  })

  return worker
}
