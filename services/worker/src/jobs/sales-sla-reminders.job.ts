import { prisma } from '@kealee/database'
import { salesQueue } from '../queues/sales.queue'
import { CronJobResult } from '../types/cron.types'
import { SalesTaskStatus } from '@prisma/client'

/**
 * Sales SLA reminders cron job
 * Finds SalesTasks with slaDueAt within next 2 hours and status not DONE/CANCELLED
 * Queues reminder jobs for each task
 */
export async function executeSalesSlaReminders(): Promise<CronJobResult> {
  const startTime = Date.now()

  try {
    console.log('📧 Starting sales SLA reminders job...')

    const now = new Date()
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000) // 2 hours from now

    // Find SalesTasks with slaDueAt within next 2 hours and status not DONE/CANCELLED
    const tasksNeedingReminders = await prisma.salesTask.findMany({
      where: {
        slaDueAt: {
          gte: now, // Not yet due
          lte: twoHoursFromNow, // Due within 2 hours
        },
        status: {
          notIn: [SalesTaskStatus.DONE, SalesTaskStatus.CANCELLED],
        },
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    })

    if (tasksNeedingReminders.length === 0) {
      console.log('ℹ️ No sales tasks needing SLA reminders found')
      return {
        success: true,
        jobType: 'sales_sla_reminders',
        executedAt: new Date(),
        duration: Date.now() - startTime,
        result: { tasksProcessed: 0 },
      }
    }

    // Queue reminder jobs for each task
    const results = []

    for (const task of tasksNeedingReminders) {
      try {
        // Check if we've already sent a reminder recently (within last hour)
        // to avoid duplicate reminders
        const recentReminder = await prisma.auditLog.findFirst({
          where: {
            action: 'SALES_TASK_SLA_REMINDER_SENT',
            entityType: 'SalesTask',
            entityId: task.id,
            createdAt: {
              gte: new Date(now.getTime() - 60 * 60 * 1000), // Last hour
            },
          },
        })

        if (recentReminder) {
          console.log(`⏭️ Skipping task ${task.id} - reminder already sent within last hour`)
          results.push({ taskId: task.id, skipped: true, reason: 'Recent reminder exists' })
          continue
        }

        // Queue the reminder job
        await salesQueue.slaReminder({
          type: 'sla_reminder',
          taskId: task.id,
          leadId: task.leadId,
          assignedToUserId: task.assignedToUserId,
          slaDueAt: task.slaDueAt!.toISOString(),
          metadata: {
            taskType: task.type,
            taskStatus: task.status,
            leadName: task.lead.name,
          },
        })

        results.push({ taskId: task.id, queued: true })
      } catch (error: unknown) {
        console.error(`❌ Failed to queue reminder for task ${task.id}:`, error)
        results.push({
          taskId: task.id,
          queued: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    const duration = Date.now() - startTime
    const queuedCount = results.filter((r) => r.queued).length
    const skippedCount = results.filter((r) => r.skipped).length

    console.log(
      `✅ Sales SLA reminders job completed: ${queuedCount} reminders queued, ${skippedCount} skipped, ${tasksNeedingReminders.length} total tasks found`
    )

    return {
      success: true,
      jobType: 'sales_sla_reminders',
      executedAt: new Date(),
      duration,
      result: {
        tasksFound: tasksNeedingReminders.length,
        remindersQueued: queuedCount,
        remindersSkipped: skippedCount,
        results,
      },
    }
  } catch (error: unknown) {
    console.error('❌ Sales SLA reminders job failed:', error)
    return {
      success: false,
      jobType: 'sales_sla_reminders',
      executedAt: new Date(),
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
