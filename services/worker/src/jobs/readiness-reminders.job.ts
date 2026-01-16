import { prisma } from '@kealee/database'
import { emailQueue } from '../queues/email.queue'
import { CronJobResult } from '../types/cron.types'
import { ReadinessItemStatus } from '@prisma/client'

/**
 * Readiness overdue reminders cron job (Prompt 1.4)
 * Sends email reminders for overdue readiness items
 */
export async function executeReadinessOverdueReminders(): Promise<CronJobResult> {
  const startTime = Date.now()

  try {
    console.log('📧 Starting readiness overdue reminders job...')

    const now = new Date()

    // Find overdue readiness items (PENDING status, dueDate < now)
    const overdueItems = await prisma.readinessItem.findMany({
      where: {
        status: ReadinessItemStatus.PENDING,
        required: true,
        dueDate: { lt: now },
      },
      include: {
        project: {
          include: {
            owner: { select: { id: true, email: true, name: true } },
          },
        },
        assignee: { select: { id: true, email: true, name: true } },
      },
    })

    if (overdueItems.length === 0) {
      console.log('ℹ️ No overdue readiness items found')
      return {
        success: true,
        jobType: 'readiness_overdue_reminders',
        executedAt: new Date(),
        duration: Date.now() - startTime,
        result: { itemsProcessed: 0 },
      }
    }

    // Group by user (assignee or owner) to avoid duplicate emails
    const userItems = new Map<string, Array<typeof overdueItems[0]>>()

    for (const item of overdueItems) {
      const userId = item.assigneeUserId || item.project.ownerId
      if (!userId) continue

      if (!userItems.has(userId)) {
        userItems.set(userId, [])
      }
      userItems.get(userId)!.push(item)
    }

    const results = []

    for (const [userId, items] of userItems.entries()) {
      const user = items[0].assignee || items[0].project.owner
      if (!user?.email) {
        console.warn(`⚠️ User ${userId} has no email, skipping reminder`)
        continue
      }

      try {
        const projectNames = Array.from(new Set(items.map((i) => i.project.name)))
        const itemCount = items.length

        await emailQueue.sendEmail({
          to: user.email,
          subject: `${itemCount} overdue readiness item${itemCount > 1 ? 's' : ''} require${itemCount > 1 ? '' : 's'} attention`,
          html: `
            <h1>Overdue Readiness Items</h1>
            <p>Hi ${user.name},</p>
            <p>You have <strong>${itemCount} overdue readiness item${itemCount > 1 ? 's' : ''}</strong> that require${itemCount > 1 ? '' : 's'} attention:</p>
            <ul>
              ${items
                .map(
                  (i) => `
                <li>
                  <strong>${i.title}</strong> (${i.project.name})
                  ${i.dueDate ? `<br />Due: ${i.dueDate.toISOString().slice(0, 10)}` : ''}
                </li>
              `
                )
                .join('')}
            </ul>
            <p><a href="${process.env.NEXT_PUBLIC_PROJECT_OWNER_URL || 'http://localhost:3006'}/projects/${items[0].projectId}">View project</a></p>
          `,
          text: `Overdue Readiness Items\n\nHi ${user.name},\n\nYou have ${itemCount} overdue readiness item${itemCount > 1 ? 's' : ''}.\n\n${items.map((i) => `- ${i.title} (${i.project.name})`).join('\n')}\n\nView project: ${process.env.NEXT_PUBLIC_PROJECT_OWNER_URL || 'http://localhost:3006'}/projects/${items[0].projectId}`,
          metadata: {
            userId,
            eventType: 'readiness_overdue_reminder',
            itemCount,
            projectIds: Array.from(new Set(items.map((i) => i.projectId))),
          },
        })

        results.push({ userId, email: user.email, itemCount, success: true })
      } catch (error: unknown) {
        console.error(`❌ Failed to send reminder to user ${userId}:`, error)
        results.push({
          userId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    const duration = Date.now() - startTime
    const successCount = results.filter((r) => r.success).length

    console.log(`✅ Readiness overdue reminders job completed: ${successCount}/${userItems.size} users notified`)

    return {
      success: true,
      jobType: 'readiness_overdue_reminders',
      executedAt: new Date(),
      duration,
      result: {
        overdueItemsFound: overdueItems.length,
        usersNotified: userItems.size,
        successCount,
        results,
      },
    }
  } catch (error: unknown) {
    console.error('❌ Readiness overdue reminders job failed:', error)
    return {
      success: false,
      jobType: 'readiness_overdue_reminders',
      executedAt: new Date(),
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
