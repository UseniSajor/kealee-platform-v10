import { Worker, Job } from 'bullmq'
import { redis } from '../config/redis.config'
import { SalesJobData, SalesSlaReminderResult } from '../types/sales.types'
import { prisma } from '@kealee/database'
import { emailQueue } from '../queues/email.queue'

/**
 * Process sales SLA reminder job
 */
async function processSlaReminderJob(job: Job<SalesJobData>): Promise<SalesSlaReminderResult> {
  const { taskId, leadId, assignedToUserId, slaDueAt } = job.data

  try {
    // Fetch sales task and related data
    const task = await prisma.salesTask.findUnique({
      where: { id: taskId },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            estimatedValue: true,
            stage: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    if (!task) {
      throw new Error(`SalesTask ${taskId} not found`)
    }

    if (!task.assignedTo?.email) {
      throw new Error(`User ${assignedToUserId} has no email address`)
    }

    // Calculate time until SLA due
    const dueDate = new Date(slaDueAt)
    const now = new Date()
    const hoursUntilDue = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60))
    const minutesUntilDue = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60))

    // Format time message
    let timeMessage = ''
    if (hoursUntilDue > 0) {
      timeMessage = `${hoursUntilDue} hour${hoursUntilDue > 1 ? 's' : ''}`
    } else if (minutesUntilDue > 0) {
      timeMessage = `${minutesUntilDue} minute${minutesUntilDue > 1 ? 's' : ''}`
    } else {
      timeMessage = 'now'
    }

    // Send email notification
    await emailQueue.sendEmail({
      to: task.assignedTo.email,
      subject: `SLA Reminder: ${task.type} task for ${task.lead.name}`,
      html: `
        <h1>SLA Reminder</h1>
        <p>Hi ${task.assignedTo.name},</p>
        <p>You have a sales task with an upcoming SLA deadline:</p>
        <ul>
          <li><strong>Task Type:</strong> ${task.type}</li>
          <li><strong>Lead:</strong> ${task.lead.name}</li>
          <li><strong>SLA Due:</strong> ${dueDate.toLocaleString()}</li>
          <li><strong>Time Remaining:</strong> ${timeMessage}</li>
        </ul>
        <p><a href="${process.env.NEXT_PUBLIC_MARKETPLACE_URL || 'http://localhost:3007'}/leads/${leadId}">View Lead</a></p>
      `,
      text: `SLA Reminder\n\nHi ${task.assignedTo.name},\n\nYou have a sales task with an upcoming SLA deadline:\n\nTask Type: ${task.type}\nLead: ${task.lead.name}\nSLA Due: ${dueDate.toLocaleString()}\nTime Remaining: ${timeMessage}\n\nView Lead: ${process.env.NEXT_PUBLIC_MARKETPLACE_URL || 'http://localhost:3007'}/leads/${leadId}`,
      metadata: {
        userId: assignedToUserId,
        taskId,
        leadId,
        eventType: 'sales_task_sla_reminder',
        slaDueAt,
      },
    })

    // Record audit event
    const auditLog = await prisma.auditLog.create({
      data: {
        action: 'SALES_TASK_SLA_REMINDER_SENT',
        entityType: 'SalesTask',
        entityId: taskId,
        userId: assignedToUserId,
        reason: `SLA reminder sent for task ${taskId} (due in ${timeMessage})`,
        before: {
          taskId,
          taskType: task.type,
          taskStatus: task.status,
          slaDueAt: task.slaDueAt?.toISOString(),
        },
        after: {
          reminderSentAt: new Date().toISOString(),
          timeRemaining: timeMessage,
        },
      },
    })

    // Record event
    await prisma.event.create({
      data: {
        type: 'SALES_TASK_SLA_REMINDER_SENT',
        entityType: 'SalesTask',
        entityId: taskId,
        userId: assignedToUserId,
        payload: {
          taskId,
          leadId,
          taskType: task.type,
          taskStatus: task.status,
          slaDueAt: task.slaDueAt?.toISOString(),
          timeRemaining: timeMessage,
          reminderSentAt: new Date().toISOString(),
        },
      },
    })

    console.log(`✅ SLA reminder sent for task ${taskId} (due in ${timeMessage})`)

    return {
      success: true,
      taskId,
      notificationSent: true,
      auditEventId: auditLog.id,
    }
  } catch (error: any) {
    console.error(`❌ Failed to process SLA reminder for task ${taskId}:`, error)
    throw error
  }
}

/**
 * Create sales worker
 */
export function createSalesWorker(): Worker<SalesJobData> {
  const worker = new Worker<SalesJobData>(
    'sales',
    async (job) => {
      switch (job.data.type) {
        case 'sla_reminder':
          return processSlaReminderJob(job)
        default:
          throw new Error(`Unknown sales job type: ${(job.data as any).type}`)
      }
    },
    {
      connection: redis,
      concurrency: 10, // Process up to 10 sales jobs concurrently
      limiter: {
        max: 100, // Max 100 jobs per
        duration: 60000, // 1 minute
      },
    }
  )

  worker.on('completed', (job, result) => {
    console.log(`✅ Sales job ${job.id} completed`, {
      type: job.data.type,
      taskId: result.taskId,
      notificationSent: result.notificationSent,
    })
  })

  worker.on('failed', (job, err) => {
    console.error(`❌ Sales job ${job?.id} failed:`, err)
  })

  worker.on('error', (error) => {
    console.error('❌ Sales worker error:', error)
  })

  return worker
}
